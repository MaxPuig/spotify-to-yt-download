import config from './config.json' with { type: 'json' };
import { getDatabase, setDatabase } from './database.js';
import { Downloader } from 'ytdl-mp3';
import NodeID3 from 'node-id3';
import fetch from 'node-fetch';
import fs from 'fs';

if (!fs.existsSync('./songs')) fs.mkdirSync('./songs'); // create ./songs folder if it doesn't exist

let confirmedSongs_db = await getDatabase('confirmedSongs');
let confirmedSongs = confirmedSongs_db[config.playlistId] || [];
let notDownloade_db = await getDatabase('notDownloaded');
let notDownloaded = notDownloade_db[config.playlistId] || [];
let downloaded_db = await getDatabase('downloaded');
let downloaded = downloaded_db[config.playlistId] || [];
let dontDownload = [];

dontDownload.push(...notDownloaded.map(song => song.spotifyId));
dontDownload.push(...downloaded.map(song => song.spotifyId));

const numberOfSongsToDownload = confirmedSongs.length - downloaded.length - notDownloaded.length;
console.log(`Number of songs to download: ${numberOfSongsToDownload}`);
let currentSongNumber = 0;

for (let i = 0; i < confirmedSongs.length; i++) {
    if (dontDownload.includes(confirmedSongs[i].spotifyId)) {
        console.log(`Song ${i + 1}/${confirmedSongs.length} - ${((i * 100) / confirmedSongs.length).toFixed(2)}% - Already Downloaded - ${confirmedSongs[i].spotifyTitle}`);
        continue; // Skip if already downloaded or not downloadable
    }
    currentSongNumber++;
    confirmedSongs[i].spotifyTitle = confirmedSongs[i].spotifyTitle.replace(/[/"\\?*:|<>]/g, '.');
    confirmedSongs[i].spotifyArtists = confirmedSongs[i].spotifyArtists.map(artist => artist.replace(/[/"\\?*:|<>]/g, '.'));
    console.log(`Downloading ${currentSongNumber}/${numberOfSongsToDownload} - ${((currentSongNumber * 100) / numberOfSongsToDownload).toFixed(2)}% - ${confirmedSongs[i].ytTitle}`);
    try {
        // create .songs/playlist folder if it doesn't exist
        if (!fs.existsSync(`./songs/${confirmedSongs[i].spotifyPlaylist}`)) fs.mkdirSync(`./songs/${confirmedSongs[i].spotifyPlaylist}`);
        const downloader = new Downloader({ getTags: false, outputDir: `./songs/${confirmedSongs[i].spotifyPlaylist}` });
        await downloader.downloadSong(confirmedSongs[i].url).then(async (path) => {
            const song_name = removeInvalidChars(confirmedSongs[i].spotifyArtists.join('; ') + ' - ' + confirmedSongs[i].spotifyTitle);
            fs.renameSync(path, `./songs/${confirmedSongs[i].spotifyPlaylist}/${song_name}.mp3`);
            path = `./songs/${confirmedSongs[i].spotifyPlaylist}/${song_name}.mp3`;
            console.log('Downloaded: ' + path);
            const imageBuffer = await fetch(confirmedSongs[i].spotifyAlbumCover)
                .then(res => res.arrayBuffer())
                .then(buffer => Buffer.from(buffer));
            const tags = {
                title: confirmedSongs[i].spotifyTitle,
                artist: confirmedSongs[i].spotifyArtists.join('; '),
                album: confirmedSongs[i].spotifyAlbum,
                year: confirmedSongs[i].spotifyYear,
                image: {
                    mime: 'image/jpeg',
                    type: { id: 3 },
                    imageBuffer
                }
            };
            NodeID3.write(tags, path, (error) => {
                if (error) {
                    throw 'Error writing ID3 tags:' + error;
                }
            });
            downloaded.push(confirmedSongs[i]);
            downloaded_db[config.playlistId] = downloaded;
            setDatabase('downloaded', downloaded_db);
        });
    } catch (e) {
        console.log(e);
        notDownloaded.push(confirmedSongs[i]);
        notDownloade_db[config.playlistId] = notDownloaded;
        await setDatabase('notDownloaded', notDownloade_db);
        console.log('Error downloading: ', confirmedSongs[i].ytTitle + ' - ' + confirmedSongs[i].ytArtists.join('; '));
    }
}

console.log('Done downloading all songs!');

function removeInvalidChars(filename) {
    const invalidCharsRegex = /[<>:"\/\\|?*\x00-\x1F]/g;
    return filename.replace(invalidCharsRegex, '');
}
import youtubeMp3Converter from 'youtube-mp3-converter';
import { getDatabase, setDatabase } from './database.js';
import NodeID3 from 'node-id3';
import fetch from 'node-fetch';
let confirmedSongs = await getDatabase('confirmedSongs');
import fs from 'fs';
if (!fs.existsSync('./songs')) fs.mkdirSync('./songs'); // create ./songs folder if it doesn't exist

const convertLinkToMp3 = youtubeMp3Converter('./songs');
let notDownloaded = await getDatabase('notDownloaded');
let downloaded = await getDatabase('downloaded');
let dontDownload = [];

for (let track of notDownloaded) {
    dontDownload.push(track.spotifyId);
}
for (let track of downloaded) {
    dontDownload.push(track.spotifyId);
}

for (let i = 0; i < confirmedSongs.length; i++) {
    if (dontDownload.includes(confirmedSongs[i].spotifyId)) continue; // Skip if already downloaded or not downloadable
    confirmedSongs[i].spotifyTitle = confirmedSongs[i].spotifyTitle.replace(/[/"\\?*:|<>]/g, ".");
    confirmedSongs[i].spotifyArtists = confirmedSongs[i].spotifyArtists.map(artist => artist.replace(/[/"\\?*:|<>]/g, "."));
    console.log(`Downloading ${i}/${confirmedSongs.length - 1} - ${((i * 100) / confirmedSongs.length - 1).toFixed(2)}% - ${confirmedSongs[i].ytTitle}`);
    try {
        await convertLinkToMp3(confirmedSongs[i].url, {
            title: confirmedSongs[i].spotifyTitle + ' - ' + confirmedSongs[i].spotifyArtists.join('; '),
        }).then(async (path) => {
            console.log("Downloaded: ", path);
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
                    type: { id: 2 },
                    imageBuffer
                }
            };
            NodeID3.write(tags, path, (error) => {
                if (error) {
                    throw 'Error writing ID3 tags:' + error;
                }
            });
            downloaded.push(confirmedSongs[i]);
            setDatabase('downloaded', downloaded);
        });
    } catch (e) {
        console.log(e);
        notDownloaded.push(confirmedSongs[i]);
        await setDatabase('notDownloaded', notDownloaded);
        console.log("Error downloading: ", confirmedSongs[i].ytTitle + ' - ' + confirmedSongs[i].ytArtists.join('; '));
    }
}

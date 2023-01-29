import youtubeMp3Converter from 'youtube-mp3-converter';
import { getDatabase, setDatabase } from './database.js';
let confirmedSongs = await getDatabase('confirmedSongs');

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
    confirmedSongs[i].spotifyTitle = confirmedSongs[i].spotifyTitle.replace(/[/\\?%*:|"<>]/g, ".");
    confirmedSongs[i].spotifyArtists = confirmedSongs[i].spotifyArtists.replace(/[/\\?%*:|"<>]/g, ".");
    console.log(`Downloading ${i}/${confirmedSongs.length - 1} - ${((i * 100) / confirmedSongs.length - 1).toFixed(2)}% - ${confirmedSongs[i].ytTitle}`);
    try {
        await convertLinkToMp3(confirmedSongs[i].url, {
            title: confirmedSongs[i].spotifyTitle + ' - ' + confirmedSongs[i].spotifyArtists,
        }).then((path) => {
            console.log("Downloaded: ", path);
            downloaded.push(confirmedSongs[i]);
            setDatabase('downloaded', downloaded);
        });
    } catch (e) {
        console.log(e);
        notDownloaded.push(confirmedSongs[i]);
        await setDatabase('notDownloaded', notDownloaded);
        console.log("Error downloading: ", confirmedSongs[i].ytTitle + ' - ' + confirmedSongs[i].ytArtists);
    }
}

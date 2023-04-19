import express from 'express';
import request from 'request';
import path from 'path';
import fs from 'fs';
import { getDatabase, setDatabase } from './database.js';
let songs = await getDatabase('ytList');
let sameSongs = await getDatabase('confirmedSongs');
let differentSongs = await getDatabase('unconfirmedSongs');
let confirmedSongsIds = [];


const app = express();
app.use(express.static('public'));

let songIndex = 0;

function checkIfConfirmed() {
    confirmedSongsIds = [];
    for (let i = 0; i < sameSongs.length; i++) {
        confirmedSongsIds.push(sameSongs[i].spotifyId);
    }
}

app.get('/', async (req, res) => {
    const filePath = 'tempImage.jpg';
    checkIfConfirmed();
    const finished = 'Done checking if same album cover. You can now start the next script!';
    if (songIndex >= songs.length) {
        res.send(finished);
        console.log(finished);
        process.exit();
    }
    while (confirmedSongsIds.includes(songs[songIndex].spotifyId)) {
        songIndex++;
        if (songIndex >= songs.length) {
            res.send(finished);
            process.exit();
        }
    }
    console.log(`${songIndex + 1}/${songs.length} - ${songs[songIndex].spotifyTitle}`);
    request(songs[songIndex].ytAlbumCover).pipe(fs.createWriteStream(filePath))
        .on('close', async () => {
            let html = `<body style="background-color: grey; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div style="text-align: center;"><h1>Are they the same song? ${songIndex + 1}/${songs.length}</h1>
            <p>Spotify: <a href="https://open.spotify.com/track/${songs[songIndex].spotifyId}" target="_blank">
            ${songs[songIndex].spotifyDuration} - ${songs[songIndex].spotifyTitle} - ${songs[songIndex].spotifyArtists.join('; ')}</a></p>
            <p>YouTube: <a href="${songs[songIndex].url}" target="_blank">
            ${songs[songIndex].ytDuration} - ${songs[songIndex].ytTitle} - ${songs[songIndex].ytArtists.join('; ')}</a></p></div>
            <div style="display: flex; justify-content: center;">
            <img src="/images/tempImage.jpg" alt="Image1" width="120" height="120" style="margin-right: 10px;">
            <img src="${songs[songIndex].spotifyAlbumCover}" alt="Image2" width="120" height="120"></div>
            <div style="display: flex; justify-content: center; margin-top: 10px">
            <button><a href="/same?spotifyId=${songs[songIndex].spotifyId}">same</a></button> 
            <button><a href="/different?spotifyId=${songs[songIndex].spotifyId}">different</a></button></div></body>`
            res.send(html);
        })
});

const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([a-z]:\/)/, '$1');
const imagePath = path.join(__dirname, 'tempImage.jpg');
app.get('/images/:filename', (req, res) => {
    res.sendFile(imagePath);
});

app.get('/same', async (req, res) => {
    sameSongs.push(songs[searchspotifyId(req.query.spotifyId, songs)]);
    songIndex++;
    await setDatabase('confirmedSongs', sameSongs);
    if (searchspotifyId(req.query.spotifyId, differentSongs) != -1) { // if song is already in unconfirmedSongs
        differentSongs.splice(searchspotifyId(req.query.spotifyId, differentSongs), 1);
        await setDatabase('unconfirmedSongs', differentSongs);
    }
    res.redirect('/');
});

app.get('/different', async (req, res) => {
    if (searchspotifyId(req.query.spotifyId, differentSongs) != -1) { // if song is already in unconfirmedSongs
        songIndex++;
        res.redirect('/');
        return;
    }
    differentSongs.push(songs[searchspotifyId(req.query.spotifyId, songs)]);
    songIndex++;
    await setDatabase('unconfirmedSongs', differentSongs);
    res.redirect('/');
});

app.listen(1234, () => {
    console.log("Server running at http://localhost:1234");
});

function searchspotifyId(spotifyId, array_search) {
    return array_search.findIndex(song => song.spotifyId === spotifyId);
}

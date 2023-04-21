import config from './config.json' assert { type: 'json' };
import { getDatabase, setDatabase } from './database.js';
import express from 'express';
import fetch from 'node-fetch';

let songs_db = await getDatabase('ytList');
let songs = songs_db[config.playlistId] || [];
let sameSongs_db = await getDatabase('confirmedSongs');
let sameSongs = sameSongs_db[config.playlistId] || [];
let differentSongs_db = await getDatabase('unconfirmedSongs');
let differentSongs = differentSongs_db[config.playlistId] || [];
let confirmedSongsIds = [];
let songIndex = 0;

const app = express();
app.use(express.static('public'));

function checkIfConfirmed() {
    confirmedSongsIds = [];
    for (let i = 0; i < sameSongs.length; i++) {
        confirmedSongsIds.push(sameSongs[i].spotifyId);
    }
}

let number_of_unconfirmed = 0;
app.get('/', async (req, res) => {
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
            console.log(finished);
            process.exit();
        }
    }
    let calculate_confirmed_db = await getDatabase('confirmedSongs');
    let calculate_confirmed = calculate_confirmed_db[config.playlistId] || [];
    let calculate_unconfirmed = songs.length - calculate_confirmed.length - number_of_unconfirmed;
    console.log(`${songIndex + 1}/${songs.length} - ${calculate_unconfirmed} left - ${songs[songIndex].spotifyTitle}`);
    let html = `<body style="background-color: grey; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div style="text-align: center;"><h1>Are they the same song? ${songIndex + 1}/${songs.length} (${calculate_unconfirmed} left)</h1>
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
});

app.get('/images/:filename', async (req, res) => {
    res.setHeader('Content-Type', 'image/jpeg');
    let image_buffer = await fetch(songs[songIndex].ytAlbumCover).then(res => res.arrayBuffer())
        .then(buffer => Buffer.from(buffer));;
    res.send(image_buffer);
});

app.get('/same', async (req, res) => {
    sameSongs.push(songs[searchspotifyId(req.query.spotifyId, songs)]);
    songIndex++;
    sameSongs_db[config.playlistId] = sameSongs;
    await setDatabase('confirmedSongs', sameSongs_db);
    if (searchspotifyId(req.query.spotifyId, differentSongs) != -1) { // if song is already in unconfirmedSongs
        differentSongs.splice(searchspotifyId(req.query.spotifyId, differentSongs), 1);
        differentSongs_db[config.playlistId] = differentSongs;
        await setDatabase('unconfirmedSongs', differentSongs_db);
    }
    res.redirect('/');
});

app.get('/different', async (req, res) => {
    number_of_unconfirmed++;
    if (searchspotifyId(req.query.spotifyId, differentSongs) != -1) { // if song is already in unconfirmedSongs
        songIndex++;
        res.redirect('/');
        return;
    }
    differentSongs.push(songs[searchspotifyId(req.query.spotifyId, songs)]);
    songIndex++;
    differentSongs_db[config.playlistId] = differentSongs;
    await setDatabase('unconfirmedSongs', differentSongs_db);
    res.redirect('/');
});

app.listen(1234, () => {
    console.log('Server running at http://localhost:1234');
});

function searchspotifyId(spotifyId, array_search) {
    return array_search.findIndex(song => song.spotifyId === spotifyId);
}

import config from './config.json' assert { type: 'json' };
import { getDatabase, setDatabase } from './database.js';
import * as YouTubeMusic from 'node-youtube-music';
import express from 'express';

let unconfirmedSongs_db = await getDatabase('unconfirmedSongs');
const unconfirmedSongs_inmutable = unconfirmedSongs_db[config.playlistId] || [];
let confirmed_db = await getDatabase('confirmedSongs');
let confirmed = confirmed_db[config.playlistId] || [];
let newUnconfirmedSongs = unconfirmedSongs_inmutable.slice(); // copy array
let indexUnconf = 0;
let content;

const app = express();

app.get('/', async (req, res) => {
    res.redirect('/search_again');
});

app.get('/search_again', async (req, res) => {
    if (indexUnconf >= unconfirmedSongs_inmutable.length) {
        res.redirect('/done_alternatives');
        return;
    }
    let count_confirmed = unconfirmedSongs_inmutable.length - indexUnconf;
    console.log(`${indexUnconf + 1}/${unconfirmedSongs_inmutable.length} - ${unconfirmedSongs_inmutable[indexUnconf].spotifyTitle}`)
    content = await YouTubeMusic.searchMusics(`${unconfirmedSongs_inmutable[indexUnconf].spotifyTitle} ${unconfirmedSongs_inmutable[indexUnconf].spotifyArtists.join(' ')}`);
    let html = `<body style="background-color: grey; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="text-align: center;"><h1>Select new song: (${count_confirmed} left)</h1>
                <p>Spotify: <a href="https://open.spotify.com/track/${unconfirmedSongs_inmutable[indexUnconf].spotifyId}" target="_blank">
                ${unconfirmedSongs_inmutable[indexUnconf].spotifyDuration} - ${unconfirmedSongs_inmutable[indexUnconf].spotifyTitle} - ${unconfirmedSongs_inmutable[indexUnconf].spotifyArtists.join('; ')}
                </a></p><img src="${unconfirmedSongs_inmutable[indexUnconf].spotifyAlbumCover}" alt="Image2" width="120" height="120"><p></p>
                <button><a href="/select_alternative?contentIndex=-1">NO ALTERNATIVE FOUND</a></button>`
    for (let i = 0; i < content.length; i++) {
        let artists = []
        content[i].artists.forEach((artist) => { artists.push(artist.name) });
        html += `<p>${content[i].duration.label} - ${content[i].title} - ${artists.join('; ')}</p></div>
        <iframe width="200" height="200" src="https://www.youtube.com/embed/${content[i].youtubeId}" 
        frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        <button><a href="/select_alternative?contentIndex=${i}">^ Select ^</a></button>`
    }
    html += `</div>`
    res.send(html);
});

app.get('/select_alternative', async (req, res) => {
    // save new url to confirmed. 
    const indexContent = Number(req.query.contentIndex);
    if (indexContent == -1) { // No alternative
        indexUnconf++;
        res.redirect('/search_again');
        return;
    }
    confirmed.push({
        url: `https://youtube.com/watch?v=${content[indexContent].youtubeId}`,
        ytTitle: content[indexContent].title,
        ytArtists: content[indexContent].artists.map(artist => artist.name),
        ytAlbum: content[indexContent].album,
        ytAlbumCover: content[indexContent].thumbnailUrl,
        ytDuration: content[indexContent].duration.label,
        spotifyId: unconfirmedSongs_inmutable[indexUnconf].spotifyId,
        spotifyTitle: unconfirmedSongs_inmutable[indexUnconf].spotifyTitle,
        spotifyArtists: unconfirmedSongs_inmutable[indexUnconf].spotifyArtists,
        spotifyAlbum: unconfirmedSongs_inmutable[indexUnconf].spotifyAlbum,
        spotifyAlbumCover: unconfirmedSongs_inmutable[indexUnconf].spotifyAlbumCover,
        spotifyDuration: unconfirmedSongs_inmutable[indexUnconf].spotifyDuration,
        spotifyYear: unconfirmedSongs_inmutable[indexUnconf].spotifyYear,
        spotifyPlaylist: unconfirmedSongs_inmutable[indexUnconf].spotifyPlaylist,
    })
    confirmed_db[config.playlistId] = confirmed;
    await setDatabase('confirmedSongs', confirmed_db);
    // remove from unconfirmed
    const found_song_id = unconfirmedSongs_inmutable[indexUnconf].spotifyId;
    // find index of song in newunconfirmedSongs, which is a copy of unconfirmedSongs_inmutable
    const indexNewUnconf = newUnconfirmedSongs.findIndex((song) => song.spotifyId == found_song_id);
    newUnconfirmedSongs.splice(indexNewUnconf, 1);
    unconfirmedSongs_db[config.playlistId] = newUnconfirmedSongs;
    await setDatabase('unconfirmedSongs', unconfirmedSongs_db);
    indexUnconf++;
    res.redirect('/search_again');
});

app.get('/done_alternatives', (req, res) => {
    res.send('Done searching for alternatives!');
    console.log('Done searching for alternatives!');
    process.exit();
});

app.listen(1234, () => {
    console.log('Server running at http://localhost:1234');
});

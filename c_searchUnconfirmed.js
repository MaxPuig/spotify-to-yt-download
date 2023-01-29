import express from 'express';
import * as YouTubeMusic from 'node-youtube-music';
import { getDatabase, setDatabase } from './database.js';
let unconfirmedSongs = await getDatabase('unconfirmedSongs');
let confirmed = await getDatabase('confirmedSongs');
let newUnconfirmedSongs = unconfirmedSongs.slice();

const app = express();


let indexUnconf = 0;
let content;


app.get('/', async (req, res) => {
    res.redirect("/search_again");
});

app.get('/search_again', async (req, res) => {
    if (indexUnconf >= unconfirmedSongs.length) {
        res.redirect("/done_alternatives");
        return;
    }
    content = await YouTubeMusic.searchMusics(`${unconfirmedSongs[indexUnconf].spotifyTitle} ${unconfirmedSongs[indexUnconf].spotifyArtists}`);
    let html = `<body style="background-color: grey; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="text-align: center;"><h1>Select new song for:</h1>
                <p>Spotify: <a href="https://open.spotify.com/track/${unconfirmedSongs[indexUnconf].spotifyId}" target="_blank">
                ${unconfirmedSongs[indexUnconf].spotifyDuration} - ${unconfirmedSongs[indexUnconf].spotifyTitle} - ${unconfirmedSongs[indexUnconf].spotifyArtists}
                </a></p><img src="${unconfirmedSongs[indexUnconf].spotifyAlbumCover}" alt="Image2" width="120" height="120"><p></p>
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
        res.redirect("/search_again");
        return;
    }
    confirmed.push({
        url: `https://youtube.com/watch?v=${content[indexContent].youtubeId}`,
        ytTitle: content[indexContent].title,
        ytArtists: content[indexContent].artists.map(artist => artist.name).join('; '),
        ytAlbum: content[indexContent].album,
        ytAlbumCover: content[indexContent].thumbnailUrl,
        ytDuration: content[indexContent].duration.label,
        spotifyId: unconfirmedSongs[indexUnconf].spotifyId,
        spotifyTitle: unconfirmedSongs[indexUnconf].spotifyTitle,
        spotifyArtists: unconfirmedSongs[indexUnconf].spotifyArtists,
        spotifyAlbum: unconfirmedSongs[indexUnconf].spotifyAlbum,
        spotifyAlbumCover: unconfirmedSongs[indexUnconf].spotifyAlbumCover,
        spotifyDuration: unconfirmedSongs[indexUnconf].spotifyDuration
    })
    await setDatabase('confirmedSongs', confirmed);
    // remove from unconfirmed
    newUnconfirmedSongs.splice(indexUnconf, 1);
    await setDatabase('unconfirmedSongs', newUnconfirmedSongs);
    indexUnconf++;
    res.redirect("/search_again");
});

app.get('/done_alternatives', (req, res) => {
    res.send("Done searching for alternatives!");
    process.exit();
});

app.listen(1234, () => {
    console.log("Server running at http://localhost:1234");
});
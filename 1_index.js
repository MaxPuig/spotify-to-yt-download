import { getDatabase, setDatabase } from './database.js';
import * as YouTubeMusic from 'node-youtube-music';
import SpotifyWebApi from 'spotify-web-api-node';


const config = {
    "clientId": "",
    "clientSecret": "",
    "playlistId": "0BxSFctZ12PYY7ysO9mrTc"
}

main()

async function main() {
    let spotifyApi = await authenticate(config.clientId, config.clientSecret);
    let songs = await getSongsFromPlaylist(spotifyApi, config.playlistId);
    await getSongsFromYoutubeMusic(songs);
}


async function authenticate(clientId, clientSecret) {
    const spotifyApi = new SpotifyWebApi({ clientId, clientSecret })
    spotifyApi.setAccessToken((await spotifyApi.clientCredentialsGrant()).body.access_token)
    return spotifyApi;
}


async function getSongsFromPlaylist(spotifyApi, playlistId) {
    const tracks = await spotifyApi.getPlaylistTracks(playlistId, { offset: 0, limit: 100 });
    if (tracks.body.total > 100) {
        for (let i = 0; i < Math.floor(tracks.body.total / 100); i++) {
            await sleep(500);
            const nextTracks = await spotifyApi.getPlaylistTracks(playlistId, { offset: (i + 1) * 100, limit: 100 });
            tracks.body.items.push(...nextTracks.body.items);
        }
    }
    return tracks.body.items;
}


async function getSongsFromYoutubeMusic(tracks) {
    for (let i = 0; i < tracks.length; i++) {
        try {
            let track = tracks[i].track;
            // If already in ytList, skip
            let ytList = await getDatabase('ytList');
            if (ytList.filter(song => song.spotifyId === track.id).length > 0) {
                console.log('Already in ytList - ' + track.name);
                continue;
            }
            await sleep(100);
            // Search on YouTube Music
            let content = await YouTubeMusic.searchMusics(`${track.name} ${track.artists.map(artist => artist.name).join(' ')}`);
            // Make a copy of the array
            let originalContent = content.slice();
            // Select Song
            content = content.filter(song => replaceTitle(song.title) === replaceTitle(track.name))
            content = content.filter(song => song.artists.length > 0)
            content = content.filter(song => song.artists[0].name === track.artists[0].name)
            // Filter Explicit -- Explicit will be preferred
            let explicit = content.filter(song => song.isExplicit)
            content = explicit.length > 0 ? explicit : content
            // Add YouTube URL
            if (content.length < 1) { // No exact match, first result
                ytList.push({
                    url: `https://youtube.com/watch?v=${originalContent[0]?.youtubeId}`,
                    ytTitle: originalContent[0]?.title,
                    ytArtists: originalContent[0]?.artists.map(artist => artist.name),
                    ytAlbum: originalContent[0]?.album,
                    ytAlbumCover: originalContent[0]?.thumbnailUrl,
                    ytDuration: originalContent[0]?.duration.label,
                    spotifyId: track.id,
                    spotifyTitle: track.name,
                    spotifyArtists: track.artists.map(artist => artist.name),
                    spotifyAlbum: track.album.name,
                    spotifyAlbumCover: track.album.images[0].url,
                    spotifyDuration: msToMinsSecs(track.duration_ms),
                    spotifyYear: track.album.release_date.split('-')[0]
                })
            } else {
                ytList.push({
                    url: `https://youtube.com/watch?v=${content[0].youtubeId}`,
                    ytTitle: content[0].title,
                    ytArtists: content[0].artists.map(artist => artist.name),
                    ytAlbum: content[0].album,
                    ytAlbumCover: content[0].thumbnailUrl,
                    ytDuration: content[0]?.duration.label,
                    spotifyId: track.id,
                    spotifyTitle: track.name,
                    spotifyArtists: track.artists.map(artist => artist.name),
                    spotifyAlbum: track.album.name,
                    spotifyAlbumCover: track.album.images[0].url,
                    spotifyDuration: msToMinsSecs(track.duration_ms),
                    spotifyYear: track.album.release_date.split('-')[0]
                })
            }
            console.log(`Song ${i + 1}/${tracks.length} - ${(((i + 1) * 100) / (tracks.length)).toFixed(2)}% - ${tracks[i].track.name}`);
            await setDatabase('ytList', ytList);
        } catch (e) {
            console.log(`Error on song ${i} - ${tracks[i].track.name}`);
            console.log(e);
        }
    }
    console.log('Done searching for Spotify Songs on YT Music!');
    return;
}


function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }


function replaceTitle(title) {
    // Replace extra content so it can be compared
    // Remove the parentheses and its content
    // Remove the dash and everythong onwards
    title = title.replace(/ \(.+?\)/, '').replace(/ - .+$/, '');
    return title;
}


function msToMinsSecs(ms) {
    let mins = Math.floor(ms / 60000);
    let secs = ((ms % 60000) / 1000).toFixed(0);
    if (secs === '60') { secs = 0; mins++; }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
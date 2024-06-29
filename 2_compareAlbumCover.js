import config from './config.json' with { type: 'json' };
import { getDatabase, setDatabase } from './database.js';
import pixelmatch from 'pixelmatch';
import fetch from 'node-fetch';
import Jimp from 'jimp';

let songs_db = await getDatabase('ytList');
let songs = songs_db[config.playlistId] || [];
let skipSongs_db = await getDatabase('confirmedSongs');
let skipSongs = skipSongs_db[config.playlistId] || [];
let unconfirmedSongs_db = await getDatabase('unconfirmedSongs');
let unconfirmedSongs = unconfirmedSongs_db[config.playlistId] || [];

skipSongs.push(...unconfirmedSongs);
skipSongs = skipSongs.map(song => song.spotifyId);
for (let i = 0; i < songs.length; i++) {
    // check if song from ytList is already in confirmedSongs or unconfirmedSongs
    if (skipSongs.includes(songs[i].spotifyId)) {
        console.log(`Song ${i + 1}/${songs.length} - ${(((i + 1) * 100) / (songs.length)).toFixed(2)}% - Already Confirmed - ${songs[i].spotifyTitle}`);
        continue;
    }
    let song = songs[i];
    const image1url = song.ytAlbumCover;
    const image2url = song.spotifyAlbumCover;
    const same_image = await imagesAreEqual(image1url, image2url, config.similiarity_percentage);
    let song1Seconds = song.ytDuration.split(':').reduce((acc, time) => (60 * acc) + +time);
    let song2Seconds = song.spotifyDuration.split(':').reduce((acc, time) => (60 * acc) + +time);

    if (same_image[0] && Math.abs(song1Seconds - song2Seconds) <= (config.duration_difference)) {
        let confirmedSongs_db = await getDatabase('confirmedSongs');
        let confirmedSongs = confirmedSongs_db[config.playlistId] || [];
        confirmedSongs.push(song);
        confirmedSongs_db[config.playlistId] = confirmedSongs;
        await setDatabase('confirmedSongs', confirmedSongs_db);
        console.log(`Song ${i + 1}/${songs.length} - ${(((i + 1) * 100) / (songs.length)).toFixed(2)}% - Same - ${songs[i].spotifyTitle}`);
    } else {
        let reason = same_image[0] ? 'Duration ' + Math.abs(song1Seconds - song2Seconds) + 's' : 'Album Cover ' + same_image[1] + '%';
        console.log(`Song ${i + 1}/${songs.length} - ${(((i + 1) * 100) / (songs.length)).toFixed(2)}% - Different ${reason} - ${songs[i].spotifyTitle}`);
    }
}

async function imagesAreEqual(image1url, image2url, percentage = 80.0) {
    // Load the two images
    const image1buffer = await fetch(image1url)
        .then(res => res.arrayBuffer())
        .then(buffer => Buffer.from(buffer));
    const image2buffer = await fetch(image2url)
        .then(res => res.arrayBuffer())
        .then(buffer => Buffer.from(buffer));
    const image1 = await Jimp.read(image1buffer);
    const image2 = await Jimp.read(image2buffer);

    // Resize both images to the same dimensions
    const width = Math.min(image1.bitmap.width, image2.bitmap.width);
    const height = Math.min(image1.bitmap.height, image2.bitmap.height);
    image1.resize(width, height);
    image2.resize(width, height);

    // Create a new image buffer to store the diff image
    const diffImage = new Jimp(width, height);

    // Use pixelmatch to compare the two images and get the number of mismatched pixels
    const mismatchedPixels = pixelmatch(
        image1.bitmap.data,
        image2.bitmap.data,
        diffImage.bitmap.data,
        width, height, { threshold: 0.1 }
    );

    // Calculate the percentage of resemblance
    const totalPixels = width * height;
    const resemblancePercentage = ((totalPixels - mismatchedPixels) / totalPixels) * 100;
    if (resemblancePercentage > percentage) {
        return [true, Math.round(resemblancePercentage)];
    } else {
        return [false, Math.round(resemblancePercentage)];
    }
}

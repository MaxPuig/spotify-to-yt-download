import Jimp from 'jimp';
import pixelmatch from 'pixelmatch';
import fetch from 'node-fetch';
import { getDatabase, setDatabase } from './database.js';
let songs = await getDatabase('ytList');

// percentage of pixels that must be the same for the images to be considered equal
const percentage = 70.0;


let skipSongs = await getDatabase('confirmedSongs');
let unconfirmedSongs = await getDatabase('unconfirmedSongs');
skipSongs.push(...unconfirmedSongs);
skipSongs = skipSongs.map(song => song.spotifyId);
for (let i = 0; i < songs.length; i++) {
    // check if song from ytList is already in confirmedSongs or unconfirmedSongs
    if (skipSongs.includes(songs[i].spotifyId)) {
        continue;
    }

    let song = songs[i];
    const image1url = song.ytAlbumCover;
    const image2url = song.spotifyAlbumCover;
    const same_image = await imagesAreEqual(image1url, image2url, percentage);
    let song1Seconds = song.ytDuration.split(':').reduce((acc, time) => (60 * acc) + +time);
    let song2Seconds = song.spotifyDuration.split(':').reduce((acc, time) => (60 * acc) + +time);

    if (same_image && Math.abs(song1Seconds - song2Seconds) < 3) {
        let confirmedSongs = await getDatabase('confirmedSongs');
        confirmedSongs.push(song);
        await setDatabase('confirmedSongs', confirmedSongs);
        console.log('Same - ' + songs[i].spotifyTitle);
    } else {
        let reason = same_image ? 'Duration - ' : 'Album Cover - ';
        console.log('Different ' + reason + songs[i].spotifyTitle);
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
    console.log('Resemblance percentage: ' + resemblancePercentage);
    if (resemblancePercentage > percentage) {
        return true;
    } else {
        return false;
    }
}

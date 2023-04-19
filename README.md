# Spotify to YouTube Download
Download a Spotify Playlist using YouTube Music. The mp3 files will be downloaded into the `./songs` folder and will include ID3 tags (Title, Artist, Album, Year, Image).

> Proof of concept as it is probably againgst TOS.


## Installation
### Prerequisites
- Have node.js and npm installed
  - You can install them [here](https://nodejs.org/en/download/)
- Have [FFmpeg](https://ffmpeg.org/download.html) installed
  - Windows ([Chocolately](https://chocolatey.org/install)): `choco install ffmpeg`
  - macOS ([Homebrew](https://brew.sh/)): `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`
- Modify the variable `config` from `1_index.js` with your Spotify credentials (Client ID, Client Secret and Playlist ID)
  - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new app
  - Copy the Client ID and Client Secret into the `config` variable
  - Also add the Spotify Playlist ID you want to download. You can get it from the Spotify URL (e.g. `https://open.spotify.com/playlist/0BxSFctZ12PYY7ysO9mrTc` → `0BxSFctZ12PYY7ysO9mrTc`)


## Steps
1. Clone the repository: `git clone https://github.com/MaxPuig/spotify-to-yt-download.git`
2. Install libraries: `npm install`
3. Modify `1_index.js`'s `config` variable with your Spotify `clientId`, `clientSecret`, and `playlistId`
4. Run the scripts in order
   1. `node 1_index.js` - Search for the Spotify songs on YouTube Music.
   2. `node 2_compareAlbumCover.js` - Compare the Spotify and YouTube Music album covers and playtime. Modify the `percentage` variable to change the threshold for the album cover similarity.
   3. `node 3_checkIfSame.js` - (Recommended/Optional) Open http://localhost:1234/ and choose if the songs match. This step is optional if you trust the previous step, you won't download the songs that didn't match the album cover or the difference between song duration was >2.
   4. `node 4_searchUnconfirmed.js` - (Optional) Open http://localhost:1234/ and choose an alternative YouTube video/song. This step is optional if you don't want to search for an alternative song from the "different" songs from the previous step.
   5. `node 5_yt2mp3.js` - Download the songs to the `./songs` folder.
5. Enjoy your songs in the `./songs` folder!
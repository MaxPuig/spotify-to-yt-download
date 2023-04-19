# Spotify to YouTube Download
Download a Spotify Playlist using YouTube Music. The mp3 files will be downloaded into the `./songs` folder and will include ID3 tags (Title, Artist, Album, Year, Image).

> Proof of concept as it is probably againgst TOS.

## Installation
### Prerequisites
- Have node.js and npm installed
  - You can install them from [here](https://nodejs.org/en/download/)
- Have [FFmpeg](https://ffmpeg.org/download.html) installed
  - Windows ([Chocolately](https://chocolatey.org/install)): `choco install ffmpeg`
  - macOS ([Homebrew](https://brew.sh/)): `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`
- Modify the variable `config` from `a_index.js` with your Spotify credentials (Client ID and Client Secret)
  - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new app
  - Copy the Client ID and Client Secret into the `config` variable
  - Also add the Spotify Playlist ID you want to download. You can get it from the Spotify URL.


## Steps
1. Clone the repository: `git clone https://github.com/MaxPuig/spotify-to-yt-download.git`
2. Install libraries: `npm install`
3. Modify `a_index.js`'s `config` variable with your spotify `clientId`, `clientSecret`, and `playlistId`
4. Run the scripts in order
   1. `node a_index.js` - Search for the spotify songs on YouTube Music.
   2. `node b_checkIfSame.js` - Open http://localhost:1234/ and choose if the songs match.
   3. `node c_searchUnconfirmed.js` - Open http://localhost:1234/ and choose an alernative youtube video/song.
   4. `node d_yt2mp3.js` - Download the songs to the `./songs` folder.
5. Wait for the script to finish and enjoy your reordered playlist!
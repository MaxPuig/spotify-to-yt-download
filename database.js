const db = new Low(new JSONFile('./database.json'));
import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';

await db.read();
if (db.data === null) { // Si no existe el archivo/db, lo crea.
    db.data = {
        'ytList': { playlistId: [] },
        'confirmedSongs': { playlistId: [] },
        'unconfirmedSongs': { playlistId: [] },
        'downloaded': { playlistId: [] },
        'notDownloaded': { playlistId: [] }
    }
    await db.write();
} else { // Si existe, comprueba que no falten campos.
    db.data.ytList = db.data.ytList || { playlistId: [] };
    db.data.confirmedSongs = db.data.confirmedSongs || { playlistId: [] };
    db.data.unconfirmedSongs = db.data.unconfirmedSongs || { playlistId: [] };
    db.data.downloaded = db.data.downloaded || { playlistId: [] };
    db.data.notDownloaded = db.data.notDownloaded || { playlistId: [] };
    await db.write();
}

/** Devuelve el objeto o array. */
async function getDatabase(part) {
    await db.read();
    return db.data[part];
}

/** Guarda el objeto o array. */
async function setDatabase(part, value) {
    db.data[part] = value;
    await db.write();
}

export { getDatabase, setDatabase };
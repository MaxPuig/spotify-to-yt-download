import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
const db = new Low(new JSONFile('./database.json'));


await db.read();
if (db.data === null) { // Si no existe el archivo/db, lo crea.
    db.data = {
        'ytList': [],
        'confirmedSongs': [],
        'unconfirmedSongs': [],
        'downloaded': [],
        'notDownloaded': []
    }
    await db.write();
} else { // Si existe, comprueba que no falten campos.
    db.data.ytList = db.data.ytList || [];
    db.data.downloaded = db.data.downloaded || [];
    db.data.notDownloaded = db.data.notDownloaded || [];
    db.data.confirmedSongs = db.data.confirmedSongs || [];
    db.data.unconfirmedSongs = db.data.unconfirmedSongs || [];
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
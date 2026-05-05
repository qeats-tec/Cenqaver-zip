const SQLite = require('better-sqlite3');
const path = require('path');

const db = new SQLite(path.resolve('database.sqlite'), { fileMustExist: false });

function initializeDatabase() {
    // Oto-cevapları tutacak tablo
    // guild_id: Sunucunun Discord ID'si
    // trigger: Cevabı tetikleyecek olan mesaj metni
    // response: Botun vereceği cevap metni
    db.exec(`
        CREATE TABLE IF NOT EXISTS auto_responses (
            guild_id TEXT NOT NULL,
            trigger TEXT NOT NULL,
            response TEXT NOT NULL,
            PRIMARY KEY (guild_id, trigger)
        );
    `);

    console.log('Veritabanı tabloları başarıyla kontrol edildi ve hazırlandı.');
}

initializeDatabase();

module.exports = db;

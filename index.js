const express = require('express');
const { Telegraf, Markup } = require('telegraf')
require('dotenv').config();

// Access the token using process.env
const botToken = process.env.BOT_TOKEN;
const port = process.env.PORT;
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const domain = process.env.DOMAIN;

const bot = new Telegraf(botToken)
const app = express()

const mysql = require('mysql')
const XLSX = require('xlsx');
const fs = require('fs');

const conn = mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPass,
    database: dbName,
    timezone: 'Z' // Set 'Z' for UTC or '+07:00' for specific time zones
})

DBConn()

// Session object to track user state
const chatSession = {}

function DBConn(){
    conn.connect((err) => {
        if (err) throw err
        console.log("DB Connected!")
    })
    conn.query("SELECT * FROM tbUser", function (err, result, fields){
        if(err){
            throw err
        }
        dataStoreUser = []
        // console.log(result)
        result.forEach(userz => {
            // console.log(userz.nama_pada_paket)
            dataStoreUser.push({
                id: userz.id_user,
                username: userz.username,
                first_name: userz.first_name,
                atas_nama: userz.atas_nama,
                asrama: userz.asrama,
                id_chat: userz.id_chat
            })
        })
        // console.log(dataStoreUser[0].username)
    })

    conn.query("SELECT * FROM `tbjadwal` WHERE tanggal < DATE(NOW())", function (err, result, fields){
        if(err){
            throw err
        }

        // const dateString = dataStoreTanggal[0].tanggal.toISOString().split('T')[0]
        if (result.length > 0) {
            // Data already exists
            conn.query('DELETE FROM tbJadwal WHERE tanggal < DATE(NOW())',
                (err) => {
                    if (err) {
                        console.error(err);
                        return ctx.reply('Terjadi kesalahan saat menghapus tanggal sebelum hari ini. Silahkan laporkan kepada /contact_person jika perlu');
                    }
                }
            );
        }
    })
}

function chooseAsrama(ctx){
    bot.telegram.sendMessage(ctx.chat.id, 'Pilih Asrama: ', {
        reply_markup: {
            inline_keyboard: 
            [
                [
                    { text: 'ASPA', callback_data: 'aspa' },
                    { text: 'ASPI', callback_data: 'aspi' }
                ]
            ]
        }
    })
}

function kodeRandom(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Loop to generate characters for the specified length
    for (let i = 0; i < length; i++) {
        const randomInd = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomInd);
    }
    return result;
}

function checkUser() {
    return (ctx, next) => {
        const idChat = ctx.from.id;
        const checkUserQuery = 'SELECT * FROM tbUser WHERE id_chat = ?';

        conn.query(checkUserQuery, [idChat], (err, results) => {
            if (err) {
                console.error(err);
                return ctx.reply('Kesalahan saat cek role.');
            }

            if (results.length === 0) {
                return ctx.reply('Anda harus /daftar terlebih dahulu');
            }

            return next();
        });
    };
}

function checkPaket() {
    return (ctx, next) => {
        const idChat = ctx.from.id;
        const checkUserQuery = 'SELECT * FROM tbPaket WHERE id_pemilik = ?';

        conn.query(checkUserQuery, [idChat], (err, results) => {
            if (err) {
                console.error(err);
                return ctx.reply('Kesalahan saat cek role.');
            }

            if (results.length === 0) {
                return ctx.reply('Maaf untuk saat ini anda belum bisa memilih jadwal. Anda bisa memilih jadwal ketika paket anda telah didata di sekre');
            }

            return next();
        });
    };
}

function checkAntrian() {
    return (ctx, next) => {
        const idChat = ctx.from.id;
        const checkUserQuery = 'SELECT * FROM tbAntrian WHERE id_pemilik = ?';

        conn.query(checkUserQuery, [idChat], (err, results) => {
            if (err) {
                console.error(err);
                return ctx.reply('Kesalahan saat cek role.');
            }

            if (results.length === 0) {
                return ctx.reply('Anda belum memilih jadwal, silahkan /pilih_jadwal terlebih dahulu');
            }

            return next();
        });
    };
}

function checkUpdateAntrian() {
    return (ctx, next) => {
        const idChat = ctx.from.id;
        const checkUserQuery = 'SELECT * FROM tbAntrian WHERE id_pemilik = ?';

        conn.query(checkUserQuery, [idChat], (err, results) => {
            if (err) {
                console.error(err);
                return ctx.reply('Kesalahan saat cek role.');
            }

            if (results.length > 0) {
                return ctx.reply('Anda sudah memilih jadwal sebelumnya, silahkan /ubah_jadwal jika ingin merubah jadwal pengambilan');
            }

            return next();
        });
    };
}

function checkAdmin(requiredRole) {
    return (ctx, next) => {
        const idChat = ctx.from.id;
        const roleQuery = 'SELECT kementerian FROM tbUser WHERE id_chat = ?';

        conn.query(roleQuery, [idChat], (err, results) => {
            if (err) {
                console.error(err);
                return ctx.reply('Kesalahan saat cek role.');
            }

            if (results.length === 0 || results[0].kementerian !== requiredRole) {
                return ctx.reply('Anda tidak memiliki izin untuk menggunakan perintah ini. Silahkan klik /login_admin');
            }

            return next();
        });
    };
}

function checkPetugas() {
    return (ctx, next) => {
        const idChat = ctx.from.id;
        const roleQuery = 'SELECT kementerian FROM tbUser WHERE id_chat = ?';

        conn.query(roleQuery, [idChat], (err, results) => {
            if (err) {
                console.error(err);
                return ctx.reply('Kesalahan saat cek role.');
            }
      
            if (results[0].kementerian === 'exoff' || results[0].kementerian === 'kemenkeu' || results[0].kementerian === 'kemendagri' || results[0].kementerian === 'kemendik' || results[0].kementerian === 'kemenhankam' || results[0].kementerian === 'kemenpora' || results[0].kementerian === 'kemenag' || results[0].kementerian === 'kemenkestra' || results[0].kementerian === 'kemkominfo' || results[0].kementerian === 'kemenekraf' || results[0].kementerian === 'kemenlu' || results[0].kementerian === 'admin') {
                return next()
            } else {
                return ctx.reply('Anda tidak memiliki izin untuk menggunakan perintah ini. Silahkan klik /login_petugas');
            }
        });
    };
}

// Export data to XLSX Today
function exportMasukToday(ctx) {
    const query = 'SELECT usr.atas_nama AS "Atas Nama Paket", usr.asrama AS "Asrama", msk.kode_unik AS "Kode Unik", DATE(msk.timestamp) AS "Waktu Masuk", (SELECT kementerian FROM tbuser WHERE id_chat=msk.id_petugas) AS "Diinput oleh" FROM tbpaketmasuk AS msk JOIN tbuser AS usr ON msk.id_pemilik = usr.id_chat WHERE DATE(msk.timestamp) = DATE(NOW())';
    conn.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat mengambil data');
        }

        // Prepare data for XLSX
        const jsonData = results.map(row => ({
            ...row // Map each row from the database
        }));

        // Create a workbook and add a worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        var datetime = new Date()
        const datetimeString = datetime.toISOString().slice(0,10)

        // Write the workbook to a file
        const filePath = `export_files/Today_ReportPaketMasuk.xlsx`;
        XLSX.writeFile(workbook, filePath);

        // Send the file to the user
        ctx.reply('File Excel berhasil dibuat! Sedang dikirimkan kepada Anda...');
        return ctx.replyWithDocument({ source: filePath });
    });
}

// Export data to XLSX 7 days ago
function exportMasukWeek(ctx) {
    const query = 'SELECT usr.atas_nama AS "Atas Nama Paket", usr.asrama AS "Asrama", msk.kode_unik AS "Kode Unik", DATE(msk.timestamp) AS "Waktu Masuk", (SELECT kementerian FROM tbuser WHERE id_chat=msk.id_petugas) AS "Diinput oleh" FROM tbpaketmasuk AS msk JOIN tbuser AS usr ON msk.id_pemilik = usr.id_chat WHERE DATE(msk.timestamp) BETWEEN DATE_ADD(DATE(NOW()), INTERVAL -6 DAY) AND DATE(NOW())';
    conn.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat mengambil data');
        }

        // Prepare data for XLSX
        const jsonData = results.map(row => ({
            ...row // Map each row from the database
        }));

        // Create a workbook and add a worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        var datetime = new Date()
        const datetimeString = datetime.toISOString().slice(0,10)

        // Write the workbook to a file
        const filePath = `export_files/7Days_ReportPaketMasuk.xlsx`;
        XLSX.writeFile(workbook, filePath);

        // Send the file to the user
        ctx.reply('File Excel berhasil dibuat! Sedang dikirimkan kepada Anda...');
        return ctx.replyWithDocument({ source: filePath });
    });
}

// Export data to XLSX this Month
function exportMasukMonth(ctx) {
    const query = 'SELECT usr.atas_nama AS "Atas Nama Paket", usr.asrama AS "Asrama", msk.kode_unik AS "Kode Unik", DATE(msk.timestamp) AS "Waktu Masuk", (SELECT kementerian FROM tbuser WHERE id_chat=msk.id_petugas) AS "Diinput oleh" FROM tbpaketmasuk AS msk JOIN tbuser AS usr ON msk.id_pemilik = usr.id_chat WHERE Month(msk.timestamp) = Month(NOW())';
    conn.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat mengambil data');
        }

        // Prepare data for XLSX
        const jsonData = results.map(row => ({
            ...row // Map each row from the database
        }));

        // Create a workbook and add a worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        var datetime = new Date()
        const datetimeString = datetime.toISOString().slice(0,10)

        // Write the workbook to a file
        const filePath = `export_files/Month_ReportPaketMasuk.xlsx`;
        XLSX.writeFile(workbook, filePath);

        // Send the file to the user
        ctx.reply('File Excel berhasil dibuat! Sedang dikirimkan kepada Anda...');
        return ctx.replyWithDocument({ source: filePath });
    });
}

// Export data to XLSX All time
function exportMasukAllTime(ctx) {
    const query = 'SELECT usr.atas_nama AS "Atas Nama Paket", usr.asrama AS "Asrama", msk.kode_unik AS "Kode Unik", DATE(msk.timestamp) AS "Waktu Masuk", (SELECT kementerian FROM tbuser WHERE id_chat=msk.id_petugas) AS "Diinput oleh" FROM tbpaketmasuk AS msk JOIN tbuser AS usr ON msk.id_pemilik = usr.id_chat';
    conn.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat mengambil data');
        }

        // Prepare data for XLSX
        const jsonData = results.map(row => ({
            ...row // Map each row from the database
        }));

        // Create a workbook and add a worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        var datetime = new Date()
        const datetimeString = datetime.toISOString().slice(0,10)

        // Write the workbook to a file
        const filePath = `export_files/AllTime_ReportPaketMasuk.xlsx`;
        XLSX.writeFile(workbook, filePath);

        // Send the file to the user
        ctx.reply('File Excel berhasil dibuat! Sedang dikirimkan kepada Anda...');
        return ctx.replyWithDocument({ source: filePath });
    });
}

bot.command('download_laporan_masuk', checkUser(), checkAdmin('admin'), (ctx) => {
    ctx.reply('Pilih jangka waktu data Paket Masuk:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Laporan Hari Ini', callback_data: 'masuk_today' }],
                [{ text: 'Laporan 7 Hari Lalu', callback_data: 'masuk_week' }],
                [{ text: 'Laporan Bulan Ini', callback_data: 'masuk_month' }],
                [{ text: 'All Time (Seluruh Data)', callback_data: 'masuk_alltime' }]
            ],
        },
    });
});

// Handle the user's choice
bot.action('masuk_today', (ctx) => exportMasukToday(ctx));
bot.action('masuk_week', (ctx) => exportMasukWeek(ctx));
bot.action('masuk_month', (ctx) => exportMasukMonth(ctx));
bot.action('masuk_alltime', (ctx) => exportMasukAllTime(ctx));

// Export data to XLSX Today
function exportKeluarToday(ctx) {
    const query = 'SELECT usr.atas_nama AS "Atas Nama Paket", usr.asrama AS "Asrama", klr.kode_unik AS "Kode Unik", DATE(klr.timestamp) AS "Waktu Keluar", (SELECT kementerian FROM tbuser WHERE id_chat=klr.id_petugas) AS "Diinput oleh" FROM tbpaketkeluar AS klr JOIN tbuser AS usr ON klr.id_pemilik = usr.id_chat WHERE DATE(klr.timestamp) = DATE(NOW())';
    conn.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat mengambil data');
        }

        // Prepare data for XLSX
        const jsonData = results.map(row => ({
            ...row // Map each row from the database
        }));

        // Create a workbook and add a worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        var datetime = new Date()
        const datetimeString = datetime.toISOString().slice(0,10)

        // Write the workbook to a file
        const filePath = `export_files/Today_ReportPaketKeluar.xlsx`;
        XLSX.writeFile(workbook, filePath);

        // Send the file to the user
        ctx.reply('File Excel berhasil dibuat! Sedang dikirimkan kepada Anda...');
        return ctx.replyWithDocument({ source: filePath });
    });
}

// Export data to XLSX 7 days ago
function exportKeluarWeek(ctx) {
    const query = 'SELECT usr.atas_nama AS "Atas Nama Paket", usr.asrama AS "Asrama", klr.kode_unik AS "Kode Unik", DATE(klr.timestamp) AS "Waktu Keluar", (SELECT kementerian FROM tbuser WHERE id_chat=klr.id_petugas) AS "Diinput oleh" FROM tbpaketkeluar AS klr JOIN tbuser AS usr ON klr.id_pemilik = usr.id_chat WHERE DATE(klr.timestamp) BETWEEN DATE_ADD(DATE(NOW()), INTERVAL -6 DAY) AND DATE(NOW())';
    conn.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat mengambil data');
        }

        // Prepare data for XLSX
        const jsonData = results.map(row => ({
            ...row // Map each row from the database
        }));

        // Create a workbook and add a worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        var datetime = new Date()
        const datetimeString = datetime.toISOString().slice(0,10)

        // Write the workbook to a file
        const filePath = `export_files/7Days_ReportPaketKeluar.xlsx`;
        XLSX.writeFile(workbook, filePath);

        // Send the file to the user
        ctx.reply('File Excel berhasil dibuat! Sedang dikirimkan kepada Anda...');
        return ctx.replyWithDocument({ source: filePath });
    });
}

// Export data to XLSX this Month
function exportKeluarMonth(ctx) {
    const query = 'SELECT usr.atas_nama AS "Atas Nama Paket", usr.asrama AS "Asrama", klr.kode_unik AS "Kode Unik", DATE(klr.timestamp) AS "Waktu Keluar", (SELECT kementerian FROM tbuser WHERE id_chat=klr.id_petugas) AS "Diinput oleh" FROM tbpaketkeluar AS klr JOIN tbuser AS usr ON klr.id_pemilik = usr.id_chat WHERE Month(klr.timestamp) = Month(NOW())';
    conn.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat mengambil data');
        }

        // Prepare data for XLSX
        const jsonData = results.map(row => ({
            ...row // Map each row from the database
        }));

        // Create a workbook and add a worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        var datetime = new Date()
        const datetimeString = datetime.toISOString().slice(0,10)

        // Write the workbook to a file
        const filePath = `export_files/Month_ReportPaketKeluar.xlsx`;
        XLSX.writeFile(workbook, filePath);

        // Send the file to the user
        ctx.reply('File Excel berhasil dibuat! Sedang dikirimkan kepada Anda...');
        return ctx.replyWithDocument({ source: filePath });
    });
}

// Export data to XLSX All time
function exportKeluarAllTime(ctx) {
    const query = 'SELECT usr.atas_nama AS "Atas Nama Paket", usr.asrama AS "Asrama", klr.kode_unik AS "Kode Unik", DATE(klr.timestamp) AS "Waktu Keluar", (SELECT kementerian FROM tbuser WHERE id_chat=klr.id_petugas) AS "Diinput oleh" FROM tbpaketkeluar AS klr JOIN tbuser AS usr ON klr.id_pemilik = usr.id_chat';
    conn.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat mengambil data');
        }

        // Prepare data for XLSX
        const jsonData = results.map(row => ({
            ...row // Map each row from the database
        }));

        // Create a workbook and add a worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        var datetime = new Date()
        const datetimeString = datetime.toISOString().slice(0,10)

        // Write the workbook to a file
        const filePath = `export_files/AllTime_ReportPaketKeluar.xlsx`;
        XLSX.writeFile(workbook, filePath);

        // Send the file to the user
        ctx.reply('File Excel berhasil dibuat! Sedang dikirimkan kepada Anda...');
        return ctx.replyWithDocument({ source: filePath });
    });
}

bot.command('download_laporan_keluar', checkUser(), checkAdmin('admin'), (ctx) => {
    ctx.reply('Pilih jangka waktu data Paket Keluar:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Laporan Hari Ini', callback_data: 'keluar_today' }],
                [{ text: 'Laporan 7 Hari Lalu', callback_data: 'keluar_week' }],
                [{ text: 'Laporan Bulan Ini', callback_data: 'keluar_month' }],
                [{ text: 'All Time (Seluruh Data)', callback_data: 'keluar_alltime' }]
            ],
        },
    });
});

// Handle the user's choice
bot.action('keluar_today', (ctx) => exportKeluarToday(ctx));
bot.action('keluar_week', (ctx) => exportKeluarWeek(ctx));
bot.action('keluar_month', (ctx) => exportKeluarMonth(ctx));
bot.action('keluar_alltime', (ctx) => exportKeluarAllTime(ctx));

function konfirmasiTambahTanggal(ctx){
    bot.telegram.sendMessage(ctx.chat.id, 'Masih mau tambah tanggal? ', {
        reply_markup: {
            inline_keyboard: 
            [
                [
                    { text: 'Ya', callback_data: 'tgl-ya' },
                    { text: 'Tidak', callback_data: 'tgl-tidak' }
                ]
            ]
        }
    })
}

bot.action('tgl-ya', ctx => {
    ctx.answerCbQuery()
    const idChat = ctx.chat.id;
    ctx.deleteMessage()
    // Start a new data inputTanggal session
    chatSession[idChat] = { step: 'tambah_tgl' };

    ctx.reply("Masukkan tanggal kembali:")
})
bot.action('tgl-tidak', ctx => {
    const idChat = ctx.chat.id;
    ctx.deleteMessage()
    // Start a new data inputTanggal session
    delete chatSession[idChat]; // Clear session after registration
    ctx.reply('Data sudah terinput semua!');
})

bot.action('aspa', ctx => {
    ctx.deleteMessage()
    ctx.answerCbQuery()
    
    bot.telegram.sendMessage(ctx.chat.id, "Aspa mana?", 
    {
        reply_markup: {
            keyboard: 
            [
                [
                    { text: "ASPA 1"},
                    { text: "ASPA 2"}
                ],
                [
                    { text: "ASPA 3"},
                    { text: "ASPA 4"}
                ],
                [
                    { text: "ASPA 5"},
                    { text: "ASPA 6"}
                ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    })
})

bot.action('aspi', ctx => {
    ctx.deleteMessage()
    ctx.answerCbQuery()
    bot.telegram.sendMessage(ctx.chat.id, "Aspi mana?", 
    {
        reply_markup: {
            keyboard: 
            [
                [
                    { text: "ASPI 1"},
                    { text: "ASPI 2"}
                ],
                [
                    { text: "ASPI 3"},
                    { text: "ASPI 4A"}
                ],
                [
                    { text: "ASPI 4B"},
                    { text: "ASPI 5A"}
                ],
                [
                    { text: "ASPI 5B"},
                    { text: "ASPI 6A"}
                ],
                [
                    { text: "ASPI 6B"},
                    { text: "ASPI 7"}
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    })
})

const startCommand = `
Selamat datang di Punten Paket Bot👋

Jika kamu baru pertama kali menggunakan bot ini, silahkan daftar terlebih dahulu dengan mengklik tombol /daftar disini. Tapi jika kamu sudah mendaftar, silahkan tunggu saja informasi tentang paket kamu. 

Jika bingung, klik tombol /help 👈
`

const helpCommand = `
Berikut beberapa perintah yang dapat dijalankan pada bot ini:

/daftar - mendaftar sebagai pengguna aplikasi
/edit_profil - Mengubah data Nama dan Asrama anda
/pilih_jadwal - Memilih jawdal pengambilan paket
/ubah_jadwal - Mengubah jadwal pengambilan paket
/contact_person - Menghubungi contact person penjaga paket

/login_petugas - Gunakan aplikasi sebagai Petugas penjaga paket
/login_admin - Gunakan aplikasi sebagai Admin / PJ

/help_petugas - Memunculkan tombol untuk Petugas jaga paket
/help_admin - Memunculkan tombol untuk Admin aplikasi
`

const petugasCommand = `
Berikut adalah tombol untuk petugas penjaga paket:

/simpan_paket - Menginput data paket yang masuk
/ambil_paket - Masukkan kode unik untuk mengambil paket
/lihat_antrian - Melihat santri yang akan mengambil paket hari ini
`

const adminCommand = `
Berikut adalah tombol untuk Admin:

/tambah_tanggal_ambil - Menambah ketersediaan jadwal ambil
/download_laporan_masuk - Men-download file data paket masuk
/download_laporan_keluar - Men-download file data paket keluar

/simpan_paket - Menginput data paket yang masuk
/ambil_paket - Mencatat saat paket mau diambil
/lihat_antrian - Melihat santri yang akan mengambil paket hari ini
`

bot.start((ctx) => ctx.reply(startCommand))

bot.help((ctx) => ctx.reply(helpCommand))

bot.command('daftar', async (ctx) => {
    const idChat = ctx.chat.id;
  
    // Query to check if user data exists
    conn.query('SELECT * FROM tbUser WHERE id_chat = ?', [idChat], (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan, coba lagi nanti. Silahkan laporkan kepada /contact_person jika perlu');
        }

        if (results.length === 0) {
            // No user data, start registration
            chatSession[idChat] = { step: 'nama' };
            return ctx.reply('Nama yang dimasukkan harus sesuai dengan yang ada pada Paket atau E-Commerce Anda\n\nJika setiap akun e-commerce memiliki "nama" yang berbeda pada alamat tujuan, tolong ubah terlebih dahulu "nama" pada alamat agar aplikasi ini berfungsi dengan baik\n\nSilahkan masukkan nama anda sesuai dengan yang ada di paket:');
        } else {
            return ctx.reply('Kamu sudah terdaftar sebelumnya, silahkan gunakan fitur lain atau tunggu informasi paket kamu yaa..');
        }
    });
});

bot.command('edit_profil', checkUser(), async (ctx) => {
    const idChat = ctx.chat.id;
  
    // Query to check if user data exists
    conn.query('SELECT * FROM tbUser WHERE id_chat = ?', [idChat], (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan, coba lagi nanti. Silahkan laporkan kepada /contact_person jika perlu');
        }

        if (results.length > 0) {
            // No user data, start registration
            chatSession[idChat] = { step: 'edit_profil_nama' };
            return ctx.reply('Masukkan perubahan nama yang anda inginkan. Ingat, nama yang dimasukkan harus sesuai dengan yang ada di paket ya. Jika tidak, kamu tidak akan menerima notifikasi dari aplikasi ini.\n\nSilahkan masukkan nama anda sesuai dengan yang ada di paket:');
        }
    });
});

bot.command('simpan_paket', checkUser(), checkPetugas(), (ctx) => {
    const idChat = ctx.chat.id;

    // Start a new data input session
    chatSession[idChat] = { step: 'nama_masuk' }
    ctx.reply('Masukkan "Atas Nama" pada paket yang ingin disimpan:')
});

bot.command('ambil_paket', checkUser(), checkPetugas(), (ctx) => {
    const idChat = ctx.chat.id;

    // Start a new data output session
    chatSession[idChat] = { step: 'kode_unik' }
    ctx.reply('Masukkan "Kode Unik" untuk setiap 1 paket:')
});

bot.command('tambah_tanggal_ambil', checkUser(), checkAdmin('admin'), (ctx) => {
    const idChat = ctx.chat.id;

    // Start a new data inputTanggal session
    chatSession[idChat] = { step: 'tambah_tgl' }
    ctx.reply('Tambah tanggal (Tahun-Bulan-Tanggal):\ncontoh: 2024-12-30')
});

bot.command('ubah_jadwal', checkUser(), checkAntrian(), (ctx) => {
    const userId = ctx.chat.id;
    const checkQuery = 'SELECT * FROM `tbjadwal` WHERE slots > (SELECT COUNT(id_pemilik) AS jml_paket FROM tbpaket WHERE id_pemilik = ?) GROUP BY tanggal;';

    conn.query(checkQuery, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat cek tanggal pengambilan. Silahkan laporkan kepada /contact_person jika perlu');
        }

        if (results.length === 0) {
            return ctx.reply('Mohon maaf jadwal tidak tersedia🙏');
        }

        // Generate buttons for available tbJadwal
        const btn_ubah = results.map((jadwals) => {
            // const { id, tanggal, kode_waktu, slots } = jadwals;
            const tanggalString = jadwals.tanggal.toISOString().split('T')[0]; // Format: YYYY-MM-DD

            return Markup.button.callback(
            `Ubah ke ${tanggalString}`,
            `ubahjadwal_${tanggalString}`
            );
        });
    
        ctx.reply(
            'Anda ingin merubah ke jadwal mana? Anda tidak bisa kembali setelah memilih tanggal.\n\nJadwal yang tersedia:',
            Markup.inlineKeyboard(btn_ubah.map((btn) => [btn]))
        );
    });
});

// Action to book a schedule
bot.action(/ubahjadwal_(.+)/, (ctx) => {
    // console.log('Ubah Jadwal')
    ctx.deleteMessage()

    const getTanggal = ctx.match[1];
    const userId = ctx.chat.id;

    // console.log(ctx.match)
    // console.log(getTanggal)
    
    const checkQuery2 = 'SELECT id, tanggal, rentang_waktu, slots FROM tbjadwal JOIN tbwaktu ON tbjadwal.kode_waktu = tbwaktu.id_waktu WHERE tanggal = ? AND slots > (SELECT COUNT(id_pemilik) AS jml_paket FROM tbpaket WHERE id_pemilik = ?);';
    conn.query(checkQuery2, [getTanggal, userId], (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat cek jam pengambilan. Silahkan laporkan kepada /contact_person jika perlu');
        }

        // Generate buttons for available tbJadwal
        const buttons = results.map((jadwals2) => {
            const { id, tanggal, rentang_waktu, slots } = jadwals2;
            const tanggalString = jadwals2.tanggal.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            return Markup.button.callback(
            `(${tanggalString}) ${rentang_waktu}`,
            // `${tanggal} ${kode_waktu} (${slots})`,
            `ubahantri_${id}`
            );
        });
    
        ctx.reply(
            'Silahkan pilih mau pindah kemana?',
            Markup.inlineKeyboard(buttons.map((btns) => [btns]))
        );
    });
});

bot.action(/ubahantri_(.+)/, (ctx) => {
    const getIdJadwal = ctx.match[1];
    const userId = ctx.chat.id;

    // console.log(getIdJadwal)
  
    // Check if the schedule has available slots
    const checkQuery3 = 'SELECT id, tanggal, rentang_waktu, slots, (SELECT COUNT(id_pemilik) FROM tbpaket WHERE id_pemilik = ?) AS jml_paket FROM tbjadwal JOIN tbwaktu ON tbjadwal.kode_waktu = tbwaktu.id_waktu WHERE id = ?';
    conn.query(checkQuery3, [userId, getIdJadwal], (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat cek ketersediaan jadwal tahap akhir. Silahkan laporkan kepada /contact_person jika perlu');
        }
        // console.log('Results from checkQuery3:', results);

        dataStoreUbahJadwal = []
        results.forEach(ubahjadwalz => {
            // console.log(ubahjadwalz.nama_pada_paket)
            dataStoreUbahJadwal.push({
                id: ubahjadwalz.id,
                tanggal: ubahjadwalz.tanggal,
                rentang_waktu: ubahjadwalz.rentang_waktu,
                slots: ubahjadwalz.slots,
                jml_paket: ubahjadwalz.jml_paket
            })
        })

        // console.log('dataStoreUbahJadwal:', dataStoreUbahJadwal);
        // console.log('jml_paket:', dataStoreUbahJadwal[0]?.jml_paket);
        // console.log(dataStoreUbahJadwal[0])

        const jumlahPaket = dataStoreUbahJadwal[0].jml_paket

        conn.query('DELETE FROM tbAntrian WHERE id_pemilik = ?', [userId], (err) => {
            if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat mengubah Jadwal Pengambilan. Silahkan laporkan kepada /contact_person jika perlu');
            }

            // Add booking
            const insertBookingQuery = 'INSERT INTO tbAntrian (id, id_pemilik, id_jadwal, jumlah_paket) VALUES (NULL, ?, ?, ?)';
            conn.query(insertBookingQuery, [userId, getIdJadwal, jumlahPaket], (err) => {
                if (err) {
                console.error(err);
                return ctx.reply('Terjadi kesalahan saat mengubah Jadwal Pengambilan. Silahkan laporkan kepada /contact_person jika perlu');
                }
                
                // console.log('Insert Query Parameters:', { userId, getIdJadwal, jumlahPaket });
    
                // Update booked slots
                const updateScheduleQuery = 'UPDATE tbJadwal SET slots = slots - ? WHERE id = ?';
                conn.query(updateScheduleQuery, [jumlahPaket, getIdJadwal], (err) => {
                    if (err) {
                        console.error(err);
                        return ctx.reply('Terjadi kesalahan saat merubah kapasitas jadwal. Silahkan laporkan kepada /contact_person jika perlu');
                    }
    
                    const tanggalString = dataStoreUbahJadwal[0].tanggal.toISOString().split('T')[0]; // Format: YYYY-MM-DD
                    const rentangWaktu = dataStoreUbahJadwal[0].rentang_waktu
    
                    ctx.deleteMessage()

                    ctx.reply(
    `
Selamat, jadwalmu sudah diubah menjadi : 
    
Tanggal : ${tanggalString} 
Jam : ${rentangWaktu}
    `
                    );
                });
            });
        });

    });
});

bot.command('pilih_jadwal', checkUser(), checkPaket(), checkUpdateAntrian(), (ctx) => {
    const userId = ctx.chat.id;
    const checkQuery = 'SELECT * FROM `tbjadwal` WHERE slots > (SELECT COUNT(id_pemilik) AS jml_paket FROM tbpaket WHERE id_pemilik = ?) GROUP BY tanggal;';

    conn.query(checkQuery, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat cek tanggal pengambilan. Silahkan laporkan kepada /contact_person jika perlu');
        }

        if (results.length === 0) {
            return ctx.reply('Mohon maaf jadwal tidak tersedia🙏');
        }

        // Generate buttons for available tbJadwal
        const btn_pilih = results.map((jadwal) => {
            // const { id, tanggal, kode_waktu, slots } = jadwal;
            const tanggalString = jadwal.tanggal.toISOString().split('T')[0]; // Format: YYYY-MM-DD

            return Markup.button.callback(
            `${tanggalString}`,
            `jadwal_${tanggalString}`
            );
        });
    
        ctx.reply(
            'Silahkan pilih jadwal yang anda inginkan. Anda tidak bisa kembali setelah memilih tanggal.',
            Markup.inlineKeyboard(btn_pilih.map((btn) => [btn]))
        );
    });
});

// Action to book a schedule
bot.action(/jadwal_(.+)/, (ctx) => {
    // console.log('Masuk Jadwal')
    ctx.deleteMessage()

    const getTanggal = ctx.match[1];
    const userId = ctx.chat.id;

    // console.log(ctx.match)
    // console.log(getTanggal)
    
    const checkQuery2 = 'SELECT id, tanggal, rentang_waktu, slots FROM tbjadwal JOIN tbwaktu ON tbjadwal.kode_waktu = tbwaktu.id_waktu WHERE tanggal = ? AND slots > (SELECT COUNT(id_pemilik) AS jml_paket FROM tbpaket WHERE id_pemilik = ?);';
    conn.query(checkQuery2, [getTanggal, userId], (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat cek jam pengambilan. Silahkan laporkan kepada /contact_person jika perlu');
        }

        // Generate buttons for available tbJadwal
        const buttons = results.map((jadwal2) => {
            const { id, tanggal, rentang_waktu, slots } = jadwal2;
            const tanggalString = jadwal2.tanggal.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            return Markup.button.callback(
            `(${tanggalString}) ${rentang_waktu}`,
            // `${tanggal} ${kode_waktu} (${slots})`,
            `antri_${id}`
            );
        });
    
        ctx.reply(
            'Jadwal yang tersedia:',
            Markup.inlineKeyboard(buttons.map((btn) => [btn]))
        );
    });
});

// Action to book a schedule
bot.action(/antri_(.+)/, (ctx) => {
    const getIdJadwal = ctx.match[1];
    const userId = ctx.chat.id;

    // console.log(getIdJadwal)
  
    // Check if the schedule has available slots
    const checkQuery3 = 'SELECT id, tanggal, rentang_waktu, slots, (SELECT COUNT(id_pemilik) FROM tbpaket WHERE id_pemilik = ?) AS jml_paket FROM tbjadwal JOIN tbwaktu ON tbjadwal.kode_waktu = tbwaktu.id_waktu WHERE id = ?';
    conn.query(checkQuery3, [userId, getIdJadwal], (err, results) => {
        if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat cek ketersediaan jadwal tahap akhir. Silahkan laporkan kepada /contact_person jika perlu');
        }
        // console.log('Results from checkQuery3:', results);

        dataStoreJadwal = []
        results.forEach(jadwalz => {
            // console.log(jadwalz.nama_pada_paket)
            dataStoreJadwal.push({
                id: jadwalz.id,
                tanggal: jadwalz.tanggal,
                rentang_waktu: jadwalz.rentang_waktu,
                slots: jadwalz.slots,
                jml_paket: jadwalz.jml_paket
            })
        })

        // console.log('dataStoreJadwal:', dataStoreJadwal);
        // console.log('jml_paket:', dataStoreJadwal[0]?.jml_paket);
        // console.log(dataStoreJadwal[0])

        const jumlahPaket = dataStoreJadwal[0].jml_paket

        // Add booking
        const insertBookingQuery = 'INSERT INTO tbAntrian (id, id_pemilik, id_jadwal, jumlah_paket) VALUES (NULL, ?, ?, ?)';
        conn.query(insertBookingQuery, [userId, getIdJadwal, jumlahPaket], (err) => {
            if (err) {
            console.error(err);
            return ctx.reply('Terjadi kesalahan saat memilih Jadwal Pengambilan. Silahkan laporkan kepada /contact_person jika perlu');
            }
            
            // console.log('Insert Query Parameters:', { userId, getIdJadwal, jumlahPaket });

            // Update booked slots
            const updateScheduleQuery = 'UPDATE tbJadwal SET slots = slots - ? WHERE id = ?';
            conn.query(updateScheduleQuery, [jumlahPaket, getIdJadwal], (err) => {
                if (err) {
                    console.error(err);
                    return ctx.reply('Terjadi kesalahan saat merubah kapasitas jadwal. Silahkan laporkan kepada /contact_person jika perlu');
                }

                const tanggalString = dataStoreJadwal[0].tanggal.toISOString().split('T')[0]; // Format: YYYY-MM-DD
                const rentangWaktu = dataStoreJadwal[0].rentang_waktu

                ctx.deleteMessage()

                console.log(dataStoreJadwal[0].tanggal)

                ctx.reply(
`
Selamat, kamu sudah masuk ke daftar pengunjung Sekre! Silahkan datang pada :

Tanggal : ${tanggalString} 
Jam : ${rentangWaktu}
`
                );

                console.log(dataStoreJadwal[0].tanggal)
            });
        });
    });
});

bot.command('login_admin', checkUser(), (ctx) => {
    const idChat = ctx.chat.id;

    // Start a new data input session
    chatSession[idChat] = { step: 'password_admin' }
    ctx.reply('Masukkan password Admin:')
});

bot.command('login_petugas', checkUser(), (ctx) => {
    const idChat = ctx.chat.id;

    // Start a new data input session
    chatSession[idChat] = { step: 'username_petugas' }
    ctx.reply('Masukkan username Kementerianmu:')
});

bot.command('help_admin', checkUser(), checkAdmin('admin'), (ctx) => {
    ctx.reply(adminCommand)
});

bot.command('help_petugas', checkUser(), checkPetugas(), (ctx) => {
    ctx.reply(petugasCommand)
});

// Session object to track user state
bot.command('lihat_antrian', checkUser(), checkPetugas(), (ctx) => {
    const selectQuery = 'SELECT atr.id, usr.atas_nama, jdw.tanggal, wkt.rentang_waktu, atr.jumlah_paket FROM tbantrian AS atr JOIN tbuser AS usr ON atr.id_pemilik = usr.id_chat JOIN tbjadwal AS jdw ON atr.id_jadwal = jdw.id JOIN tbwaktu AS wkt ON jdw.kode_waktu = wkt.id_waktu WHERE tanggal = DATE(NOW()) ORDER BY atr.id_jadwal ASC';

    conn.query(selectQuery, function(err, result, fields){
        if(err){
            throw err
        }

        dataStoreAntrian = []

        result.forEach(antriz => {
            // console.log(antriz.nama_pada_paket)
            dataStoreAntrian.push({
                id: antriz.id,
                atas_nama: antriz.atas_nama,
                tanggal: antriz.tanggal,
                rentang_waktu: antriz.rentang_waktu,
                jumlah_paket: antriz.jumlah_paket
            })
        })

        let antrianMessage = 'Berikut daftar antrian Hari Ini:\n'
    
        dataStoreAntrian.forEach(antrizz => {
            antrianMessage += `▪️ ${antrizz.rentang_waktu} - ${antrizz.atas_nama} (${antrizz.jumlah_paket} paket)\n`
        })

        ctx.reply(antrianMessage)
    })
});

bot.command('contact_person', checkUser(), (ctx) => {
    ctx.reply('👇Silahkan klik tombol di bawah👇', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Hubungi CP', url: 'https://t.me/kmnkstr' }]
            ],
        },
    });
});

// Message handler for the registration process
bot.on('text', (ctx) => {
    const idChat = ctx.chat.id;
    const userName = ctx.chat.username;
    const firstName = ctx.chat.first_name;
    const text = ctx.message.text;
    const slotsJadwal = 29

    // Untuk command /login_admin
    if (chatSession[idChat]) {
        const step = chatSession[idChat].step;
    
        if (step === 'password_admin') {
            // Check username
            conn.query(
                'SELECT * FROM tbKementerian WHERE role = "admin" AND password = ?', [text], (err, result) => {
                    if (err) {
                        console.error(err);
                        return ctx.reply('Terjadi kesalahan saat memasukkan password admin. Silahkan laporkan kepada /contact_person jika perlu');
                    }

                    // const dateString = dataStoreTanggal[0].tanggal.toISOString().split('T')[0]

                    if (result.length > 0) {
                        // Data is exists
                        // console.log(result[0].role)
                        nameAdmin = result[0].role

                        conn.query(
                            'UPDATE tbUser SET kementerian = ? WHERE id_chat = ?',
                            [nameAdmin, idChat],
                            (err) => {
                                if (err) {
                                console.error(err);
                                return ctx.reply('Terjadi kesalahan saat mengubah role. Silahkan laporkan kepada /contact_person jika perlu');
                                }
                                ctx.reply(adminCommand);
                            }
                        );
                    } else {
                        // Data does not exist
                        ctx.reply('Mohon maaf, password yang kamu masukkan salah❌');
                    }

                    delete chatSession[idChat]; // Clear session after registration
                }
            );
        } else if (step === 'username_petugas') {
            // Check username
            conn.query(
                'SELECT role FROM tbKementerian WHERE role = ?', [text], (err, result) => {
                    if (err) {
                        console.error(err);
                        return ctx.reply('Terjadi kesalahan saat memasukkan username. Silahkan laporkan kepada /contact_person jika perlu');
                    }

                    // const dateString = dataStoreTanggal[0].tanggal.toISOString().split('T')[0]

                    if (result.length > 0) {
                        // Data is exists
                        chatSession[idChat] = { step: 'password_petugas' }
                        ctx.reply('Masukkan password Kementerianmu:')
                    } else {
                        // Data does not exist
                        ctx.reply('Mohon maaf, username yang kamu masukkan salah❌');
                    }
                }
            );
        } else if (step === 'password_petugas') {
            // console.log(step)
            // input password
            conn.query(
                'SELECT * FROM tbKementerian WHERE password = ?', [text], (err, result) => {
                    if (err) {
                        console.error(err);
                        return ctx.reply('Terjadi kesalahan saat memasukkan username. Silahkan laporkan kepada /contact_person jika perlu');
                    }

                    if (result.length > 0) {
                        // Data is exists
                        conn.query("SELECT role FROM tbKementerian WHERE password = ?", [text], function (err, result, fields){
                            if(err){
                                throw err
                            }
                            dataStorePassword = []
                    
                            result.forEach(paketz => {
                                dataStorePassword.push({
                                    role: paketz.role
                                })
                            })

                            namaKementerian = dataStorePassword[0].role
                            // console.log(namaKementerian)

                            conn.query(
                                'UPDATE tbUser SET kementerian = ? WHERE id_chat = ?',
                                [namaKementerian, idChat],
                                (err) => {
                                    if (err) {
                                    console.error(err);
                                    return ctx.reply('Terjadi kesalahan saat mengubah role. Silahkan laporkan kepada /contact_person jika perlu');
                                    }
                                    ctx.reply(petugasCommand);
                                }
                            );
                        })
                        
                        delete chatSession[idChat]; // Clear session after registration

                    } else {
                        // Data does not exist
                        ctx.reply('Mohon maaf, password yang kamu masukkan salah❌');
                        delete chatSession[idChat]; // Clear session after registration
                    }

                    delete chatSession[idChat]; // Clear session after registration
                    
                }
            );
        } else if (step === 'nama') {
            // Insert user's name
            conn.query(
                'INSERT INTO tbUser (id, username, first_name, atas_nama, asrama, id_chat, kementerian) VALUES (NULL, ?, ?, ?, "", ?, "")',
                [userName, firstName, text, idChat],
                (err) => {
                    if (err) {
                        console.error(err);
                        return ctx.reply('Terjadi kesalahan saat menyimpan Nama. Silahkan laporkan kepada /contact_person jika perlu');
                    }
                    chatSession[idChat].step = 'asrama';
                    // ctx.reply('Asrama:');
                    chooseAsrama(ctx)
                }
            );
        } else if (step === 'asrama') {
            // Update user's address
            conn.query(
                'UPDATE tbUser SET asrama = ? WHERE id_chat = ?',
                [text, idChat],
                (err) => {
                    if (err) {
                    console.error(err);
                    return ctx.reply('Terjadi kesalahan saat menyimpan data Asrama. Silahkan laporkan kepada /contact_person jika perlu');
                    }
                    delete chatSession[idChat]; // Clear session after registration
                    ctx.reply('Selamat!!! Registrasi telah berhasil. Silahkan tunggu informasi selanjutnya mengenai paket anda.');
                }
            );
        } else if (step === 'nama_masuk') {
        // Save atas_nama and ask for asrama
            conn.query(
                'INSERT INTO tbTempPaket (id_temp, atas_nama, asrama, kode_unik, id_chat) VALUES (NULL, ?, "", "", ?)',
                [text, idChat],
                (err) => {
                if (err) {
                    console.error(err);
                    return ctx.reply('Terjadi kesalahan saat menyimpan "Atas Nama" paket. Silahkan laporkan kepada /contact_person jika perlu');
                }
                chatSession[idChat].step = 'asrama_masuk';
                // ctx.reply('Masukkan Asrama:');
                chooseAsrama(ctx)
                }
            );
        } else if (step === 'asrama_masuk') {
        // Save asrama and complete the input process
            const kodeUnik = kodeRandom(6)

            conn.query(
                'UPDATE tbTempPaket SET asrama = ?, kode_unik = ? WHERE id_chat = ?',
                [text, kodeUnik, idChat],
                (err) => {
                if (err) {
                    console.error(err);
                    return ctx.reply('Terjadi kesalahan. Santri belum mendaftar pada aplikasi atau nama yang diinput tidak sesuai dengan data pengguna. Silahkan laporkan kepada /contact_person jika perlu');
                }
                // delete chatSession[idChat]; // Clear session after input
                // ctx.reply('Data berhasil disimpan!');
                }
            );

            conn.query("SELECT tbUser.id_chat AS id_pemilik FROM tbUser WHERE atas_nama IN (SELECT atas_nama FROM tbTempPaket WHERE id_chat = ?) AND asrama IN (SELECT asrama FROM tbTempPaket WHERE id_chat = ?)", [idChat, idChat], function (err, result, fields){
                if(err){
                    throw err
                }
                dataStorePaket = []
        
                result.forEach(paketz => {
                    dataStorePaket.push({
                        id_pemilik: paketz.id_pemilik
                    })
                    
                    idPemilik = paketz.id_pemilik
                    // console.log(idPemilik)
                    
                    const notifKodeUnik = 
`
Haloo, paket anda telah didata dan disimpan di Sekre!

Silahkan gunakan kode unik yang kamu miliki untuk mengambil paket. Kode untuk mengambil paket tersebut adalah:

"${kodeUnik}"

Jangan sebarkan kode yang kamu dapat ke sembarang orang yaa.
`
                    bot.telegram.sendMessage(idPemilik, notifKodeUnik)

                    const notifRekomendasiJadwal = 
`
Sekarang sekre ada jadwal pengambilan. Apakah kamu ingin pilih jadwal sekarang atau nanti? Silahkan klik /pilih_jadwal di saat kamu siap untuk memilih jadwal😉
`
                    bot.telegram.sendMessage(idPemilik, notifRekomendasiJadwal)
                    ctx.reply('Notifikasi paket sudah terkirim kepada pemilik paket!!!')
                })
            })

            // conn.query("SELECT COUNT(id_pemilik) AS jml_paket FROM tbpaket WHERE id_pemilik = (SELECT tbUser.id_chat FROM tbUser WHERE atas_nama IN (SELECT atas_nama FROM tbTempPaket WHERE id_chat = ?) AND asrama IN (SELECT asrama FROM tbTempPaket WHERE id_chat = ?)))", [idChat, idChat], function (err, result, fields){
            //     if(err){
            //         throw err
            //     }
            // })

            conn.query(
                'DELETE FROM tbTempPaket WHERE id_chat = ?',
                [idChat],
                (err) => {
                if (err) {
                    console.error(err);
                    return ctx.reply('Terjadi kesalahan saat menghapus Tabel Temp. Silahkan laporkan kepada /contact_person jika perlu');
                }
                delete chatSession[idChat]; // Clear session after input
                }
            );
            delete chatSession[idChat]; // Clear session after
        } else if (step === 'kode_unik') {
            // Insert user's name
            conn.query(
                'INSERT INTO tbPaketKeluar (id_keluar, id_pemilik, kode_unik, id_petugas, timestamp) VALUES (NULL, "", ?, ?, "")',
                [text, idChat],
                (err) => {
                    if (err) {
                        console.error(err);
                        return ctx.reply('Terjadi kesalahan saat memasukkan Kode Unik ke data Paket Keluar. Silahkan laporkan kepada /contact_person jika perlu');
                    }
                }
            );

            conn.query(
                'UPDATE tbPaketKeluar SET id_pemilik = (SELECT id_pemilik FROM tbPaket WHERE kode_unik=?), timestamp = current_timestamp() WHERE kode_unik = ?',
                [text, text],
                (err) => {
                if (err) {
                    console.error(err);
                    return ctx.reply('Terjadi kesalahan saat menyimpan Kode Unik ke data Paket Keluar. Silahkan laporkan kepada /contact_person jika perlu');
                }
                delete chatSession[idChat]; // Clear session after input
                }
            );

            conn.query("SELECT atas_nama, asrama, id_pemilik, kode_unik, id_petugas FROM tbpaket INNER JOIN tbuser ON tbpaket.id_pemilik = tbuser.id_chat WHERE kode_unik=?", [text], function (err, result, fields){
                if(err){
                    throw err
                }
                dataStoreKodeUnik = []

                result.forEach(kodez => {
                    // console.log(kodez.nama_pada_paket)
                    dataStoreKodeUnik.push({
                        atas_nama: kodez.atas_nama,
                        asrama: kodez.asrama,
                        id_pemilik: kodez.id_pemilik,
                        kode_unik: kodez.kode_unik,
                        id_petugas: kodez.id_petugas
                    })
                    let idPemilikPaket = kodez.id_pemilik
                    let atasNamaPaket = kodez.atas_nama
                    let asramaPaket = kodez.asrama
                    
                    const konfirmasiPaket = 
`
[DETAIL PAKET KELUAR]

Atas Nama : ${atasNamaPaket}
Asrama : ${asramaPaket}
`
                    const notifKeluar = 
`
[PEMBERITAHUAN]

Paket Atas Nama : ${atasNamaPaket}
Asrama : ${asramaPaket}

sudah diambil dari sekre. Jika terdapat kekeliruan, silahkan hubungi /contact_person
`
                    // ctx.reply(konfirmasiPaket)
                    delete chatSession[idChat]; // Clear session after input
                    ctx.reply(konfirmasiPaket)
                    bot.telegram.sendMessage(idPemilikPaket, notifKeluar)

                    conn.query(
                        'DELETE FROM tbAntrian WHERE id_pemilik = ?',
                        [idPemilikPaket],
                        (err) => {
                        if (err) {
                            console.error(err);
                            return ctx.reply('Terjadi kesalahan saat selesai memasukkan Kode Unik. Silahkan laporkan kepada /contact_person jika perlu');
                        }
                        delete chatSession[idChat]; // Clear session after input
                        }
                    );
                })
            })
            
            conn.query(
                'DELETE FROM tbPaket WHERE kode_unik = ?',
                [text],
                (err) => {
                if (err) {
                    console.error(err);
                    return ctx.reply('Terjadi kesalahan saat selesai memasukkan Kode Unik. Silahkan laporkan kepada /contact_person jika perlu');
                }
                delete chatSession[idChat]; // Clear session after input
                }
            );

            delete chatSession[idChat]; // Clear session after
        } else if (step === 'tambah_tgl') {
            // Insert user's name
            conn.query("SELECT DATE(tanggal) AS tanggal FROM tbjadwal WHERE tanggal=? LIMIT 1", [text], function (err, result, fields){
                if(err){
                    throw err
                }

                // const dateString = dataStoreTanggal[0].tanggal.toISOString().split('T')[0]
                if (result.length > 0) {
                    // Data already exists
                    ctx.reply(`Tanggal '${text}' sudah ada. Silahkan klik /tambah_tanggal_ambil untuk memasukkan tanggal lain.`);
                } else {
                    // Data does not exist, insert it
                    conn.query(
                        'INSERT INTO tbJadwal (id, tanggal, kode_waktu, slots) VALUES (NULL, ?, 1, ?)',
                        [text, slotsJadwal],
                        (err) => {
                            if (err) {
                                console.error(err);
                                return ctx.reply('Terjadi kesalahan saat menyimpan tanggal. Silahkan laporkan kepada /contact_person jika perlu');
                            }
                        }
                    );
                    conn.query(
                        'INSERT INTO tbJadwal (id, tanggal, kode_waktu, slots) VALUES (NULL, ?, 2, ?)',
                        [text, slotsJadwal],
                        (err) => {
                            if (err) {
                                console.error(err);
                                return ctx.reply('Terjadi kesalahan saat menyimpan tanggal. Silahkan laporkan kepada /contact_person jika perlu');
                            }
                        }
                    );
                    conn.query(
                        'INSERT INTO tbJadwal (id, tanggal, kode_waktu, slots) VALUES (NULL, ?, 3, ?)',
                        [text, slotsJadwal],
                        (err) => {
                            if (err) {
                                console.error(err);
                                return ctx.reply('Terjadi kesalahan saat menyimpan tanggal. Silahkan laporkan kepada /contact_person jika perlu');
                            }
                        }
                    );
                    conn.query(
                        'INSERT INTO tbJadwal (id, tanggal, kode_waktu, slots) VALUES (NULL, ?, 4, ?)',
                        [text, slotsJadwal],
                        (err) => {
                            if (err) {
                                console.error(err);
                                return ctx.reply('Terjadi kesalahan saat menyimpan tanggal. Silahkan laporkan kepada /contact_person jika perlu');
                            }
                        }
                    );
                    conn.query(
                        'INSERT INTO tbJadwal (id, tanggal, kode_waktu, slots) VALUES (NULL, ?, 5, ?)',
                        [text, slotsJadwal],
                        (err) => {
                            if (err) {
                                console.error(err);
                                return ctx.reply('Terjadi kesalahan saat menyimpan tanggal. Silahkan laporkan kepada /contact_person jika perlu');
                            }
                        }
                    );
                    conn.query(
                        'INSERT INTO tbJadwal (id, tanggal, kode_waktu, slots) VALUES (NULL, ?, 6, ?)',
                        [text, slotsJadwal],
                        (err) => {
                            if (err) {
                                console.error(err);
                                return ctx.reply('Terjadi kesalahan saat menyimpan tanggal. Silahkan laporkan kepada /contact_person jika perlu');
                            }
                            ctx.reply(`Tanggal '${text}' sudah dimasukkan, aman👍!`)
                            konfirmasiTambahTanggal(ctx)
                        }
                    );
                }
            })
            delete chatSession[idChat]; // Clear session after
        } else if (step === 'edit_profil_nama') {
            // Insert user's name
            conn.query(
                'UPDATE tbUser SET atas_nama = ? WHERE id_chat = ?',
                [text, idChat],
                (err) => {
                    if (err) {
                        console.error(err);
                        return ctx.reply('Terjadi kesalahan saat mengubah Nama. Silahkan laporkan kepada /contact_person jika perlu');
                    }
                    chatSession[idChat].step = 'edit_profil_asrama';
                    // ctx.reply('Asrama:');
                    chooseAsrama(ctx)
                }
            );
        } else if (step === 'edit_profil_asrama') {
            // Update user's address
            conn.query(
                'UPDATE tbUser SET asrama = ? WHERE id_chat = ?',
                [text, idChat],
                (err) => {
                    if (err) {
                    console.error(err);
                    return ctx.reply('Terjadi kesalahan saat menyimpan data Asrama. Silahkan laporkan kepada /contact_person jika perlu');
                    }
                    delete chatSession[idChat]; // Clear session after registration
                    ctx.reply('Selamat!!! Data Nama dan Asrama Anda telah berhasil diubah.');
                }
            );
        } 
    } else {
        // Fallback for unrecognized messages
        ctx.reply(
            "Mohon maaf saya tidak mengerti apa yang anda kirim. Gunakan /help untuk melihat list perintah."
        );
    }
});

bot.launch(
    {
        webhook: {
            // Public domain for webhook; e.g.: example.com
            domain: domain,
        
            // Port to listen on; e.g.: 8080
            port: port,
        },
    }
)

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
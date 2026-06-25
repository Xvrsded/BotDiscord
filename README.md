# WinterBot

WinterBot adalah bot Discord multi-fungsi untuk komunitas Roblox dan toko digital. Bot ini dibangun menggunakan Node.js, Discord.js v14, Mongoose (MongoDB), dan noblox.js.

## Fitur
- **Verifikasi Akun Roblox**: Mengintegrasikan akun Discord dengan Roblox.
- **Sistem Tiket**: Sistem tiket berbasis tombol untuk layanan pelanggan (Support, Order, Custom UGC, Report).
- **Sistem Produk**: Manajemen produk toko (Tambah, Hapus, Lihat).
- **Sistem Pesanan**: Pengguna dapat memesan produk, dan admin dapat mengelolanya.
- **Informasi**: Command dasar seperti `/ping`, `/serverinfo`, dan `/userinfo`.

## Persyaratan
- Node.js v16.14.0 atau yang lebih baru.
- MongoDB database (lokal atau Atlas).
- Token Bot Discord dan Client ID.

## Cara Instalasi

1. Pastikan Anda telah menginstal `node_modules` dengan menjalankan:
   ```bash
   npm install
   ```

2. Buat file `.env` berdasarkan file `.env.example` dan isi dengan konfigurasi Anda:
   ```env
   TOKEN=YOUR_DISCORD_BOT_TOKEN
   CLIENT_ID=YOUR_BOT_CLIENT_ID
   GUILD_ID=YOUR_SERVER_ID
   MONGO_URI=YOUR_MONGODB_URI
   ```
   > **Note**: `GUILD_ID` digunakan untuk memperbarui Slash Commands secara instan di server Anda selama masa pengembangan.

3. Jalankan bot:
   ```bash
   npm start
   ```

## Struktur Proyek
Proyek ini menggunakan arsitektur modular yang membagi fungsi ke dalam:
- `src/commands/`: Tempat command Slash (admin, general, roblox, shop).
- `src/events/`: Event listener Discord (`ready`, `interactionCreate`).
- `src/handlers/`: Pemanggil otomatis untuk command dan event.
- `src/models/`: Skema database Mongoose (User, Ticket, Product, Order, Review).
- `src/services/`: Logika eksternal (API Roblox).
- `src/index.js`: Entry point.

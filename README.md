<div align="center">
  <img src="WinterStore.gif" alt="WinterBot Banner" width="600" />

  # ❄️ WinterBot

  **Bot Discord Multi-Fungsi untuk Komunitas Roblox & Manajemen Toko Digital**

  [![Node.js](https://img.shields.io/badge/Node.js-v16.14.0+-green.svg)](https://nodejs.org/)
  [![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg)](https://discord.js.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
</div>

<br />

## 📖 Tentang WinterBot

WinterBot adalah bot Discord canggih yang dirancang khusus untuk mempermudah pengelolaan komunitas berbasis Roblox serta mengotomatisasi sistem toko digital langsung di dalam server Discord Anda. Dilengkapi dengan antarmuka yang ramah pengguna (Slash Commands & Buttons) dan integrasi database yang kuat.

---

## ✨ Fitur Unggulan

🛡️ **Sistem Verifikasi Roblox**
- Integrasi mulus antara akun Discord dan Roblox menggunakan `noblox.js`.
- Pemberian role otomatis berdasarkan status verifikasi dan kepemilikan grup/item.

🎫 **Sistem Tiket Lanjutan**
- Panel tiket interaktif berbasis tombol UI.
- Kategori tiket: *Support*, *Order*, *Custom UGC*, dan *Report*.
- Manajemen log tiket yang rapi dan terstruktur.

🛍️ **Manajemen Toko & Produk (E-Commerce)**
- Tambah, Edit, dan Hapus produk toko langsung dari Discord.
- Sistem pesanan interaktif: pengguna dapat melihat katalog dan memesan produk.
- Manajemen order untuk Admin (Accept, Reject, Complete).

🛠️ **Utilitas & Informasi**
- Command informasi server dan pengguna secara detail (`/serverinfo`, `/userinfo`).
- Pengecekan status bot dan latensi (`/ping`).
- Sistem Welcome & Goodbye yang dapat dikustomisasi.

---

## 🚀 Panduan Instalasi

Ikuti langkah-langkah di bawah ini untuk menjalankan WinterBot di server Anda sendiri.

### 📋 Persyaratan Sistem
- [Node.js](https://nodejs.org/) v16.14.0 atau yang lebih baru.
- Database [MongoDB](https://www.mongodb.com/) (Bisa menggunakan MongoDB Atlas yang gratis).
- Token Bot Discord dari [Discord Developer Portal](https://discord.com/developers/applications).

### 🛠️ Langkah Instalasi

1. **Clone Repository**
   ```bash
   git clone https://github.com/Xvrsded/BotDiscord.git
   cd BotDiscord
   ```

2. **Instalasi Dependencies**
   Pastikan Anda menginstal semua package yang dibutuhkan:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment (`.env`)**
   Isi file `.env` Anda dengan format berikut:
   ```env
   TOKEN=YOUR_DISCORD_BOT_TOKEN
   CLIENT_ID=YOUR_BOT_CLIENT_ID
   GUILD_ID=YOUR_SERVER_ID
   MONGO_URI=YOUR_MONGODB_URI
   ```
   > 💡 **Tips:** `GUILD_ID` digunakan untuk meregistrasi *Slash Commands* secara instan ke server pengujian Anda selama masa pengembangan.

4. **Jalankan Bot**
   ```bash
   npm start
   ```
   *Bot akan mulai berjalan dan terhubung ke Discord serta MongoDB.*

---

## 📂 Struktur Direktori Proyek

Proyek ini dibangun dengan arsitektur modular agar mudah dikembangkan:

```text
📦 src
 ┣ 📂 commands     # Kumpulan Slash Commands (admin, general, shop)
 ┣ 📂 events       # Event listeners Discord (ready, interactionCreate, dll)
 ┣ 📂 handlers     # Sistem handler otomatis untuk memuat command & event
 ┣ 📂 models       # Skema database Mongoose (User, Ticket, Product, dll)
 ┣ 📂 services     # Service eksternal (Integrasi API Roblox & Store)
 ┣ 📂 scripts      # Script utilitas dan pemeliharaan tambahan
 ┗ 📜 index.js     # Entry point aplikasi bot
```

---

## 🤝 Kontribusi

Kami sangat menyambut kontribusi! Jika Anda menemukan bug atau memiliki ide fitur baru, silakan buat *Pull Request* atau buka *Issue* di repositori ini.

---

<div align="center">
  Dibuat dengan ❤️ untuk komunitas Discord & Roblox.
</div>

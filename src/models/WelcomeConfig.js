const mongoose = require('mongoose');

const WelcomeConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, default: '1505192878446612580' },
    message: { type: String, default: '🎉 **Selamat Datang di Winter Santuary, {user}!** 🎉\n\nKami sangat senang menyambutmu di komunitas kami! Di sini kamu bisa menemukan berbagai macam produk terbaik, terpercaya, dan berkualitas tinggi.\n\nJangan lupa untuk:\n📖 Membaca peraturan server agar komunitas kita tetap aman.\n✅ Melakukan verifikasi jika diperlukan untuk mengakses channel lainnya.\n🎫 Membuka tiket bantuan jika kamu memiliki pertanyaan atau kendala.\n\nEnjoy your stay, **{username}**! ✨' },
    welcomeGif: { type: String, default: null },
    autoRole: { type: String, default: null },
    enabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('WelcomeConfig', WelcomeConfigSchema);

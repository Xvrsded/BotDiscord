const mongoose = require('mongoose');

const ProductConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, default: '1517962269567221840' },
    messageId: { type: String, default: null }
});

module.exports = mongoose.model('ProductConfig', ProductConfigSchema);

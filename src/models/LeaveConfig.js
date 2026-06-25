const mongoose = require('mongoose');

const LeaveConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, default: null },
    message: { type: String, default: null },
    leaveGif: { type: String, default: null },
    enabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('LeaveConfig', LeaveConfigSchema);

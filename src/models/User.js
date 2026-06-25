const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    robloxId: { type: Number, default: null },
    robloxUsername: { type: String, default: null },
    verified: { type: Boolean, default: false },
    eligibleForPayout: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);

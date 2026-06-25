const mongoose = require('mongoose');

const StoreConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    stockChannelId: { type: String, default: null },
    messageId: { type: String, default: null },
    packages: { 
        type: [{ amount: Number, price: Number }],
        default: [
            { amount: 100, price: 18000 },
            { amount: 200, price: 33000 },
            { amount: 300, price: 47000 },
            { amount: 400, price: 65000 },
            { amount: 500, price: 75000 },
            { amount: 1000, price: 150000 }
        ] 
    },
    lastAvailable: { type: String, default: null },
    lastPersonalAvailable: { type: String, default: null },
    lastGroupAvailable: { type: String, default: null },
    lastPending: { type: String, default: null },
    lastUpdate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StoreConfig', StoreConfigSchema);

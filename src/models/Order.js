const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    robloxUsername: { type: String, required: true },
    channelId: { type: String, required: true },
    robuxAmount: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: String, default: 'pending' }, // pending, processing, completed, cancelled
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);

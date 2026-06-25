const mongoose = require('mongoose');

const ProductOrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    channelId: { type: String, required: true },
    status: { type: String, default: 'pending' }, // pending, delivered, cancelled
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProductOrder', ProductOrderSchema);

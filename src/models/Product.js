const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Product', ProductSchema);

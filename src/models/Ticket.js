const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },
    category: { type: String, required: true }, // Support, Order, Custom UGC, Report
    status: { type: String, default: 'open' }, // open, closed
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);

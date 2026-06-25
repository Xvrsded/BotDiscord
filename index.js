require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected');
    })
    .catch(err => {
        console.error('❌ MongoDB Error:', err);
    });

client.once('ready', () => {
    console.log(`🤖 Login sebagai ${client.user.tag}`);
});

client.login(process.env.TOKEN);
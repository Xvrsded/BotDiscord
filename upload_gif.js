require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', async () => {
    try {
        const channel = await client.channels.fetch('1517637984705319033'); // Log channel
        const attachment = new AttachmentBuilder('WinterStore.gif');
        const msg = await channel.send({ content: 'Uploading GIF for CDN link...', files: [attachment] });
        console.log('GIF URL:', msg.attachments.first().url);
    } catch (e) {
        console.error('Upload failed:', e.message);
    }
    client.destroy();
});

client.login(process.env.TOKEN);

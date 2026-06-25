const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`🤖 Login sebagai ${client.user.tag}`);
        
        client.user.setPresence({
            activities: [{ name: 'Winter Community', type: ActivityType.Watching }],
            status: 'online',
        });
        
        const { updateStoreEmbed } = require('../services/storeService');
        // Update embed every 10 minutes (600000 ms)
        setInterval(() => {
            updateStoreEmbed(client);
        }, 10 * 60 * 1000);
        
        // Initial update
        setTimeout(() => updateStoreEmbed(client), 5000);
    },
};

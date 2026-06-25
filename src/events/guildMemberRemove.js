const { Events, EmbedBuilder } = require('discord.js');
const WelcomeConfig = require('../models/WelcomeConfig');
const LeaveConfig = require('../models/LeaveConfig');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        try {
            let targetChannel = null;

            // Coba cari dari LeaveConfig dulu
            const leaveConfig = await LeaveConfig.findOne({ guildId: member.guild.id });
            if (leaveConfig && leaveConfig.channelId) {
                targetChannel = member.guild.channels.cache.get(leaveConfig.channelId);
            }

            // Cari channel goodbye otomatis berdasarkan nama jika belum ada
            if (!targetChannel) {
                targetChannel = member.guild.channels.cache.find(c => 
                    c.name.toLowerCase().includes('goodbye') || 
                    c.name.toLowerCase().includes('leave') ||
                    c.name.toLowerCase().includes('keluar') ||
                    c.name.toLowerCase().includes('out')
                );
            }

            // Jika tidak ada channel khusus goodbye, gunakan channel welcome
            if (!targetChannel) {
                const welcomeConfig = await WelcomeConfig.findOne({ guildId: member.guild.id });
                if (welcomeConfig && welcomeConfig.channelId) {
                    targetChannel = member.guild.channels.cache.get(welcomeConfig.channelId);
                }
            }

            if (targetChannel) {
                let messageContent = `🍂 **Yahhh, ada yang pergi dari {server} nih...** 🍂\n\nSelamat jalan, **{username}**! 👋 Makasih banyak ya udah pernah mampir dan ikut ngeramein komunitas kita.\n\nHati-hati di jalan, semoga sukses terus di luaran sana! Pintu kita selalu terbuka lebar kok kalau suatu saat nanti kamu pengen main dan nongkrong di sini lagi. See ya! ✨`;
                
                // Replace placeholders
                messageContent = messageContent
                    .replace(/{user}/g, `<@${member.id}>`)
                    .replace(/{username}/g, member.user.username)
                    .replace(/{server}/g, member.guild.name)
                    .replace(/{membercount}/g, member.guild.memberCount);

                const embed = new EmbedBuilder()
                    .setColor('#ff0000') // Red for leave
                    .setDescription(messageContent)
                    .setTimestamp();

                const { AttachmentBuilder } = require('discord.js');
                const fs = require('fs');
                const path = require('path');
                
                const payload = { content: `**${member.user.username}** telah meninggalkan server.`, embeds: [] };

                const gifPath = path.join(__dirname, '../../WinterStore.gif');
                if (fs.existsSync(gifPath)) {
                    const stats = fs.statSync(gifPath);
                    if (stats.size < 8 * 1024 * 1024) { // Limit 8MB Discord untuk bot
                        const attachment = new AttachmentBuilder(gifPath, { name: 'LeaveBanner.gif' });
                        embed.setImage('attachment://LeaveBanner.gif');
                        payload.files = [attachment];
                    } else {
                        console.log('Leave GIF lokal terlalu besar (>8MB), tidak dilampirkan agar tidak error.');
                    }
                }

                payload.embeds = [embed];

                try {
                    await targetChannel.send(payload);
                } catch (err) {
                    console.error(`Failed to send leave message to channel ${targetChannel.id}:`, err);
                }
            }

        } catch (error) {
            console.error('GuildMemberRemove Event Error:', error);
        }
    },
};

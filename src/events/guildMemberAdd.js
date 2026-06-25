const { Events, EmbedBuilder } = require('discord.js');
const WelcomeConfig = require('../models/WelcomeConfig');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            let config = await WelcomeConfig.findOne({ guildId: member.guild.id });
            
            // Jika belum ada konfigurasi untuk server ini, buat konfigurasi baru dengan nilai default
            if (!config) {
                config = await WelcomeConfig.create({ guildId: member.guild.id });
            }

            // Jika sistem dinonaktifkan, jangan kirim pesan
            if (!config.enabled) return;

            // Handle Auto Role
            if (config.autoRole) {
                const role = member.guild.roles.cache.get(config.autoRole);
                if (role) {
                    try {
                        await member.roles.add(role);
                    } catch (err) {
                        console.error(`Failed to add auto-role to ${member.user.tag}:`, err);
                    }
                }
            }

            // Handle Welcome Message
            if (config.channelId) {
                const channel = await member.guild.channels.fetch(config.channelId).catch(() => null);
                
                if (channel) {
                    let messageContent = config.message || `🎉 **Wohooo! Ada member baru nih di {server}!** 🎉\n\nHalo {user}! 👋 Selamat datang dan terima kasih udah mampir ke server kita! Kita seneng banget kamu bisa gabung di sini dan jadi bagian dari member ke-{membercount}!\n\nSebelum mulai asik-asikan dan ngobrol bareng yang lain, pastiin kamu udah baca rules-nya dulu ya, biar kita semua sama-sama chill dan nyaman.\n\nKalo bingung atau mau nanya-nanya, jangan sungkan buat sapa admin atau ngobrol bareng member lain yang lagi online. Let's gooo, have fun, cari temen baru, dan semoga betah terus nongkrong di sini! 🚀✨`;
                    
                    // Replace placeholders
                    messageContent = messageContent
                        .replace(/{user}/g, `<@${member.id}>`)
                        .replace(/{username}/g, member.user.username)
                        .replace(/{server}/g, member.guild.name)
                        .replace(/{membercount}/g, member.guild.memberCount);

                    const embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setDescription(messageContent)
                        .setTimestamp();

                    const { AttachmentBuilder } = require('discord.js');
                    const fs = require('fs');
                    const path = require('path');
                    
                    const payload = { content: `<@${member.id}>`, embeds: [] };

                    // Gunakan URL GIF dari config jika ada, jika tidak cek file lokal (maks 25MB)
                    if (config.welcomeGif) {
                        embed.setImage(config.welcomeGif);
                    } else {
                        const gifPath = path.join(__dirname, '../../WinterStore.gif');
                        if (fs.existsSync(gifPath)) {
                            const stats = fs.statSync(gifPath);
                            if (stats.size < 8 * 1024 * 1024) { // Limit 8MB Discord untuk bot
                                const attachment = new AttachmentBuilder(gifPath, { name: 'WelcomeBanner.gif' });
                                embed.setImage('attachment://WelcomeBanner.gif');
                                payload.files = [attachment];
                            } else {
                                console.log('Welcome GIF lokal terlalu besar (>8MB), tidak dilampirkan agar tidak error.');
                            }
                        }
                    }

                    payload.embeds = [embed];

                    try {
                        await channel.send(payload);
                    } catch (err) {
                        console.error(`Failed to send welcome message to channel ${config.channelId}:`, err);
                    }
                }
            }

        } catch (error) {
            console.error('GuildMemberAdd Event Error:', error);
        }
    },
};

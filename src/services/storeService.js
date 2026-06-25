const noblox = require('noblox.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const StoreConfig = require('../models/StoreConfig');

let isLoggedIn = false;

async function loginRoblox() {
    if (isLoggedIn) return true;
    if (!process.env.ROBLOX_COOKIE) {
        console.warn('⚠️ ROBLOX_COOKIE tidak disetel di .env, sistem cek saldo otomatis dinonaktifkan.');
        return false;
    }
    
    try {
        const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE);
        const name = currentUser.name || currentUser.UserName || 'User';
        console.log(`✅ Roblox Logged in as ${name}`);
        isLoggedIn = true;
        return true;
    } catch (error) {
        console.error('❌ Roblox Login Error:', error.message);
        return false;
    }
}

async function getRobuxBalance() {
    let personalAvailable = 'N/A';
    let groupAvailable = 'N/A';
    let pending = 'N/A';

    try {
        const loggedIn = await loginRoblox();
        if (loggedIn) {
            // Fetch user funds
            try {
                const user = await noblox.getAuthenticatedUser();
                if (user && user.id) {
                    personalAvailable = await noblox.getUserFunds(user.id);
                } else {
                    personalAvailable = 'Error';
                }
            } catch (err) {
                console.error('Error fetching User funds:', err.message);
                personalAvailable = 'Error';
            }

            // Fetch group funds
            if (process.env.GROUP_ID) {
                try {
                    const groupId = parseInt(process.env.GROUP_ID);
                    groupAvailable = await noblox.getGroupFunds(groupId);
                } catch (err) {
                    console.error('Error fetching Group funds:', err.message);
                    groupAvailable = 'No Access';
                }
            } else {
                groupAvailable = 'Not Set';
            }
        }
    } catch (error) {
        console.error('Error fetching Robux balance:', error.message);
    }

    return { personalAvailable, groupAvailable, pending };
}

async function updateStoreEmbed(client) {
    try {
        let configs = await StoreConfig.find();
        
        // Auto-create config untuk setiap guild jika belum ada
        const guilds = client.guilds.cache.values();
        for (const guild of guilds) {
            const exists = configs.find(c => c.guildId === guild.id);
            if (!exists) {
                const newConfig = new StoreConfig({ guildId: guild.id, stockChannelId: '1517541756105916486' });
                await newConfig.save();
                configs.push(newConfig);
                console.log(`[Store] Auto-created store config for guild ${guild.name}`);
            }
        }

        if (configs.length === 0) return;

        const balance = await getRobuxBalance();
        const currentPersonal = String(balance.personalAvailable);
        const currentGroup = String(balance.groupAvailable);
        const currentPending = String(balance.pending);

        for (const config of configs) {
            try {
                if (!config.stockChannelId) {
                    config.stockChannelId = '1517541756105916486';
                    await config.save();
                }

                const guild = client.guilds.cache.get(config.guildId);
                if (!guild) continue;

                const channel = guild.channels.cache.get(config.stockChannelId);
                if (!channel) continue;

                // Cek apakah saldo berubah
                const stockChanged = (config.lastPersonalAvailable !== currentPersonal || config.lastGroupAvailable !== currentGroup || config.lastPending !== currentPending);
                
                if (!stockChanged && config.messageId) {
                    try {
                        const existingMessage = await channel.messages.fetch(config.messageId);
                        if (existingMessage) {
                            console.log(`[Store] Stock unchanged. No update needed for guild ${config.guildId}.`);
                            continue; // Skip update if nothing changed and message exists
                        }
                    } catch (err) {
                        // Message might be deleted, so we continue to create a new one
                        console.log(`[Store] Pesan embed tidak ditemukan, akan dibuat ulang.`);
                    }
                } else if (stockChanged) {
                    console.log(`[Store] Stock changed! Personal: ${currentPersonal}, Group: ${currentGroup}, Pending: ${currentPending}`);
                }

                const embed = new EmbedBuilder()
                    .setTitle('🛒 WinterBot Robux Store')
                    .setDescription('Selamat datang di Robux Store! Pilih menu di bawah ini untuk membeli Robux.')
                    .setColor('#0099ff')
                    .addFields(
                        { name: '💎 Personal Robux', value: `${currentPersonal} R$`, inline: true },
                        { name: '🏢 Group Robux', value: `${currentGroup} R$`, inline: true },
                        { name: '📦 Total Paket', value: `${config.packages.length} Paket`, inline: false }
                    )
                    .setFooter({ text: `Last Update: ${new Date().toLocaleString('id-ID')}` });

                let packageList = '';
                if (config.packages.length > 0) {
                    const sortedPackages = [...config.packages].sort((a, b) => a.amount - b.amount);
                    sortedPackages.forEach(pkg => {
                        packageList += `• **${pkg.amount} R$** - Rp ${pkg.price.toLocaleString('id-ID')}\n`;
                    });
                } else {
                    packageList = 'Belum ada paket yang tersedia.';
                }
                embed.addFields({ name: '📋 Daftar Paket & Harga', value: packageList });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('store_order').setLabel('🛒 Order Robux').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('store_packages').setLabel('📋 Lihat Paket').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('store_refresh').setLabel('💰 Refresh Stock').setStyle(ButtonStyle.Success)
                );

                let messageCreatedOrUpdated = false;

                if (config.messageId) {
                    try {
                        const message = await channel.messages.fetch(config.messageId);
                        if (message) {
                            await message.edit({ embeds: [embed], components: [row] });
                            console.log(`[Store] Embed updated for guild ${config.guildId}`);
                            messageCreatedOrUpdated = true;
                        }
                    } catch (err) {
                        console.log(`[Store] Pesan embed terhapus di guild ${config.guildId}, membuat ulang...`);
                    }
                }

                if (!messageCreatedOrUpdated) {
                    const newMessage = await channel.send({ embeds: [embed], components: [row] });
                    config.messageId = newMessage.id;
                    console.log(`[Store] Embed created for guild ${config.guildId}`);
                }

                config.lastPersonalAvailable = currentPersonal;
                config.lastGroupAvailable = currentGroup;
                config.lastPending = currentPending;
                config.lastUpdate = new Date();
                await config.save();

            } catch (err) {
                console.error(`[Store] Error updating embed for guild ${config.guildId}:`, err);
            }
        }
    } catch (error) {
        console.error('[Store] Error in updateStoreEmbed:', error);
    }
}

module.exports = {
    loginRoblox,
    getRobuxBalance,
    updateStoreEmbed
};

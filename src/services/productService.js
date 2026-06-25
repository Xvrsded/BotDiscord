const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Product = require('../models/Product');
const ProductConfig = require('../models/ProductConfig');

async function updateProductEmbed(client, guildId) {
    try {
        let config = await ProductConfig.findOne({ guildId });
        if (!config) {
            config = new ProductConfig({ guildId });
            await config.save();
        }

        const channelId = config.channelId || '1517962269567221840';
        const channel = await client.channels.fetch(channelId).catch(() => null);

        if (!channel) {
            console.error(`Product channel ${channelId} not found.`);
            return;
        }

        const products = await Product.find({ active: true });
        let descText = 'Halo semuanya! Berikut adalah daftar produk dari **WinterBot** yang tersedia untuk dibeli. Silakan baca deskripsi produk dengan baik sebelum melakukan pembelian. Untuk membeli, silakan klik tombol **Beli Sekarang** di bawah ini.\n\n';

        if (products.length === 0) {
            descText += 'Belum ada produk yang tersedia.';
        } else {
            products.forEach((p, index) => {
                const formatPrice = p.price.toLocaleString('id-ID');
                const formatStock = p.stock.toLocaleString('id-ID');
                
                descText += `\`\`\`ansi\n\u001b[1;36m${p.name}\u001b[0m\n\u001b[1;32mHarga: Rp${formatPrice}\u001b[0m | Stok: ${formatStock}\n${p.description}\n\`\`\`\n`;
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🛍️ Daftar Produk WinterBot (Luar Game Roblox)')
            .setDescription(descText)
            .setColor('#0099ff');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('product_buy_btn')
                    .setLabel('🛒 Beli Sekarang')
                    .setStyle(ButtonStyle.Success)
            );

        if (config.messageId) {
            try {
                const message = await channel.messages.fetch(config.messageId);
                await message.edit({ embeds: [embed], components: [row] });
                return;
            } catch (error) {
                console.log('Product message not found, creating a new one.');
            }
        }

        const newMessage = await channel.send({ embeds: [embed], components: [row] });
        config.messageId = newMessage.id;
        await config.save();

    } catch (error) {
        console.error('Error updating product embed:', error);
    }
}

module.exports = { updateProductEmbed };

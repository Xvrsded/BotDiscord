const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Command Execution Error:', error);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'Terdapat kesalahan saat mengeksekusi command ini!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'Terdapat kesalahan saat mengeksekusi command ini!', ephemeral: true });
                    }
                } catch (replyError) {
                    console.error('Failed to send error message:', replyError);
                }
            }
        } else if (interaction.isButton()) {
            const { customId } = interaction;
            
            // Handle verify button
            if (customId === 'verify_btn') {
                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                
                const modal = new ModalBuilder()
                    .setCustomId('verify_modal')
                    .setTitle('Verifikasi Akun Roblox');

                const usernameInput = new TextInputBuilder()
                    .setCustomId('roblox_username')
                    .setLabel('Masukkan Username Roblox Anda')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(3)
                    .setMaxLength(20);

                const firstActionRow = new ActionRowBuilder().addComponents(usernameInput);
                modal.addComponents(firstActionRow);

                return await interaction.showModal(modal);
            }

            try {
                const staffRoles = ['1505190278003298324', '1517049069166526546'];
                const restrictedButtons = ['ticket_close', 'staff_delivered', 'staff_cancel', 'staff_delivered_product', 'staff_cancel_product'];
                if (restrictedButtons.includes(customId)) {
                    const hasRole = staffRoles.some(roleId => interaction.member.roles.cache.has(roleId));
                    if (!hasRole) {
                        return interaction.reply({ content: '❌ Anda tidak memiliki izin untuk melakukan tindakan ini.', ephemeral: true });
                    }
                }

                if (customId.startsWith('ticket_') && customId !== 'ticket_close') {
                    const category = customId.split('_')[1];
                    const Ticket = require('../models/Ticket');
                    
                    await interaction.deferReply({ ephemeral: true });

                    const ticketId = `ticket-${interaction.user.id.slice(-4)}-${Date.now().toString().slice(-4)}`;
                    
                    const channel = await interaction.guild.channels.create({
                        name: `${category}-${interaction.user.username}`,
                        type: 0, // GuildText
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: ['ViewChannel'],
                            },
                            {
                                id: interaction.user.id,
                                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                            },
                            {
                                id: interaction.client.user.id,
                                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageChannels'],
                            },
                            {
                                id: '1505190278003298324', // Owner
                                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                            },
                            {
                                id: '1517049069166526546', // Admin
                                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                            }
                        ],
                    });

                    await Ticket.create({
                        ticketId: channel.id,
                        ownerId: interaction.user.id,
                        category: category
                    });

                    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                    const embed = new EmbedBuilder()
                        .setTitle(`Ticket: ${category.toUpperCase()}`)
                        .setDescription(`Halo ${interaction.user}, staf kami akan segera membantu Anda. Silakan jelaskan keperluan Anda.`)
                        .setColor('#00ff00');

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('ticket_close')
                                .setLabel('Close Ticket')
                                .setStyle(ButtonStyle.Danger)
                        );

                    await channel.send({ content: `${interaction.user} | <@&1505190278003298324> <@&1517049069166526546>`, embeds: [embed], components: [row] });
                    await interaction.editReply(`✅ Tiket berhasil dibuat: ${channel}`);
                } else if (customId === 'ticket_close') {
                    const Ticket = require('../models/Ticket');
                    await interaction.deferReply();
                    
                    await Ticket.findOneAndUpdate(
                        { ticketId: interaction.channel.id },
                        { status: 'closed' }
                    );

                    await interaction.editReply('Tiket ini akan ditutup dalam 5 detik...');
                    setTimeout(() => {
                        interaction.channel.delete().catch(console.error);
                    }, 5000);
                } else if (customId === 'staff_delivered') {
                    const Order = require('../models/Order');
                    const Ticket = require('../models/Ticket');
                    
                    await interaction.deferReply();
                    
                    const order = await Order.findOne({ channelId: interaction.channel.id });
                    if (!order) {
                        return interaction.editReply('❌ Data pesanan tidak ditemukan untuk channel ini.');
                    }
                    
                    // 1. Update order status
                    order.status = 'delivered';
                    await order.save();
                    
                    // 2. Update Embed Ticket
                    const message = interaction.message;
                    if (message && message.embeds && message.embeds.length > 0) {
                        const { EmbedBuilder } = require('discord.js');
                        const oldEmbed = message.embeds[0];
                        const newEmbed = EmbedBuilder.from(oldEmbed)
                            .setDescription(oldEmbed.description.replace('🟡 Pending', '🟢 Delivered'))
                            .setColor('#00ff00');
                        await message.edit({ embeds: [newEmbed] }).catch(console.error);
                    }
                    
                    // 4. Kirim DM ke customer
                    try {
                        const customer = await interaction.client.users.fetch(order.userId);
                        if (customer) {
                            const dmMessage = `🎉 Pesanan Robux Anda telah berhasil diproses!\n\n📦 Order ID: ${order.orderId}\n🎮 Username Roblox: ${order.robloxUsername}\n💰 Jumlah Robux: ${order.robuxAmount}\n💵 Total Pembayaran: Rp ${order.price.toLocaleString('id-ID')}\n\nTerima kasih telah mempercayai WinterStore.\nKami berharap dapat melayani Anda kembali.\n\n❄️ WinterStore Team`;
                            await customer.send(dmMessage);
                        }
                    } catch (e) {
                        console.error('Failed to DM user:', e);
                    }
                    
                    // 5. Kirim embed BARU ke channel log
                    try {
                        const logChannel = await interaction.client.channels.fetch('1517637984705319033');
                        if (logChannel) {
                            const { EmbedBuilder } = require('discord.js');
                            const logEmbed = new EmbedBuilder()
                                .setTitle('✅ Robux Delivery Completed')
                                .setDescription('Pesanan pelanggan telah berhasil diselesaikan dan dikirim.')
                                .addFields(
                                    { name: '📦 Order Information\nOrder ID:', value: order.orderId, inline: false },
                                    { name: '👤 Customer', value: `<@${order.userId}>`, inline: true },
                                    { name: '🎮 Roblox Username', value: order.robloxUsername, inline: true },
                                    { name: '💰 Robux Delivered', value: `${order.robuxAmount} Robux`, inline: false },
                                    { name: '💵 Total Payment', value: `Rp ${order.price.toLocaleString('id-ID')}`, inline: true },
                                    { name: '👨💼 Processed By', value: `<@${interaction.user.id}>`, inline: true },
                                    { name: '🕒 Delivery Time', value: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB', inline: false }
                                )
                                .setFooter({ text: 'WinterStore Delivery Logs' })
                                .setColor('#00ff00');
                                
                            await logChannel.send({ embeds: [logEmbed] });
                        }
                    } catch (e) {
                        console.error('Failed to send log:', e);
                    }
                    
                    // Auto close logic
                    await interaction.editReply('✅ Pesanan telah selesai diproses.\n\nTicket akan ditutup otomatis dalam 60 detik.');
                    
                    await Ticket.findOneAndUpdate({ ticketId: interaction.channel.id }, { status: 'closed' });
                    
                    setTimeout(() => {
                        interaction.channel.delete().catch(console.error);
                    }, 60000);
                    
                } else if (customId === 'staff_delivered_product') {
                    const ProductOrder = require('../models/ProductOrder');
                    const Ticket = require('../models/Ticket');
                    
                    await interaction.deferReply();
                    
                    const order = await ProductOrder.findOne({ channelId: interaction.channel.id });
                    if (!order) {
                        return interaction.editReply('❌ Data pesanan produk tidak ditemukan untuk channel ini.');
                    }
                    
                    order.status = 'delivered';
                    await order.save();
                    
                    const message = interaction.message;
                    if (message && message.embeds && message.embeds.length > 0) {
                        const { EmbedBuilder } = require('discord.js');
                        const oldEmbed = message.embeds[0];
                        const newEmbed = EmbedBuilder.from(oldEmbed)
                            .setDescription(oldEmbed.description.replace('🟡 Pending', '🟢 Delivered'))
                            .setColor('#00ff00');
                        await message.edit({ embeds: [newEmbed] }).catch(console.error);
                    }
                    
                    try {
                        const logChannel = await interaction.client.channels.fetch('1517960763698843779');
                        if (logChannel) {
                            const { EmbedBuilder } = require('discord.js');
                            const logEmbed = new EmbedBuilder()
                                .setTitle('✅ Product Delivery Completed')
                                .setDescription('Pesanan produk telah berhasil diselesaikan dan dikirim.')
                                .addFields(
                                    { name: '📦 Order ID', value: order.orderId, inline: false },
                                    { name: '👤 Customer', value: `<@${order.userId}>`, inline: true },
                                    { name: '🛍️ Product', value: order.productName, inline: true },
                                    { name: '💵 Total Payment', value: `Rp ${order.price.toLocaleString('id-ID')}`, inline: true },
                                    { name: '👨💼 Processed By', value: `<@${interaction.user.id}>`, inline: true },
                                    { name: '🕒 Delivery Time', value: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB', inline: false }
                                )
                                .setFooter({ text: 'WinterStore Product Logs' })
                                .setColor('#00ff00');
                                
                            await logChannel.send({ embeds: [logEmbed] });
                        }
                    } catch (e) {
                        console.error('Failed to send product log:', e);
                    }
                    
                    await interaction.editReply('✅ Pesanan produk telah selesai diproses.\n\nTicket akan ditutup otomatis dalam 60 detik.');
                    await Ticket.findOneAndUpdate({ ticketId: interaction.channel.id }, { status: 'closed' });
                    
                    setTimeout(() => {
                        interaction.channel.delete().catch(console.error);
                    }, 60000);
                    
                } else if (customId === 'staff_cancel') {
                    const Order = require('../models/Order');
                    const Ticket = require('../models/Ticket');
                    
                    await interaction.deferReply();
                    
                    const order = await Order.findOne({ channelId: interaction.channel.id });
                    if (order) {
                        order.status = 'cancelled';
                        await order.save();
                    }
                    
                    const message = interaction.message;
                    if (message && message.embeds && message.embeds.length > 0) {
                        const { EmbedBuilder } = require('discord.js');
                        const oldEmbed = message.embeds[0];
                        const newEmbed = EmbedBuilder.from(oldEmbed)
                            .setDescription(oldEmbed.description.replace('🟡 Pending', '🔴 Cancelled'))
                            .setColor('#ff0000');
                        await message.edit({ embeds: [newEmbed] }).catch(console.error);
                    }
                    
                    await interaction.editReply('❌ Pesanan telah dibatalkan.\n\nTicket akan ditutup otomatis dalam 10 detik.');
                    await Ticket.findOneAndUpdate({ ticketId: interaction.channel.id }, { status: 'closed' });
                    
                    setTimeout(() => {
                        interaction.channel.delete().catch(console.error);
                    }, 10000);
                } else if (customId === 'staff_cancel_product') {
                    const ProductOrder = require('../models/ProductOrder');
                    const Ticket = require('../models/Ticket');
                    const Product = require('../models/Product');
                    const { updateProductEmbed } = require('../services/productService');
                    
                    await interaction.deferReply();
                    
                    const order = await ProductOrder.findOne({ channelId: interaction.channel.id });
                    if (order) {
                        order.status = 'cancelled';
                        await order.save();
                        
                        const product = await Product.findOne({ name: order.productName });
                        if (product) {
                            product.stock += 1;
                            await product.save();
                            await updateProductEmbed(interaction.client, interaction.guild.id);
                        }
                    }
                    
                    const message = interaction.message;
                    if (message && message.embeds && message.embeds.length > 0) {
                        const { EmbedBuilder } = require('discord.js');
                        const oldEmbed = message.embeds[0];
                        const newEmbed = EmbedBuilder.from(oldEmbed)
                            .setDescription(oldEmbed.description.replace('🟡 Pending', '🔴 Cancelled'))
                            .setColor('#ff0000');
                        await message.edit({ embeds: [newEmbed] }).catch(console.error);
                    }
                    
                    await interaction.editReply('❌ Pesanan produk telah dibatalkan dan stok telah dikembalikan.\n\nTicket akan ditutup otomatis dalam 10 detik.');
                    await Ticket.findOneAndUpdate({ ticketId: interaction.channel.id }, { status: 'closed' });
                    
                    setTimeout(() => {
                        interaction.channel.delete().catch(console.error);
                    }, 10000);
                } else if (customId === 'store_refresh') {
                    await interaction.deferReply({ ephemeral: true });
                    const StoreConfig = require('../models/StoreConfig');
                    const config = await StoreConfig.findOne({ guildId: interaction.guild.id });
                    if (config) {
                        config.lastAvailable = null;
                        config.lastPending = null;
                        await config.save();
                    }
                    const { updateStoreEmbed } = require('../services/storeService');
                    await updateStoreEmbed(interaction.client);
                    await interaction.editReply('✅ Stock berhasil direfresh!');
                } else if (customId === 'store_packages') {
                    const StoreConfig = require('../models/StoreConfig');
                    const config = await StoreConfig.findOne({ guildId: interaction.guild.id });
                    if (!config || config.packages.length === 0) {
                        return interaction.reply({ content: 'Belum ada paket yang tersedia.', ephemeral: true });
                    }
                    const sortedPackages = [...config.packages].sort((a, b) => a.amount - b.amount);
                    let packageList = '📋 **Daftar Paket Robux**\n\n';
                    sortedPackages.forEach(pkg => {
                        packageList += `• **${pkg.amount} R$** - Rp ${pkg.price.toLocaleString('id-ID')}\n`;
                    });
                    await interaction.reply({ content: packageList, ephemeral: true });
                } else if (customId === 'store_order') {
                    const StoreConfig = require('../models/StoreConfig');
                    const config = await StoreConfig.findOne({ guildId: interaction.guild.id });
                    
                    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
                    
                    if (!config || config.packages.length === 0) {
                        const modal = new ModalBuilder()
                            .setCustomId('store_order_modal')
                            .setTitle('Order Robux Manual');
                            
                        const robuxInput = new TextInputBuilder()
                            .setCustomId('robux_amount')
                            .setLabel('Jumlah Robux')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true);
                            
                        const usernameInput = new TextInputBuilder()
                            .setCustomId('roblox_username')
                            .setLabel('Username Roblox')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true);
                            
                        modal.addComponents(new ActionRowBuilder().addComponents(robuxInput), new ActionRowBuilder().addComponents(usernameInput));
                        return interaction.showModal(modal);
                    }
                    
                    const select = new StringSelectMenuBuilder()
                        .setCustomId('store_order_select')
                        .setPlaceholder('Pilih paket Robux yang ingin dibeli');
                        
                    const sortedPackages = [...config.packages].sort((a, b) => a.amount - b.amount);
                    sortedPackages.forEach(pkg => {
                        select.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(`${pkg.amount} Robux`)
                                .setDescription(`Harga: Rp ${pkg.price.toLocaleString('id-ID')}`)
                                .setValue(pkg.amount.toString())
                        );
                    });
                    
                    select.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Input Manual')
                            .setDescription('Masukkan jumlah Robux secara manual')
                            .setValue('manual')
                    );
                    
                    const row = new ActionRowBuilder().addComponents(select);
                    await interaction.reply({ content: 'Pilih paket yang ingin Anda beli, atau pilih Input Manual:', components: [row], ephemeral: true });
                } else if (customId === 'product_buy_btn') {
                    const Product = require('../models/Product');
                    const products = await Product.find({ active: true });
                    
                    if (products.length === 0) {
                        return interaction.reply({ content: 'Toko saat ini tidak memiliki produk aktif.', ephemeral: true });
                    }
                    
                    const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
                    const select = new StringSelectMenuBuilder()
                        .setCustomId('product_buy_select')
                        .setPlaceholder('Pilih produk yang ingin dibeli');
                        
                    products.forEach(p => {
                        select.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(p.name)
                                .setDescription(`Harga: Rp ${p.price.toLocaleString('id-ID')} | Stok: ${p.stock}`)
                                .setValue(p.name)
                        );
                    });
                    
                    const row = new ActionRowBuilder().addComponents(select);
                    await interaction.reply({ content: 'Pilih produk yang ingin Anda beli dari daftar di bawah ini:', components: [row], ephemeral: true });
                }
            } catch (error) {
                console.error('Button Interaction Error:', error);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'Terdapat kesalahan memproses tombol ini!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'Terdapat kesalahan memproses tombol ini!', ephemeral: true });
                    }
                } catch (replyError) {
                    console.error('Failed to send button error message:', replyError);
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'store_order_select') {
                const selectedValue = interaction.values[0];
                
                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                const modal = new ModalBuilder()
                    .setCustomId('store_order_modal')
                    .setTitle('Order Robux');
                    
                const robuxInput = new TextInputBuilder()
                    .setCustomId('robux_amount')
                    .setLabel('Jumlah Robux')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                    
                if (selectedValue !== 'manual') {
                    robuxInput.setValue(selectedValue);
                }
                                    const usernameInput = new TextInputBuilder()
                        .setCustomId('roblox_username')
                        .setLabel('Username Roblox')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);
                        
                    modal.addComponents(new ActionRowBuilder().addComponents(robuxInput), new ActionRowBuilder().addComponents(usernameInput));
                    return interaction.showModal(modal);
                } else if (interaction.customId === 'product_buy_select') {
                    const selectedProductName = interaction.values[0];
                    const Product = require('../models/Product');
                    const product = await Product.findOne({ name: selectedProductName });
                    
                    if (!product || !product.active) {
                        return interaction.reply({ content: 'Produk tidak ditemukan atau sudah tidak aktif.', ephemeral: true });
                    }
                    
                    if (product.stock <= 0) {
                        return interaction.reply({ content: 'Maaf, stok produk ini sedang kosong.', ephemeral: true });
                    }

                    await interaction.deferReply({ ephemeral: true });
                    
                    // Reduce stock
                    product.stock -= 1;
                    await product.save();
                    const { updateProductEmbed } = require('../services/productService');
                    await updateProductEmbed(interaction.client, interaction.guild.id);

                    const ticketId = `prod-${interaction.user.id.slice(-4)}-${Date.now().toString().slice(-4)}`;

                    const channel = await interaction.guild.channels.create({
                        name: `order-${interaction.user.username}`,
                        type: 0,
                        permissionOverwrites: [
                            { id: interaction.guild.id, deny: ['ViewChannel'] },
                            { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                            { id: interaction.client.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageChannels'] },
                            { id: '1505190278003298324', allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }, // Owner
                            { id: '1517049069166526546', allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }  // Admin
                        ],
                    });

                    const Ticket = require('../models/Ticket');
                    await Ticket.create({
                        ticketId: channel.id,
                        ownerId: interaction.user.id,
                        category: 'product'
                    });
                    
                    const ProductOrder = require('../models/ProductOrder');
                    await ProductOrder.create({
                        orderId: ticketId,
                        userId: interaction.user.id,
                        productName: product.name,
                        price: product.price,
                        channelId: channel.id,
                        status: 'pending'
                    });

                    // Auto notes logic
                    const nameLower = product.name.toLowerCase();
                    let productNotes = 'Akan diproses secepatnya.';
                    
                    if (nameLower.includes('bot')) {
                        productNotes = 'Estimasi pengerjaan paling lama 3 - 7 hari.';
                    } else if (nameLower.includes('decoration') || nameLower.includes('deco')) {
                        productNotes = 'Proses via login, paling lama bisa beberapa jam.';
                    } else if (nameLower.includes('akun') || nameLower.includes('nitro')) {
                        productNotes = 'Proses tergantung antrian yang ada.';
                    }

                    const paymentInfo = `\n\n**🏦 Informasi Pembayaran:**\n• **Seabank** -> 901269725883 [Guntur]\n• **Dana** -> 082110831473 [Guntur]\n• **Gopay** -> 081519308407 [Kai]\n• **Shopepay** -> 0881080702615 [WinterStoree]\n\n_Silakan lakukan transfer sesuai dengan nominal harga pesanan Anda. Setelah itu, **kirimkan bukti pembayaran Anda di channel ini** dan jangan lupa tag Admin (<@&1517049069166526546>) atau Owner (<@&1505190278003298324>) agar pesanan segera diproses!_`;

                    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                    const embed = new EmbedBuilder()
                        .setTitle('🛒 Pesanan Produk WinterBot')
                        .setDescription(`Halo ${interaction.user}, terima kasih banyak telah mempercayai layanan kami! ✨\nPesananmu sudah kami terima dan stok telah berhasil di-booking. Staf kami akan segera meninjau pesanan ini.\n\n**📦 Detail Pesanan:**\n• **Produk:** ${product.name}\n• **Harga:** Rp ${product.price.toLocaleString('id-ID')}\n• **Status:** 🟡 Pending\n\n**📌 Notes Penting:** \n📝 *${productNotes}*${paymentInfo}`)
                        .setColor('#0099ff');
                        
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('staff_delivered_product').setLabel('Mark Delivered').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('staff_cancel_product').setLabel('Cancel Order').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
                    );
                    
                    await channel.send({ content: `${interaction.user} | <@&1505190278003298324> <@&1517049069166526546>`, embeds: [embed], components: [row] });
                    
                    await interaction.editReply(`✅ Tiket pesanan berhasil dibuat! Silakan lanjutkan ke tiket: ${channel}`);
                }
            } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'verify_modal') {
                await interaction.deferReply({ ephemeral: true });

                const robloxUsername = interaction.fields.getTextInputValue('roblox_username');
                const discordId = interaction.user.id;

                try {
                    const { verifyRobloxUsername } = require('../services/robloxService');
                    const noblox = require('noblox.js');
                    const User = require('../models/User');

                    const verification = await verifyRobloxUsername(robloxUsername);
                    if (!verification.success) {
                        return interaction.editReply('❌ Username Roblox tidak ditemukan.');
                    }

                    // Cek apakah user ada di Community Roblox
                    const groupId = parseInt(process.env.GROUP_ID);
                    if (!groupId) {
                        return interaction.editReply('❌ Sistem belum dikonfigurasi sepenuhnya (GROUP_ID belum diset). Harap hubungi Admin.');
                    }

                    const rankInGroup = await noblox.getRankInGroup(groupId, verification.id).catch(() => 0);
                    if (rankInGroup === 0) {
                        return interaction.editReply(`❌ Akun **${verification.username}** belum bergabung ke Community Roblox kami.\nSilakan join community terlebih dahulu, lalu coba lagi.`);
                    }

                    // Check server join duration
                    const member = interaction.member;
                    const joinedAt = member.joinedAt;
                    const diffTime = Math.abs(new Date() - joinedAt);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    const isEligible = diffDays >= 14;

                    // Update or Create user in MongoDB
                    await User.findOneAndUpdate(
                        { discordId },
                        {
                            discordId,
                            robloxId: verification.id,
                            robloxUsername: verification.username,
                            verified: true,
                            eligibleForPayout: isEligible
                        },
                        { upsert: true, new: true }
                    );

                    let replyMessage = `✅ Roblox account berhasil diverifikasi sebagai **${verification.username}** (ID: ${verification.id})\n\n`;
                    replyMessage += `📅 Kamu sudah bergabung di server ini selama **${diffDays} hari**.\n`;
                    
                    if (isEligible) {
                        replyMessage += `🎉 **Selamat!** Kamu sudah memenuhi syarat durasi bergabung (14 hari) untuk menerima Robux Payout.`;
                        
                        const roleId = process.env.ELIGIBLE_ROLE_ID;
                        if (roleId) {
                            try {
                                await member.roles.add(roleId);
                            } catch (err) {
                                console.error('Failed to add role:', err);
                            }
                        }
                    } else {
                        replyMessage += `⏳ Kamu masih belum memenuhi syarat durasi server (butuh 14 hari). Sisa waktu: **${14 - diffDays} hari** lagi.`;
                    }

                    // --- COMMUNITY MONITOR LOG ---
                    try {
                        const payoutChannelId = process.env.PAYOUT_LOG_CHANNEL_ID || '1499095140671684738';
                        const payoutChannel = await interaction.client.channels.fetch(payoutChannelId).catch(() => null);
                        
                        if (payoutChannel) {
                            const { EmbedBuilder } = require('discord.js');
                            const playerInfo = await noblox.getPlayerInfo(verification.id).catch(() => null);
                            
                            if (playerInfo) {
                                const accCreatedDate = new Date(playerInfo.joinDate);
                                const accAgeDays = playerInfo.age || 0;
                                const accAgeYears = Math.floor(accAgeDays / 365);
                                const accAgeMonths = Math.floor((accAgeDays % 365) / 30);
                                const accAgeRemainingDays = (accAgeDays % 365) % 30;
                                const accAgeString = `${accAgeDays} days • ${accAgeYears > 0 ? accAgeYears + ' yr ' : ''}${accAgeMonths} mo ${accAgeRemainingDays} d`;
                                
                                const eligibleDate = new Date();
                                eligibleDate.setDate(eligibleDate.getDate() + 14);
                                
                                const monitorEmbed = new EmbedBuilder()
                                    .setTitle('Community Monitor • WinterStore')
                                    .setDescription(`${playerInfo.displayName} ( @${playerInfo.username} )\n✅ Member Joined the Community`)
                                    .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${verification.id}&width=420&height=420&format=png`)
                                    .addFields(
                                        { name: '🆔 Username', value: `@${playerInfo.username}`, inline: true },
                                        { name: '👤 User ID', value: `${verification.id}`, inline: true },
                                        { name: '🏷️ Display Name', value: `${playerInfo.displayName}`, inline: true },
                                        { name: '👥 Followers', value: `${playerInfo.followerCount || 0}`, inline: true },
                                        { name: '➡️ Following', value: `${playerInfo.followingCount || 0}`, inline: true },
                                        { name: '🤝 Connections', value: `${playerInfo.friendCount || 0}`, inline: true },
                                        { name: '📅 Account Created', value: `<t:${Math.floor(accCreatedDate.getTime() / 1000)}:f>`, inline: true },
                                        { name: '⏳ Account Age', value: accAgeString, inline: true },
                                        { name: '🔞 Age Group', value: 'Unknown', inline: true },
                                        { name: '🛡️ Account Status', value: playerInfo.isBanned ? '❌ Banned' : '✅ Active', inline: true },
                                        { name: '📥 Join Community Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
                                        { name: '✅ Eligible Date (+14 Days)', value: `<t:${Math.floor(eligibleDate.getTime() / 1000)}:f>`, inline: true }
                                    )
                                    .setFooter({ text: 'WinterStore • Join Event • Multi-Source Verified', iconURL: interaction.guild.iconURL() })
                                    .setColor('#2b2d31');
                                    
                                await payoutChannel.send({ content: `<@${interaction.user.id}> telah bergabung dan diverifikasi!`, embeds: [monitorEmbed] });
                            }
                        }
                    } catch (logErr) {
                        console.error('Failed to send community monitor log:', logErr);
                    }
                    // -----------------------------

                    await interaction.editReply(replyMessage);
                } catch (error) {
                    console.error('Verify error:', error);
                    await interaction.editReply('❌ Terjadi kesalahan saat memverifikasi akun Anda.');
                }
            } else if (interaction.customId === 'store_order_modal') {
                try {
                    const amountStr = interaction.fields.getTextInputValue('robux_amount');
                    const username = interaction.fields.getTextInputValue('roblox_username');
                    const amount = parseInt(amountStr);
                    
                    if (isNaN(amount) || amount <= 0) {
                        return interaction.reply({ content: 'Jumlah Robux harus berupa angka valid.', ephemeral: true });
                    }
                    
                    await interaction.deferReply({ ephemeral: true });
                    
                    const StoreConfig = require('../models/StoreConfig');
                    const config = await StoreConfig.findOne({ guildId: interaction.guild.id });
                    
                    let price = 0;
                    let priceStr = 'Dihitung Admin';
                    if (config && config.packages) {
                        const pkg = config.packages.find(p => p.amount === amount);
                        if (pkg) {
                            price = pkg.price;
                            priceStr = `Rp ${price.toLocaleString('id-ID')}`;
                        }
                    }
                    
                    const ticketId = `order-${interaction.user.id.slice(-4)}-${Date.now().toString().slice(-4)}`;
                    
                    const channel = await interaction.guild.channels.create({
                        name: `order-${interaction.user.username}`,
                        type: 0,
                        permissionOverwrites: [
                            { id: interaction.guild.id, deny: ['ViewChannel'] },
                            { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                            { id: interaction.client.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageChannels'] },
                            { id: '1505190278003298324', allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }, // Owner
                            { id: '1517049069166526546', allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }  // Admin
                        ],
                    });
                    
                    const Order = require('../models/Order');
                    await Order.create({
                        orderId: ticketId,
                        userId: interaction.user.id,
                        robloxUsername: username,
                        channelId: channel.id,
                        robuxAmount: amount,
                        price: price,
                        status: 'pending'
                    });
                    
                    const Ticket = require('../models/Ticket');
                    await Ticket.create({
                        ticketId: channel.id,
                        ownerId: interaction.user.id,
                        category: 'order'
                    });
                    
                    const paymentInfo = `\n\n**🏦 Informasi Pembayaran:**\n• **Seabank** -> 901269725883 [Guntur]\n• **Dana** -> 082110831473 [Guntur]\n• **Gopay** -> 081519308407 [Kai]\n• **Shopepay** -> 0881080702615 [WinterStoree]\n\n_Silakan lakukan transfer sesuai dengan nominal harga pesanan Anda. Setelah itu, **kirimkan bukti pembayaran Anda di channel <#1517638154889199656>** dan jangan lupa tag Admin (<@&1517049069166526546>) atau Owner (<@&1505190278003298324>) agar pesanan segera diproses!_`;

                    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                    const embed = new EmbedBuilder()
                        .setTitle('🛒 Pesanan Robux')
                        .setDescription(`Halo ${interaction.user}, staf kami akan segera memproses pesanan Anda.\n\n**Detail Pesanan:**\n• Username Roblox: **${username}**\n• Jumlah: ${amount} R$\n• Harga: ${priceStr}\n• Status: 🟡 Pending${paymentInfo}`)
                        .setColor('#ffff00');
                        
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('staff_delivered').setLabel('Mark Delivered').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('staff_cancel').setLabel('Cancel Order').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
                    );
                    
                    await channel.send({ content: `${interaction.user} | <@&1505190278003298324> <@&1517049069166526546>`, embeds: [embed], components: [row] });
                    
                    // Coba menghapus pesan Select Menu jika ada
                    try {
                        if (interaction.message) {
                            await interaction.message.delete();
                        }
                    } catch (e) {}
                    
                    await interaction.editReply(`✅ Pesanan dibuat! Silakan lanjutkan pembayaran di tiket: ${channel}`);
                    
                    // 1 Hour Auto-Cancel logic
                    setTimeout(async () => {
                        try {
                            const checkOrder = await Order.findOne({ orderId: ticketId });
                            if (checkOrder && checkOrder.status === 'pending') {
                                checkOrder.status = 'cancelled';
                                await checkOrder.save();

                                await Ticket.findOneAndUpdate({ ticketId: channel.id }, { status: 'closed' });

                                try {
                                    const customer = await interaction.client.users.fetch(interaction.user.id);
                                    if (customer) {
                                        const dmMessage = `Halo kak ${interaction.user.username} 👋\n\nMohon maaf sebesar-besarnya 🙏 pesanan Robux kakak di **WinterStore** (Order ID: **${checkOrder.orderId}**) terpaksa kami **batalkan otomatis** karena tidak ada respon atau konfirmasi pembayaran yang kami terima selama 1 jam terakhir.\n\nJika kakak masih ingin melakukan pembelian atau sudah melakukan transfer namun lupa mengirimkan bukti, silakan buat tiket pesanan baru ya kak!\n\nTerima kasih,\n❄️ **WinterStore Team**`;
                                        await customer.send(dmMessage);
                                    }
                                } catch (e) {
                                    console.error('Failed to DM user on auto-cancel:', e);
                                }

                                try {
                                    const msgs = await channel.messages.fetch({ limit: 10 });
                                    const botMsg = msgs.find(m => m.author.id === interaction.client.user.id && m.embeds.length > 0);
                                    if (botMsg) {
                                        const { EmbedBuilder } = require('discord.js');
                                        const oldEmbed = botMsg.embeds[0];
                                        const newEmbed = EmbedBuilder.from(oldEmbed)
                                            .setDescription(oldEmbed.description.replace('🟡 Pending', '🔴 Cancelled (Timeout)'))
                                            .setColor('#ff0000');
                                        await botMsg.edit({ embeds: [newEmbed], components: [] }).catch(() => {});
                                    }
                                    await channel.send('⏳ **Sistem Otomatis:** Pesanan dibatalkan karena tidak ada konfirmasi/respons selama 1 jam. Tiket ini akan ditutup dalam 10 detik.');
                                } catch (e) {}

                                setTimeout(() => {
                                    channel.delete().catch(() => {});
                                }, 10000);
                            }
                        } catch (err) {
                            console.error('Error in auto-cancel timeout:', err);
                        }
                    }, 60 * 60 * 1000); // 1 hour

                    
                } catch (error) {
                    console.error('Modal Submit Error:', error);
                    await interaction.reply({ content: 'Gagal memproses pesanan.', ephemeral: true }).catch(() => {});
                }
            } else if (interaction.customId === 'verify_modal') {
                await interaction.deferReply({ ephemeral: true });

                const robloxUsername = interaction.fields.getTextInputValue('roblox_username');
                const discordId = interaction.user.id;

                try {
                    const { verifyRobloxUsername } = require('../services/robloxService');
                    const noblox = require('noblox.js');
                    const User = require('../models/User');

                    const verification = await verifyRobloxUsername(robloxUsername);
                    if (!verification.success) {
                        return interaction.editReply('❌ Username Roblox tidak ditemukan.');
                    }

                    // Cek apakah user ada di Community Roblox
                    const groupId = parseInt(process.env.GROUP_ID);
                    if (!groupId) {
                        return interaction.editReply('❌ Sistem belum dikonfigurasi sepenuhnya (GROUP_ID belum diset). Harap hubungi Admin.');
                    }

                    const rankInGroup = await noblox.getRankInGroup(groupId, verification.id).catch(() => 0);
                    if (rankInGroup === 0) {
                        return interaction.editReply(`❌ Akun **${verification.username}** belum bergabung ke Community Roblox kami.\nSilakan join community terlebih dahulu, lalu coba lagi.`);
                    }

                    // Cek apakah user ada di database
                    let userRecord = await User.findOne({ discordId });
                    
                    // Jika belum ada, buat record baru dengan createdAt = hari ini (saat dia verifikasi)
                    if (!userRecord) {
                        userRecord = await User.create({
                            discordId,
                            robloxId: verification.id,
                            robloxUsername: verification.username,
                            verified: true,
                            eligibleForPayout: false
                        });
                    } else {
                        // Jika sudah ada, update datanya
                        userRecord.robloxId = verification.id;
                        userRecord.robloxUsername = verification.username;
                        userRecord.verified = true;
                    }

                    // Check community join duration using userRecord.createdAt (tanggal dia verifikasi)
                    // Karena Roblox API tidak menyediakan tanggal join grup, kita menghitung 14 hari
                    // dimulai dari saat user mendaftarkan akunnya di sistem ini.
                    const joinedAt = userRecord.createdAt;
                    const diffTime = Math.abs(new Date() - joinedAt);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    const isEligible = diffDays >= 14;
                    userRecord.eligibleForPayout = isEligible;
                    await userRecord.save();

                    let dmMessage = `✅ Roblox account berhasil diverifikasi sebagai **${verification.username}** (ID: ${verification.id})\n\n`;
                    dmMessage += `📅 Kamu sudah bergabung di **Community Roblox** ini selama **${diffDays} hari** (dihitung sejak tanggal verifikasi).\n`;
                    
                    if (isEligible) {
                        dmMessage += `🎉 **Selamat!** Kamu sudah memenuhi syarat durasi bergabung (14 hari) di Community untuk menerima Robux Payout.`;
                        
                        const roleId = process.env.ELIGIBLE_ROLE_ID;
                        if (roleId) {
                            try {
                                await interaction.member.roles.add(roleId);
                            } catch (err) {
                                console.error('Failed to add role:', err);
                            }
                        }
                    } else {
                        dmMessage += `⏳ Kamu masih belum memenuhi syarat durasi Community Roblox (butuh 14 hari). Sisa waktu: **${14 - diffDays} hari** lagi.`;
                    }

                    try {
                        await interaction.user.send(dmMessage);
                        await interaction.editReply('✅ Verifikasi berhasil diproses! Silakan cek pesan masuk (DM) Anda dari bot ini.');
                    } catch (dmError) {
                        console.error('Failed to DM user:', dmError);
                        await interaction.editReply(`✅ Verifikasi berhasil! Namun bot tidak dapat mengirimkan DM ke akun Anda (DM ditutup).\n\n${dmMessage}`);
                    }
                } catch (error) {
                    console.error('Verify error:', error);
                    await interaction.editReply('❌ Terjadi kesalahan saat memverifikasi akun Anda.');
                }
            }
        }
    },
};

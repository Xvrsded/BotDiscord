const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const StoreConfig = require('../../models/StoreConfig');
const { updateStoreEmbed } = require('../../services/storeService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('store')
        .setDescription('Sistem Robux Store')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Inisialisasi sistem store di server ini')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stock-channel')
                .setDescription('Pilih channel untuk embed stock Robux')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel target')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('prices')
                .setDescription('Atur harga paket (Format: 100:15000, 500:70000)')
                .addStringOption(option =>
                    option.setName('packages')
                        .setDescription('Format: Jumlah:Harga dipisah koma. Contoh: 100:15000, 500:70000')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('refresh')
                .setDescription('Update stock embed secara manual')
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        let config = await StoreConfig.findOne({ guildId });

        if (subcommand === 'setup') {
            if (config) {
                return interaction.editReply('❌ Sistem store sudah diinisialisasi di server ini.');
            }
            await StoreConfig.create({ guildId });
            return interaction.editReply('✅ Sistem store berhasil diinisialisasi! Lanjutkan dengan `/store stock-channel`.');
        }

        if (!config) {
            return interaction.editReply('❌ Sistem store belum diinisialisasi. Silakan jalankan `/store setup` terlebih dahulu.');
        }

        if (subcommand === 'stock-channel') {
            const channel = interaction.options.getChannel('channel');
            config.stockChannelId = channel.id;
            config.messageId = null; // Reset message ID agar bot membuat pesan baru
            config.lastAvailable = null;
            config.lastPending = null;
            await config.save();
            
            await updateStoreEmbed(interaction.client);
            return interaction.editReply(`✅ Channel stock berhasil diatur ke ${channel}.`);
        }

        if (subcommand === 'prices') {
            const packagesStr = interaction.options.getString('packages');
            const packagesArr = packagesStr.split(',').map(p => p.trim());
            
            const newPackages = [];
            for (const pkg of packagesArr) {
                const [amountStr, priceStr] = pkg.split(':');
                if (!amountStr || !priceStr) {
                    return interaction.editReply(`❌ Format salah pada bagian: \`${pkg}\`. Harap gunakan format: \`Jumlah:Harga\`.`);
                }
                const amount = parseInt(amountStr);
                const price = parseInt(priceStr);
                
                if (isNaN(amount) || isNaN(price)) {
                    return interaction.editReply(`❌ Harga dan jumlah harus berupa angka pada: \`${pkg}\`.`);
                }
                newPackages.push({ amount, price });
            }

            config.packages = newPackages;
            config.lastAvailable = null;
            config.lastPending = null;
            await config.save();
            await updateStoreEmbed(interaction.client);
            return interaction.editReply('✅ Paket harga berhasil diperbarui!');
        }

        if (subcommand === 'refresh') {
            if (!config.stockChannelId) {
                return interaction.editReply('❌ Channel stock belum diatur. Jalankan `/store stock-channel` terlebih dahulu.');
            }
            config.lastAvailable = null;
            config.lastPending = null;
            await config.save();
            await updateStoreEmbed(interaction.client);
            return interaction.editReply('✅ Stock embed berhasil direfresh!');
        }
    },
};

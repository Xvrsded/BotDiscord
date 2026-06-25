const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Product = require('../../models/Product');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('product')
        .setDescription('Kelola produk (Admin Only).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Tambah produk baru')
                .addStringOption(option => option.setName('name').setDescription('Nama Produk').setRequired(true))
                .addStringOption(option => option.setName('desc').setDescription('Deskripsi Produk').setRequired(true))
                .addNumberOption(option => option.setName('price').setDescription('Harga Produk').setRequired(true))
                .addNumberOption(option => option.setName('stock').setDescription('Stok Produk').setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Hapus produk')
                .addStringOption(option => option.setName('name').setDescription('Nama Produk').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit produk yang ada')
                .addStringOption(option => option.setName('old_name').setDescription('Nama Produk (yang lama)').setRequired(true))
                .addStringOption(option => option.setName('new_name').setDescription('Nama Produk Baru').setRequired(false))
                .addStringOption(option => option.setName('desc').setDescription('Deskripsi Produk Baru').setRequired(false))
                .addNumberOption(option => option.setName('price').setDescription('Harga Produk Baru').setRequired(false))
                .addNumberOption(option => option.setName('stock').setDescription('Stok Produk Baru').setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Refresh/Tampilkan daftar produk di channel panel')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });

        try {
            if (subcommand === 'add') {
                const name = interaction.options.getString('name');
                const desc = interaction.options.getString('desc');
                const price = interaction.options.getNumber('price');
                const stock = interaction.options.getNumber('stock') || 0;

                const existingProduct = await Product.findOne({ name });
                if (existingProduct) {
                    return interaction.editReply('❌ Produk dengan nama tersebut sudah ada.');
                }

                await Product.create({ name, description: desc, price, stock });
                const { updateProductEmbed } = require('../../services/productService');
                await updateProductEmbed(interaction.client, interaction.guild.id);
                await interaction.editReply(`✅ Produk **${name}** berhasil ditambahkan dan panel telah diperbarui!`);
            } else if (subcommand === 'remove') {
                const name = interaction.options.getString('name');
                const deletedProduct = await Product.findOneAndDelete({ name });
                
                if (!deletedProduct) {
                    return interaction.editReply('❌ Produk tidak ditemukan.');
                }
                const { updateProductEmbed } = require('../../services/productService');
                await updateProductEmbed(interaction.client, interaction.guild.id);
                await interaction.editReply(`✅ Produk **${name}** berhasil dihapus dan panel telah diperbarui!`);
            } else if (subcommand === 'edit') {
                const oldName = interaction.options.getString('old_name');
                const newName = interaction.options.getString('new_name');
                const desc = interaction.options.getString('desc');
                const price = interaction.options.getNumber('price');
                const stock = interaction.options.getNumber('stock');

                const product = await Product.findOne({ name: oldName });
                if (!product) return interaction.editReply('❌ Produk tidak ditemukan.');

                if (newName) product.name = newName;
                if (desc) product.description = desc;
                if (price !== null) product.price = price;
                if (stock !== null) product.stock = stock;

                await product.save();
                const { updateProductEmbed } = require('../../services/productService');
                await updateProductEmbed(interaction.client, interaction.guild.id);
                await interaction.editReply(`✅ Produk **${oldName}** berhasil diupdate dan panel telah diperbarui!`);
            } else if (subcommand === 'list') {
                const { updateProductEmbed } = require('../../services/productService');
                await updateProductEmbed(interaction.client, interaction.guild.id);
                await interaction.editReply('✅ Panel produk berhasil direfresh di channel <#1517962269567221840>.');
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Terjadi kesalahan.');
        }
    },
};

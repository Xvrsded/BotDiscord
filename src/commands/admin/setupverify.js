const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupverify')
        .setDescription('Setup the verification button in the current channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle('🔐 Verifikasi Akun Roblox')
            .setDescription('Silakan klik tombol di bawah ini untuk memverifikasi akun Roblox Anda dan mengecek kelayakan Payout.\n\n**Syarat Payout:**\n1. Harus tergabung di Community Roblox kami.\n2. Harus sudah berada di Community Roblox kami selama minimal 14 Hari (Server Discord ini hanya untuk antrean / order Robux).')
            .setColor('#0099ff');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_btn')
                    .setLabel('Verifikasi Sekarang')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔗')
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply('✅ Tombol verifikasi berhasil dibuat di channel ini.');
    },
};

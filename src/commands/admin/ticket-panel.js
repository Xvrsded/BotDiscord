const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('Kirim panel tiket ke channel ini.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('WinterBot Support')
            .setDescription('Silakan klik tombol di bawah ini untuk membuat tiket baru sesuai kebutuhan Anda.');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_support')
                    .setLabel('Support')
                    .setEmoji('🎫')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_order')
                    .setLabel('Order')
                    .setEmoji('🛒')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ticket_ugc')
                    .setLabel('Custom UGC')
                    .setEmoji('🎨')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('ticket_report')
                    .setLabel('Report')
                    .setEmoji('🐛')
                    .setStyle(ButtonStyle.Danger),
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Ticket panel berhasil dikirim!', ephemeral: true });
    },
};

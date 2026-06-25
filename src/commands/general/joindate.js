const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joindate')
        .setDescription('Cek sudah berapa lama kamu bergabung di server ini.'),
    async execute(interaction) {
        const member = interaction.member;
        const joinedAt = member.joinedAt;
        const now = new Date();

        const diffTime = Math.abs(now - joinedAt);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('ℹ️ Informasi Join Date')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Username', value: `${member.user.tag}`, inline: true },
                { name: 'Tanggal Join', value: `<t:${Math.floor(joinedAt.getTime() / 1000)}:F>`, inline: false },
                { name: 'Durasi', value: `**${diffDays} hari** dan ${diffHours} jam`, inline: false }
            );

        if (diffDays >= 14) {
            embed.setFooter({ text: '✅ Kamu sudah memenuhi syarat durasi join 14 hari!' });
        } else {
            embed.setFooter({ text: `❌ Kurang ${14 - diffDays} hari lagi untuk mencapai syarat 14 hari.` });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};

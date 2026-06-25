const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display info about this server.'),
    async execute(interaction) {
        const { guild } = interaction;
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Server Info: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Nama Server', value: guild.name, inline: true },
                { name: 'Member Count', value: `${guild.memberCount}`, inline: true },
                { name: 'Created Date', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};

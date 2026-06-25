const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display info about a user.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to get info about')
                .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;
        const member = interaction.guild.members.cache.get(targetUser.id);
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`User Info: ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Username', value: targetUser.tag, inline: true },
                { name: 'User ID', value: targetUser.id, inline: true },
                { name: 'Join Date', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Not in server', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Config = require('../../models/Config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplist')
        .setDescription('Setup the Live Payout List in the current channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // Kirim pesan placeholder pertama kali
        const message = await interaction.channel.send({
            content: "🔄 **Menginisialisasi Live Payout List...**\n(Pesan ini akan di-update otomatis segera)"
        });

        // Simpan Message ID dan Channel ID ke MongoDB
        await Config.findOneAndUpdate(
            { key: 'payoutListConfig' },
            { 
                key: 'payoutListConfig', 
                value: { 
                    channelId: interaction.channelId, 
                    messageId: message.id 
                }
            },
            { upsert: true, new: true }
        );

        await interaction.editReply(`✅ Berhasil! Live message telah di-setup. Pastikan bot memiliki permission untuk mengedit pesan di channel ini.`);
    },
};

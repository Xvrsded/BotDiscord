require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const LeaveConfig = require('../models/LeaveConfig');

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const guildId = process.env.GUILD_ID;
        const targetChannel = '1505193302771630241';
        
        let config = await LeaveConfig.findOne({ guildId });
        if (!config) {
            config = new LeaveConfig({ guildId });
        }
        config.channelId = targetChannel;
        await config.save();
        console.log(`Successfully updated LeaveConfig for guild ${guildId} to channel ${targetChannel}`);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

fix();

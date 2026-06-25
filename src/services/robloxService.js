const noblox = require('noblox.js');

async function verifyRobloxUsername(username) {
    try {
        const id = await noblox.getIdFromUsername(username);
        return { success: true, id, username };
    } catch (error) {
        return { success: false, error: 'Username Roblox tidak ditemukan' };
    }
}

module.exports = {
    verifyRobloxUsername
};

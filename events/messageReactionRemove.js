const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

const reactionRolesPath = path.join(__dirname, '..', 'reaction-roles.json');

// Helper function to read reaction roles data
const readReactionRoles = () => {
    if (!fs.existsSync(reactionRolesPath)) {
        return {};
    }
    const data = fs.readFileSync(reactionRolesPath, 'utf8');
     try {
        return JSON.parse(data);
    } catch (error) {
        console.error('Error parsing reaction-roles.json:', error);
        return {}; // Return empty object on error
    }
};

module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        // Ignore reactions from bots
        if (user.bot) return;

        // If the reaction is partial, fetch it
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }

        const guildId = reaction.message.guild.id;
        const messageId = reaction.message.id;
        const reactionRoles = readReactionRoles();

        // Check if the message is a reaction role message
        const config = reactionRoles[guildId]?.[messageId];
        if (!config) return;

        // Check if the emoji is part of the reaction role setup
        const emojiIdentifier = reaction.emoji.id || reaction.emoji.name;
        const roleId = config.roles[emojiIdentifier];
        if (!roleId) return;

        // Fetch the role and the member
        const role = await reaction.message.guild.roles.fetch(roleId).catch(console.error);
        const member = await reaction.message.guild.members.fetch(user.id).catch(console.error);

        if (!role || !member) {
            console.error(`Role or member not found. Role ID: ${roleId}, User ID: ${user.id}`);
            return;
        }
        
         // Check if bot can manage the role
        if (role.position >= reaction.message.guild.members.me.roles.highest.position) {
             console.warn(`[Tepki-Rol] Botun rolü, alınacak olan ${role.name} rolünden daha yüksek değil. Rol alınamadı.`);
             return;
        }

        // Remove the role from the member
        try {
            await member.roles.remove(role);
        } catch (error) {
            console.error(`Failed to remove role ${role.name} from user ${user.tag}:`, error);
        }
    },
};

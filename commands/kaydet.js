const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kaydet')
        .setDescription('Sunucunun rollerini ve kanallarını bir yedek dosyasına kaydeder.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const backup = {
            guildName: guild.name,
            createdAt: new Date().toISOString(),
            roles: [],
            categories: [],
            channels: []
        };

        // Rolleri yedekle
        for (const role of guild.roles.cache.sort((a, b) => b.position - a.position).values()) {
            if (role.managed) continue; // Yönetilen rolleri atla
            backup.roles.push({
                id: role.id, // Yükle komutu için ID gerekli
                name: role.name,
                color: role.hexColor,
                hoist: role.hoist,
                permissions: role.permissions.bitfield.toString(),
                mentionable: role.mentionable,
                position: role.position
            });
        }

        // Kanalları ve kategorileri ayırarak yedekle
        const allChannels = [...guild.channels.cache.values()].sort((a, b) => a.position - b.position);

        for (const channel of allChannels) {
            const permissionOverwrites = channel.permissionOverwrites.cache.map(overwrite => ({
                id: overwrite.id, // Rol veya kullanıcı ID'si
                type: overwrite.type, // 'role' veya 'member'
                allow: overwrite.allow.bitfield.toString(),
                deny: overwrite.deny.bitfield.toString()
            }));

            if (channel.type === ChannelType.GuildCategory) {
                backup.categories.push({
                    id: channel.id,
                    name: channel.name,
                    position: channel.position,
                    permissionOverwrites: permissionOverwrites
                });
            } else if (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice) { // Sadece metin ve duyuru kanalları
                backup.channels.push({
                    id: channel.id,
                    type: channel.type,
                    name: channel.name,
                    topic: channel.topic,
                    nsfw: channel.nsfw,
                    rateLimitPerUser: channel.rateLimitPerUser,
                    parentId: channel.parentId,
                    position: channel.position,
                    permissionOverwrites: permissionOverwrites
                });
            }
        }

        const backupFilePath = path.join(__dirname, '..', 'sunucu-yedek.json');
        try {
            fs.writeFileSync(backupFilePath, JSON.stringify(backup, null, 2));
            await interaction.editReply({ content: `✅ Sunucu yedeği başarıyla **sunucu-yedek.json** dosyasına kaydedildi.` });
        } catch (error) {
            console.error('Yedekleme hatası:', error);
            await interaction.editReply({ content: '❌ Yedekleme sırasında bir hata oluştu.' });
        }
    },
};
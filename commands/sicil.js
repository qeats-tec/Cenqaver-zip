
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '..', 'warnings.json');

// Yardımcı fonksiyon: Uyarıları dosyadan oku
function getWarnings() {
    try {
        if (fs.existsSync(warningsPath)) {
            const data = fs.readFileSync(warningsPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('warnings.json okunurken hata:', error);
    }
    return {};
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sicil')
        .setDescription('Bir kullanıcının uyarı sicilini görüntüler.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Sicili görüntülenecek kullanıcı.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .setDMPermission(false),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');
        const guild = interaction.guild;

        if (!targetUser) {
            return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const warnings = getWarnings();
        const guildId = guild.id;
        const userId = targetUser.id;

        const userWarnings = warnings[guildId] && warnings[guildId][userId] ? warnings[guildId][userId] : [];

        const embed = new EmbedBuilder()
            .setColor(0xFFFF00) // Sarı
            .setTitle(`📜 ${targetUser.tag} Adlı Kullanıcının Sicili`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        if (userWarnings.length === 0) {
            embed.setDescription('Bu kullanıcının hiç uyarısı bulunmuyor.');
        } else {
            embed.setDescription(`Toplam ${userWarnings.length} uyarı bulundu.`);
            // Uyarıları tek tek alan olarak ekle
            for (const warning of userWarnings) {
                const moderator = await interaction.client.users.fetch(warning.moderatorId).catch(() => ({ tag: 'Bilinmiyor' }));
                embed.addFields({
                    name: `📝 Uyarı ID: ${warning.warningId}`,
                    value: 
                        `**> Moderatör:** ${moderator.tag}\n` +
                        `**> Sebep:** ${warning.reason}\n` +
                        `**> Tarih:** <t:${Math.floor(new Date(warning.timestamp).getTime() / 1000)}:R>`,
                    inline: false
                });
            }
        }

        await interaction.editReply({ embeds: [embed] });
    },
};

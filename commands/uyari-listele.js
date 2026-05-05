const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../warnings.json');

// warnings.json dosyasını okumak için yardımcı fonksiyon
function getWarnings() {
    try {
        if (fs.existsSync(warningsPath)) {
            const data = fs.readFileSync(warningsPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Uyarılar dosyası okunurken hata oluştu:", error);
    }
    return {};
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uyarı-listele')
        .setDescription('Bir kullanıcının tüm uyarılarını listeler.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Uyarıları listelenecek kullanıcı.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers), // Sadece üyeleri atma yetkisi olanlar

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için `Üyeleri At` yetkisine sahip olmalısın.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('kullanıcı');
        const allWarnings = getWarnings();
        const userWarnings = allWarnings[targetUser.id] || [];

        const embed = new EmbedBuilder()
            .setColor(0xFFA500) // Turuncu
            .setAuthor({ name: `${targetUser.tag} adlı kullanıcının uyarıları`, iconURL: targetUser.displayAvatarURL() });

        if (userWarnings.length === 0) {
            embed.setDescription('Bu kullanıcının hiç uyarısı bulunmuyor.');
        } else {
            const warningFields = userWarnings.map((warn, index) => ({
                name: `Uyarı ${index + 1} (ID: ${warn.id})`,
                value: `**Sebep:** ${warn.reason}\n**Moderatör:** <@${warn.moderator}>\n**Tarih:** ${new Date(warn.timestamp).toLocaleString('tr-TR')}`
            }));
            embed.addFields(warningFields);
        }

        embed.setFooter({ text: `Kullanıcı ID: ${targetUser.id}` });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
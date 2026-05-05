const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger.js'); // Log modülünü dahil et

const warningsPath = path.join(__dirname, '..', 'warnings.json');

// Yardımcı fonksiyonlar (getWarnings, saveWarnings) burada...
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

function saveWarnings(data) {
    try {
        fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('warnings.json yazılırken hata:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uyari-kaldir')
        .setDescription('Bir kullanıcının belirli bir uyarısını sicilinden kaldırır.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Uyarısı kaldırılacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('uyari-id')
            .setDescription("Kaldırılacak uyarının benzersiz ID'si.")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .setDMPermission(false),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');
        const warningIdToRemove = interaction.options.getString('uyari-id');
        const moderator = interaction.user;
        const guild = interaction.guild;

        if (!targetUser) {
            return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const warnings = getWarnings();
        const guildId = guild.id;
        const userId = targetUser.id;

        if (!warnings[guildId] || !warnings[guildId][userId] || warnings[guildId][userId].length === 0) {
            return interaction.editReply({ content: 'Bu kullanıcının zaten hiç uyarısı yok.' });
        }

        const initialWarningCount = warnings[guildId][userId].length;
        const warningToRemove = warnings[guildId][userId].find(w => w.warningId === warningIdToRemove);

        if (!warningToRemove) {
            return interaction.editReply({ content: `\`${warningIdToRemove}\` ID'li bir uyarı bulunamadı. Lütfen \`/sicil\` komutu ile ID'yi kontrol edin.` });
        }

        // Uyarıyı filtreleyerek kaldır
        warnings[guildId][userId] = warnings[guildId][userId].filter(
            (warning) => warning.warningId !== warningIdToRemove
        );

        if (warnings[guildId][userId].length === 0) {
            delete warnings[guildId][userId];
            if (Object.keys(warnings[guildId]).length === 0) {
                delete warnings[guildId];
            }
        }

        saveWarnings(warnings);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00) // Yeşil
            .setTitle('🗑️ Uyarı Kaldırıldı')
            .setDescription(`**${targetUser.tag}** adlı kullanıcının bir uyarısı başarıyla kaldırıldı.`)
            .addFields(
                { name: 'Kullanıcı', value: targetUser.toString(), inline: true },
                { name: 'Kaldırılan Uyarı ID', value: warningIdToRemove, inline: true },
                { name: 'Kalan Uyarı Sayısı', value: (initialWarningCount - 1).toString(), inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // --- YENİ LOGLAMA KISMI ---
        const logEmbed = new EmbedBuilder()
            .setColor(0x00BFFF) // Açık Mavi
            .setTitle('Uyarı Kaldırıldı')
            .setDescription('Bir kullanıcının uyarısı moderatör tarafından kaldırıldı.')
            .addFields(
                { name: 'Kullanıcı', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
                { name: 'Moderatör', value: `${moderator.tag} (${moderator.id})`, inline: false },
                { name: 'Kaldırılan Uyarı ID', value: warningIdToRemove, inline: false },
                { name: 'Kaldırılan Uyarının Sebebi', value: warningToRemove.reason || 'Sebep belirtilmemiş', inline: false },
                { name: 'Kalan Uyarı Sayısı', value: `${initialWarningCount - 1}`, inline: false }
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();

        // Log fonksiyonunu çağır
        await log(guild, 'punishment', logEmbed);
    },
};
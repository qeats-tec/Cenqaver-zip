const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger.js'); // Log modülünü dahil et

const warningsPath = path.join(__dirname, '..', 'warnings.json');

// Diğer yardımcı fonksiyonlar (getWarnings, saveWarnings) burada...
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
        .setName('uyar')
        .setDescription('Bir kullanıcıyı uyarır ve siciline işler.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Uyarılacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Uyarı sebebi.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .setDMPermission(false),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('sebep');
        const moderator = interaction.user;
        const guild = interaction.guild;

        if (!targetUser) {
            return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
        }

        if (targetUser.id === moderator.id) {
            return interaction.reply({ content: 'Kendini uyaramazsın!', ephemeral: true });
        }
        
        if (targetUser.bot) {
            return interaction.reply({ content: 'Botları uyaramazsın!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const warnings = getWarnings();
        const guildId = guild.id;
        const userId = targetUser.id;
        const warningId = `${Date.now()}`;

        if (!warnings[guildId]) {
            warnings[guildId] = {};
        }
        if (!warnings[guildId][userId]) {
            warnings[guildId][userId] = [];
        }

        const newWarning = {
            warningId: warningId,
            moderatorId: moderator.id,
            reason: reason,
            timestamp: new Date().toISOString(),
        };

        warnings[guildId][userId].push(newWarning);
        saveWarnings(warnings);

        const userWarnings = warnings[guildId][userId];

        // Kullanıcıya gönderilecek DM Embedi
        const dmEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`Uyarı Aldınız: ${guild.name}`)
            .setDescription(`**${reason}** sebebiyle uyarıldınız.`)
            .addFields({ name: 'Mevcut Uyarı Sayınız', value: `${userWarnings.length}` })
            .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] }).catch(err => {
            console.log(`${targetUser.tag} adlı kullanıcıya DM gönderilemedi.`);
        });

        // Kanala gönderilecek bildirim embedi
        const channelEmbed = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setDescription(`✅ **${targetUser.tag}** adlı kullanıcı **${reason}** sebebiyle uyarıldı. (Toplam: ${userWarnings.length})`);

        await interaction.editReply({ embeds: [channelEmbed] });

        // --- YENİ LOGLAMA KISMI ---
        const logEmbed = new EmbedBuilder()
            .setColor(0xFFA500) // Turuncu
            .setTitle('Kullanıcı Uyarıldı')
            .setDescription('Bir kullanıcı moderatör tarafından uyarıldı.')
            .addFields(
                { name: 'Kullanıcı', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
                { name: 'Moderatör', value: `${moderator.tag} (${moderator.id})`, inline: false },
                { name: 'Sebep', value: reason, inline: false },
                { name: 'Yeni Uyarı Sayısı', value: `${userWarnings.length}`, inline: false },
                { name: 'Uyarı ID', value: warningId, inline: false }
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        
        // Log fonksiyonunu çağır
        await log(guild, 'punishment', logEmbed);
    },
};
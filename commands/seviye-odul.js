const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const rewardsPath = path.join(__dirname, '../level-oduller.json');

// Ödülleri okumak ve yazmak için yardımcı fonksiyonlar
const readRewards = () => {
    if (fs.existsSync(rewardsPath)) {
        try { return JSON.parse(fs.readFileSync(rewardsPath, 'utf-8')); } catch { return {}; }
    }
    return {};
};

const writeRewards = (data) => {
    fs.writeFileSync(rewardsPath, JSON.stringify(data, null, 2));
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seviye-odul')
        .setDescription('Seviye atlama ödüllerini (rolleri) yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('ekle')
                .setDescription('Belirli bir seviyeye ulaşınca verilecek rolü ayarlar.')
                .addIntegerOption(option => option.setName('seviye').setDescription('Ödülün verileceği seviye.').setRequired(true).setMinValue(1))
                .addRoleOption(option => option.setName('rol').setDescription('Verilecek rol.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kaldir')
                .setDescription('Belirli bir seviyenin ödülünü kaldırır.')
                .addIntegerOption(option => option.setName('seviye').setDescription('Ödülü kaldırılacak seviye.').setRequired(true).setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('liste')
                .setDescription('Ayarlanmış tüm seviye ödüllerini listeler.')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const rewards = readRewards();

        if (!rewards[guildId]) {
            rewards[guildId] = {};
        }

        switch (subcommand) {
            case 'ekle': {
                await interaction.deferReply({ ephemeral: true });
                const level = interaction.options.getInteger('seviye');
                const role = interaction.options.getRole('rol');

                // Bot'un üye nesnesini manuel olarak çekerek önbellek sorunlarını önle
                const botMember = await interaction.guild.members.fetch(interaction.client.user.id);

                // Rol hiyerarşisini ve yönetilip yönetilemediğini kontrol et
                if (role.managed || role.position >= botMember.roles.highest.position) {
                    return interaction.editReply({ content: '❌ Bu rolü yönetemem! Lütfen botun rolünden daha aşağıda olan ve botlar tarafından yönetilmeyen bir rol seçin.' });
                }

                rewards[guildId][level] = role.id;
                writeRewards(rewards);
                await interaction.editReply({ content: `✅ Başarılı! **Seviye ${level}** için ödül rolü ${role} olarak ayarlandı.` });
                break;
            }
            case 'kaldir': {
                const level = interaction.options.getInteger('seviye');
                if (!rewards[guildId][level]) {
                    return interaction.reply({ content: `❌ **Seviye ${level}** için zaten ayarlanmış bir ödül yok.`, ephemeral: true });
                }

                delete rewards[guildId][level];
                writeRewards(rewards);
                await interaction.reply({ content: `✅ Başarılı! **Seviye ${level}** için ayarlanmış ödül kaldırıldı.`, ephemeral: true });
                break;
            }
            case 'liste': {
                const guildRewards = rewards[guildId];
                if (Object.keys(guildRewards).length === 0) {
                    return interaction.reply({ content: 'Bu sunucuda ayarlanmış hiç seviye ödülü yok.', ephemeral: true });
                }

                const sortedLevels = Object.keys(guildRewards).sort((a, b) => a - b);

                const description = sortedLevels
                    .map(level => `**Seviye ${level}** ➜ <@&${guildRewards[level]}>`)
                    .join('\n');

                const embed = new EmbedBuilder()
                    .setTitle('🏆 Sunucu Seviye Ödülleri')
                    .setColor('Gold')
                    .setDescription(description);
                
                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }
        }
    },
};
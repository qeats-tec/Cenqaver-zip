const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ayarlarPath = path.join(__dirname, '..', 'market-ayarlar.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market-kur')
        .setDescription('Sunucu için ekonomi ve market sistemini kurar. (Yönetici Yetkisi Gerekir)')
        .addChannelOption(option =>
            option.setName('log-kanali')
                .setDescription('Market alışverişlerinin loglanacağı kanal.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        const logKanali = interaction.options.getChannel('log-kanali');
        const guildId = interaction.guild.id;

        try {
            let ayarlar = {};
            if (fs.existsSync(ayarlarPath)) {
                ayarlar = JSON.parse(fs.readFileSync(ayarlarPath, 'utf-8'));
            }

            if (ayarlar[guildId]) {
                return interaction.reply({ content: '✅ Market sistemi bu sunucuda zaten kurulu. Ayarları değiştirmek isterseniz gelecekte `/market-ayarla` komutunu kullanabilirsiniz.', ephemeral: true });
            }

            ayarlar[guildId] = {
                logChannelId: logKanali.id,
                items: [] // Başlangıçta boş bir item listesi
            };

            fs.writeFileSync(ayarlarPath, JSON.stringify(ayarlar, null, 2));

            return interaction.reply({ content: `✅ Ekonomi ve market sistemi başarıyla kuruldu! Alışveriş logları <#${logKanali.id}> kanalına gönderilecek.` });

        } catch (error) {
            console.error('Market kurma hatası:', error);
            return interaction.reply({ content: '❌ Market sistemi kurulurken bir hata oluştu.', ephemeral: true });
        }
    }
};

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ayarlarPath = path.join(__dirname, '../başvuru-ayarlar.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('başvuru-soru-kaldır')
        .setDescription('Numarasını belirttiğiniz soruyu başvuru formundan kaldırır.')
        .addIntegerOption(option =>
            option.setName('numara')
                .setDescription('Kaldırılacak sorunun numarası. (/başvuru-soru-listele)')
                .setRequired(true)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const soruNumarasi = interaction.options.getInteger('numara');

        try {
            let ayarlar = {};
            if (fs.existsSync(ayarlarPath)) {
                ayarlar = JSON.parse(fs.readFileSync(ayarlarPath, 'utf-8'));
            } else {
                return interaction.reply({ content: '❌ Başvuru sistemi kurulu değil.', ephemeral: true });
            }

            const guildAyarlari = ayarlar[interaction.guild.id];
            if (!guildAyarlari || !guildAyarlari.questions || guildAyarlari.questions.length === 0) {
                return interaction.reply({ content: '❌ Kaldırılacak hiç soru bulunmuyor.', ephemeral: true });
            }

            if (soruNumarasi > guildAyarlari.questions.length) {
                return interaction.reply({ content: `❌ Geçersiz soru numarası. Sadece ${guildAyarlari.questions.length} adet soru var.`, ephemeral: true });
            }

            // Soruyu diziden kaldır (index = numara - 1)
            const kaldirilanSoru = guildAyarlari.questions.splice(soruNumarasi - 1, 1);

            fs.writeFileSync(ayarlarPath, JSON.stringify(ayarlar, null, 2));

            await interaction.reply({ 
                content: `✅ **${soruNumarasi}.** sıradaki "*${kaldirilanSoru}*" sorusu başarıyla kaldırıldı.`,
                ephemeral: true 
            });

        } catch (error) {
            console.error('Başvuru sorusu kaldırılırken hata oluştu:', error);
            await interaction.reply({ 
                content: '❌ Soru kaldırılırken bir hata oluştu.',
                ephemeral: true 
            });
        }
    },
};
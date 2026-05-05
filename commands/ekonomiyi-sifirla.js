const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '..', 'economy.json');

// Helper functions
function getEconomy() {
    if (fs.existsSync(economyPath)) {
        return JSON.parse(fs.readFileSync(economyPath, 'utf-8'));
    }
    return {};
}

function saveEconomy(economy) {
    fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ekonomiyi-sifirla')
        .setDescription('[Sunucu Sahibi] Sunucudaki tüm ekonomi verilerini sıfırlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Extra check to ensure only the guild owner can run this.
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: '❌ Bu komutu sadece sunucu sahibi kullanabilir.', ephemeral: true });
        }

        const guildId = interaction.guild.id;
        const economy = getEconomy();

        if (!economy[guildId]) {
            return interaction.reply({ content: 'Bu sunucuda zaten sıfırlanacak bir ekonomi verisi yok.' });
        }

        // Reset economy for the guild
        delete economy[guildId];
        saveEconomy(economy);

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('💥 Ekonomi Sıfırlandı!')
            .setDescription(`**${interaction.guild.name}** sunucusundaki tüm ekonomi verileri başarıyla sıfırlandı.`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};

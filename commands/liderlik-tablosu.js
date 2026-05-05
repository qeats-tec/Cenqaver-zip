const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '..', 'economy.json');

// Helper function to read economy data
function getEconomy() {
    if (fs.existsSync(economyPath)) {
        return JSON.parse(fs.readFileSync(economyPath, 'utf-8'));
    }
    return {};
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('liderlik-tablosu')
        .setDescription('Sunucunun en zengin kullanıcılarını gösterir.')
        .addStringOption(option =>
            option.setName('sirala')
                .setDescription('Sıralama ölçütü.')
                .setRequired(true)
                .addChoices(
                    { name: 'Toplam Servet', value: 'net' },
                    { name: 'Cüzdan', value: 'cuzdan' },
                    { name: 'Banka', value: 'banka' }
                )),

    async execute(interaction) {
        const sortBy = interaction.options.getString('sirala');
        const guildId = interaction.guild.id;

        const economy = getEconomy();
        const guildEconomy = economy[guildId];

        if (!guildEconomy) {
            return interaction.reply({ content: 'Bu sunucuda görüntülenecek ekonomi verisi yok.' });
        }

        const users = await interaction.guild.members.fetch();
        const leaderboard = Object.keys(guildEconomy)
            .map(userId => {
                const user = users.get(userId);
                if (!user) return null;

                const data = guildEconomy[userId];
                const balance = data.balance || 0;
                const bank = data.bank || 0;
                return {
                    id: userId,
                    username: user.user.username,
                    balance: balance,
                    bank: bank,
                    net: balance + bank
                };
            })
            .filter(Boolean); // Remove null entries for users who left

        let sortFunction;
        let title;
        switch (sortBy) {
            case 'cuzdan':
                sortFunction = (a, b) => b.balance - a.balance;
                title = 'Cüzdan Liderlik Tablosu 👛';
                break;
            case 'banka':
                sortFunction = (a, b) => b.bank - a.bank;
                title = 'Banka Liderlik Tablosu 🏦';
                break;
            default: // net
                sortFunction = (a, b) => b.net - a.net;
                title = 'Toplam Servet Liderlik Tablosu 💰';
                break;
        }

        leaderboard.sort(sortFunction);

        const top10 = leaderboard.slice(0, 10);

        if (top10.length === 0) {
            return interaction.reply({ content: 'Sıralamada kimse yok!' });
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(title)
            .setTimestamp();

        let description = '';
        top10.forEach((user, index) => {
            let value;
            if (sortBy === 'cuzdan') value = user.balance;
            else if (sortBy === 'banka') value = user.bank;
            else value = user.net;
            description += `**${index + 1}.** ${user.username} - **${value}**\\n`;
        });

        embed.setDescription(description);

        return interaction.reply({ embeds: [embed] });
    }
};
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '..', 'economy.json');
const COOLDOWN = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

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
        .setName('soygun')
        .setDescription('Başka bir kullanıcıyı soymaya çalış.')
        .addUserOption(option =>
            option.setName('hedef')
                .setDescription('Soymak istediğin kullanıcı.')
                .setRequired(true)),

    async execute(interaction) {
        const robber = interaction.user;
        const target = interaction.options.getUser('hedef');
        const guildId = interaction.guild.id;

        if (target.bot || target.id === robber.id) {
            return interaction.reply({ content: '❌ Kendini veya bir botu soyamazsın.', ephemeral: true });
        }

        const economy = getEconomy();

        // Initialize data if not present
        if (!economy[guildId]) economy[guildId] = {};
        if (!economy[guildId][robber.id]) economy[guildId][robber.id] = { balance: 0, lastRob: 0 };
        if (!economy[guildId][target.id] || !economy[guildId][target.id].balance || economy[guildId][target.id].balance < 100) {
            return interaction.reply({ content: '❌ Hedefin soyulmaya değecek kadar parası yok (En az 100 parası olmalı).', ephemeral: true });
        }

        const lastRob = economy[guildId][robber.id].lastRob || 0;
        const timeLeft = COOLDOWN - (Date.now() - lastRob);

        if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            return interaction.reply({ content: `Çok sık soygun yapıyorsun! Tekrar denemek için **${hours} saat ${minutes} dakika** beklemelisin.` });
        }

        economy[guildId][robber.id].lastRob = Date.now();

        const successChance = 0.40; // 40% success chance
        const didSucceed = Math.random() < successChance;
        
        const targetBalance = economy[guildId][target.id].balance;
        const robberBalance = economy[guildId][robber.id].balance;

        let embed;

        if (didSucceed) {
            const stolenAmount = Math.floor(targetBalance * (Math.random() * 0.20 + 0.10)); // Steal 10-30%
            economy[guildId][robber.id].balance += stolenAmount;
            economy[guildId][target.id].balance -= stolenAmount;

            embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✅ Başarılı Soygun!')
                .setDescription(`**<@${target.id}>** adlı kullanıcıyı soydun ve **${stolenAmount}** para çaldın!`)
                .addFields(
                    { name: `Senin Yeni Bakiyen`, value: `**${robberBalance + stolenAmount}**` },
                    { name: `Hedefin Yeni Bakiyesi`, value: `**${targetBalance - stolenAmount}**` }
                );
        } else {
            const penalty = Math.floor(robberBalance * (Math.random() * 0.15 + 0.05)); // Lose 5-20%
            economy[guildId][robber.id].balance = Math.max(0, robberBalance - penalty);
            
            embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ Başarısız Soygun!')
                .setDescription(`**<@${target.id}>** adlı kullanıcıyı soymaya çalışırken yakalandın ve **${penalty}** para kaybettin!`)
                 .addFields({ name: 'Senin Yeni Bakiyen', value: `**${Math.max(0, robberBalance - penalty)}**` });
        }

        saveEconomy(economy);
        return interaction.reply({ embeds: [embed] });
    }
};

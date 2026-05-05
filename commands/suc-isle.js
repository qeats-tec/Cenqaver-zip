const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '..', 'economy.json');
const COOLDOWN = 60 * 60 * 1000; // 1 hour in milliseconds

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

// Scenarios
const scenarios = {
    success: [
        { message: 'Yerel bir bankayı soydun ve kaçmayı başardın!', reward: [500, 1500] },
        { message: 'Zengin bir iş insanının cüzdanını çaldın.', reward: [200, 800] },
        { message: 'Bir mücevher dükkanından değerli bir kolye aşırdın.', reward: [800, 2000] },
        { message: 'Online bir dolandırıcılıkla yüklü bir vurgun yaptın.', reward: [1000, 2500] }
    ],
    failure: [
        { message: 'Bankayı soymaya çalışırken yakalandın ve para cezası ödedin.', penalty: [300, 1000] },
        { message: 'Cüzdanı çalarken ensendin ve ceza olarak paran alındı.', penalty: [100, 500] },
        { message: 'Mücevher dükkanının alarmını çalıştırdın ve kaçarken paranı düşürdün.', penalty: [400, 1200] },
        { message: 'Polis siber suçlar ekibi seni buldu ve banka hesabını boşalttı.', penalty: [1500, 3000] }
    ]
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suc-isle')
        .setDescription('Risk alarak para kazanmaya veya kaybetmeye çalış.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const economy = getEconomy();

        // Initialize data if not present
        if (!economy[guildId]) economy[guildId] = {};
        if (!economy[guildId][userId]) {
            economy[guildId][userId] = { balance: 0, lastCrime: 0 };
        }

        const lastCrime = economy[guildId][userId].lastCrime || 0;
        const timeLeft = COOLDOWN - (Date.now() - lastCrime);

        if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            return interaction.reply({ content: `Çok sık suç işliyorsun! Tekrar denemek için **${minutes} dakika ${seconds} saniye** beklemelisin.` });
        }

        economy[guildId][userId].lastCrime = Date.now();

        const successChance = 0.6; // 60% success chance
        const didSucceed = Math.random() < successChance;

        let resultMessage = '';
        let newBalance = economy[guildId][userId].balance;

        if (didSucceed) {
            const scenario = scenarios.success[Math.floor(Math.random() * scenarios.success.length)];
            const amount = getRandomInt(scenario.reward[0], scenario.reward[1]);
            newBalance += amount;
            resultMessage = `✅ **Başarılı!** ${scenario.message} **${amount}** para kazandın!`;
        } else {
            const scenario = scenarios.failure[Math.floor(Math.random() * scenarios.failure.length)];
            const amount = getRandomInt(scenario.penalty[0], scenario.penalty[1]);
            newBalance = Math.max(0, newBalance - amount);
            resultMessage = `❌ **Başarısız!** ${scenario.message} **${amount}** para kaybettin!`;
        }

        economy[guildId][userId].balance = newBalance;
        saveEconomy(economy);

        const embed = new EmbedBuilder()
            .setTitle('Suç Dünyası')
            .setDescription(resultMessage)
            .addFields({ name: 'Yeni Bakiye', value: `**${newBalance}**` })
            .setColor(didSucceed ? '#00ff00' : '#ff0000')
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};

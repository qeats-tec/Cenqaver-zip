const { SlashCommandBuilder } = require('discord.js');

const jokes = [
    'Bugün işsiz isen yarında işsizsindir \n-Cenqaver Motivasyon',
    ' -senin adın neden Yunus?\nBilmem, ailem koymuş.\nBence "Şanslı" olmalıydı, çünkü benim gibi bir arkadaşın var. hahaha',
    'Helelelele',
    'Skibidi Toilet...',
    'Bugün elini veren yarın ...\nDiğer elini verir \nTövbe Tövbe hemen fesat anlıyor bu da',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('şaka')
        .setDescription('Rastgele bir şaka yapar.'),
    async execute(interaction) {
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
        await interaction.reply(randomJoke);
    },
};
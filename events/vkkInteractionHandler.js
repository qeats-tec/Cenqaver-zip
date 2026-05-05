const { EmbedBuilder } = require('discord.js');
const { activeGames } = require('../commands/vampir-koylu.js');
const { startGame, startDayPhase, startNightPhase } = require('../gameLogic/vkkGameLogic.js');

// Lobi embed'ini güncellemek için yardımcı fonksiyon...
async function updateLobbyEmbed(interaction, game) { /* ... */ }

// Oyunun bitip bitmediğini kontrol et
async function checkWinCondition(interaction, game) {
    const livingPlayers = game.players.filter(p => p.isAlive);
    const livingVampires = livingPlayers.filter(p => p.role === 'Vampir');
    const livingVillagers = livingPlayers.filter(p => p.role !== 'Vampir');

    let winner = null; // 'vampires', 'villagers'

    if (livingVampires.length === 0) {
        winner = 'villagers';
    } else if (livingVampires.length >= livingVillagers.length) {
        winner = 'vampires';
    }

    if (winner) {
        activeGames.delete(interaction.guild.id);
        const winEmbed = new EmbedBuilder()
            .setTitle('Oyun Bitti!')
            .setColor(winner === 'vampires' ? 'DarkRed' : 'Green')
            .setDescription(`**Kazanan taraf: ${winner === 'vampires' ? 'Vampirler' : 'Köylüler'}**`);
        await interaction.channel.send({ embeds: [winEmbed] });
        return true; // Oyun bitti
    }
    return false; // Oyun devam ediyor
}

// Gece oylarını işle
async function processBiteVotes(interaction, game) {
    // ... (logic to count votes and find target)
    const victimId = Object.keys(game.vampireVotes)[0]; // Basitçe ilk oyu al (geliştirilebilir)
    const victim = game.players.find(p => p.id === victimId);
    victim.isAlive = false;

    const resultEmbed = new EmbedBuilder()
        .setTitle('🌅 Gün Doğuyor')
        .setColor('Orange')
        .setDescription(`Bu gece karanlıkta bir çığlık duyuldu... **${victim.username}** saldırıya uğradı ve öldü!\nRolü: **${victim.role}**`);
    
    await interaction.channel.send({ embeds: [resultEmbed] });

    if (!await checkWinCondition(interaction, game)) {
        startDayPhase(interaction, game);
    }
}


// Gündüz oylarını işle
async function processLynchVotes(interaction, game) {
    // ... (voting logic)
    const lynchTargetId = '...'; // Belirlenen hedef

    if (lynchTargetId) {
        const lynchedPlayer = game.players.find(p => p.id === lynchTargetId);
        lynchedPlayer.isAlive = false;
        // ... (send message)
    }

    if (!await checkWinCondition(interaction, game)) {
        startNightPhase(interaction, game);
    }
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        const gameId = interaction.guild.id;
        const game = activeGames.get(gameId);

        if (!game) return;

        if (interaction.isButton() && interaction.customId.startsWith('vkk_')) {
            // ... Lobi Butonları ...
        }

        if (interaction.isStringSelectMenu()) {
            const player = game.players.find(p => p.id === interaction.user.id);
            if (!player || !player.isAlive) {
                return interaction.reply({ content: 'Sadece hayattaki oyuncular etkileşime girebilir!', ephemeral: true });
            }

            switch (interaction.customId) {
                case 'vkk_vote_lynch':
                    // ... Gündüz Oylama Mantığı ...
                    const livingPlayersCount = game.players.filter(p => p.isAlive).length;
                    if (Object.keys(game.votes).length === livingPlayersCount) {
                        await interaction.message.edit({ components: [] });
                        await processLynchVotes(interaction, game);
                    }
                    break;
                
                case 'vkk_vote_bite':
                    const voterRole = player.role;
                    if (voterRole !== 'Vampir') return interaction.reply({ content: 'Bu menüyü sadece vampirler kullanabilir.', ephemeral: true });

                    game.vampireVotes[interaction.user.id] = interaction.values[0];
                    await interaction.update({ content: 'Kurban seçimin yapıldı.', components: [] });

                    const livingVampires = game.players.filter(p => p.isAlive && p.role === 'Vampir').length;
                    if (Object.keys(game.vampireVotes).length === livingVampires) {
                        await processBiteVotes(interaction, game);
                    }
                    break;
            }
        }
    },
};
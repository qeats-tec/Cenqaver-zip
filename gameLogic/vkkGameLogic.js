const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { activeGames } = require('../commands/vampir-koylu.js');

// Rolleri dağıtan fonksiyon...
function assignRoles(players) {
    const playerCount = players.length;
    let vampireCount = 1;
    let moleCount = 0;

    if (playerCount >= 7) vampireCount = 2;
    if (playerCount >= 5) moleCount = 1;

    const roles = [];
    for (let i = 0; i < vampireCount; i++) roles.push('Vampir');
    for (let i = 0; i < moleCount; i++) roles.push('Köstebek');
    while (roles.length < playerCount) roles.push('Köylü');

    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    players.forEach((player, index) => {
        player.role = roles[index];
        player.guildId = players[0].guildId; // Herkese guildId ata
    });
    
    const game = activeGames.get(players[0].guildId);
    if(game) {
        game.roles.vampires = players.filter(p => p.role === 'Vampir').map(p => p.id);
        game.roles.mole = players.find(p => p.role === 'Köstebek')?.id;
    }

    return players;
}

// Gece fazını başlatan fonksiyon
async function startNightPhase(interaction, game) {
    game.phase = 'night';
    game.vampireVotes = {}; // Vampir oylarını sıfırla

    const nightEmbed = new EmbedBuilder()
        .setTitle(`🌙 Gece ${game.turn} Başladı`)
        .setColor('DarkBlue')
        .setDescription('Herkes uykuya daldı. Bazıları için av, bazıları için ise hayatta kalma vakti...\n\nVampirler avını seçiyor.');
    
    try {
        await interaction.channel.send({ embeds: [nightEmbed] });
    } catch (channelError) {
        console.error(`VKK Oyunu: Gece fazı mesajı gönderilemedi. Kanal: ${interaction.channel.id}`, channelError);
        // Kanalda mesaj gönderilemiyorsa oyunu durdurmak mantıklı olabilir, ancak şimdilik devam ediyoruz.
    }


    const livingPlayers = game.players.filter(p => p.isAlive);
    const vampires = livingPlayers.filter(p => p.role === 'Vampir');
    const potentialVictims = livingPlayers.filter(p => p.role !== 'Vampir');

    if (potentialVictims.length === 0) return; // Avlanacak kimse kalmadıysa devam etme

    const victimOptions = potentialVictims.map(p => ({
        label: p.username,
        value: p.id,
    }));

    const biteMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vkk_vote_bite')
            .setPlaceholder('Isırmak için bir kurban seçin...')
            .addOptions(victimOptions)
    );

    // Tüm vampirlere oylama menüsünü DM ile gönder
    for (const vampire of vampires) {
        try {
            const user = await interaction.client.users.fetch(vampire.id);
            await user.send({ content: 'Kimi avlamak istediğini seç. Eğer birden fazla vampir varsa, çoğunluk aynı kişiyi seçmelidir.', components: [biteMenu] });
        } catch (dmError) {
            console.error(`Vampire DM hatası (${vampire.id}):`, dmError);
            // DM atılamazsa kanala yazmayı dene, ama bu da başarısız olabilir.
            try {
                await interaction.channel.send(`⚠️ <@${vampire.id}> (Vampir), sana DM atamıyorum! Lütfen ayarlarını düzelt. Oylamaya katılamayacaksın.`);
            } catch (channelError) {
                console.error(`VKK Oyunu: DM hata uyarısı kanala gönderilemedi. Kanal: ${interaction.channel.id}`, channelError);
            }
        }
    }
}

// Gündüz fazını başlatan fonksiyon...
async function startDayPhase(interaction, game) {
    game.phase = 'day';
    game.votes = {};
    game.turn++; // Tur sayısını artır

    const livingPlayers = game.players.filter(p => p.isAlive);

    const playerOptions = livingPlayers.map(p => ({ label: p.username, value: p.id }));

    const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vkk_vote_lynch')
            .setPlaceholder('Asmak için bir oyuncu seçin...')
            .addOptions(playerOptions)
    );

    const dayEmbed = new EmbedBuilder()
        .setTitle(`☀️ Gün ${game.turn} - Tartışma ve Oylama`)
        .setColor('Yellow')
        .setDescription('Köy meydanında toplandınız. İçinizdeki hainin kim olduğunu tartışın ve gün sonunda birini asmak için oylama yapın.')
        .addFields({ name: 'Hayattaki Oyuncular', value: livingPlayers.map(p => p.username).join(', ') });

    try {
        await interaction.channel.send({ embeds: [dayEmbed], components: [selectMenu] });
    } catch (channelError) {
         console.error(`VKK Oyunu: Gündüz fazı mesajı gönderilemedi. Kanal: ${interaction.channel.id}`, channelError);
    }
}

async function startGame(interaction, game) {
    game.status = 'running';
    game.players.forEach(p => p.guildId = interaction.guild.id);
    const playersWithRoles = assignRoles(game.players);
    game.players = playersWithRoles;
    
    const roleInfoEmbed = new EmbedBuilder().setTitle('Oyun Başladı! Roller Dağıtıldı!').setColor('Gold').setDescription('Rolünü öğrenmek için lütfen özel mesajlarını (DM) kontrol et! Oyun şimdi başlayacak...');
    await interaction.update({ embeds: [roleInfoEmbed], components: [] });

    for (const player of game.players) {
        try {
            const user = await interaction.client.users.fetch(player.id);
            let roleDescription, roleColor;
            switch(player.role){
                case 'Vampir':
                    roleDescription = 'Sen bir Vampirsin! Geceleri uyanır ve diğer vampirlerle birlikte birini avlarsın. Gündüzleri ise kimliğini gizleyerek bir köylü gibi davranmalısın.';
                    roleColor = 'DarkRed';
                    break;
                case 'Köylü':
                    roleDescription = 'Sen bir Köylüsün! Amacın, aranızdaki vampirleri bularak onları köy meydanında asmak ve hayatta kalmaktır.';
                    roleColor = 'Green';
                    break;
                case 'Köstebek':
                    roleDescription = 'Sen bir Köstebeksin! Vampirler kim olduğunuzu bilir ve onlarla birlikte kazanırsınız. Onların kazanması için elinden geleni yapmalısın, gerekirse kendini feda etmelisin.';
                    roleColor = 'DarkGrey';
                    break;
            }
            const roleEmbed = new EmbedBuilder().setTitle(`Rolün: ${player.role}`).setDescription(roleDescription).setColor(roleColor).setFooter({text:`Oyun: ${interaction.guild.name}`});
            await user.send({embeds:[roleEmbed]});
        } catch (dmError) {
            console.error(`Oyuncu DM hatası (${player.id}):`, dmError);
            // DM atılamazsa kanala yazmayı dene, ama bu da başarısız olabilir.
            try {
                await interaction.channel.send(`⚠️ <@${player.id}>, sana DM gönderilemiyor! Rolünü öğrenmek için lütfen DM ayarlarını düzelt.`);
            } catch (channelError) {
                console.error(`VKK Oyunu: DM hata uyarısı kanala gönderilemedi. Kanal: ${interaction.channel.id}`, channelError);
            }
        }
    }
    
    // 5 saniye bekle ve ilk gündüz fazını başlat
    setTimeout(() => { startDayPhase(interaction, game); }, 5000);
}

module.exports = { startGame, startDayPhase, startNightPhase };
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

// Sunuculardaki aktif oyunları saklamak için bir Map (in-memory)
// Key: guildId, Value: game object
const activeGames = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vampir-koylu')
        .setDescription('Vampir, Köylü ve Köstebek oyununu başlatır ve yönetir.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('baslat')
                .setDescription('Yeni bir oyun lobisi başlatır.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bitir')
                .setDescription('Devam eden bir oyunu zorla bitirir (Kurucu veya Yönetici).')),
    
    // activeGames'i diğer dosyalardan erişilebilir yapmak için export ediyoruz.
    activeGames,

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const game = activeGames.get(guildId);

        if (subcommand === 'baslat') {
            if (game) {
                return interaction.reply({ content: 'Bu sunucuda zaten bir oyun lobisi veya devam eden bir oyun var!', ephemeral: true });
            }

            const host = interaction.user;

            // Yeni oyun nesnesini oluştur
            const newGame = {
                hostId: host.id,
                players: [{ id: host.id, username: host.username, role: null, isAlive: true }],
                status: 'lobby', // 'lobby', 'running', 'finished'
                channelId: interaction.channel.id,
                messageId: null, // Lobi mesajının ID'si
                roles: {}, // Roller burada tutulacak (vampire, mole, villagers)
                turn: 1,
                phase: 'day', // 'day', 'night'
            };

            activeGames.set(guildId, newGame);

            const embed = new EmbedBuilder()
                .setTitle('🧛 Vampir Köylü Oyunu Lobisi')
                .setColor('DarkRed')
                .setDescription(`**${host.username}** tarafından yeni bir oyun başlatıldı!\n\nOyuna katılmak için **Katıl** butonuna basın.\nKurucu, yeterli oyuncu olduğunda oyunu başlatabilir.`)
                .addFields({ name: `Oyuncular (1/12)`, value: host.username });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('vkk_join').setLabel('Katıl').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('vkk_leave').setLabel('Ayrıl').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('vkk_start').setLabel('Oyunu Başlat (Kurucu)').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('vkk_cancel').setLabel('İptal Et (Kurucu)').setStyle(ButtonStyle.Danger)
            );

            const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
            newGame.messageId = message.id; // Mesaj ID'sini kaydet

        } else if (subcommand === 'bitir') {
            if (!game) {
                return interaction.reply({ content: 'Bu sunucuda bitirilecek aktif bir oyun yok.', ephemeral: true });
            }

            const canForceEnd = interaction.user.id === game.hostId || interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            if (!canForceEnd) {
                return interaction.reply({ content: 'Sadece oyunu başlatan kişi veya bir yönetici oyunu bitirebilir.', ephemeral: true });
            }

            const originalMessage = await interaction.channel.messages.fetch(game.messageId);
            if (originalMessage) {
                 const finishedEmbed = new EmbedBuilder()
                    .setTitle('Oyun Bitti')
                    .setDescription('Oyun, kurucu veya bir yönetici tarafından zorla bitirildi.')
                    .setColor('Grey');
                await originalMessage.edit({ embeds: [finishedEmbed], components: [] });
            }

            activeGames.delete(guildId);
            await interaction.reply({ content: 'Oyun başarıyla bitirildi.', ephemeral: true });
        }
    },
};
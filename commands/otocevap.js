const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const autoResponsesPath = path.join(__dirname, '..', 'auto-responses.json');

// Yardımcı fonksiyon: Otocevapları dosyadan oku
const getAutoResponses = () => {
    try {
        if (fs.existsSync(autoResponsesPath)) {
            const data = fs.readFileSync(autoResponsesPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('auto-responses.json okunurken hata:', error);
    }
    return {}; // Varsayılan olarak boş bir nesne döndür
};

// Yardımcı fonksiyon: Otocevapları dosyaya yaz
const saveAutoResponses = (data) => {
    try {
        fs.writeFileSync(autoResponsesPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('auto-responses.json yazılırken hata:', error);
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('otocevap')
        .setDescription('Otomatik cevapları yönetir. (Yönetici Yetkisi Gerekir)')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator) // Yetki kontrolü
        .addSubcommand(subcommand =>
            subcommand
                .setName('oluştur')
                .setDescription('Yeni bir otomatik cevap oluşturur veya günceller.')
                .addStringOption(option => option.setName('tetikleyici').setDescription('Botun tepki vereceği kelime veya cümle.').setRequired(true))
                .addStringOption(option => option.setName('cevap').setDescription('Botun vereceği cevap.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sil')
                .setDescription('Bir otomatik cevabı siler.')
                .addStringOption(option => option.setName('tetikleyici').setDescription('Silinecek otomatik cevabın tetikleyicisi.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('liste')
                .setDescription('Sunucudaki tüm otomatik cevapları listeler.')),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için "Yönetici" yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const allResponses = getAutoResponses();

        if (!allResponses[guildId]) {
            allResponses[guildId] = {};
        }

        const trigger = interaction.options.getString('tetikleyici')?.toLowerCase();

        if (subcommand === 'oluştur') {
            const response = interaction.options.getString('cevap');
            allResponses[guildId][trigger] = response;
            saveAutoResponses(allResponses);

            // Belleği de güncelle
            if (!interaction.client.autoResponses) {
                interaction.client.autoResponses = new Map();
            }
            interaction.client.autoResponses.set(guildId, allResponses[guildId]);

            await interaction.reply({ content: `✅ **\`${trigger}\`** tetikleyicisi için otomatik cevap ayarlandı.`, ephemeral: true });

        } else if (subcommand === 'sil') {
            if (allResponses[guildId][trigger]) {
                delete allResponses[guildId][trigger];
                saveAutoResponses(allResponses);

                // Belleği de güncelle
                if (interaction.client.autoResponses) {
                    interaction.client.autoResponses.set(guildId, allResponses[guildId]);
                }

                await interaction.reply({ content: `🗑️ **\`${trigger}\`** tetikleyicisi kaldırıldı.`, ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Bu tetikleyici için ayarlanmış bir otomatik cevap bulunamadı.', ephemeral: true });
            }

        } else if (subcommand === 'liste') {
            const guildResponses = allResponses[guildId] || {};
            const responseList = Object.entries(guildResponses);

            if (responseList.length === 0) {
                return interaction.reply({ content: 'Bu sunucuda ayarlanmış hiç otomatik cevap yok.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(`${interaction.guild.name} - Otomatik Cevap Listesi`)
                .setDescription(responseList.map(([t, r]) => `**Tetikleyici:** \`${t}\`\\n**Cevap:** ${r}`).join('\\n\\n'));

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};

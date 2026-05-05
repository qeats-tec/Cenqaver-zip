const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const reactionRolesPath = path.join(__dirname, '..', 'reaction-roles.json');

// Helper function to read reaction roles data
const readReactionRoles = () => {
    if (!fs.existsSync(reactionRolesPath)) {
        return {};
    }
    const data = fs.readFileSync(reactionRolesPath, 'utf8');
    return JSON.parse(data);
};

// Helper function to write reaction roles data
const writeReactionRoles = (data) => {
    fs.writeFileSync(reactionRolesPath, JSON.stringify(data, null, 2));
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tepki-rol-ekle')
        .setDescription('Mevcut bir tepki-rol mesajına yeni bir emoji ve rol ekler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('mesaj_id')
                .setDescription('Tepki-rol mesajının IDsi.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Eklenen emojiye verilecek rol.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Role karşılık gelen emoji.')
                .setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const messageId = interaction.options.getString('mesaj_id');
            const role = interaction.options.getRole('rol');
            const emoji = interaction.options.getString('emoji');
            const guildId = interaction.guild.id;

            const reactionRoles = readReactionRoles();

            if (!reactionRoles[guildId] || !reactionRoles[guildId][messageId]) {
                return interaction.editReply({ content: '❌ Bu ID ile kayıtlı bir tepki-rol mesajı bulunamadı.', ephemeral: true });
            }

            if (role.managed || role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.editReply({ content: '❌ Bu rolü yönetemem. Lütfen botun rolünü bu rolün üzerine taşıyın.', ephemeral: true });
            }

            const config = reactionRoles[guildId][messageId];
            const channel = await interaction.guild.channels.fetch(config.channelId);
            if (!channel) {
                // Clean up if channel is not found
                delete reactionRoles[guildId][messageId];
                writeReactionRoles(reactionRoles);
                return interaction.editReply({ content: '❌ Mesajın bulunduğu kanal silinmiş. Bu tepki-rol kaydı temizlendi.', ephemeral: true });
            }

            const message = await channel.messages.fetch(messageId);
            if (!message) {
                 // Clean up if message is not found
                delete reactionRoles[guildId][messageId];
                writeReactionRoles(reactionRoles);
                return interaction.editReply({ content: '❌ Mesaj bulunamadı. Bu tepki-rol kaydı temizlendi.', ephemeral: true });
            }

            const emojiIdentifier = interaction.guild.emojis.cache.find(e => e.toString() === emoji)?.id || emoji;

            if (config.roles[emojiIdentifier]) {
                return interaction.editReply({ content: '❌ Bu emoji zaten bu mesajda başka bir rol için kullanılıyor.', ephemeral: true });
            }

             try {
                await message.react(emoji);
            } catch (error) {
                 console.error('Emoji reaksiyonu hatası:', error);
                 return interaction.editReply({ content: '❌ Geçersiz bir emoji girdiniz. Lütfen standart bir Discord emojisi veya bu sunucuda bulunan bir özel emoji kullanın.', ephemeral: true });
            }

            config.roles[emojiIdentifier] = role.id;
            writeReactionRoles(reactionRoles);

            await interaction.editReply({
                content: `✅ Başarıyla **${role.name}** rolü, **${emoji}** emojisi ile mesaja eklendi.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Tepki-rol ekleme hatası:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '❌ Komutu çalıştırırken bir hata oluştu. Lütfen mesaj IDsinin doğru olduğundan ve botun izinlerini kontrol edin.', ephemeral: true });
            }
        }
    },
};

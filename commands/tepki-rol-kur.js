const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const reactionRolesPath = path.join(__dirname, '..', 'reaction-roles.json');

// Helper function to read reaction roles data
const readReactionRoles = () => {
    if (!fs.existsSync(reactionRolesPath)) {
        fs.writeFileSync(reactionRolesPath, JSON.stringify({}));
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
        .setName('tepki-rol-kur')
        .setDescription('Yeni bir tepki-rol mesajı oluşturur ve başlığı ayarlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Mesajın gönderileceği kanal.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('başlık')
                .setDescription('Embed mesajının başlığı (örn: Rol Seçimi).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Embed mesajının içeriği (örn: Almak istediğin rol için tepkiye tıkla).')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Eklenen emojiye verilecek rol.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Role karşılık gelen emoji (standart veya bu sunucudaki özel emoji).')
                .setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const channel = interaction.options.getChannel('kanal');
            const title = interaction.options.getString('başlık');
            const messageText = interaction.options.getString('mesaj');
            const role = interaction.options.getRole('rol');
            const emoji = interaction.options.getString('emoji');

            if (!channel.permissionsFor(interaction.client.user).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.ViewChannel])) {
                return interaction.editReply({ content: '❌ Bu kanalda mesaj gönderme veya reaksiyon ekleme iznim yok.', ephemeral: true });
            }

            if (role.managed || role.position >= interaction.guild.members.me.roles.highest.position) {
                 return interaction.editReply({ content: '❌ Bu rolü yönetemem. Lütfen botun rolünü bu rolün üzerine taşıyın.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(title)
                .setDescription(messageText);

            const sentMessage = await channel.send({ embeds: [embed] });
            
            try {
                await sentMessage.react(emoji);
            } catch (error) {
                 console.error('Emoji reaksiyonu hatası:', error);
                 await sentMessage.delete(); // Mesajı sil çünkü emoji eklenemedi
                 return interaction.editReply({ content: '❌ Geçersiz bir emoji girdiniz. Lütfen standart bir Discord emojisi veya bu sunucuda bulunan bir özel emoji kullanın.', ephemeral: true });
            }


            const reactionRoles = readReactionRoles();
            if (!reactionRoles[interaction.guild.id]) {
                reactionRoles[interaction.guild.id] = {};
            }

            const emojiIdentifier = sentMessage.guild.emojis.cache.find(e => e.toString() === emoji)?.id || emoji;

            reactionRoles[interaction.guild.id][sentMessage.id] = {
                channelId: channel.id,
                roles: {
                    [emojiIdentifier]: role.id
                }
            };

            writeReactionRoles(reactionRoles);

            await interaction.editReply({
                content: `✅ Tepki-rol mesajı başarıyla ${channel} kanalında oluşturuldu. Başlığı ve metni istediğiniz gibi ayarladınız. Yeni roller eklemek için \`/tepki-rol-ekle\` komutunu kullanabilirsiniz.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Tepki-rol kurma hatası:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '❌ Komutu çalıştırırken bir hata oluştu. Lütfen botun izinlerini kontrol edin.', ephemeral: true });
            }
        }
    },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed-oluştur')
        .setDescription('Özelleştirilmiş bir embed mesajı oluşturur ve gönderir.')
        .addStringOption(option =>
            option.setName('başlık')
                .setDescription('Embed mesajının başlığı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mesaj-içeriği')
                .setDescription('Embed mesajının ana içeriği. Satır atlamak için \\n kullanabilirsiniz.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('renk')
                .setDescription('Embed rengi (HEX kodu, örn: #FF5733). Varsayılan mavidir.')),

    async execute(interaction) {
        const title = interaction.options.getString('başlık');
        const description = interaction.options.getString('mesaj-içeriği').replace(/\\n/g, '\n'); // Slash n karakterlerini gerçek yeni satırlara dönüştür
        let color = interaction.options.getString('renk');

        // HEX renk kodu doğrulaması
        if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
            return interaction.reply({ content: 'Geçersiz HEX renk kodu! Lütfen `#RRGGBB` formatında bir kod girin (örn: `#FF5733`).', ephemeral: true });
        }
        if (!color) {
            color = '#5865F2'; // Varsayılan Discord rengi
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: `Mesajı oluşturan: ${interaction.user.tag}` });

        try {
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Embed oluşturulurken hata:', error);
            await interaction.reply({ content: 'Embed mesajı gönderilirken bir hata oluştu.', ephemeral: true });
        }
    },
};
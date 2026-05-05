const { Events, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const reactionRolesPath = path.join(__dirname, '..', 'reaction-roles.json');

// Sağlamlaştırılmış JSON okuma fonksiyonu
const readReactionRoles = () => {
    if (!fs.existsSync(reactionRolesPath)) {
        return {};
    }
    try {
        const data = fs.readFileSync(reactionRolesPath, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error(`[${new Date().toISOString()}] HATA: reaction-roles.json dosyası okunurken veya parse edilirken hata oluştu:`, error);
        return {}; // Hata durumunda boş nesne dön
    }
};

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Botların tepkilerini yoksay
        if (user.bot) return;

        // Kısmi (partial) tepkileri ve mesajları tam veriye dönüştür
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error(`[${new Date().toISOString()}] HATA: Tepki (reaction) verisi çekilemedi:`, error);
                return;
            }
        }
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error(`[${new Date().toISOString()}] HATA: Mesaj verisi çekilemedi:`, error);
                return;
            }
        }

        const guild = reaction.message.guild;
        const messageId = reaction.message.id;
        const reactionRoles = readReactionRoles();

        // Bu mesajın bir tepki-rol mesajı olup olmadığını kontrol et
        const config = reactionRoles[guild.id]?.[messageId];
        if (!config) return;

        // Tepkinin, ayarlanan emojilerden biri olup olmadığını kontrol et
        const emojiIdentifier = reaction.emoji.id || reaction.emoji.name;
        const roleId = config.roles[emojiIdentifier];
        if (!roleId) return;

        // Botun kendisini ve rolü alacak üyeyi al
        const me = guild.members.me;
        const member = await guild.members.fetch(user.id).catch(() => null); // Üye bulunamazsa null dön
        const role = await guild.roles.fetch(roleId).catch(() => null); // Rol bulunamazsa null dön

        if (!member) {
             // Üye sunucudan ayrılmış olabilir, bu bir hata değil, sadece logla
            console.log(`[BİLGİ] Tepki ekleyen kullanıcı (ID: ${user.id}) ${guild.name} sunucusunda bulunamadı.`);
            return;
        }
        if (!role) {
            console.warn(`[UYARI] Ayarlanan rol (ID: ${roleId}) ${guild.name} sunucusunda bulunamadı. Lütfen tepki-rol ayarlarını kontrol edin.`);
            return;
        }

        // --- İZİN KONTROLLERİ ---
        // 1. Botun "Rolleri Yönet" izni var mı?
        if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            console.error(`[${new Date().toISOString()}] İZİN HATASI: ${guild.name} sunucusunda "Rolleri Yönet" iznim yok.`);
            return;
        }

        // 2. Botun rolü, yönetilecek rolden daha yüksek mi?
        if (role.position >= me.roles.highest.position) {
            console.warn(`[${new Date().toISOString()}] HİYERARŞİ UYARISI: ${guild.name} sunucusunda, ${role.name} rolü benim en yüksek rolümden daha yüksek veya aynı seviyede. Rol verilemedi.`);
            try {
                 await user.send(`> **${guild.name}** sunucusundaki \`${role.name}\` rolünü sana veremedim.\n> **Sebep:** Botun rol hiyerarşisi bu rolü yönetmek için yetersiz.\n> Lütfen sunucu yöneticisine durumu bildir.`);
            } catch (dmError) { // Kullanıcının DM'leri kapalıysa
                console.error(`[${new Date().toISOString()}] HATA: Rol hiyerarşi hatası hakkında kullanıcıya DM gönderilemedi (Kullanıcı: ${user.tag}).`, dmError);
            }
            return;
        }

        // Rolü üyeye ekle
        try {
            await member.roles.add(role);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ROL EKLEME HATASI (Sunucu: ${guild.name}, Kullanıcı: ${user.tag}, Rol: ${role.name}):`, error);
        }
    },
};
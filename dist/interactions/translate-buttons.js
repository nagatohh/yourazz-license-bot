"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTranslateButton = handleTranslateButton;
const discord_js_1 = require("discord.js");
const i18n_1 = require("../i18n");
const cv2_1 = require("../utils/cv2");
const T = {
    bienvenue: {
        fr: {
            title: "🚀 Bienvenue dans l'équipe YouRazz",
            desc: `Tu fais maintenant partie de l'équipe **YouRazz**.

**🏦 YouRazz, c'est quoi ?**
Plateforme de paiement nouvelle génération FR/EU.
Wallet interne • Paiements Stripe • Interface premium

**👤 Ton rôle : Staff / Middleman**
→ Tu gères les deals via tickets
→ Tu accumules des vouches → tu montes en grade
→ Ta limite MM augmente avec ton grade

**🎯 Système :** Deals → Vouches → Grades → Limite MM ↑
**Commande :** \`/vouch\` (Shiba) • **Reset :** 1er du mois`,
        },
        en: {
            title: "🚀 Welcome to the YouRazz team",
            desc: `You are now part of the **YouRazz** team.

**🏦 What is YouRazz?**
Next-gen payment platform for FR/EU market.
Internal wallet • Stripe payments • Premium interface

**👤 Your role: Staff / Middleman**
→ You handle deals via tickets
→ You accumulate vouches → you rank up
→ Your MM limit increases with your rank

**🎯 System:** Deals → Vouches → Ranks → MM Limit ↑
**Command:** \`/vouch\` (Shiba) • **Reset:** 1st of each month`,
        },
        es: {
            title: "🚀 Bienvenido al equipo YouRazz",
            desc: `Ahora formas parte del equipo **YouRazz**.

**🏦 ¿Qué es YouRazz?**
Plataforma de pago de nueva generación FR/EU.
Wallet interno • Pagos Stripe • Interfaz premium

**👤 Tu rol: Staff / Middleman**
→ Gestionas deals por tickets
→ Acumulas vouches → subes de rango
→ Tu límite MM aumenta con tu rango

**🎯 Sistema:** Deals → Vouches → Rangos → Límite MM ↑
**Comando:** \`/vouch\` (Shiba) • **Reset:** 1 de cada mes`,
        },
    },
    reglement: {
        fr: {
            title: "📖 Règlement Staff",
            desc: `**✅ OBLIGATOIRE**
• Atteindre l'objectif minimum chaque mois
• Répondre aux tickets rapidement
• Être honnête sur les produits
• Signaler ses absences
• Faire \`/vouch\` après chaque deal

**❌ INTERDIT**
• Spam / Mass DM
• Mentir sur les produits
• Deals hors ticket
• Voler des clients d'un autre staff
• Faux vouches
• Inactif +7j sans prévenir

**⚠️ SANCTIONS**
1er avertissement → Rappel
2ème → Suspension
3ème → Exclusion
Faute grave → Exclusion immédiate`,
        },
        en: {
            title: "📖 Staff Rules",
            desc: `**✅ MANDATORY**
• Reach minimum objective each month
• Respond to tickets quickly
• Be honest about products
• Report absences
• Use \`/vouch\` after every deal

**❌ FORBIDDEN**
• Spam / Mass DM
• Lying about products
• Deals outside tickets
• Stealing another staff's clients
• Fake vouches
• Inactive 7+ days without notice

**⚠️ SANCTIONS**
1st warning → Reminder
2nd → Suspension
3rd → Exclusion
Serious fault → Immediate exclusion`,
        },
        es: {
            title: "📖 Reglamento Staff",
            desc: `**✅ OBLIGATORIO**
• Alcanzar el objetivo mínimo cada mes
• Responder tickets rápidamente
• Ser honesto sobre los productos
• Reportar ausencias
• Usar \`/vouch\` después de cada deal

**❌ PROHIBIDO**
• Spam / Mass DM
• Mentir sobre productos
• Deals fuera de tickets
• Robar clientes de otro staff
• Vouches falsos
• Inactivo +7 días sin aviso

**⚠️ SANCIONES**
1ª advertencia → Recordatorio
2ª → Suspensión
3ª → Exclusión
Falta grave → Exclusión inmediata`,
        },
    },
    guide: {
        fr: {
            title: "🎓 Guide de vente",
            desc: `**Le process :**
1️⃣ Client ouvre un ticket → choisit son produit
2️⃣ Tu claim si tu as le stock
3️⃣ Tu vérifies le moyen de paiement
4️⃣ Tu procèdes à la vente
5️⃣ Client vouch le ticket via \`/vouch\`

**Bonnes pratiques :**
• Claim que si tu as le produit
• Réponds vite
• Sois clair sur le prix
• Confirme chaque étape
• Demande le vouch poliment à la fin`,
        },
        en: {
            title: "🎓 Selling Guide",
            desc: `**The process:**
1️⃣ Client opens a ticket → selects product
2️⃣ You claim if you have stock
3️⃣ You verify payment method
4️⃣ You proceed with the sale
5️⃣ Client vouches the ticket via \`/vouch\`

**Best practices:**
• Only claim if you have the product
• Reply fast
• Be clear on price
• Confirm each step
• Ask for the vouch politely at the end`,
        },
        es: {
            title: "🎓 Guía de ventas",
            desc: `**El proceso:**
1️⃣ Cliente abre un ticket → elige producto
2️⃣ Tú claim si tienes stock
3️⃣ Verificas método de pago
4️⃣ Procedes con la venta
5️⃣ Cliente voucha el ticket con \`/vouch\`

**Buenas prácticas:**
• Claim solo si tienes el producto
• Responde rápido
• Sé claro con el precio
• Confirma cada paso
• Pide el vouch amablemente al final`,
        },
    },
    objectifs: {
        fr: {
            title: "🎯 Paliers & Limites MM",
            desc: `**👑 Grades (vouches mensuels)**

⬜ Newbies — 0v *(20€)*
🟤 Trainee — 100v *(30€)*
🟠 Trail — 200v *(40€)*
🟣 Mod — 300v *(50€)*
🔵 Ops — 400v *(70€)*
🟢 Senior — 500v *(90€)*
⭐ Staff Of The Week — 600v
🥇 Lead — 700v *(100€)*
💎 Head — 900v *(150€)*
👑 Boss — 1000v *(200€)*
🏆 King — 1200v *(250€)*
🐐 Goat — 1500v *(300€)*

📅 Reset le 1er de chaque mois
⚠️ Limite = total de TOUS les tickets en cours`,
        },
        en: {
            title: "🎯 Tiers & MM Limits",
            desc: `**👑 Ranks (monthly vouches)**

⬜ Newbies — 0v *(€20)*
🟤 Trainee — 100v *(€30)*
🟠 Trail — 200v *(€40)*
🟣 Mod — 300v *(€50)*
🔵 Ops — 400v *(€70)*
🟢 Senior — 500v *(€90)*
⭐ Staff Of The Week — 600v
🥇 Lead — 700v *(€100)*
💎 Head — 900v *(€150)*
👑 Boss — 1000v *(€200)*
🏆 King — 1200v *(€250)*
🐐 Goat — 1500v *(€300)*

📅 Reset on the 1st of each month
⚠️ Limit = total of ALL open tickets`,
        },
        es: {
            title: "🎯 Niveles & Límites MM",
            desc: `**👑 Rangos (vouches mensuales)**

⬜ Newbies — 0v *(20€)*
🟤 Trainee — 100v *(30€)*
🟠 Trail — 200v *(40€)*
🟣 Mod — 300v *(50€)*
🔵 Ops — 400v *(70€)*
🟢 Senior — 500v *(90€)*
⭐ Staff Of The Week — 600v
🥇 Lead — 700v *(100€)*
💎 Head — 900v *(150€)*
👑 Boss — 1000v *(200€)*
🏆 King — 1200v *(250€)*
🐐 Goat — 1500v *(300€)*

📅 Reset el 1 de cada mes
⚠️ Límite = total de TODOS los tickets abiertos`,
        },
    },
    vouch: {
        fr: {
            title: "📸 Comment faire voucher un client",
            desc: `**Le process :**
1. Le deal est terminé, le client a bien reçu
2. Tu fais \`/vouch\` dans le ticket
3. Le bot génère un message avec un bouton **📋 Copier**
4. Le client clique Copier et colle dans le salon vouch

**Exemple :**
Le bot affiche :
\`+vouch 1483231929196347615 Server Boost | x14 | 1m | 12€ | PayPal\`

Le client copie-colle → ton vouch est compté ✅

**⚠️ Interdit :**
• Faux vouch (inventé)
• Vouch échangé (je te vouch tu me vouch)
• Forcer le client`,
        },
        en: {
            title: "📸 How to get a client to vouch",
            desc: `**The process:**
1. Deal is done, client received the product
2. You type \`/vouch\` in the ticket
3. The bot generates a message with a **📋 Copy** button
4. The client clicks Copy and pastes it in the vouch channel

**Example:**
The bot displays:
\`+vouch 1483231929196347615 Server Boost | x14 | 1m | 12€ | PayPal\`

Client copy-pastes → your vouch is counted ✅

**⚠️ Forbidden:**
• Fake vouch
• Traded vouch (I vouch you, you vouch me)
• Forcing the client`,
        },
        es: {
            title: "📸 Cómo hacer que un cliente vouche",
            desc: `**El proceso:**
1. El deal terminó, el cliente recibió el producto
2. Escribes \`/vouch\` en el ticket
3. El bot genera un mensaje con un botón **📋 Copiar**
4. El cliente hace clic en Copiar y pega en el canal vouch

**Ejemplo:**
El bot muestra:
\`+vouch 1483231929196347615 Server Boost | x14 | 1m | 12€ | PayPal\`

El cliente copia y pega → tu vouch se cuenta ✅

**⚠️ Prohibido:**
• Vouch falso
• Vouch intercambiado
• Forzar al cliente`,
        },
    },
    faq: {
        fr: {
            title: "❓ FAQ Staff",
            desc: `**Comment ajouter un vouch ?**
→ \`/vouch\` dans le ticket après le deal

**Comment monter en grade ?**
→ Accumule des vouches chaque mois

**C'est quoi la limite MM ?**
→ Montant total de tous tes tickets ouverts

**Reset quand ?**
→ 1er de chaque mois à 00h00

**Deal hors serveur ?**
→ Interdit. Toujours par ticket.

**Absence ?**
→ Poste dans #absences avec durée + raison`,
        },
        en: {
            title: "❓ Staff FAQ",
            desc: `**How to add a vouch?**
→ \`/vouch\` in the ticket after the deal

**How to rank up?**
→ Accumulate vouches each month

**What is the MM limit?**
→ Total amount of all your open tickets

**When does it reset?**
→ 1st of each month at 00:00

**Deals outside server?**
→ Forbidden. Always via ticket.

**Absence?**
→ Post in #absences with duration + reason`,
        },
        es: {
            title: "❓ FAQ Staff",
            desc: `**¿Cómo añadir un vouch?**
→ \`/vouch\` en el ticket después del deal

**¿Cómo subir de rango?**
→ Acumula vouches cada mes

**¿Qué es el límite MM?**
→ Monto total de todos tus tickets abiertos

**¿Cuándo se resetea?**
→ 1 de cada mes a las 00:00

**¿Deals fuera del servidor?**
→ Prohibido. Siempre por ticket.

**¿Ausencia?**
→ Publica en #absences con duración + razón`,
        },
    },
};
async function handleTranslateButton(interaction) {
    const section = interaction.customId.replace("translate_", "");
    const lang = await (0, i18n_1.getUserLang)(interaction.user.id);
    const content = T[section]?.[lang];
    if (!content) {
        await interaction.reply({ content: "❌ Traduction non disponible.", ephemeral: true });
        return;
    }
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${content.title}`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(content.desc))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# 🌐 ${lang.toUpperCase()} • YouRazz Staff`));
    await interaction.reply({ ...(0, cv2_1.buildReply)([container]), ephemeral: true });
}
//# sourceMappingURL=translate-buttons.js.map
# 🌌 Confidence Book V2.0

> **Votre refuge émotionnel anonyme**  
> Personne ne doit rester seul face à son histoire.

[![NEXUS AXION 4.1](https://img.shields.io/badge/Architecture-NEXUS%20AXION%204.1-blue)](https://github.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![AI Fallback](https://img.shields.io/badge/AI%20Fallback-5%20Models-purple)](https://groq.com)

---

## 🎯 Concept

Confidence Book est une plateforme d'expression émotionnelle anonyme où chacun peut :
- 💬 Partager ses expériences sans jugement
- 🤝 Recevoir du soutien bienveillant
- 🔒 Rester 100% anonyme (ID unique, pas de compte classique)
- 🛡️ Être protégé par une modération IA (5 modèles en fallback)

## 📁 Structure du Projet

```
confidence-book/
├── welcome.html           # Page d'accueil + règles
├── auth.html              # Génération/Connexion ID anonyme
├── feed.html              # Fil d'actualité principal
├── confidence.html        # Page dédiée à une confidence
├── profile.html           # Profil utilisateur
├── settings.html          # Paramètres
├── support.html           # Page soutien/donation
├── api.js                 # API Gateway (NEXUS AXION 4.1)
├── server.js              # Backend + 5 IA en fallback
├── scripts/
│   └── reset-db.js        # Script reset DB (déploiement uniquement)
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

**Total : 7 pages HTML + 2 fichiers JS. C'est tout.**

---

## 🚀 Déploiement Rapide (10 minutes)

### Prérequis

1. **Compte Turso** (gratuit) : [turso.tech](https://turso.tech)
2. **Compte Groq** (gratuit) : [console.groq.com](https://console.groq.com)
3. **Compte Render** (gratuit) : [render.com](https://render.com)

### Étape 1 : Créer la Database

```bash
# Installer Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Créer la database
turso db create confidence-book

# Récupérer URL et Token
turso db show confidence-book
```

Copier :
- URL: `libsql://confidence-book-xxxx.turso.io`
- Token: `eyJhb...` (créer via "Create Token")

### Étape 2 : Obtenir Clé Groq

1. Aller sur [console.groq.com](https://console.groq.com)
2. Créer compte gratuit
3. API Keys → Create Key
4. Copier : `gsk_...`

### Étape 3 : Déployer sur Render

```bash
# 1. Push sur GitHub
git init
git add .
git commit -m "Confidence Book V2.0"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/confidence-book.git
git push -u origin main

# 2. Sur Render:
# - New → Web Service
# - Connect GitHub repo
# - Build Command: npm install
# - Start Command: node api.js

# 3. Variables d'environnement (Settings → Environment):
DATABASE_URL=libsql://...
DATABASE_AUTH_TOKEN=eyJhb...
GROQ_API_KEY=gsk_...

# 4. Deploy → Attendre 2 min → En ligne ! 🎉
```

---

## 🧪 Test Local

```bash
# Installer dépendances
npm install

# Créer .env
cp .env.example .env
# Éditer .env avec vraies clés

# Lancer serveur
npm start

# Ouvrir http://localhost:3000
```

---

## 🤖 Modération IA (5 Modèles en Fallback)

**Stratégie** : Essaie chaque modèle dans l'ordre jusqu'à ce qu'un fonctionne.

```javascript
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',      // 1. Meilleur (précis)
  'llama-3.1-8b-instant',         // 2. Plus rapide
  'gemma2-9b-it',                 // 3. Alternative
  'mixtral-8x7b-32768',           // 4. Backup
  'llama3-groq-70b-8192-tool-use-preview' // 5. Dernier recours
];
```

Si les 5 échouent → **Fail-open** (approuver par défaut pour ne pas bloquer les utilisateurs).

### Règles de Modération

✅ **Toujours Accepter** :
- Émotions (tristesse, colère, peur, solitude)
- Pensées suicidaires (appel à l'aide) → + Message ressources
- Récits de trauma (abus, deuil, rupture)
- Remise en question (identité, spiritualité)

❌ **Rejeter** :
- Violence explicite envers autrui
- Haine/discrimination
- Spam/publicité
- Contenu sexuel explicite (sauf mention trauma)
- Hors-sujet total
- Infos personnelles identifiables

---

## 🔐 Système d'ID Anonyme

**Flow** :
1. Utilisateur arrive → Génère ID (ex: `CB_8h3j9k2l`)
2. Copie l'ID et le conserve
3. Se "connecte" avec cet ID sur autre appareil
4. Aucune donnée personnelle requise

**Sécurité** :
- ID stocké dans `localStorage` du navigateur
- Pour changer d'appareil : entrer manuellement l'ID
- Si perdu : perte d'accès définitive (anonymat oblige)

---

## 💙 Système de Réactions (6 Types)

| Réaction | Emoji | Label |
|----------|-------|-------|
| `soutiens` | 🤝 | Je te soutiens |
| `espoir` | 🔥 | Garde espoir |
| `compatis` | 🤜🤛 | Je compatis |
| `pas_seul` | 🫂 | T'es pas seul |
| `courage` | 🙌 | Courage |
| `triste` | 💔 | C'est triste |

**Comportement** :
- Clic = ajouter réaction
- Re-clic = annuler (toggle)
- Clic autre réaction = changer automatiquement

---

## 💰 Monétisation (Éthique & Transparente)

### Option B : Toast Donation (15min, 5s)

```javascript
// Toast apparaît toutes les 15 minutes
// Dure 5 secondes
// Coin bas-gauche, discret
```

### Option C : Page Dédiée `/support`

- Moyens de don : WhatsApp (+229 69 05 62 83)
- Transparence totale sur l'utilisation des fonds
- Autres moyens de soutien (partage, contribution)

---

## 🔧 Fonctionnalités Avancées

### Custom Scrollbar

```css
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: var(--scroll-track);
}
::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb);
  border-radius: 4px;
}
```

### Dark Mode

```javascript
// Toggle dans settings.html
// Sauvegardé dans localStorage
// Appliquer via classes CSS (theme-light / theme-dark)
```

### Suppression Auto (3 mois)

```javascript
const expiresAt = now + (90 * 24 * 60 * 60 * 1000);
// Confidences supprimées automatiquement après 90 jours
```

---

## 🛠️ Scripts de Maintenance

### Reset Database (Déploiement uniquement)

```bash
npm run reset-db

# ⚠️ WARNING: Supprime TOUTES les données
# Demande double confirmation
# Recrée les tables à vide
```

**Usage** : Uniquement lors du déploiement initial ou en cas de corruption DB.

---

## 📊 Footer (Toutes les Pages)

```html
Contact:
- 📱 WhatsApp: +229 69 05 62 83
- 📧 Email: nexusstudio100@gmail.com

Aide d'urgence:
- 🇫🇷 France: 3114
- 🇨🇦 Canada: 1-833-456-4566
- 🇧🇪 Belgique: 0800 32 123

💙 Soutenir le projet: /support
```

---

## 🐛 Dépannage

### Erreur 502 Bad Gateway

**Cause** : Start Command incorrect

**Solution** :
- Render Settings → Start Command : `node api.js`
- Vérifier `package.json` → `"main": "api.js"`

### Database Connection Error

**Cause** : Variables manquantes

**Solution** :
- Vérifier `DATABASE_URL` et `DATABASE_AUTH_TOKEN` dans Render
- Tester : `turso db shell confidence-book`

### Modération IA échoue

**Cause** : Clé Groq invalide ou modèles décommissionnés

**Solution** :
1. Vérifier `GROQ_API_KEY` dans Render
2. Si modèles ne fonctionnent pas, la modération passe en mode "fail-open" (approuve par défaut)

### Boutons ne répondent pas

**Cause** : Erreur JavaScript

**Solution** :
1. Ouvrir DevTools (F12)
2. Console → Vérifier erreurs rouges
3. Network → Vérifier appels API

---

## 📈 Monitoring

### Health Check

```bash
curl https://ton-app.onrender.com/api/health
```

Réponse :
```json
{
  "timestamp": "2025-11-16T...",
  "status": "ok",
  "services": {
    "database": "connected",
    "ai": "configured",
    "models": "5 models in fallback"
  }
}
```

### Logs (Render)

```
🔧 [API GATEWAY] Initializing backend...
✅ [BACKEND] Database connected
✅ [BACKEND] Tables created/verified
[BACKEND] Calling Groq API (model: llama-3.3-70b-versatile)...
[BACKEND] AI Response (llama-3.3-70b-versatile): APPROVED
```

---

## 🤝 Contribution

Les contributions sont bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit (`git commit -m 'Ajout fonctionnalité X'`)
4. Push (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

---

## 📄 Licence

MIT License - Libre d'utilisation pour projets personnels et commerciaux.

---

## 🙏 Remerciements

- **Architecture** : NEXUS AXION 4.1 by Anzize Daouda
- **IA** : Groq (5 modèles LLaMA, Mixtral, Gemma)
- **Database** : Turso (LibSQL)
- **Design** : Tailwind CSS + Inter Font

---

## 📞 Support

- **WhatsApp** : +229 69 05 62 83
- **Email** : nexusstudio100@gmail.com
- **Soutenir** : [https://ton-app.onrender.com/support](https://ton-app.onrender.com/support)

---

**🌌 Personne ne doit rester seul face à son histoire.**

> "L'anonymat n'est pas un masque pour fuir, c'est un outil de libération."  
> - Anzize Daouda, Confidence Book V2.0
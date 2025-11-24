# 🌌 Confidence Book v2.0

> **Votre refuge émotionnel anonyme**  
> Personne ne doit rester seul face à son histoire.

[![NEXUS AXION 4.1](https://img.shields.io/badge/Architecture-NEXUS%20AXION%204.1-blue)]()
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

---

## 🎯 Concept

Confidence Book est une plateforme d'expression émotionnelle anonyme où chacun peut :
- 💬 Partager ses expériences sans jugement
- 🤝 Recevoir du soutien bienveillant
- 🔒 Rester 100% anonyme
- 🛡️ Être protégé par modération IA

## 📁 Structure du Projet

```
confidence-book/
├── index.html → welcome.html (redirect)
├── welcome.html       # Page d'accueil + règles
├── auth.html          # Génération/vérification ID
├── feed.html          # Fil d'actualité
├── confidence.html    # Page dédiée confidence
├── profile.html       # Profil utilisateur
├── settings.html      # Paramètres
├── support.html       # Page de soutien/donation
├── api.js             # API Gateway (point d'entrée)
├── server.js          # Backend (logique + 5 IA)
├── package.json       # Dépendances
├── .env.example       # Template variables
├── .gitignore         # Fichiers ignorés
└── scripts/
    └── reset-db.js    # Reset database (dev only)
```

**Total : 10 fichiers HTML + 4 fichiers config**

---

## 🚀 Déploiement Rapide (5 minutes)

### Prérequis

1. **Compte Render** (gratuit) : [render.com](https://render.com)
2. **Compte Turso** (gratuit) : [turso.tech](https://turso.tech) 
3. **Compte Groq** (gratuit) : [console.groq.com](https://console.groq.com)

### Étape 1 : Créer la Base de Données

```bash
# Installer Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Créer la database
turso db create confidence-book

# Récupérer URL et token
turso db show confidence-book
```

### Étape 2 : Obtenir la Clé IA Groq

1. Va sur [console.groq.com](https://console.groq.com)
2. Créer un compte gratuit
3. API Keys → Create → Copier la clé `gsk_...`

### Étape 3 : Déployer sur Render

1. **Push sur GitHub** :
   ```bash
   git init
   git add .
   git commit -m "Confidence Book v2.0"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/confidence-book.git
   git push -u origin main
   ```

2. **Sur Render** :
   - New → Web Service
   - Connect GitHub repo
   - Name: `confidence-book`
   - Build Command: `npm install`
   - Start Command: `node api.js`

3. **Variables d'environnement** (Settings → Environment) :
   ```
   DATABASE_URL=libsql://confidence-book-xxxx.turso.io
   DATABASE_AUTH_TOKEN=eyJhb...
   GROQ_API_KEY=gsk_...
   ```

4. **Deploy** → Attendre 2 minutes → ✅ En ligne !

---

## 🧪 Test Local

```bash
# Installer dépendances
npm install

# Créer .env (copier .env.example)
cp .env.example .env

# Éditer .env avec tes vraies clés

# Lancer le serveur
npm start

# Ouvrir http://localhost:3000
```

---

## 🛡️ Système de Modération IA

### 5 Modèles en Fallback

```javascript
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',   // Le meilleur
  'llama-3.1-8b-instant',      // Le plus rapide
  'gemma2-9b-it',              // Alternative
  'mixtral-8x7b-32768',        // Backup
  'llama3-70b-8192'            // Dernier recours
];
```

Si le 1er échoue → essaie le 2e → etc.  
Si les 5 échouent → **fail-open** (approuve par défaut).

### Règles de Modération

**✅ TOUJOURS ACCEPTER** :
- Tristesse, colère, peur, solitude
- Pensées suicidaires (c'est un appel à l'aide)
- Récits de trauma, abus, deuil
- Remise en question identitaire

**⚠️ ACCEPTER AVEC WARNING** :
- Mentions de suicide → Ajout ressources d'aide

**❌ REJETER** :
- Violence explicite envers autrui
- Haine/discrimination
- Spam/publicité
- Contenu sexuel explicite
- Informations personnelles

---

## 🔐 Système d'ID Anonyme

### Format

```
CB_[8 caractères aléatoires]
Exemple: CB_8h3j9k2l
```

### Flow Utilisateur

1. Arrive sur welcome.html
2. Accepte les règles
3. Crée son espace → Génère ID unique
4. Copie l'ID pour le sauvegarder
5. Se "connecte" avec cet ID sur autre appareil

### Sécurité

- Aucune donnée personnelle requise
- ID stocké uniquement en localStorage côté client
- Si perdu, accès impossible (anonymat oblige)

---

## 💰 Monétisation Éthique

### Toast Donation (Toutes les 15min, dure 5s)

```javascript
// Apparaît en bas à gauche
// Non intrusif, facilement fermable
// Lien vers page support.html
```

### Page Soutenir (`support.html`)

- Explique la mission
- Lien WhatsApp : +229 69 05 62 83
- Email support : nexusstudio100@gmail.com
- Options de contribution

---

## 🎨 Design & UX

### Custom Scrollbar

```css
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
}
```

### Lucide Icons

Tous les icônes utilisent [Lucide](https://lucide.dev) (plus pro que les emojis).

### Dark Mode

Toggle dans settings.html (persiste via localStorage).

### 6 Réactions

- Je te soutiens 🤝
- Garde espoir 🔥
- Je compatis 💜
- T'es pas seul 🫂
- Courage 🙌
- Triste 💔

*Appui long pour ouvrir modal réactions (style Facebook)*

---

## 🛠️ Commandes Utiles

### Développement

```bash
npm start           # Lancer le serveur
npm run dev         # Mode watch (auto-reload)
npm run reset-db    # Reset database (DANGER!)
```

### Déploiement

```bash
git add .
git commit -m "Update"
git push origin main
# → Render redéploie automatiquement
```

---

## 🐛 Dépannage

### Erreur 502 Bad Gateway

**Solution** : Vérifier Start Command = `node api.html` (pas `app.html`!)

### app.html redirect loop

**Solution** : `api.js` redirige explicitement app.html → welcome.html

### Database Connection Error

**Solution** : Vérifier `DATABASE_URL` et `DATABASE_AUTH_TOKEN` dans Render

### Modération ne fonctionne pas

**Solution** : 
1. Vérifier `GROQ_API_KEY` dans Render
2. Tester la clé :
   ```bash
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer $GROQ_API_KEY"
   ```

---

## 📊 Monitoring

### Health Check

```bash
curl https://ton-app.onrender.com/api/health
```

### Logs Render

Chercher :
```
✅ [BACKEND] AI Response (llama-3.3-70b-versatile): APPROVED
```

---

## 🤝 Contribution

Les contributions sont bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit (`git commit -m 'Ajout X'`)
4. Push (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

---

## 📄 Licence

MIT License - Libre d'utilisation.

---

## 🙏 Remerciements

- **Architecture** : NEXUS AXION 4.1
- **IA** : Groq (LLaMA 3.3)
- **Database** : Turso (LibSQL)
- **Icons** : Lucide
- **Design** : Tailwind CSS

---

## 📞 Support

- **WhatsApp** : +229 69 05 62 83
- **Email** : nexusstudio100@gmail.com
- **Urgences** : 🇫🇷 3114 | 🇧🇪 0800 32 123 | 🇨🇦 1-833-456-4566

---

**🌌 Construis l'impossible. Simplement.**

> "Personne ne doit rester seul face à son histoire."  
> — Confidence Book
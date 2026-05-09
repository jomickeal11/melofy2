# Melofy 🎵

> Crée ta chanson personnalisée avec l'IA

## Stack technique

| Rôle              | Outil              |
|-------------------|--------------------|
| Frontend + API    | Next.js 14         |
| Styles            | Tailwind CSS       |
| Auth + Base de données + Stockage | Supabase |
| Génération musicale | ai33.pro          |
| Déploiement       | Vercel             |

---

## Installation

### 1. Cloner et installer les dépendances

```bash
git clone <ton-repo>
cd melofy
npm install
```

### 2. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → New project
2. Copie l'URL et la clé `anon` depuis **Settings > API**
3. Va dans **SQL Editor** et exécute le fichier `supabase-schema.sql`

### 3. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplis `.env.local` avec tes vraies clés :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
AI33_API_KEY=ta-cle
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Lancer en développement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

---

## Structure du projet

```
melofy/
├── pages/
│   ├── index.js          ← Page d'accueil
│   ├── create.js         ← Formulaire de création (3 étapes)
│   ├── songs.js          ← Mes chansons
│   ├── profile.js        ← Profil utilisateur
│   └── api/
│       └── generate.js   ← API route génération IA
├── components/
│   ├── layout/
│   │   ├── Navbar.js     ← Navigation desktop
│   │   └── BottomNav.js  ← Navigation mobile (bas)
│   └── ui/
│       └── SongCard.js   ← Carte chanson avec lecteur
├── lib/
│   └── supabase.js       ← Client Supabase
├── styles/
│   └── globals.css       ← Styles globaux + Tailwind
└── supabase-schema.sql   ← Schéma base de données
```

---

## Déploiement sur Vercel

```bash
npm install -g vercel
vercel
```

Ajoute tes variables d'environnement dans le dashboard Vercel.

---

## Prochaines étapes

- [ ] Page de partage publique `/s/[id]`
- [ ] Intégration paiement (Stripe + CinetPay)
- [ ] Page profil complète
- [ ] Notifications email
- [ ] Mode hors-ligne PWA

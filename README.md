# Vorae

*Voyez avant de choisir · See it before you order*

SaaS de menu en réalité augmentée pour restaurants. Marché de lancement :
Montréal → Canada.

Le cahier des charges technique complet (produit, architecture, modèle de
données, sprints, tarification) fait foi pour toute décision de conception :
voir le document `Vorae - Cahier des charges technique v2.0`.

## Stack technique

| Couche | Choix |
|---|---|
| Frontend / PWA | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Affichage AR | `<model-viewer>` (AR native iOS/Android, pas de WebXR) |
| i18n | next-intl - `/fr` (défaut, Loi 96) et `/en` |
| Base de données | Neon PostgreSQL (serverless) via Prisma |
| Stockage images | Cloudinary |
| Stockage modèles 3D | AWS S3 + CloudFront |
| Authentification | Clerk (rôles Owner / Staff / SuperAdmin) |
| Paiement | Stripe Billing (paliers + facturation à l'usage) |
| Emails | Resend |
| Hébergement | Vercel |
| CI/CD | GitHub Actions |

## Démarrer en local

```bash
npm install
cp .env.example .env
# renseigner DATABASE_URL, CLERK_*, etc. dans .env
npx prisma generate
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
npm run dev         # serveur de développement
npm run build        # build de production
npm run lint          # ESLint
npm run typecheck   # TypeScript --noEmit
npm run test          # Vitest
```

## Contribuer

Workflow Git obligatoire par Pull Request - voir [`CONTRIBUTING.md`](./CONTRIBUTING.md).
Aucun push direct sur `main`.

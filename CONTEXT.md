# Contexte projet — Vorae (AR-menu)

Ce document résume l'état réel du projet pour toute personne (humaine ou IA)
qui reprend le travail sans avoir suivi les sessions précédentes. Il complète
le cahier des charges (`Vorae — Cahier des charges technique v2.0`), qui reste
la source de vérité produit — ce fichier documente l'**implémentation
réelle**, y compris les écarts par rapport au cahier et les raisons.

**Règle** : mettre à jour ce fichier à la fin de chaque sprint (nouvelle
section "Sprint N", écarts constatés, comptes externes ajoutés, bugs connus).
Ne jamais le laisser devenir obsolète — un contexte faux est pire qu'aucun
contexte.

---

## 1. État des sprints

| Sprint | Statut | Contenu |
|---|---|---|
| Sprint 0 | ✅ Mergé | Next.js 14 + TS + Tailwind + shadcn/ui, Prisma, Clerk, CI, PR workflow |
| Sprint 1 | ✅ Mergé | Menu 2D public, fiche plat + AR (`<model-viewer>`) + fallback 2D, i18n FR/EN |
| Sprint 2 | 🔄 En cours (branche `feature/s2-dashboard-crud-plats`) | Dashboard restaurateur : CRUD plats, upload photo/3D, QR codes |

---

## 2. Comptes externes (déjà créés, gérés par Mouhamed / lomedlow)

| Service | Usage | Où sont les identifiants |
|---|---|---|
| **GitHub** | `terangahub/AR-menu` — repo **public** (protection de branche gratuite impossible sur un repo privé d'org sur le plan Free) | — |
| **Vercel** | Hébergement, scope `terangahub's projects` | Vercel → Settings → Environment Variables |
| **Neon** | Postgres serverless, projet `vorae` | `DATABASE_URL` dans Vercel — **utiliser la connexion POOLED** (hostname avec `-pooler`), pas la directe (voir section 5) |
| **Clerk** | Authentification | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` dans Vercel |
| **Cloudinary** | Stockage images ET modèles 3D (voir écart section 4) | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` dans Vercel |

Pas encore créés : AWS (S3/CloudFront), Stripe, Resend.

---

## 3. Architecture réelle

Stack conforme au cahier (section 7), avec les versions **épinglées**
ci-dessous — voir section 4 pour pourquoi.

```
src/
  app/
    [locale]/                    ← toutes les routes passent par next-intl
      page.tsx                   ← accueil (placeholder Sprint 0, vraie landing = Sprint 4)
      [restaurantSlug]/          ← menu public 2D (F02)
        dishes/[dishId]/         ← fiche plat + AR (F03-F05)
      dashboard/                 ← protégé par middleware Clerk, force-dynamic
        dishes/                  ← CRUD plats (10.2)
        qrcodes/                 ← génération QR (10.4)
    api/
      menu/[restaurantSlug]/     ← GET menu public
      dishes/                    ← GET liste (dashboard) / POST création
      dishes/[id]/               ← GET public / PUT / DELETE
      dishes/[id]/photo/         ← upload image → Cloudinary
      dishes/[id]/model3d/       ← upload .glb (+.usdz optionnel) → Cloudinary
      qrcodes/                   ← GET liste / POST création
      qrcodes/[id]/              ← DELETE
      qrcodes/[id]/png/          ← régénère le PNG à la volée
      scan/                      ← POST tracking scan (rate-limited)
      allergens/                 ← GET table de référence
  components/
    menu/                        ← composants du menu public
    dashboard/                   ← composants du dashboard
    ui/                          ← shadcn/ui (button, etc. — installés à la main, voir section 4)
  lib/
    prisma.ts                    ← client Prisma singleton
    auth.ts                      ← résout Clerk → Restaurant/User (voir section 6)
    scan.ts                      ← logique + rate limiting des scans
    qrcode.ts                    ← génération PNG + URL absolue
    cloudinary.ts                ← config + upload
    dish-schema.ts                ← validation zod du formulaire plat
    dish-categories.ts           ← catégories existantes (pour le dropdown)
  i18n/                          ← next-intl (routing, navigation, request config)
prisma/
  schema.prisma
  seed.ts                        ← restaurant démo "vorae-demo" + 3 plats + 1 QR code
```

---

## 4. Écarts assumés par rapport au cahier des charges

Chacun de ces écarts est documenté en commentaire dans le code source
concerné — cette liste est un résumé, pas la seule source.

- **Prisma 6.19.3, pas la dernière version (7.x)** — Prisma 7 supprime
  `datasource { url }` au profit de `prisma.config.ts` + adapters. Le
  schéma du cahier suppose la syntaxe classique.
- **@clerk/nextjs 6.x, pas 7.x** — Clerk 7 exige Next.js 15+, or le cahier
  impose Next.js 14.
- **Cloudinary au lieu d'AWS S3+CloudFront pour les modèles 3D**
  (section 7) — aucun compte AWS configuré. Cloudinary stocke aussi les
  `.glb`/`.usdz` en `resource_type: "raw"`. À migrer vers S3 si le volume
  ou le coût le justifie.
- **Pas de conversion automatique .glb → .usdz** (section 9.2 le
  demande) — aucun outil fiable côté serveur Node (il faut `usdz_converter`
  d'Apple, macOS uniquement, ou un service tiers payant). Upload manuel du
  `.usdz` en attendant un vrai pipeline (section 16).
- **shadcn/ui installé à la main** — `ui.shadcn.com` est bloqué par le
  proxy réseau de l'environnement de dev utilisé ; les fichiers standards
  (`components.json`, `lib/utils.ts`, composants) ont été recréés
  manuellement plutôt que via le CLI.
- **Schéma de données complété** — la section 8 du cahier omet plusieurs
  champs référencés ailleurs dans le texte : `Dish.category`/`categoryEn`
  (F02, 10.2), `Dish.ingredients`/`ingredientsEn` (F05),
  `Dish.prepTimeMinutes` (F05), `Dish.descriptionEn` (F06 bilingue complet),
  la table `Allergen`/`DishAllergen` (référencée mais jamais définie),
  `User.clerkUserId` (lien identité Clerk ↔ profil restaurant, nécessaire
  pour le dashboard section 18).
- **Repo GitHub public, pas privé** — la protection de branche (section
  4.1, PR obligatoire + CI verte requise) n'est **appliquée** par GitHub
  que sur les repos publics pour une organisation sur le plan Free. Un
  repo privé d'org sur ce plan peut créer des règles mais elles restent
  inertes. Alternative si la confidentialité redevient prioritaire :
  upgrade payant vers GitHub Team.
- **Onboarding dashboard simplifié** — pas de flux d'invitation d'équipe
  (section 10.7, hors scope Sprint 2). Le premier compte Clerk qui visite
  `/dashboard` est auto-provisionné "owner" du restaurant `vorae-demo`
  (voir `src/lib/auth.ts`). À remplacer avant d'ouvrir à plusieurs
  restaurants/plusieurs comptes.
- **Rate limiting en mémoire** (`src/lib/scan.ts`) — suffisant pour une
  seule instance serveur. À remplacer par un store partagé (Upstash Redis)
  avant un déploiement multi-instance.

---

## 5. Pièges connus / à ne pas refaire

- **Neon : toujours utiliser la connexion POOLED** (`-pooler` dans le
  hostname) pour `DATABASE_URL` sur Vercel. La connexion directe a une
  limite de connexions simultanées très basse sur le plan gratuit —
  utilisée depuis du serverless, elle produit des erreurs 500
  intermittentes ("Application error: a server-side exception has
  occurred") difficiles à diagnostiquer sans ça en tête.
- **Aucune connexion TCP brute (Postgres, etc.) depuis l'environnement de
  dev sandboxé** utilisé pour ce projet — seul le HTTPS passe par le proxy
  réseau. Toute migration/seed Prisma contre la vraie base doit être faite
  soit par SQL généré offline (`prisma migrate diff --from-empty
  --to-schema-datamodel prisma/schema.prisma --script`, qui ne nécessite
  aucune connexion) collé dans le SQL Editor de Neon, soit exécutée par
  quelqu'un ayant un accès réseau direct.
- **`export const dynamic = "force-dynamic"`** est nécessaire sur le
  layout `/dashboard` (et hérité par ses routes filles) — sans ça, Next.js
  tente de pré-générer ces pages personnalisées par utilisateur une seule
  fois au build. Le résumé du build peut afficher "●" (statique) même
  quand `force-dynamic` fonctionne correctement : vérifier l'absence
  réelle de fichiers `.html`/`.rsc` dans `.next/server/app/...` plutôt que
  de se fier à ce symbole.
- **Toujours vérifier `res.ok`** sur les appels fetch côté client et
  afficher une erreur visible — plusieurs bugs signalés ("le bouton ne
  fait rien", "il faut rafraîchir pour voir le changement") venaient
  d'échecs silencieux côté client masquant une vraie erreur serveur.
- **Toute donnée bilingue doit avoir ses deux champs dès sa création**
  (`x` et `xEn`) — plusieurs oublis déjà corrigés (description, catégorie,
  ingrédients). Vérifier systématiquement qu'un nouveau champ visible par
  l'utilisateur final a son pendant anglais avant de le considérer terminé.
- **`localeDetection: false`** est requis dans `src/i18n/routing.ts` — le
  comportement par défaut de next-intl sert la langue du navigateur, ce
  qui viole la Loi 96 (le français doit être prédominant à l'ouverture,
  jamais l'anglais par défaut, même sur un navigateur anglophone).

---

## 6. Modèle d'authentification (dashboard)

`src/lib/auth.ts` → `getCurrentRestaurantUser()` :
1. Récupère l'utilisateur Clerk courant (`currentUser()`).
2. Cherche un `User` Prisma par `clerkUserId` ou par email.
3. Si trouvé mais `clerkUserId` pas encore lié (première connexion après
   création manuelle) → lie l'identité.
4. Si aucun `User` n'existe → auto-provisionne comme `owner` du **premier**
   restaurant créé en base (`orderBy: createdAt asc`). C'est une
   simplification Sprint 2 : fonctionne tant qu'il n'y a qu'un seul
   restaurant. À remplacer par un vrai flux d'invitation (section 10.7)
   avant d'ouvrir à plusieurs restaurants/organisations.

---

## 7. Lancer le projet en local

```bash
npm install
cp .env.example .env   # renseigner DATABASE_URL (pooled), CLERK_*, CLOUDINARY_*
npx prisma generate
npm run dev
```

Scripts utiles : `npm run lint`, `npm run typecheck`, `npm run test -- --run`,
`npm run build`. Le seed (`prisma/seed.ts`) nécessite une vraie connexion DB
et n'a pas pu être exécuté depuis l'environnement de développement utilisé
pour ce projet (voir section 5) — le restaurant démo et ses données ont été
créés via un script SQL équivalent collé directement dans Neon.

---

## 8. Prochaines étapes (Sprint 3, section 21)

Analytics par plat (section 10.3), système de design dark/light complet
avec la palette de la section 13 (actuellement thème shadcn/ui neutre par
défaut, pas encore la palette de marque Vorae).

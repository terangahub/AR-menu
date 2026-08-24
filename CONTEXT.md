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
| Sprint 2 | ✅ Mergé | Dashboard restaurateur : CRUD plats, upload photo/3D, QR codes |
| Sprint 3 | ✅ Mergé | Analytics par plat, système de design (palette reflect.app + Space Grotesk/Inter + toggle dark/light), landing page marketing (section 12, avancée depuis le Sprint 4) |
| Sprint 4 | 🔄 En cours (branche `feature/s4-billing-landing-polish`) | Stripe Billing (3 paliers, section 15), section tarifs + FAQ sur la landing — reste à faire : visuels réels (voir section 4), Stripe pas encore testé en conditions réelles (clés manquantes) |

---

## 2. Comptes externes (déjà créés, gérés par Mouhamed / lomedlow)

| Service | Usage | Où sont les identifiants |
|---|---|---|
| **GitHub** | `terangahub/AR-menu` — repo **public** (protection de branche gratuite impossible sur un repo privé d'org sur le plan Free) | — |
| **Vercel** | Hébergement, scope `terangahub's projects` | Vercel → Settings → Environment Variables |
| **Neon** | Postgres serverless, projet `vorae` | `DATABASE_URL` dans Vercel — **utiliser la connexion POOLED** (hostname avec `-pooler`), pas la directe (voir section 5) |
| **Clerk** | Authentification | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` dans Vercel |
| **Cloudinary** | Stockage images ET modèles 3D (voir écart section 4) | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` dans Vercel |
| **Stripe** | Facturation (section 15) — **compte pas encore créé par le client**, code écrit et buildé mais jamais exercé contre l'API réelle | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_{ESSENTIEL,CROISSANCE,PRESTIGE}_{MONTHLY,ANNUAL}` — 8 variables au total, voir section 4 pour la checklist de création |

Pas encore créés : AWS (S3/CloudFront), Stripe (produits à créer, voir section 4), Resend.

---

## 3. Architecture réelle

Stack conforme au cahier (section 7), avec les versions **épinglées**
ci-dessous — voir section 4 pour pourquoi.

```
src/
  app/
    [locale]/                    ← toutes les routes passent par next-intl
      page.tsx                   ← landing marketing (section 12, direction reflect.app — voir section 4)
      [restaurantSlug]/          ← menu public 2D (F02)
        dishes/[dishId]/         ← fiche plat + AR (F03-F05)
      dashboard/                 ← protégé par middleware Clerk, force-dynamic
        page.tsx                 ← vue d'ensemble (10.1)
        dishes/                  ← CRUD plats (10.2)
        qrcodes/                 ← génération QR (10.4)
        analytics/               ← tableau global triable + export CSV (10.3)
        analytics/[dishId]/      ← analytics par plat : tendance, heure de pointe (10.3)
        billing/                 ← palier actuel, factures, checkout/portail Stripe (10.6)
    api/
      menu/[restaurantSlug]/     ← GET menu public
      dishes/                    ← GET liste (dashboard) / POST création
      dishes/[id]/               ← GET public / PUT / DELETE
      dishes/[id]/photo/         ← upload image → Cloudinary
      dishes/[id]/model3d/       ← upload .glb (+.usdz optionnel) → Cloudinary
      qrcodes/                   ← GET liste / POST création
      qrcodes/[id]/              ← DELETE
      qrcodes/[id]/png/          ← régénère le PNG à la volée (Content-Disposition: attachment)
      scan/                      ← POST tracking scan (rate-limited)
      allergens/                 ← GET table de référence
      analytics/export/          ← GET export CSV (Content-Disposition: attachment)
      billing/checkout/          ← POST session Stripe Checkout (palier + cycle)
      billing/portal/            ← POST session portail client Stripe
      webhooks/stripe/           ← POST synchronisation Subscription/Invoice (signature vérifiée)
  components/
    menu/                        ← composants du menu public
    dashboard/                   ← composants du dashboard (dont analytics-table, dish-trend-chart, billing-panel)
    landing/                     ← reveal.tsx (scroll-reveal), site-header.tsx (header sticky + menu mobile), pricing-section.tsx (tarifs, toggle mensuel/annuel)
    theme-toggle.tsx             ← bascule dark/light (next-themes)
    ui/                          ← shadcn/ui (button, etc. — installés à la main, voir section 4)
  lib/
    prisma.ts                    ← client Prisma singleton
    auth.ts                      ← résout Clerk → Restaurant/User (voir section 6)
    scan.ts                      ← logique + rate limiting des scans
    analytics.ts                 ← requêtes agrégées pour le dashboard (10.1, 10.3)
    dish-locale.ts               ← localizedDishName() — résout name/nameEn selon la locale (voir section 4)
    billing.ts                   ← TIERS (source unique des prix, section 15.1), getStripe(), subscriptionFieldsFrom()
    qrcode.ts                    ← génération PNG + URL absolue
    cloudinary.ts                ← config + upload
    dish-schema.ts                ← validation zod du formulaire plat
    dish-categories.ts           ← catégories existantes (pour le dropdown)
  i18n/                          ← next-intl (routing, navigation, request config)
prisma/
  schema.prisma
  seed.ts                        ← restaurant démo "demo" + 3 plats + 1 QR code
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
  `/dashboard` est auto-provisionné "owner" du restaurant `demo`
  (voir `src/lib/auth.ts`). À remplacer avant d'ouvrir à plusieurs
  restaurants/plusieurs comptes.
- **Rate limiting en mémoire** (`src/lib/scan.ts`) — suffisant pour une
  seule instance serveur. À remplacer par un store partagé (Upstash Redis)
  avant un déploiement multi-instance.
- **Vue de fiche plat ajoutée en Sprint 3** — le Sprint 1 n'enregistrait un
  `ScanEvent` avec `dishId` que lors d'une activation AR ; il n'y avait
  donc aucune donnée pour calculer un taux d'activation AR (activations ÷
  vues). La page fiche plat enregistre maintenant aussi un scan à
  l'ouverture (`arActivated: false`), distinct de celui déclenché par
  l'activation AR — voir `src/lib/analytics.ts`.
- **Palette et typographie de la section 13 remplacées par celles de
  reflect.app — décision explicite du client, à l'encontre de la section
  26 ("ne pas improviser de palette alternative").** Après avoir vu le
  dashboard Sprint 3 en conditions réelles, le client a jugé le design de
  la section 13 insuffisant pour un SaaS premium et a fourni un prompt de
  direction créative détaillé basé sur une analyse mesurée de reflect.app
  (couleurs hex, polices, rayons, espacement, structure de landing). Face
  au conflit avec le cahier, le choix explicite proposé et validé était :
  remplacer **toute** la palette (dashboard + landing), pas seulement
  celle de la landing. Détails :
  - `globals.css` : tokens HSL mesurés sur reflect.app en mode sombre
    (`#030014`/`#efedfd`/`#181848`/`#f0d8f0`/`#481890`/`#484860`) ; le
    mode clair n'a pas d'équivalent mesuré (reflect.app n'en a pas) donc
    ses tokens sont dérivés, pas mesurés.
  - Polices : Space Grotesk (titres) + Inter (corps) via `next/font/google`,
    remplaçant Fraunces/Geist — AeonikPro et "Inter V" (polices d'origine
    du prompt) sont payantes/non disponibles ; le prompt prévoyait
    lui-même ces alternatives Google Fonts.
  - `--radius: 7px`, `--radius-card: 24px`, boutons `h-auto` avec padding
    explicite (12px 24px) — spec boutons reflect.app mesurée.
  - La landing (`[locale]/page.tsx`) force `data-theme="dark"` localement
    via un wrapper (reflect.app n'a pas de mode clair) ; le dashboard garde
    `defaultTheme="system"` inchangé — pas de second `ThemeProvider`,
    l'attribut `data-theme` posé sur un `<div>` suffit car tous les tokens
    sont déjà scopés par sélecteur CSS.
  - **Si le cahier doit un jour reprendre le dessus** (ex. revue légale/
    marque), les valeurs originales de la section 13 (or/sarcelle) sont
    encore dans l'historique git (`4032e9f`, `db663f6`) — il suffirait de
    restaurer `globals.css`/`tailwind.config.ts`/`layout.tsx` à cet état.
- **Section 13.2 ne donne pas de valeurs succès/alerte pour le mode
  clair** — non applicable tel quel depuis le remplacement de palette
  ci-dessus ; les tokens `--success`/`--destructive` du mode clair de
  `globals.css` sont dérivés, pas mesurés sur reflect.app (qui n'a pas de
  mode clair). À revoir si un contrôle de contraste WCAG AA (section
  17.5) le juge insuffisant.
- **Landing page (section 12) livrée en avance sur le Sprint 4** — copy FR
  reprise textuellement du cahier quand elle existait (hero, 3 bullets
  features), copy originale mais alignée pour les sections que le cahier
  ne couvre pas (offre de lancement en remplacement de faux témoignages/
  logos clients — aucun client réel à ce stade —, le trio "Scanner → Voir
  en AR → Commander" dérivé du parcours client section 6.1). Section
  tarifs (12.1 #9) et FAQ (12.1 #10) ajoutées au Sprint 4, montants tirés
  tels quels de la section 15.1 via `lib/billing.ts` (source unique
  partagée avec le dashboard facturation, pour ne jamais désynchroniser
  les deux).
- **Stripe Billing (section 15, F10) — code écrit et buildé, jamais
  exercé contre l'API réelle.** Aucun compte Stripe n'existe encore côté
  client. Checklist pour débloquer (mode Test suffit pour valider avant
  la mise en prod) :
  1. Créer un compte Stripe (ou utiliser un compte existant), rester en
     **mode Test** pour le développement.
  2. Créer 3 Products : "Vorae Essentiel", "Vorae Croissance", "Vorae
     Prestige".
  3. Pour chacun, créer deux Prices récurrents en **CAD** (montants
     exacts de la section 15.1) :
     Essentiel 79 $/mois et 790 $/an · Croissance 199 $/mois et 1 990 $/an
     · Prestige 449 $/mois et 4 490 $/an.
  4. Copier les 6 `price_...` obtenus dans les variables
     `STRIPE_PRICE_{ESSENTIEL,CROISSANCE,PRESTIGE}_{MONTHLY,ANNUAL}`
     (Vercel + `.env` local).
  5. Récupérer la clé secrète (Developers → API keys) → `STRIPE_SECRET_KEY`.
  6. Créer un endpoint de webhook Stripe pointant vers
     `https://<domaine>/api/webhooks/stripe`, événements à cocher :
     `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.paid`,
     `invoice.payment_failed`. Copier le signing secret →
     `STRIPE_WEBHOOK_SECRET`.
  7. Dans Stripe → Customer Portal (Settings), autoriser les 3 Products
     ci-dessus et activer le changement de palier — c'est ce qui permet
     à `POST /api/billing/portal` (section 9.2, 10.6) de couvrir "changement
     de palier en libre-service avec proratisation automatique" sans code
     applicatif supplémentaire : la logique de proratisation est gérée
     entièrement par Stripe.
  - **Facturation à l'usage (section 15.2, plats additionnels au-delà du
    quota inclus) : non implémentée.** `extraDishCount` existe dans le
    schéma `Subscription` mais rien ne l'incrémente ni ne le reporte à
    Stripe (`metered billing`, un second item de subscription par
    palier). Décision de scope Sprint 4 : livrer l'abonnement de base (3
    paliers × 2 cycles, checkout, portail, webhook) d'abord — l'usage
    metered demande une automatisation (compter les plats actifs, reporter
    l'usage à Stripe) qui n'a pas pu être testée sans compte Stripe réel.
    Palier Prestige non concerné (plats illimités).
  - Palier "illimité" (Prestige) représenté par `includedDishSlots: -1`
    dans `lib/billing.ts`/`Subscription.includedDishSlots` (le champ
    Prisma est un `Int` non nullable, donc pas de `null`) — tout code lisant
    ce champ doit connaître cette convention.
  - Service de capture 3D à la carte/forfaits (section 15.3,
    `DishCaptureOrder`) : modèle de données existant depuis Sprint 0, mais
    aucun flux de commande ni paiement associé — non demandé explicitement
    pour ce sprint, à faire si le client en a besoin.

---

## 5. Pièges connus / à ne pas refaire

- **Neon : toujours utiliser la connexion POOLED** (`-pooler` dans le
  hostname) pour `DATABASE_URL` sur Vercel — bonne pratique générale pour
  du serverless (la connexion directe a une limite de connexions
  simultanées très basse sur le plan gratuit). Note : ce n'était **pas**
  la cause du bug ci-dessous malgré la ressemblance des symptômes — les
  deux pièges peuvent coexister, ne pas arrêter le diagnostic au premier
  suspect plausible.
- **Vercel peut créer une variable d'env comme chaîne VIDE plutôt qu'absente**
  — au tout premier import du projet, Vercel avait auto-détecté les noms
  de variables depuis `.env.example` (dont `NEXT_PUBLIC_APP_URL=`, sans
  valeur) et créé l'entrée correspondante vide plutôt que de ne rien
  créer. `process.env.NEXT_PUBLIC_APP_URL` valait donc `""`, pas
  `undefined`. Tout code utilisant `??` pour un fallback laissait passer
  cette chaîne vide (elle n'est pas null/undefined) — `new URL(path, "")`
  plante avec `ERR_INVALID_URL`. Symptôme en prod : "Application error: a
  server-side exception has occurred" sans plus de détail — le vrai
  message (`TypeError: Invalid URL ... base: ''`) n'était visible que
  dans Vercel → Deployments → [déploiement] → Runtime Logs, pas dans
  l'onglet "Logs" du projet (qui est production-only). **Toujours
  utiliser `||` (pas `??`) pour un fallback de variable d'environnement
  potentiellement vide**, et vérifier les Runtime Logs du déploiement
  concerné dès qu'une erreur 500 générique apparaît, avant de deviner.
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
- **Un champ bilingue en base (`x`/`xEn`) ne suffit pas : il faut aussi
  que chaque requête serveur qui l'affiche sélectionne `xEn` et résout la
  bonne valeur selon la locale.** Bug constaté : `src/lib/analytics.ts`
  avait bien `Dish.nameEn` en base depuis le Sprint 1, mais ses requêtes
  Prisma (vue d'ensemble, tableau global, page par plat) ne
  sélectionnaient que `name` — le dashboard en anglais affichait quand
  même les noms de plats en français. Corrigé avec un helper partagé
  `localizedDishName()` (`src/lib/dish-locale.ts`) et une locale propagée
  jusqu'à ces requêtes ; l'export CSV (route API hors segment `[locale]`)
  reçoit la locale en query string. Vérifier ce même piège sur tout futur
  champ bilingue affiché depuis une requête serveur, pas seulement dans les
  formulaires/composants client.
- **Le webhook Stripe doit lire le corps brut de la requête** (`req.text()`)
  et jamais `req.json()` — la vérification de signature
  (`stripe.webhooks.constructEvent`) recalcule un HMAC sur les octets
  exacts reçus ; `req.json()` puis re-sérialiser donnerait un contenu
  différent (ordre de clés, espaces) et ferait toujours échouer la
  vérification. Voir `src/app/api/webhooks/stripe/route.ts`.
- **Le matcher du middleware (`src/middleware.ts`) doit exclure toute
  extension de fichier statique servie depuis `public/`**, pas seulement
  les images — sinon next-intl route la requête comme une page et la
  redirige vers `/fr/<fichier>` (404). Repéré en ajoutant une vidéo
  (`.mp4`) : la regex d'exclusion listait `jpe?g|webp|png|...` mais pas
  `mp4|webm|mov|mp3`. Vérifier ce matcher à chaque nouveau type de fichier
  statique ajouté au projet.

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

## 8. Prochaines étapes (Sprint 4, section 21)

La landing marketing (section 12, y compris tarifs + FAQ) et l'abonnement
Stripe de base (checkout, portail, webhook, page facturation dashboard)
sont codés et buildés. Il reste :

- **Créer le compte Stripe et les 8 variables d'environnement** — voir la
  checklist complète en section 4 ("Stripe Billing — code écrit... jamais
  exercé contre l'API réelle"). Rien de ce qui touche à la facturation ne
  peut être testé en conditions réelles avant ça.
- **Facturation à l'usage (plats additionnels au-delà du quota, section
  15.2)** — non implémentée, voir section 4 pour le détail du gap
  (`extraDishCount` existe en base mais rien ne l'alimente ni ne le
  reporte à Stripe en metered billing).
- **Visuels réels intégrés (générés par IA — Gemini/Imagen, pas de vraies
  photos de plats ni un vrai enregistrement d'écran de l'app).** Livrés
  par Mouhamed, stockés dans `public/` (pas Cloudinary — ce sont des
  assets de site statiques, pas des données `Dish` éditables par un
  restaurateur) et référencés en dur dans le code :
  - `public/logo-icon.png` — icône du logo (monogramme "V" + réticule),
    utilisée dans `SiteHeader` et comme favicon (`src/app/icon.png`,
    convention Next.js App Router).
  - `public/hero-dish.jpg` — photo plat dramatique, intégrée en visuel
    sous le CTA du hero (`[locale]/page.tsx`).
  - `public/hero-video.mp4` — vidéo concept (bol qui apparaît en
    hologramme au-dessus d'un téléphone), remplace l'ancien mockup CSS
    dans la section "aperçu produit". **Reconvertie depuis un .mov HEVC+AAC
    d'origine** (non lisible de façon fiable sur Chrome/Firefox et avec
    piste audio superflue pour une vidéo en boucle muette) vers H.264/
    yuv420p sans audio via `ffmpeg` — nécessaire pour la compatibilité
    navigateur, pas une simple copie de fichier.
  - `public/dish-*.jpg` (signature-bowl, pasta, burger, salad) — pas
    encore reliées aux plats du restaurant démo en base (nécessite un
    `UPDATE` SQL collé dans Neon, voir message de session — même
    contrainte que d'habitude, pas d'accès TCP direct depuis cet
    environnement). `dish-burger.jpg` n'a pas de plat correspondant dans
    `seed.ts` — disponible si un 4ᵉ plat est ajouté un jour.
  - **Piège découvert en intégrant la vidéo** : le matcher du middleware
    (`src/middleware.ts`) excluait bien `.png`/`.jpg`/etc. du routing
    i18n mais pas `.mp4`/`.webm`/`.mov`/`.mp3` — next-intl redirigeait
    donc `/hero-video.mp4` vers `/fr/hero-video.mp4` (404). Corrigé en
    étendant la regex d'exclusion. Voir aussi section 5 (pièges connus).
  - Ces visuels sont volontairement "concept" et non de vraies captures
    de l'app (pas de fausse interface dans la vidéo) — voir l'échange sur
    ce point en session. À remplacer par de vraies photos/captures dès
    qu'elles existent.
- Pages `/privacy` et `/terms` — les liens du footer de la landing pointent
  vers `#` en attendant (voir commentaire dans `[locale]/page.tsx`).
- Le CTA "Réserver une démo" / "Book a demo" de la landing ne fait encore
  rien (pas de bouton fonctionnel, pas de formulaire/lien Calendly, etc.)
  — à brancher avant mise en production réelle. Les CTA de la section
  tarifs, eux, renvoient déjà vers `/dashboard` (sign-in Clerk → palier
  choisi dans la page facturation).
- Rappel : ne plus réintroduire la palette or/sarcelle de la section 13
  sans revalider avec le client — le remplacement par reflect.app est une
  décision explicite et documentée (section 4), pas un oubli.

---

## 9. Roadmap — fonctionnalités hors cahier des charges (planifiées, pas construites)

- **Génération de modèle 3D instantanée par IA (photo → 3D)** — voir
  `docs/roadmap-ai-instant-3d.md`. Ajout de scope proposé par le client
  après avoir vu une vidéo marketing d'un concurrent (AR Code, déjà listé
  section 3 du cahier). Document de planification complet (architecture,
  schéma, endpoints, garde-fous qualité, lien facturation) — **rien n'est
  implémenté**, à reprendre en détail avant de coder quoi que ce soit.

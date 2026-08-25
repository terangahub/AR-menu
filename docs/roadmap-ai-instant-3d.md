# Roadmap - Génération de modèle 3D instantanée par IA (photo → 3D)

**Statut : planification uniquement, rien n'est implémenté.** Ce document
sert à figer les décisions techniques avant de démarrer le sprint, pour
qu'il soit rapide à exécuter le moment venu. Écrit à partir d'une analyse
Gemini d'une vidéo marketing du concurrent **AR Code** (déjà référencé
comme concurrent européen en section 3 du cahier des charges - "SaaS de
scan 3D + génération QR"), **vérifiée et corrigée** ci-dessous - plusieurs
affirmations de l'analyse d'origine étaient approximatives ou incomplètes.

Ce n'est **pas** une fonctionnalité prévue par le cahier des charges v2.0
(ni dans le MVP section 5.1, ni explicitement dans la Phase 2 section 5.2)
- c'est un ajout de scope proposé par le client après avoir vu la
concurrence, à traiter comme les autres écarts déjà documentés dans
`CONTEXT.md`.

---

## 0. Décision arbitrée (août 2026) : photogrammétrie, pas génération IA

**Ce document a été écrit avant l'arbitrage. La section 0 le corrige ; les
sections suivantes restent valables pour tout ce qui touche à
l'architecture, mais leur hypothèse de départ (génération IA à partir
d'une seule photo) est abandonnée.** Version illustrée sur trois pages
dans `docs/scan-3d-plats-vorae.pdf`.

### Ce qui a été écarté et pourquoi

La **génération IA à partir d'une photo unique** (Meshy, Tripo3D, Stable
Fast 3D) est écartée. Elle ne capture pas le plat, elle en invente une
interprétation. Les analyses techniques 2026 situent explicitement ces
moteurs sur le contenu stylisé de jeu vidéo, avec des arêtes au rendu
"pâte à modeler" de près. Sur un menu où le convive doit reconnaître ce
qu'il va commander, l'écart entre le plat servi et le modèle affiché est
un risque commercial, pas un détail esthétique. Test mené sur une photo
de burger avec Meshy : géométrie approximative et export bloqué derrière
l'abonnement. Le doute soulevé en section 5 de ce document (« la
nourriture est un cas difficile ») s'est confirmé en pratique.

Écartés également :
- **Luma AI** : leur outil de capture (Genie) a été arrêté au 1er janvier
  2026, l'offre a pivoté vers le Gaussian Splatting de scènes et la
  vidéo. La mention "Polycam/Luma AI" de la section 15.3 du cahier est
  donc périmée sur la moitié Luma.
- **Polycam** : le palier gratuit n'exporte qu'en GLTF, ni GLB ni USDZ.
  Sans USDZ, pas d'AR Quick Look sur iPhone. Reste une option payante de
  secours.
- **Rig multi-caméras** (proposé en session par un collaborateur) : bonne
  intuition sur le multi-vues, mais construire une station physique est
  disproportionné pour un pilote à un seul restaurant. À reconsidérer si
  le passage à l'échelle le justifie.

### Ce qui est retenu : KIRI Engine API

Photogrammétrie **managée** : capture réelle du plat, pas de génération,
et aucune infrastructure à héberger de notre côté. Spécification vérifiée
sur le dépôt officiel `Kiri-Innovation/KIRI-ENGINE-SDK-API` :

| Élément | Valeur |
|---|---|
| Base URL | `https://api.kiriengine.app/api/` |
| Authentification | Bearer, clé au format `kiri-<random>` |
| Entrée vidéo | 3 min max, 1920x1080 |
| Entrée photos | 20 à 300 images |
| Sorties | OBJ, FBX, STL, PLY, **GLB**, glTF, **USDZ**, XYZ |
| Algorithmes | Photo Scan, Featureless Object, 3DGS (avec conversion mesh) |
| Qualité | `modelQuality` 0=High à 3=Ultra, `textureQuality` 0=4K à 3=8K |
| Webhooks | POST JSON au changement de statut, 3 tentatives, backoff exponentiel |
| Suivi | `getStatus`, `getModelZip` (lien 60 min), `balance` |
| Limites | 3 Go par envoi |
| Tarif | 1 appel API = 1 crédit = 1 $ US, quel que soit le type de scan (Photo Scan, Featureless, 3DGS) |
| Essai | 10 crédits offerts à l'inscription |
| Recharge | Minimum 500 crédits (500 $) au-delà du gratuit |

Trois points décisifs pour notre cas :

1. **`Featureless Object`** vise les surfaces brillantes et sans texture,
   exactement le cas des assiettes blanches et des sauces réfléchissantes
   où la photogrammétrie classique échoue.
2. **L'entrée vidéo** rend le geste réaliste pour un restaurateur : filmer
   30 secondes le tour de l'assiette, au lieu de cadrer 20 à 300 photos.
3. **Les webhooks** résolvent la contrainte Vercel décrite en section 6 de
   ce document : plus besoin d'inventer un mécanisme de reprise, KIRI
   rappelle Vorae quand le modèle est prêt.

**Effet de bord favorable** : KIRI livre GLB et USDZ dans le même export.
La dette **D-03** du `BOARD.md` (pas de conversion `.glb` vers `.usdz`,
faute d'outil fiable côté Node) disparaît sans travail supplémentaire.

### Plan B conservé : RealityScan 2.1 (Epic)

Le moteur de photogrammétrie le plus qualitatif du marché. Depuis
novembre 2025 il expose un **Remote Command Plugin REST et gRPC**,
utilisable en service headless, avec support Linux complet. Licence
**gratuite même en usage commercial sous 1 M$ de revenu annuel**, ce qui
couvre largement Vorae aujourd'hui (au-delà : 1 250 $/siège/an).

Non retenu en premier choix parce qu'il faut héberger et maintenir notre
propre machine GPU. C'est le repli si la qualité ou le coût de KIRI ne
tiennent pas à l'échelle. L'adaptateur de la section 4.1 permet d'en
changer sans réécrire le flux.

### Reste à trancher avant de coder

- **Le prix par crédit est confirmé, la décision de budget ne l'est pas.**
  1 $/scan est raisonnable à l'usage, mais la recharge minimale de 500 $
  est un vrai engagement à planifier avant de dépasser les 10 plats
  gratuits, pas un détail technique. Si ce montant est prématuré pour le
  stade pilote, solution de repli manuelle : l'abonnement web KIRI à
  17,99 $/mois en scan illimité, utilisé à la main (upload sur
  kiriengine.app, export, puis transfert dans Vorae) le temps de valider
  avec plus de plats, avant de basculer sur l'API à 500 $ quand le volume
  le justifie.
- **Juger la qualité sur de vrais plats du restaurant pilote**, pas sur
  des photos de stock.

### Corrections à apporter au reste du document

- Section 4.1 : l'interface s'appelle désormais `Scan3dProvider`
  (`src/lib/scan3d.ts`), et prend des médias de capture, pas une photo
  unique. Le fournisseur par défaut est KIRI.
- Section 4.2 : le modèle Prisma devient `ScanJob` plutôt que
  `Ai3dGenerationJob`, avec `sourceMediaUrls` (pluriel) au lieu de
  `sourceImageUrl`.
- Section 6 (contrainte Vercel) : résolue par les webhooks KIRI.
- Le positionnement de la section 2 reste valable tel quel : ce flux
  complète le service de capture professionnel à 45 $/plat de la section
  15.3 du cahier, il ne le remplace pas.
- Les garde-fous de la section 5 restent obligatoires : chaque scan coûte
  de l'argent réel, donc compteur et limite par restaurant dès la première
  version, jamais d'accès illimité non facturé.

---

## 1. Ce que fait réellement le concurrent (et ce qui est vérifié vs approximatif)

| Affirmation de l'analyse d'origine | Vérification |
|---|---|
| Le scan "laser" façon effet de film dans la vidéo est un effet marketing, pas la vraie technique | ✅ Correct - aucune API d'image-to-3D actuelle ne "scanne" visuellement une photo de cette manière ; c'est du VFX de présentation. |
| Pipeline réel : photo → API IA générative 3D → cloud → QR → WebAR | ✅ Correct dans les grandes lignes - c'est l'architecture standard de ce type de produit. |
| `<model-viewer>` + AR Quick Look (iOS) / Scene Viewer (Android) | ✅ Déjà exactement ce que Vorae utilise (`src/components/menu/ar-viewer.tsx`) - **aucun changement nécessaire côté affichage AR**, cette fonctionnalité touche uniquement l'**acquisition** du modèle, pas sa présentation. |
| Formats `.glb`/`.usdz` nécessaires | ✅ Correct - et déjà exactement les deux champs existants `Dish.model3dGlbUrl` / `Dish.model3dUsdzUrl` (section 8 du cahier). Aucun nouveau format à gérer. |
| APIs suggérées : Tripo3D, Meshy.ai, CSM.ai, Luma AI, Stable Fast 3D | ⚠️ **À nuancer.** Tripo3D et Meshy.ai sont bien des APIs REST commerciales d'image-to-3D établies avec export multi-format (dont `.usdz`). Stable Fast 3D (Stability AI) est un modèle ouvert, utilisable en self-hosted ou via API. **Luma AI est plus ambigu** : leur produit le plus connu est la capture par photogrammétrie/Gaussian splatting (l'app mobile de scan), pas une API "une seule photo → 3D" au même titre que les trois autres - à re-vérifier au moment de l'implémentation, ce marché évolue vite et les offres/tarifs changent souvent. **Ne pas figer un choix de fournisseur maintenant** (voir section 4, architecture en adaptateur).
| Stockage cloud : "AWS S3, Google Cloud Storage, ou Firebase Storage" | ⚠️ **Ne pas ajouter un 4ᵉ fournisseur.** Vorae a déjà Cloudinary en place pour tout le stockage média (écart documenté dans `CONTEXT.md` section 4 - AWS S3 prévu par le cahier section 7 mais jamais configuré). Réutiliser Cloudinary (`resource_type: "raw"`, déjà utilisé pour les `.glb`/`.usdz` uploadés manuellement) plutôt que d'introduire un nouveau vendor. |
| Qualité : "l'arrière du plat est flou, l'IA l'invente" pour de la nourriture à partir d'une seule photo | ✅ Correct et important à garder - les modèles image-to-3D grand public sont entraînés sur des objets génériques, pas spécifiquement sur de la nourriture (formes non rigides, sauces, garnitures). Voir section 5 (garde-fous qualité). |
| Alternative vidéo/photogrammétrie pour un résultat "100% parfait" | ✅ Correct - et c'est **déjà exactement le service payant existant** du cahier, section 15.3 ("Service de capture 3D - facturé par plat/image", Polycam/Luma AI, 45 $/plat à la carte). **Ce nouveau sprint ne remplace pas ce service, il le complète en dessous** (voir section 2). |

**Ce que l'analyse d'origine ne couvrait pas du tout et qu'il faut ajouter :**
coût par génération et son lien avec la facturation Stripe déjà en place
(section 3), modération/validation avant publication (section 5),
traitement asynchrone et ses contraintes sur Vercel serverless (section 6),
et le fait que l'affichage AR lui-même n'a besoin d'aucun changement.

---

## 2. Positionnement produit - ne remplace pas le service de capture existant

Le cahier prévoit déjà un service de capture 3D professionnel humain
(section 15.3) : photogrammétrie Polycam/Luma AI sur place, facturé
45 $/plat à la carte ou en forfait, résultat de haute qualité. C'est un
service à marge élevée, explicitement identifié comme tel dans le cahier
("probablement la plus grosse marge en phase de lancement").

La génération IA instantanée est un **produit différent, complémentaire,
pas un remplacement** :

| | Capture professionnelle (existant, 15.3) | Génération IA instantanée (ce document) |
|---|---|---|
| Qualité | Haute, garantie | Variable, parfois décevante (nourriture = cas difficile) |
| Délai | Jours (rendez-vous, traitement) | Secondes à ~2 minutes |
| Effort restaurateur | Prend rendez-vous, quelqu'un se déplace | Prend une photo depuis le dashboard, en self-service |
| Prix suggéré | 45 $/plat (déjà fixé) | Nettement moins cher - à valider, ordre de grandeur 5-10 $/génération ou inclus dans un quota par palier (voir section 3) |
| Rôle | Le "vrai" résultat pour le menu définitif | Un aperçu rapide pour tester le produit, convaincre en démo, ou dépanner pour un plat secondaire |

Argument de vente naturel : proposer la génération IA comme un
**aperçu gratuit ou à bas coût qui donne envie de commander la vraie
capture professionnelle** - pas une concurrence interne au service
existant. Dans l'UI, chaque modèle généré par IA doit afficher un badge
clair ("Aperçu généré par IA") et un CTA vers la commande de capture
professionnelle.

---

## 3. Lien avec la facturation (déjà en place depuis le Sprint 4)

Le modèle `DishCaptureOrder` (section 8 du cahier, déjà dans le schéma
Prisma) a un champ `packageType` (`a_la_carte | forfait_demarrage |
forfait_menu_complet | recapture`). Deux options à trancher au moment de
l'implémentation, pas maintenant :

- **Option A - nouveau `packageType: "ia_instantanee"`** dans le même
  modèle, prix nettement inférieur, statut généralement immédiat
  (`delivered` en quelques minutes) plutôt qu'un vrai rendez-vous planifié.
- **Option B - quota inclus par palier d'abonnement**, ex. "N générations
  IA par mois incluses selon le palier Stripe" (`Subscription.tier`,
  `lib/billing.ts`), au-delà facturé à l'usage - cohérent avec la logique
  déjà en place pour les plats additionnels (section 15.2, non
  implémentée non plus, voir `CONTEXT.md`).

Dans les deux cas, **chaque appel à l'API du fournisseur IA coûte de
l'argent réel** (contrairement à l'upload manuel d'un fichier .glb, qui
est gratuit pour Vorae) - il faut absolument un compteur et une limite,
jamais un accès illimité non facturé, pour éviter qu'un usage abusif ne
génère une facture fournisseur incontrôlée.

---

## 4. Architecture technique proposée

### 4.1 Principe : adaptateur fournisseur, pas un choix figé

Comme le marché des APIs image-to-3D bouge vite (nouveaux entrants,
tarifs qui changent, qualité qui progresse), le code ne doit **jamais**
appeler un fournisseur directement depuis les routes API. Une interface
d'adaptateur, sur le modèle de `src/lib/billing.ts` (source unique déjà
utilisée pour découpler la logique métier du fournisseur Stripe) :

```ts
// src/lib/ai3d.ts (à créer)
export interface Ai3dProvider {
  generateFromImage(imageUrl: string): Promise<
    | { status: "ready"; glbUrl: string; usdzUrl?: string }
    | { status: "queued"; externalJobId: string }
  >;
  checkStatus?(externalJobId: string): Promise<
    { status: "processing" | "ready" | "failed"; glbUrl?: string; usdzUrl?: string; error?: string }
  >;
}
```

Un seul fournisseur actif à la fois via `AI_3D_PROVIDER` (variable
d'environnement), sélectionné parmi les implémentations disponibles.
**Réévaluer au moment de l'implémentation** lequel de Tripo3D, Meshy.ai,
Stable Fast 3D (ou un nouvel entrant) offre le meilleur rapport
qualité/prix/latence pour des photos de nourriture spécifiquement - faire
un petit test comparatif avec de vraies photos de plats avant de choisir,
ne pas se fier uniquement à la réputation générale du fournisseur.

### 4.2 Schéma de données (extension Prisma, pas encore appliquée)

```prisma
// Job de génération IA - pendant traçable et déboguable, sur le même
// principe que DishCaptureOrder pour le service humain.
model Ai3dGenerationJob {
  id              String   @id @default(cuid())
  dishId          String
  dish            Dish     @relation(fields: [dishId], references: [id])
  provider        String   // "tripo3d" | "meshy" | "stability" | ...
  status          String   // queued | processing | ready | failed
  sourceImageUrl  String   // photo 2D envoyée au fournisseur
  externalJobId   String?  // id de job côté fournisseur, si asynchrone
  resultGlbUrl    String?
  resultUsdzUrl   String?
  errorMessage    String?
  createdAt       DateTime @default(now())
  completedAt     DateTime?
}
```

`Dish` reste inchangé dans sa forme (toujours `model3dGlbUrl` /
`model3dUsdzUrl` / `isArReady` comme source de vérité affichée sur le
menu) - un job IA "ready" **copie** son résultat dans ces champs
seulement après validation manuelle du restaurateur (section 5), jamais
automatiquement.

### 4.3 Endpoints (à ajouter à la section 9.2 du cahier)

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/dishes/[id]/ai-model` | Déclenche une génération à partir d'une photo déjà uploadée (`Dish.imageUrl`) ou d'un nouvel upload. Crée un `Ai3dGenerationJob`. |
| GET | `/api/dishes/[id]/ai-model/[jobId]` | Poll du statut si le fournisseur est asynchrone (pas de webhook fiable). |
| POST | `/api/webhooks/ai3d/[provider]` | Callback fournisseur si disponible (préférable au polling, voir section 6). |
| POST | `/api/dishes/[id]/ai-model/[jobId]/approve` | Le restaurateur valide le résultat → copie vers `Dish.model3dGlbUrl`/`model3dUsdzUrl`, passe `isArReady: true`. |
| POST | `/api/dishes/[id]/ai-model/[jobId]/reject` | Rejette le résultat (mauvaise qualité) - le job reste dans l'historique mais rien n'est publié. |

### 4.4 Stockage

Le résultat (`.glb`/`.usdz` renvoyés par le fournisseur, généralement via
une URL téléchargeable temporaire) est re-téléchargé puis ré-uploadé sur
**Cloudinary** (`resource_type: "raw"`, même pattern que
`src/app/api/dishes/[id]/model3d/route.ts` existant) - ne pas dépendre
d'une URL fournisseur qui peut expirer.

---

## 5. Garde-fous qualité (absents de l'analyse d'origine, indispensables)

- **Jamais de publication automatique.** Le résultat IA passe par un
  écran d'aperçu (`<model-viewer>` déjà existant, réutilisable tel quel)
  où le restaurateur voit le modèle tourner avant de cliquer "Publier sur
  le menu" ou "Rejeter / réessayer". Un mauvais modèle publié
  automatiquement sur le menu public serait pire que pas de modèle du
  tout (fallback 2D déjà disponible dans ce cas, section 17.1 du cahier).
- **Badge visible "Aperçu généré par IA"** partout où ce type de modèle
  est affiché - transparence envers le client final, cohérent avec le
  ton de marque "sobre, confiant" (section 1.3) plutôt que de laisser
  croire à une vraie capture professionnelle.
- **Limite de tentatives** par plat (ex. 3 générations avant de devoir
  passer par le service payant) pour éviter un usage en boucle qui
  ferait exploser le coût fournisseur sans jamais satisfaire le
  restaurateur.

---

## 6. Contrainte technique Vercel à anticiper

Les fonctions serverless Vercel ont une limite de durée d'exécution (plan
Hobby/Pro : quelques secondes à quelques minutes selon le plan). Une
génération 3D peut prendre de quelques secondes à ~1-2 minutes selon le
fournisseur - **ne jamais faire un appel synchrone bloquant** dans une
route API si le fournisseur ne garantit pas une réponse rapide.
Deux approches possibles, à trancher selon ce que permet le fournisseur
choisi :

1. **Webhook fournisseur** (préféré) - la route déclenche la génération,
   répond immédiatement `202 Accepted`, le fournisseur rappelle
   `/api/webhooks/ai3d/[provider]` quand c'est prêt (même pattern que le
   webhook Stripe déjà en place, `src/app/api/webhooks/stripe/route.ts`
   - y compris le piège du corps brut documenté dans `CONTEXT.md`).
2. **Polling côté client** - le dashboard interroge
   `GET /api/dishes/[id]/ai-model/[jobId]` toutes les quelques secondes
   jusqu'à `ready`/`failed`, si le fournisseur ne propose pas de webhook.

---

## 7. Découpage en tâches (pour quand ce sprint sera lancé)

1. Spike : tester 2-3 fournisseurs avec de vraies photos de plats
   (qualité, latence, prix, dispo webhook), documenter le choix retenu
   et pourquoi - avant d'écrire le moindre code d'intégration.
2. Schéma Prisma (`Ai3dGenerationJob`) + migration.
3. `src/lib/ai3d.ts` (interface adaptateur) + implémentation du
   fournisseur retenu.
4. Routes API (section 4.3) + webhook ou polling selon le fournisseur.
5. UI dashboard : bouton "Générer un aperçu 3D par IA" dans le formulaire
   plat, écran d'aperçu/validation/rejet, badge "généré par IA".
6. Lien facturation (section 3) - option A ou B à trancher avant de coder.
7. Tests manuels iPhone Safari + Android Chrome sur le résultat final
   affiché (le rendu AR lui-même ne change pas, mais le modèle généré
   doit être validé sur device réel comme tout modèle 3D, section 22).

---

*Document de planification - mettre à jour ou supprimer les incertitudes
marquées ⚠️ ci-dessus (choix de fournisseur, tarifs, mécanique de
facturation) au moment où ce sprint est réellement priorisé, avant de
commencer à coder.*

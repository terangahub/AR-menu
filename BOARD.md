# Board de livraison - Vorae

Suivi d'avancement de tous les sprints et de tous les tickets du projet.
C'est le "Jira" du projet : l'état de chaque chantier, qui attend quoi, et
ce qui bloque.

Deux documents complémentaires, ne pas les confondre :

| Document | Rôle |
|---|---|
| `BOARD.md` (ce fichier) | **Où en est chaque ticket.** Statut, blocages, prochaine action. |
| `CONTEXT.md` | **Comment le projet est fait.** Architecture, écarts au cahier, pièges connus. |
| `docs/roadmap-ai-instant-3d.md` | Planification détaillée d'un chantier futur non démarré. |

**Règle de mise à jour :** ce fichier doit être mis à jour à chaque
changement d'état d'un ticket, pas seulement en fin de sprint. Un board
faux est pire qu'aucun board.

Dernière mise à jour : Sprint 4 en revue, en attente du compte Stripe.

---

## Légende des statuts

| Statut | Signification |
|---|---|
| `TODO` | Identifié, pas encore spécifié en détail. Ne pas commencer à coder. |
| `READY` | Spécifié, dépendances levées, prêt à être pris en développement. |
| `DEV` | En cours de développement sur une branche `feature/*`. |
| `REVIEW` | Pull Request ouverte, CI verte, en attente de test et de merge par Mouhamed. |
| `DONE` | Mergé sur `main`. |
| `DEPLOYED` | Mergé et vérifié en conditions réelles (production ou preview testée sur appareil). |
| `BLOCKED` | Bloqué par une dépendance externe. La cause est toujours écrite dans la colonne Notes. |

---

## Vue d'ensemble des sprints

| Sprint | Contenu (cahier section 21) | Statut | PR |
|---|---|---|---|
| Sprint 0 | Init repo, Next.js 14, Prisma, Neon, Clerk, CI, workflow PR | `DEPLOYED` | #1 |
| Sprint 1 | Menu 2D public, fiche plat, AR + fallback 2D, i18n FR/EN | `DEPLOYED` | #2 |
| Sprint 2 | Dashboard restaurateur : CRUD plats, upload photo/3D, QR codes | `DEPLOYED` | #3 |
| Sprint 3 | Analytics par plat, système de design | `DEPLOYED` | #4 |
| Sprint 4 | Landing page complète, Stripe Billing | `REVIEW` | #5 |
| Sprint 5 | Dashboard super admin, pilote réel Montréal | `TODO` | - |
| Hors cahier | Génération 3D instantanée par IA (photo vers 3D) | `TODO` | - |

---

## Sprint 4 - Landing page et facturation (en cours)

Branche : `feature/s4-billing-landing-polish` - PR #5

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S4-01 | Modèle de tarification partagé (`lib/billing.ts`) | `DONE` | Source unique des prix, réutilisée par la landing et le dashboard. |
| S4-02 | Route Stripe Checkout (`POST /api/billing/checkout`) | `REVIEW` | Codé et buildé, jamais exercé contre l'API Stripe réelle. |
| S4-03 | Route portail client Stripe (`POST /api/billing/portal`) | `REVIEW` | Le changement de palier et la proratisation sont gérés par Stripe, pas par notre code. |
| S4-04 | Webhook Stripe (`POST /api/webhooks/stripe`) | `REVIEW` | Synchronise `Subscription` et `Invoice`. Signature vérifiée sur le corps brut. |
| S4-05 | Page Facturation du dashboard (section 10.6) | `REVIEW` | Palier actuel, factures, accès au portail. |
| S4-06 | Section Tarifs de la landing (section 12.1 #9) | `REVIEW` | Bascule mensuel/annuel avec indicateur coulissant. |
| S4-07 | Section FAQ de la landing (section 12.1 #10) | `REVIEW` | Accordéon, 4 questions. |
| S4-08 | Intégration des visuels réels (logo, photo hero, vidéo) | `REVIEW` | Assets générés par IA, fournis par Mouhamed. Vidéo reconvertie en H.264 sans audio. |
| S4-09 | Refonte visuelle de la landing (profondeur, dégradés, halos) | `REVIEW` | Suite au retour "trop minimaliste, on dirait du HTML". |
| S4-10 | Correction du menu mobile (superposition et scroll) | `REVIEW` | Cause : `backdrop-blur` créait un containing block pour l'overlay `fixed`. Scroll de page verrouillé à l'ouverture. |
| S4-11 | Suppression de tous les tirets longs du projet | `REVIEW` | 211 occurrences dans 49 fichiers. Exigence explicite du client. |
| S4-12 | **Créer le compte Stripe et les 8 variables d'environnement** | `BLOCKED` | **Action Mouhamed.** Checklist complète dans `CONTEXT.md` section 4. Rien de S4-02 à S4-05 n'est testable avant. |
| S4-13 | Facturation à l'usage, plats additionnels (section 15.2) | `TODO` | Hors périmètre décidé pour ce sprint. `extraDishCount` existe en base mais rien ne l'alimente. Voir `CONTEXT.md` section 4. |
| S4-14 | Relier les photos de plats au restaurant démo | `BLOCKED` | **Action Mouhamed.** Nécessite un `UPDATE` SQL dans Neon (pas d'accès TCP direct depuis l'environnement de dev). |
| S4-15 | Brancher le CTA "Réserver une démo" | `TODO` | Le bouton n'a aucune action. À décider : formulaire, Calendly, ou lien courriel. |
| S4-16 | Pages `/privacy` et `/terms` | `TODO` | Liens du footer en ancre `#` en attendant. Requis par la Loi 25 (section 17.4) avant la vraie mise en production. |

---

## Sprint 5 - Dashboard super admin et pilote réel

Rien n'est démarré. Périmètre issu des sections 11 et 21 du cahier.

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S5-01 | Rôle et garde d'accès SuperAdmin (section 18) | `TODO` | Aucune route `/superadmin` n'existe. Le middleware la protège déjà par anticipation. |
| S5-02 | Vue d'ensemble revenus : MRR, ARR, churn (section 11.1) | `TODO` | Dépend de S4-12 : sans données Stripe réelles, aucun revenu à afficher. |
| S5-03 | Gestion des restaurants : liste, filtres, suspension (section 11.2) | `TODO` | Inclut le mode support "impersonate" avec traçabilité. |
| S5-04 | Facturation globale et codes promo (section 11.3) | `TODO` | Dépend de S4-12. |
| S5-05 | Statistiques produit cross-restaurants (section 11.4) | `TODO` | Réutilise `lib/analytics.ts` en élargissant la portée à tous les restaurants. |
| S5-06 | Notes de support internes (section 11.5) | `TODO` | Modèle `SuperAdminNote` déjà présent dans le schéma depuis le Sprint 0. |
| S5-07 | Vrai flux d'invitation d'équipe (section 10.7) | `TODO` | Remplace l'auto-provisionnement actuel, voir `CONTEXT.md` section 6. Bloquant avant d'ouvrir à plusieurs restaurants. |
| S5-08 | Pilote réel avec un restaurant montréalais | `TODO` | Objectif de fin de sprint selon la section 23. Nécessite de vrais modèles 3D de plats. |

---

## Chantiers hors cahier des charges

| # | Ticket | Statut | Notes |
|---|---|---|---|
| X-01 | Génération de modèle 3D instantanée par IA | `TODO` | Planification complète dans `docs/roadmap-ai-instant-3d.md`. Demande un comparatif de fournisseurs avant tout code. |

---

## Dette technique connue

Ces points ne bloquent rien aujourd'hui mais deviendront bloquants à
l'échelle. Détail et raisonnement dans `CONTEXT.md` section 4.

| # | Sujet | Statut | Devient bloquant quand |
|---|---|---|---|
| D-01 | Onboarding auto-provisionné (premier compte Clerk devient owner) | `TODO` | Dès le 2e restaurant client. |
| D-02 | Rate limiting en mémoire (`lib/scan.ts`) | `TODO` | Dès un déploiement multi-instance. |
| D-03 | Pas de conversion automatique `.glb` vers `.usdz` | `TODO` | Dès que les restaurateurs uploadent leurs propres modèles sans passer par le service de capture. |
| D-04 | Modèles 3D sur Cloudinary au lieu d'AWS S3 + CloudFront | `TODO` | Quand le volume ou le coût le justifie. |
| D-05 | Aucun test automatisé sur les routes API de facturation | `TODO` | Avant la première vraie transaction client. |

---

## Actions en attente côté Mouhamed

Récapitulatif de tout ce qui est bloqué et qui ne peut pas avancer sans
une action extérieure.

1. **Créer le compte Stripe** et renseigner les 8 variables d'environnement (S4-12). Checklist pas à pas dans `CONTEXT.md` section 4. C'est le seul blocage réel du Sprint 4.
2. **Exécuter l'`UPDATE` SQL dans Neon** pour relier les photos de plats au restaurant démo (S4-14).
3. **Tester et merger la PR #5** une fois la preview Vercel vérifiée.

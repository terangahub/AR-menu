# Contribuer à Vorae

Ce projet se développe exclusivement par Pull Request, sans exception — même
en phase de développement solo. Aucun push direct sur `main`.

## Branches

Convention de nommage :

- `feature/<sprint>-<description-courte>` — ex. `feature/s1-menu-2d-public`
- `fix/<description>` — ex. `fix/ar-fallback-android`
- `chore/<description>` — ex. `chore/update-deps`

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) obligatoire :

```
feat: ajoute le fallback 2D automatique sur échec AR
fix: corrige la génération QR code pour les tables > 99
chore: met à jour les dépendances Prisma
docs: documente le pipeline de conversion .glb vers .usdz
```

## Pull Requests

- Une PR par fonctionnalité ou correctif — jamais une PR fourre-tout couvrant
  plusieurs sprints.
- Description obligatoire : quoi, pourquoi, comment tester (voir le gabarit
  `.github/PULL_REQUEST_TEMPLATE.md`). Captures d'écran ou GIF pour tout
  changement visuel.
- CI (lint, typecheck, tests, build — voir `.github/workflows/ci.yml`) doit
  être au vert avant merge, sans exception.
- Revue de code requise avant merge.
- Squash-merge recommandé vers `main`.

## Protection de branche

`main` doit avoir la protection suivante activée dans les paramètres GitHub
du repository (Settings → Branches) :

- Require a pull request before merging
- Require status checks to pass before merging (job CI `lint-build-test`)
- Require branches to be up to date before merging

## Avant d'ouvrir une PR, en local

```bash
npm run lint
npm run typecheck
npm run test -- --run
npm run build
```

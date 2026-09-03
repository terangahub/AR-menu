# D'où viennent les 90 Mo d'un modèle de plat

Mesures réelles, faites depuis le dashboard sur des plats scannés par
Mouhamed, avec le panneau **D'où vient le poids du modèle** (`S9-01`).

Ce document existe parce que le chantier `S9-02` a failli partir dans la
mauvaise direction : l'intuition, la mienne comprise, désignait les
textures. Elle était fausse.

## Les mesures

| | Plat A | Plat B | Astronaute (démo) |
|---|---|---|---|
| GLB | 85,8 Mo | 89,4 Mo | 2,7 Mo |
| USDZ | absent | 58,3 Mo | 2,0 Mo |
| Textures | 2,4 Mo (2,8 %) | 2,7 Mo (3,0 %) | 2,6 Mo (94,2 %) |
| Géométrie | 83,4 Mo (97,2 %) | 86,7 Mo (97,0 %) | 160 Ko (5,7 %) |
| Triangles | 809 862 | 842 064 | 1 604 |
| Produit par | Khronos glTF Blender I/O | Khronos glTF Blender I/O | THREE.GLTFExporter |
| Dimensions | 223 x 227 x 417 cm | 261 x 247 x 475 cm | 112 x 201 x 72 cm |

## Ce que ça dit

**Le poids est de la géométrie, à 97 %.** Réduire ou recompresser les
textures ne changerait rien : elles pèsent 2,5 Mo sur 88. Toute l'énergie
doit aller au maillage.

**Le maillage compte 800 000 à 840 000 triangles pour une assiette.** Un
modèle confortable sur téléphone tient entre 20 000 et 100 000. Il y a donc
un facteur 10 à 40 à récupérer sur ce seul levier, avant même de parler de
compression.

**Le modèle mesure plus de quatre mètres dans une direction.** Une assiette
fait 26 cm. Ce n'est pas seulement un facteur d'échelle à corriger : un
volume de cette taille ne peut pas être une assiette, donc **le maillage
contient la table et l'arrière-plan**. C'est l'hypothèse formulée dès
l'ouverture de `S9-01` à propos du paramètre `isMask`, et elle est
maintenant appuyée par une mesure.

Conséquence pour `S9-09` : recadrer avant de mettre à l'échelle. Normaliser
d'abord reviendrait à ajuster la taille d'une scène entière au lieu de
celle du plat.

**L'astronaute de démonstration est l'exact inverse** : 94 % de textures,
1 604 triangles. Il ne dit donc rien du problème, et c'est pourtant sur lui
que la première analyse avait été lancée. Un cas témoin n'est représentatif
que s'il vient de la même chaîne de production.

## Ordre de travail qui en découle

1. **Recadrer** le maillage sur le plat, ce qui supprime la table et le
   fond. C'est le seul geste qui réduise à la fois le nombre de triangles
   et l'aberration de taille.
2. **Décimer** ce qui reste, en visant quelques dizaines de milliers de
   triangles.
3. **Mettre à l'échelle** pour qu'une assiette fasse une assiette.
4. **Compresser** (Draco ou meshopt) en dernier, sur un maillage déjà sain.

Les textures ne figurent pas dans cette liste, et c'est le résultat le plus
utile de la mesure.

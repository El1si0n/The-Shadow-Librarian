# Wiki - The Shadow Librarian

Bienvenue dans le document de référence du jeu. Ici sont listées toutes les fonctionnalités, améliorations, recherches et événements disponibles.

---

## 🏗️ Mécaniques Principales

### Ressources
- **Encre** : Ressource de base. Produite par clic ou passivement.
- **Pages** : Ressource secondaire. Nécessite de l'encre pour être créée (Manuel ou Auto).
- **Savoir Interdit** : Ressource de prestige. Obtenue après "Le Grand Incendie". Donne un bonus multiplicatif permanent sur TOUTE la production.

### Boucle de Jeu & Sauvegarde
Le jeu sauvegarde automatiquement toutes les ressources, bâtiments, recherches, artefacts et succès.

---

## 🛠️ Atelier (Améliorations)

Les améliorations ont un coût progressif (x1.15 par niveau).

**Note sur la Production** : Les taux affichés ci-dessous sont les valeurs de BASE. 
Vos taux réels sont multipliés par :
1. Les Recherches (x2 pour Bougies/Livraisons, +0.1 pour Apprentis).
2. Le Savoir Interdit (+10% / point).
3. Les Artefacts.

| ID | Nom | Coût Base | Production de Base | Déblocage |
| :--- | :--- | :--- | :--- | :--- |
| `better_quill` | Plume de Corbeau | 2 Pages | +1 Encre / Clic (Manuel) | 2 Pages |
| `tallow_candle` | Bougie de Graisse | 5 Pages | +1 Encre / Sec | 5 Pages |
| `ink_pot` | Encrier Profond | 15 P, 50 E | +10% Efficacité Clics | Scriptorium |
| `apprentice` | Apprenti Copiste | 25 Pages | 0.4 Page / Sec (Conso 5 Encre) | 35 Pages |
| `ink_delivery` | Livraison Clandestine | 50 Pages | +10 Encre / Sec | 75 Pages |
| `silent_scribe` | Scribe Muet | 150 Pages | 2 Pages / Sec (Conso 16 Encre) | 200 Pages |
| `shadow_well` | Puits d'Ombre | 200 Pages | +50 Encre / Sec | 300 Pages |
| `ink_press` | Presse Mécanique | 1000 Pages | 10 Pages / Sec (Conso 200 Encre) | 1500 Pages |

---

## 🔬 Recherche (Arbre Tech)

Débloqué en **Phase 2** (Scriptorium, après 100 Pages). Améliorations uniques.

| Nom | Coût | Effet | Condition |
| :--- | :--- | :--- | :--- |
| **Encre Concentrée** | 200 Encre | +1 Encre Base / Clic | 100 Encre Totale |
| **Raffinage du Suif** | 20 P, 300 E | Bougies x2 (Passif) | 5 Bougies |
| **Étude du Parchemin** | 50 Pages | -1 Coût Encre/Page | 50 Pages Totales |
| **Double Reliure** | 500 E, 150 P | +1 Page / Clic (Manuel) | 150 Pages Totales |
| **Plume en Os** | 300 P, 1000 E | Clic Multiplier x1.5 | 500 Pages Totales |
| **Réseau d'Apprentis** | 500 Pages | Apprentis +0.1 Page/s | 10 Apprentis |
| **Reliure en Croix** | 2000 E, 600 P | +2 Pages / Clic (Manuel) | 1000 Pages Totales |
| **Reliure de Cuir** | 800 Pages | Coût Page fixé à 8 Encre | Scriptorium |
| **Encre de Sang** | 2000 Pages | Clic x2, Coût Page +2 | Recherche 'Reliure de Cuir' |
| **Canalisations d'Ombre**| 1200 P, 5000 E | Livraisons x2 | 5 Livraisons |
| **Automates d'Ombre** | 5000 P, 20000 E | Passif Global x1.5 | 8000 Pages Totales |
| **Logique Non-Euclidienne**| 10k P, 50k E | Débloque Phase 3 (Architecte) | 20k Pages Totales |

---

## 🏺 Artefacts (Méta-Progression)

Les Artefacts sont des objets **permanents** conservés après un Grand Incendie (Reset).
Ils changent radicalement les règles du jeu.

| Artefact | Effet | Condition d'obtention (Probabilité) |
| :--- | :--- | :--- |
| **Objet Étrange** | Aucun (Lore) | Événement (>100 Pages, 20% si condition remplie) |
| **Lentille de Vérité** | **Coût des Améliorations -25%** | Suite de "Objet Étrange" (20%) |
| **Plume de Cendres** | **Départ Avancé** (Commence avec 1000 Pages + 5000 Encre + Scriptorium après Reset) | Événement Rarissime (>2000 Pages, chance très faible) |

---

## 📜 Événements & Probabilités

Le jeu vérifie les événements aléatoires toutes les **10 secondes** minimum.
**Chance de déclenchement** : 10% par seconde (1% par tick de jeu).

### Événements Narratifs (Logs)
Petites phrases d'ambiance ou gains mineurs.
- **Ressources** : Gain/Perte de quelques unités d'Encre ou de Pages.
- **Horreur** : Ambiance sonore ou visuelle ("Les murs saignent", "Un rat vous observe").

### Événements Majeurs (Popups)

| Titre | Condition | Probabilité (si condition remplie) | Choix |
| :--- | :--- | :--- | :--- |
| **Le Rat de Bibliothèque** | >10 Pages | 50% | Chasser (50% perte page) OU Donner Encre (10) |
| **Le Visiteur Égaré** | >50 Encre | 50% | Aider (+50 Encre), Voler (+5 Pages), Ignorer |
| **L'Encre Vivante** | >200 Encre | 50% | Éduquer (-50 Encre, +2 Pages), Bouteille (+20 Encre) |
| **Le Silence Pesant** | >500 Pages | 50% | Crier (Rien), Écrire (-5 Encre, +1 Page) |
| **Début d'Incendie** | >100 Pages | 50% | Étouffer (-20 Encre), Piétiner (Risque dégâts) |
| **Le Marchand Ambulant** | >50 Pages | 50% | Echange Pages contre Encre (Attention aux arnaques 40% !) |
| **L'Inspiration Soudaine** | >100 Encre | 50% | Écrire (-100 Encre, +15 Pages) OU Repos (+10 Encre) |
| **Le Murmure du Vide** | >500 Pages | 10% (Rare) | **Sacrifier 500 Pages** contre **1 Savoir Interdit** |

---

## 🔮 Le Grand Incendie (Prestige) & Corruption

Débloqué après **5000 Pages Totales**.

### Le Prestige
- **Action** : Réinitialise tout (Ressources, Bâtiments, Recherches).
- **Conservation** : **Artefacts** et **Succès**.
- **Gain** : **Savoir Interdit** = `Floor(Pages Totales / 5000)`.
- **Bonus** :
    - +10% Production Passive par point.
    - +5% Production Clics par point.

### La Corruption Visuelle
Plus vous accumulez de Savoir Interdit, plus le jeu devient instable.
- **1-30 Savoir** : Texte qui tremble, légers glitchs de couleur (Rare).
- **30+ Savoir** : Tremblements forts, **Blackout** (Écran noir flash) occasionnel.

---

## 🏆 Succès

Liste des hauts faits à accomplir. Les succès sont conservés à vie.

- **Premier Mot** : 1 Page.
- **Chapitre Un** : 100 Pages.
- **Livre Entier** : 1 000 Pages.
- **L'Usine à Mots** : 10 Apprentis.
- **Révolution Industrielle** : 20 Presses.
- **Armée des Ombres** : 100 Scribes Muets.
- **Tabula Rasa** : Effectuer un Grand Incendie.
- **Océan Noir** : 1 000 000 Encre.
- **Bibliothèque d'Alexandrie** : 1 000 000 Pages.
- **Savoir Interdit** : Avoir 10 Savoir.
- **La Fin est Proche** : Débloquer la fin du jeu.

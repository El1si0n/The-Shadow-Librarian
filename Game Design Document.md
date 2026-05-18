# Game Design Document: The Shadow Librarian

## 1. Vision du Projet
* **Titre :** The Shadow Librarian (Le Bibliothécaire de l'Ombre)
* **Genre :** Incremental / Idle / Narrative Web Game
* **Plateforme :** Navigateur Web (HTML5/CSS/JS)
* **Inspiration :** *Universal Paperclips*, *A Dark Room*
* **Style graphique :** Jeux de PS1

## 2. Synopsis Narratif
Le joueur commence comme un simple copiste dans une cave sombre, chargé de recopier des textes oubliés. Rapidement, il s'aperçoit que les mots qu'il transcrit influencent la réalité. La bibliothèque s'agrandit, devient infinie, et le joueur finit par manipuler les concepts fondamentaux de l'existence.

---

## 3. Mécaniques de Jeu (Core Loop)

### A. Ressources
| Ressource | Rôle | Obtention |
| :--- | :--- | :--- |
| **Encre** | Ressource de base | Clic manuel / Génération passive |
| **Pages** | Monnaie d'achat | Conversion de l'Encre |
| **Savoir Interdit** | Ressource de Prestige | "Le Grand Incendie" (Reset) |

### B. Boucle Principale
1. **Générer :** Cliquer pour obtenir de l'encre.
2. **Convertir :** Transformer l'encre en pages reliées.
3. **Investir :** Acheter des plumes automatiques et recruter des scribes.
4. **Débloquer :** Atteindre des paliers de pages pour révéler de nouveaux boutons et pans de l'histoire.

---

## 4. Progression & Évolution

### Phase 1 : La Cave (Début)
* **UI :** Interface minimaliste, texte blanc sur fond noir.
* **Actions :** "Tremper la plume", "Recruter un apprenti".
* **Événement de fin :** "La porte de la cave s'ouvre sur le Scriptorium".

### Phase 2 : Le Scriptorium (Milieu)
* **UI :** Apparition de jauges et de statistiques plus complexes.
* **Actions :** "Encre de Sang", "Traducteurs de l'Ombre", "Rayonnages Infinis".
* **Système :** Arbre de recherche pour améliorer l'efficacité des clics.

### Phase 3 : L'Architecte (Fin)
* **UI :** Effets visuels de distorsion (CSS glitch).
* **Actions :** "Effacer un souvenir", "Réécrire le destin", "Déchirer le voile".

---

## 5. Système de Prestige : "Le Grand Incendie"
Lorsque la progression ralentit, le joueur peut choisir de brûler sa bibliothèque.
* **Perte :** Toutes les ressources et bâtiments sont remis à zéro.
* **Gain :** Obtention de **Savoir Interdit** basé sur le nombre total de pages écrites.
* **Effet :** Chaque point de Savoir Interdit augmente de façon permanente la vitesse de production de +10%.

---

## 6. Architecture Technique (Stack Web)
* **Langage :** JavaScript (ES6+).
* **Interface :** HTML5 pour la structure, CSS3 pour l'ambiance "Dark Gothic".
* **Stockage :** `localStorage` pour sauvegarder la progression automatiquement.
* **Moteur :** Système de "Tick" (Boucle `setInterval` à 10hz ou 60hz) pour calculer les ressources par seconde.
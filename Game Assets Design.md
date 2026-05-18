# Game Assets Design: The Shadow Librarian

## 1. Direction Artistique & Palette de Couleurs

L'esthétique repose sur les limitations techniques de la PS1 : palette réduite, textures basse résolution, et ambiance "Dark Gothic".

### Palette "Shadow PS1" (Codes Hex)
* **`#0a080d` - Noir Profond (Fond) :** Noir teinté de violet/marron pour un effet vieilli.
* **`#c7c2b2` - Blanc Cassé (Texte) :** Pour un contraste doux.
* **`#8f806b` - Sépia Sombre (UI/Papier) :** Couleur principale des interfaces.
* **`#7a1f1f` - Rouge Sang (Highlight) :** Pour les actions critiques ou sacrifices.
* **`#4a6e4f` - Vert Maladif (Magie) :** Pour le "Savoir Interdit".
* **`#4d4a46` - Gris Pierre (Inactif) :** Pour les boutons désactivés.

---

## 2. Typographie (Fonts)

Privilégier les polices bitmap/pixelisées.

* **Texte Narratif & Titres :** Style RPG classique (Serif Pixel).
    * *Suggestions :* "Silver", "Pixel Operator", "Vagrant Story style".
* **Compteurs & Données :** Style Terminal (Monospace).
    * *Suggestions :* "Press Start 2P" (chiffres uniquement), "VT323".

---

## 3. UI & Textures (CSS Styles)

### A. Le "Chunky Button" (Style PS1)
Effet de faux relief 3D réalisé uniquement en CSS.

```css
.ps1-btn {
    font-family: 'VotrePolicePixel', serif;
    background-color: #8f806b;
    color: #0a080d;
    border: 4px solid;
    /* Faux relief lumière/ombre */
    border-top-color: #c7c2b2;
    border-left-color: #c7c2b2;
    border-right-color: #4d4a46;
    border-bottom-color: #4d4a46;
    padding: 10px 20px;
    text-transform: uppercase;
    cursor: pointer;
    image-rendering: pixelated;
    box-shadow: 2px 2px 0px #0a080d; /* Ombre portée dure */
}

.ps1-btn:active {
    background-color: #7d6f5c;
    border-top-color: #4d4a46;
    border-left-color: #4d4a46;
    border-right-color: #c7c2b2;
    border-bottom-color: #c7c2b2;
    box-shadow: none;
    transform: translate(2px, 2px);
}

.ps1-btn:disabled {
    background-color: #4d4a46;
    color: #8f806b;
    border-color: #4d4a46;
    cursor: not-allowed;
    box-shadow: none;
}

### B. Textures de Fond (Tiling)
* **Phase 1 (Cave) :** `64x64px`. Gris très foncé avec "noise" (bruit) léger.
* **Phase 2 (Parchemin) :** `128x128px`. Fibre de papier brute couleur sépia.
* **Overlay Global :** Une `div` en `position: fixed` avec une image transparente de "Scanlines" (lignes horizontales) pour l'effet écran cathodique.

---

## 4. Icônes (Pixel Art 32x32)
* **Encre :** Fiole carrée, liquide noir, plume d'oie.
* **Pages :** Pile de parchemins cornés avec texte illisible.
* **Savoir Interdit :** Crâne stylisé avec un 3ème œil vert brillant.
* **Le Grand Incendie :** Torche pixelisée à flamme vive.

---

## 5. Assets Audio
Le son doit être compressé et "crunchy".

### SFX (Effets courts)
* **`ink_dip.wav` :** Plongement liquide + grattement.
* **`page_turn.wav` :** Papier lourd et sec qu'on tourne.
* **`menu_buy.wav` :** "Ka-Ching" métallique ou "Blip" digital fort.
* **`fire_start.wav` :** Allumage violent de torche + crépitement.

### Ambiance (Loops)
* **Phase 1 :** Drone grave (basse fréquence) + goutte d'eau avec réverbération.
* **Phase 2 :** Grattements de plumes multiples + chuchotements lointains.
* **Phase 3 :** Drone instable + parasites numériques (glitchs audio).

---

## 6. Bonus : Effet "Glitch" (Phase 3)
Animation CSS pour déformer la réalité en fin de jeu.

```css
@keyframes reality-glitch {
  0% { transform: translate(0px, 0px); filter: hue-rotate(0deg); }
  20% { transform: translate(-3px, 1px); filter: hue-rotate(10deg) blur(0.5px); }
  40% { transform: translate(3px, -2px); filter: invert(0.1); }
  60% { transform: translate(-2px, 2px); filter: hue-rotate(-10deg); }
  80% { transform: translate(1px, -1px); opacity: 0.9; }
  100% { transform: translate(0px, 0px); filter: hue-rotate(0deg); }
}

.glitching-active {
    animation: reality-glitch 0.3s linear infinite;
    text-shadow: 2px 0 0 red, -2px 0 0 cyan;
}
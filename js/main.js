// Game State
let gameState = {
    resources: {
        ink: 0,
        pages: 0,
        forbiddenKnowledge: 0
    },
    upgrades: {}, // keys: upgradeId, value: count
    research: {}, // keys: researchId, value: boolean
    flags: {
        seenScriptorium: false, // Phase 2 triggered
        firstPage: false,
        upgradesVisible: false,
        researchVisible: false
    },
    stats: {
        totalPages: 0,
        totalInk: 0,
        lastPassiveRate: 0, // Volatile, for Omniscient Quill
        playTime: 0 // In seconds
    },
    startTime: Date.now()
};

// Config
const CONFIG = {
    inkPerClick: 1,
    inkPageCost: 10,
    tickRate: 100, // 10Hz
    clickMultiplier: 1, // Multiplier for manual clicks
    passiveMultiplier: 1, // Multiplier for passive gen
    pagesPerClick: 1 // Pages created per click
};

// --- DATA DEFINITIONS (Hoisted) ---

// Upgrade DB (Repeatable or stackable items)
const UPGRADES = [
    // --- Manual Buffs ---
    {
        id: 'better_quill',
        name: 'Plume de Corbeau',
        description: 'La pointe est plus fine. +1 Encre par clic.',
        baseCost: { pages: 2 },
        scale: 1.5,
        effect: () => { CONFIG.inkPerClick += 1; },
        trigger: (state) => state.stats.totalPages >= 2 || (state.upgrades['better_quill'] > 0)
    },
    {
        id: 'ink_pot',
        name: 'Encrier Profond',
        description: 'Moins de va-et-vient. Efficacité +10% clics.',
        baseCost: { pages: 15, ink: 50 },
        scale: 1.2,
        trigger: (state) => state.flags.seenScriptorium || (state.upgrades['ink_pot'] > 0),
        effect: () => { CONFIG.clickMultiplier *= 1.1; }
    },

    // --- Ink Generators (Sources) ---
    {
        id: 'tallow_candle',
        name: 'Bougie de Graisse',
        description: 'Chauffe l\'encre figée. +1 Encre / sec.',
        baseCost: { pages: 5 },
        scale: 1.15,
        passiveInk: 1,
        trigger: (state) => state.stats.totalPages >= 5 || (state.upgrades['tallow_candle'] > 0)
    },
    {
        id: 'ink_delivery',
        name: 'Livraison Clandestine',
        description: 'Des fioles déposées devant la porte. +10 Encre / sec.',
        baseCost: { pages: 50 },
        scale: 1.15,
        passiveInk: 10,
        trigger: (state) => state.stats.totalPages >= 75 || (state.upgrades['ink_delivery'] > 0)
    },
    {
        id: 'shadow_well',
        name: 'Puits d\'Ombre',
        description: 'Puise directement dans les ténèbres. +50 Encre / sec.',
        baseCost: { pages: 200 },
        scale: 1.15,
        passiveInk: 50,
        trigger: (state) => state.stats.totalPages >= 300 || (state.upgrades['shadow_well'] > 0)
    },

    // --- Page Producers (Consumers) ---
    {
        id: 'apprentice',
        name: 'Apprenti Copiste',
        description: 'Relie 1 page / 2.5 sec. (Consomme de l\'encre)',
        baseCost: { pages: 25 },
        scale: 1.15,
        passivePage: 0.4, // Pages per second
        trigger: (state) => state.stats.totalPages >= 35 || (state.upgrades['apprentice'] > 0)
    },
    {
        id: 'silent_scribe',
        name: 'Scribe Muet',
        description: 'Relie 2 pages / sec. (Consomme de l\'encre)',
        baseCost: { pages: 150 },
        scale: 1.15,
        passivePage: 2,
        trigger: (state) => state.stats.totalPages >= 200 || (state.upgrades['silent_scribe'] > 0)
    },
    {
        id: 'ink_press',
        name: 'Presse Mécanique',
        description: 'Production de masse. 10 pages / sec.',
        baseCost: { pages: 1000 },
        scale: 1.15,
        passivePage: 10,
        trigger: (state) => state.stats.totalPages >= 1500 || (state.upgrades['ink_press'] > 0)
    }
];

// Research DB (One-time unlocks that change mechanics or unlock phases)
const RESEARCH = [
    // --- Early Efficiency (Pre-Scriptorium) ---
    {
        id: 'concentrated_ink',
        name: 'Encre Concentrée',
        description: 'Une recette plus épaisse. +5 Encre/clic.',
        cost: { ink: 500 },
        trigger: (state) => state.stats.totalInk >= 100 || state.research['concentrated_ink'],
        effect: () => {
            CONFIG.inkPerClick += 5;
            Narrative.log("Une encre plus noire, plus lourde.");
        }
    },
    {
        id: 'tallow_processing',
        name: 'Raffinage du Suif',
        description: 'Les bougies brûlent plus longtemps. Bougies x2.',
        cost: { pages: 20, ink: 300 },
        trigger: (state) => (state.upgrades['tallow_candle'] >= 5) || state.research['tallow_processing'],
        effect: () => {
            Narrative.log("Les flammes sont plus vives.");
        }
    },
    {
        id: 'parchment_study',
        name: 'Étude du Parchemin',
        description: 'Optimisation de l\'espace. Coût -1 Encre/Page.',
        cost: { pages: 50 },
        trigger: (state) => state.stats.totalPages >= 50 || state.research['parchment_study'],
        effect: () => {
            CONFIG.inkPageCost -= 1;
            Narrative.log("On peut écrire plus petit.");
        }
    },

    // --- Mid Game (Scriptorium Entry) ---
    {
        id: 'double_binding',
        name: 'Double Reliure',
        description: 'Deux pages à la fois. +1 Page/clic.',
        cost: { ink: 1000, pages: 150 },
        trigger: (state) => state.stats.totalPages >= 150 || state.research['double_binding'],
        effect: () => {
            CONFIG.pagesPerClick += 1;
            Narrative.log("Les mains s'activent plus vite.");
        }
    },
    {
        id: 'quad_binding',
        name: 'Reliure en Croix',
        description: 'Quatre pages à la fois. +2 Pages/clic.',
        cost: { ink: 2000, pages: 600 },
        trigger: (state) => state.stats.totalPages >= 1000 || state.research['quad_binding'],
        effect: () => {
            CONFIG.pagesPerClick += 2;
            Narrative.log("Une symétrie parfaite.");
        }
    },
    {
        id: 'bone_quill',
        name: 'Plume en Os',
        description: 'Vibre au toucher. Clics x1.5.',
        cost: { pages: 300, ink: 1000 },
        trigger: (state) => state.stats.totalPages >= 500 || state.research['bone_quill'],
        effect: () => {
            CONFIG.clickMultiplier *= 1.5;
            Narrative.log("L'os semble aspirer l'encre de lui-même.");
        }
    },
    {
        id: 'apprentice_network',
        name: 'Réseau d\'Apprentis',
        description: 'Ils s\'organisent. Apprentis +0.1 Page/s chacun.',
        cost: { pages: 500 },
        trigger: (state) => state.upgrades['apprentice'] >= 10 || state.research['apprentice_network'],
        effect: () => {
            Narrative.log("Ils murmurent en chœur.");
        }
    },

    // --- Late Game / Occult ---
    {
        id: 'leather_binding',
        name: 'Reliure de Cuir',
        description: 'Robuste et noble. Coût des pages fixé à 8 Encre.',
        cost: { pages: 800 },
        trigger: (state) => state.flags.seenScriptorium || state.research['leather_binding'],
        effect: () => {
            CONFIG.inkPageCost = 8;
            Narrative.log("Le cuir grince agréablement.");
        }
    },
    {
        id: 'ink_supply_chain',
        name: 'Canalisations d\'Ombre',
        description: 'L\'encre coule dans les murs. Livraisons x2.',
        cost: { pages: 1200, ink: 5000 },
        trigger: (state) => state.upgrades['ink_delivery'] >= 5 || state.research['ink_supply_chain'],
        effect: () => {
            Narrative.log("Les murs suintent.");
        }
    },
    {
        id: 'blood_ink',
        name: 'Encre de Sang',
        description: 'Vitalité sacrifiée. Clics x2, mais coût Page +2 Encre.',
        cost: { pages: 2000 },
        trigger: (state) => state.research['leather_binding'] || state.research['blood_ink'],
        effect: () => {
            CONFIG.clickMultiplier *= 2;
            CONFIG.inkPageCost += 2;
            Narrative.log("Le liquide carmin sèche vite. Les mots sont indélébiles.");
        }
    },
    {
        id: 'shadow_automation',
        name: 'Automates d\'Ombre',
        description: 'La bibliothèque s\'écrit elle-même. Production passive x1.5.',
        cost: { pages: 5000, ink: 20000 },
        trigger: (state) => state.stats.totalPages >= 8000 || state.research['shadow_automation'],
        effect: () => {
            CONFIG.passiveMultiplier *= 1.5;
            Narrative.log("Les plumes bougent seules.");
        }
    },

    // --- Endgame ---
    {
        id: 'infinite_logic',
        name: 'Logique Non-Euclidienne',
        description: 'Comprendre l\'infini. Débloque la Phase Finale.',
        cost: { pages: 10000, ink: 50000 },
        trigger: (state) => state.stats.totalPages >= 20000 || state.research['infinite_logic'],
        effect: () => {
            Narrative.log("Les murs reculent. La bibliothèque n'a plus de fin.");
            document.body.classList.add('phase-3-ready');
            changeBackground('occulte.png');
            if (ui.tabArchitect) ui.tabArchitect.style.display = 'block';
            gameState.research['infinite_shelves'] = true; // Legacy support flag
        }
    }
];

// ARTIFACTS (Found via Events)
const ARTIFACTS = [
    {
        id: 'artifact_strange_object',
        name: 'Objet Étrange', // Intermediate item
        description: 'Un petit objet métallique qui vibre.',
        bonusDescription: 'Aucun effet connu (pour l\'instant).',
        hidden: false
    },
    {
        id: 'artifact_lens',
        name: 'Lentille de Vérité',
        description: 'Permet de voir les rouages de l\'économie.',
        bonusDescription: 'Coût des Améliorations -25% (Passif)',
        trigger: (state) => state.flags['artifact_lens'],
        apply: (rates) => { /* Logic handled in getUpgradeCost */ }
    },
    {
        id: 'artifact_ash_quill',
        name: 'Plume de Cendres',
        description: 'L\'histoire refuse d\'être effacée.',
        bonusDescription: 'Départ Avancé (1000 Pages + Scriptorium) après Incendie',
        trigger: (state) => state.flags['artifact_ash_quill'],
        apply: (rates) => { /* Logic handled in prestigeReset */ }
    }
];

// Architect Actions (Phase 3)
const ARCHITECT_ACTIONS = [
    {
        id: 'reality_engine',
        name: 'Moteur de Réalité',
        description: 'Overclocker la simulation. Production passive x2.',
        cost: { knowledge: 1 },
        trigger: (state) => state.research['infinite_shelves'],
        effect: () => {
            CONFIG.passiveMultiplier *= 2;
            Narrative.log("L'univers tourne plus vite.");
        }
    },
    {
        id: 'omniscient_quill',
        name: 'Plume Omnisciente',
        description: 'Écrire l\'avenir. Clics = +5% de la production passive / sec.',
        cost: { knowledge: 3 },
        trigger: (state) => state.research['reality_engine'], // Unlock after engine
        effect: () => {
            Narrative.log("La plume précède votre pensée.");
        }
    },
    {
        id: 'temporal_glitch',
        name: 'Glitch Temporel',
        description: 'Le temps saute. Production x3, mais consomme 1% des pages/s.',
        cost: { knowledge: 2 },
        trigger: (state) => state.research['reality_engine'],
        effect: () => {
            CONFIG.passiveMultiplier *= 3;
            Narrative.log("Les secondes se répètent. Les secondes se répètent.");
        }
    },
    {
        id: 'code_injection',
        name: 'Injection de Code',
        description: 'Réécrire les lois physiques. Clics +500% efficacité.',
        cost: { knowledge: 5 },
        trigger: (state) => state.research['omniscient_quill'],
        effect: () => {
            CONFIG.clickMultiplier *= 5;
            Narrative.log("L'univers obéit.");
        }
    },
    {
        id: 'tear_veil',
        name: 'Déchirer le Voile',
        description: 'La réalité est une page mal écrite. La brûler pour réécrire le destin. (FIN)',
        cost: { knowledge: 10 },
        trigger: (state) => state.research['code_injection'],
        effect: () => {
            triggerEndingSequence();
        }
    }
];

function triggerEndingSequence() {
    // Cinematic Ending
    document.body.style.transition = "opacity 2s ease";
    document.body.style.opacity = "0";

    setTimeout(() => {
        document.body.innerHTML = '';
        document.body.style.backgroundColor = 'black';
        document.body.style.color = '#AA0000';
        document.body.style.display = 'flex';
        document.body.style.flexDirection = 'column';
        document.body.style.justifyContent = 'center';
        document.body.style.alignItems = 'center';
        document.body.style.height = '100vh';
        document.body.style.fontFamily = "'VT323', monospace";
        document.body.style.fontSize = '2rem';
        document.body.style.opacity = "1";

        const lines = [
            "VOUS AVEZ DÉPASSÉ L'AUTORITÉ DE L'ARCHITECTE.",
            "LA BIBLIOTHÈQUE EST MAINTENANT VÔTRE.",
            "MAIS QU'EST-CE QU'UNE BIBLIOTHÈQUE...",
            "...SANS LECTEUR ?"
        ];

        let i = 0;
        function showLine() {
            if (i < lines.length) {
                const p = document.createElement('p');
                p.textContent = lines[i];
                p.style.opacity = 0;
                p.style.transition = "opacity 1s";
                document.body.appendChild(p);

                // Fade in
                setTimeout(() => p.style.opacity = 1, 100);

                i++;
                setTimeout(showLine, 3000);
            } else {
                setTimeout(() => {
                    // --- STATISTICS SCREEN ---
                    const statsDiv = document.createElement('div');
                    statsDiv.style.marginTop = "30px";
                    statsDiv.style.fontSize = "1rem";
                    statsDiv.style.color = "#888";
                    statsDiv.style.textAlign = "center";
                    statsDiv.style.opacity = "0";
                    statsDiv.style.transition = "opacity 2s";

                    const timeStr = formatTime(gameState.stats.playTime);
                    const ink = formatNumber(gameState.stats.totalInk);
                    const pages = formatNumber(gameState.stats.totalPages);

                    statsDiv.innerHTML = `
                        <h3 style="color: gold; margin-bottom: 15px;">STATISTIQUES DE LA PARTIE</h3>
                        <p>Temps de Jeu : <span style="color: white;">${timeStr}</span></p>
                        <p>Encre Totale Produite : <span style="color: white;">${ink}</span></p>
                        <p>Pages Totales Reliées : <span style="color: white;">${pages}</span></p>
                        <p>Savoir Interdit Acquis : <span style="color: white;">${gameState.resources.forbiddenKnowledge}</span></p>
                    `;
                    document.body.appendChild(statsDiv);
                    setTimeout(() => statsDiv.style.opacity = 1, 500);

                    const btn = document.createElement('button');
                    btn.className = 'ps1-btn big-btn';
                    btn.textContent = "RECOMMENCER LA SIMULATION";
                    btn.style.marginTop = "30px";
                    btn.onclick = () => {
                        // Preserve Achievements but Reset everything else
                        const preservedAchievements = gameState.achievements || [];

                        // Update GLOBAL state directly so saveGame() sees the reset
                        gameState = {
                            resources: { ink: 0, pages: 0, forbiddenKnowledge: 0 },
                            upgrades: {},
                            research: {},
                            flags: { seenScriptorium: false, firstPage: false, upgradesVisible: false, researchVisible: false },
                            stats: { totalPages: 0, totalInk: 0, lastPassiveRate: 0, playTime: 0 },
                            achievements: preservedAchievements,
                            startTime: Date.now()
                        };

                        // Force save of the new state
                        saveGame();

                        // Reload
                        location.reload();
                    };
                    document.body.appendChild(btn);
                }, 4000);
            }
        }
        showLine();
    }, 2000);
}

// DOM Elements
const ui = {
    get inkCount() { return document.getElementById('ink-count'); },
    get pageCount() { return document.getElementById('page-count'); },
    get btnGenerateInk() { return document.getElementById('btn-generate-ink'); },
    get btnCreatePage() { return document.getElementById('btn-create-page'); },

    get upgradeList() { return document.getElementById('upgrade-list'); },
    get researchList() { return document.getElementById('research-list'); },
    get architectList() { return document.getElementById('architect-list'); },

    get panelUpgrades() { return document.getElementById('panel-content-upgrades'); },
    get panelResearch() { return document.getElementById('panel-content-research'); },
    get panelArchitect() { return document.getElementById('panel-content-architect'); },
    get tabResearch() { return document.getElementById('tab-research'); },
    get tabArchitect() { return document.getElementById('tab-architect'); },
    get panelArchives() { return document.getElementById('panel-archives'); },
    get archiveList() { return document.getElementById('archive-list'); },

    get btnInkSub() { return document.querySelector('#btn-generate-ink .btn-subtext'); },
    get btnPageSub() { return document.querySelector('#btn-create-page .btn-subtext'); },
    get btnPrestige() { return document.getElementById('btn-prestige'); }
};

// --- LOGIC ---

function formatNumber(num) {
    if (!num && num !== 0) return "0";
    if (num < 1000000) {
        // Use spaces as separators: "1 234", "10 500", "900 000"
        return Math.floor(num).toLocaleString('fr-FR');
    }

    // Larger numbers: use suffixes
    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx"];
    const suffixNum = Math.floor(Math.log10(num) / 3);

    const shortValue = (num / Math.pow(1000, suffixNum));
    // Display with 2 decimals if needed
    return shortValue.toFixed(2) + " " + (suffixes[suffixNum] || "e" + suffixNum * 3);
}

function formatTime(seconds) {
    if (!seconds) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getUpgradeCost(item, count) {
    // If it's a fixed cost items (Research/Architect), use cost directly
    if (!item.baseCost) return item.cost;

    // Geometric sequence: Base * (Scale ^ Count)
    const scale = item.scale || 1.15;
    let costMult = 1.0;

    // Artifact Bonus: Lens of Truth (-25% Cost)
    if (gameState.flags['artifact_lens']) {
        costMult = 0.75;
    }

    const multiplier = Math.pow(scale, count) * costMult;

    const newCost = {};
    if (item.baseCost.pages) newCost.pages = Math.floor(item.baseCost.pages * multiplier);
    if (item.baseCost.ink) newCost.ink = Math.floor(item.baseCost.ink * multiplier);

    return newCost;
}

function saveGame() {
    localStorage.setItem('shadowLibrarianSave', JSON.stringify(gameState));
}

function changeBackground(imageName) {
    document.body.style.backgroundImage = `url('image/${imageName}')`;
}

function spawnFeedback(x, y, text, type) {
    const el = document.createElement('div');
    el.className = `click-feedback ${type}-feedback`;
    el.innerHTML = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    // Random jitter
    const jitterX = (Math.random() - 0.5) * 40;
    el.style.left = `${x + jitterX}px`;

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function loadGame() {
    const saved = localStorage.getItem('shadowLibrarianSave');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = {
                ...gameState,
                ...parsed,
                resources: { ...gameState.resources, ...parsed.resources },
                // Merge flags carefully
                flags: { ...gameState.flags, ...(parsed.flags || {}) },
                // Merge stats, defaulting totalPages to current pages if missing (legacy save compatibility)
                stats: {
                    totalPages: parsed.stats?.totalPages || parsed.resources?.pages || 0,
                    totalInk: parsed.stats?.totalInk || parsed.resources?.ink || 0,
                    lastPassiveRate: 0,
                    playTime: parsed.stats?.playTime || 0
                },
                achievements: parsed.achievements || []
            };

            // Re-calculate derived stats from save state
            // 1. Reset base
            CONFIG.inkPerClick = 1;
            CONFIG.clickMultiplier = 1;
            CONFIG.passiveMultiplier = 1;
            CONFIG.inkPageCost = 10;
            CONFIG.pagesPerClick = 1;

            // 2. Apply Upgrades (Manual Buffs only affecting CONFIG)
            if (gameState.upgrades['better_quill']) {
                CONFIG.inkPerClick += (gameState.upgrades['better_quill']);
            }
            if (gameState.upgrades['ink_pot']) {
                CONFIG.clickMultiplier *= Math.pow(1.1, gameState.upgrades['ink_pot']);
            }

            // 3. Apply Research (Restore State)
            if (gameState.research['concentrated_ink']) CONFIG.inkPerClick += 1;
            if (gameState.research['parchment_study']) CONFIG.inkPageCost -= 1;
            if (gameState.research['bone_quill']) CONFIG.clickMultiplier *= 1.5;
            if (gameState.research['double_binding']) CONFIG.pagesPerClick += 1;
            if (gameState.research['quad_binding']) CONFIG.pagesPerClick += 2;

            if (gameState.research['leather_binding']) CONFIG.inkPageCost = 8;

            if (gameState.research['blood_ink']) {
                CONFIG.clickMultiplier *= 2;
                CONFIG.inkPageCost += 2;
            }
            if (gameState.research['shadow_automation']) {
                CONFIG.passiveMultiplier *= 1.5;
            }
            if (gameState.research['reality_engine']) {
                CONFIG.passiveMultiplier *= 2;
            }

            if (gameState.research['infinite_logic'] || gameState.research['infinite_shelves']) {
                document.body.classList.add('phase-3-ready');
                changeBackground('occulte.png');
            }

            // 4. Apply Prestige Bonus - MOVED TO DYNAMIC CALCULATION
            // if (gameState.resources.forbiddenKnowledge > 0) {
            //     CONFIG.passiveMultiplier *= (1 + (gameState.resources.forbiddenKnowledge * 0.1));
            //     CONFIG.clickMultiplier *= (1 + (gameState.resources.forbiddenKnowledge * 0.05));
            // }

            // Visual restore
            if (gameState.research['infinite_logic'] || gameState.research['infinite_shelves']) {
                changeBackground('occulte.png');
                document.body.classList.add('phase-3-ready');
            } else if (gameState.flags.seenScriptorium) {
                changeBackground('scriptorium.png');
            }

            Narrative.log("Retour au Scriptorium.");
        } catch (e) {
            console.error("Save file corrupted", e);
        }

        // Ensure UI state matches GameState
        checkUnlocks();
        if (window.Achievements) window.Achievements.render(gameState);
    } else {
        Narrative.log("Le pot d'encre est plein. La première page est vierge.");
    }

    // UI Init
    setupTabs();
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel-content').forEach(p => p.classList.add('hidden'));

            // Activate clicked
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            document.getElementById(`panel-content-${target}`).classList.remove('hidden');
        });
    });
}

// Core Actions
function generateInk(amount = null, event = null) {
    let actualAmount = amount;
    if (actualAmount === null) {
        let clickMult = CONFIG.clickMultiplier;
        // Prestige Click Bonus
        if (gameState.resources.forbiddenKnowledge > 0) {
            clickMult *= (1 + (gameState.resources.forbiddenKnowledge * 0.05)); // +5% per point
        }
        actualAmount = CONFIG.inkPerClick * clickMult;
    }

    if (event) {
        let text = `+${actualAmount.toFixed(1)}`;
        if (gameState.research['omniscient_quill']) {
            if (gameState.stats.lastPassiveRate && gameState.stats.lastPassiveRate > 0) {
                const bonus = gameState.stats.lastPassiveRate * 0.05;
                actualAmount += bonus;
                text += ` (+${bonus.toFixed(1)})`;
            }
        }
        spawnFeedback(event.clientX, event.clientY, text, 'ink');
    }

    gameState.resources.ink += actualAmount;
    gameState.stats.totalInk += actualAmount;
    updateUI();
}

function createPage(event = null) {
    const batchSize = CONFIG.pagesPerClick || 1;
    const totalCost = CONFIG.inkPageCost * batchSize;

    if (gameState.resources.ink >= totalCost) {
        gameState.resources.ink -= totalCost;
        gameState.resources.pages += batchSize;
        gameState.stats.totalPages += batchSize;

        if (event) {
            spawnFeedback(event.clientX, event.clientY, `+${batchSize}`, 'page');
        }

        checkUnlocks();
        updateUI();
    }
}

function checkUnlocks() {
    // Phase 1 -> 2 Transition
    if (gameState.resources.pages >= 100 && !gameState.flags.seenScriptorium) {
        gameState.flags.seenScriptorium = true;
        gameState.flags.researchVisible = true;

        Narrative.log("La porte de la cave s'ouvre. Le Scriptorium s'étend à l'infini.");
        changeBackground('scriptorium.png');

        ui.tabResearch.style.display = 'block';
    }


    // Prestige Unlock
    if (gameState.stats.totalPages >= 5000) {
        if (ui.btnPrestige && ui.btnPrestige.classList.contains('hidden')) {
            ui.btnPrestige.classList.remove('hidden');
        }
    }

    // Narrative events
    if (gameState.resources.pages === 1 && !gameState.flags.firstPage) {
        gameState.flags.firstPage = true;
        Narrative.log("Vous avez relié votre première page. Les mots semblent vibrer.");
    }

    renderShop();
}

function prestigeReset() {
    const knowledgePerPoint = 5000;
    const pendingKnowledge = Math.floor(gameState.stats.totalPages / knowledgePerPoint);

    const currentKnowledge = gameState.resources.forbiddenKnowledge;
    const newTotalKnowledge = Math.floor(gameState.stats.totalPages / knowledgePerPoint);

    // Check if it's worth it
    if (newTotalKnowledge <= gameState.resources.forbiddenKnowledge) {
        return false;
    }

    // Preserve Artifacts
    const preservedFlags = {};
    for (const key in gameState.flags) {
        if (key.startsWith('artifact_')) {
            preservedFlags[key] = gameState.flags[key];
        }
    }

    gameState = {
        resources: {
            ink: preservedFlags['artifact_ash_quill'] ? 5000 : 0,
            pages: preservedFlags['artifact_ash_quill'] ? 1000 : 0,
            forbiddenKnowledge: newTotalKnowledge
        },
        upgrades: {},
        research: {},
        flags: {
            ...preservedFlags, // Restore artifacts
            seenScriptorium: preservedFlags['artifact_ash_quill'] ? true : false, // Ash Quill skips phase 1
            firstPage: preservedFlags['artifact_ash_quill'] ? true : false,
            upgradesVisible: preservedFlags['artifact_ash_quill'] ? true : false, // Assuming 1000 pages unlocks upgrades
            researchVisible: preservedFlags['artifact_ash_quill'] ? true : false
        },
        stats: {
            totalPages: gameState.stats.totalPages + (preservedFlags['artifact_ash_quill'] ? 1000 : 0),
            totalInk: gameState.stats.totalInk + (preservedFlags['artifact_ash_quill'] ? 5000 : 0),
            lastPassiveRate: 0,
            lastRunDuration: gameState.stats.playTime, // Capture duration for achievement
            playTime: 0 // Reset for speedrun purposes
        },
        achievements: gameState.achievements || [], // Preserve Achievements
        startTime: Date.now()
    };

    saveGame();
    location.reload();
    return true;
}

// Rendering
function renderArchitect() {
    if (!gameState.research['infinite_shelves']) return;

    ARCHITECT_ACTIONS.forEach(action => {
        if (action.trigger(gameState)) {
            renderShopItem(action, 'architect');
        }
    });
}

function renderArchives() {
    // Check if we have any artifacts
    const foundArtifacts = ARTIFACTS.filter(a => gameState.flags[a.id]);

    if (foundArtifacts.length > 0) {
        if (ui.panelArchives && ui.panelArchives.classList.contains('hidden')) {
            ui.panelArchives.classList.remove('hidden');
        }

        const container = ui.archiveList;
        if (!container) return;

        // Clear only if needed or just append? 
        // Simplest: clear list part (keeping the quote at bottom is hard if we clear innerHTML)
        // Let's just rebuild the items.

        foundArtifacts.forEach(item => {
            if (document.getElementById(`artifact-${item.id}`)) return; // Already rendered

            const el = document.createElement('div');
            el.id = `artifact-${item.id}`;
            el.className = 'upgrade-item'; // Reuse style
            el.style.border = '1px solid #444';
            el.style.color = '#aaa';
            el.style.marginBottom = '10px';
            el.style.padding = '10px';

            el.innerHTML = `
                <strong style="color: #F2CB57;">${item.name}</strong>
                <div style="font-size: 0.9em; color: #C7C2B2;">${item.description}</div>
                ${item.bonusDescription ? `<div class="artifact-bonus">${item.bonusDescription}</div>` : ''}
            `;

            // Insert before the quote?
            container.insertBefore(el, container.firstChild);
        });
    }
}

function renderShop() {
    let lastUpgradeEl = null;
    UPGRADES.forEach(upgrade => {
        if (upgrade.trigger(gameState)) {
            lastUpgradeEl = renderShopItem(upgrade, 'upgrade', lastUpgradeEl);
        } else {
            const el = document.getElementById(`upgrade-${upgrade.id}`);
            if (el) el.remove();
        }
    });

    if (gameState.flags.researchVisible) {
        let lastResearchEl = null;
        RESEARCH.forEach(res => {
            if (res.trigger(gameState)) {
                lastResearchEl = renderShopItem(res, 'research', lastResearchEl);
            } else {
                const el = document.getElementById(`research-${res.id}`);
                if (el) el.remove();
            }
        });
    }

    renderArchitect();
    renderArchives();
}

function renderShopItem(item, type, previousSibling = null) {
    let listId;
    if (type === 'upgrade') listId = 'upgrade-list';
    else if (type === 'research') listId = 'research-list';
    else if (type === 'architect') listId = 'architect-list';

    const container = document.getElementById(listId);
    let el = document.getElementById(`${type}-${item.id}`);

    const count = (type === 'upgrade') ? (gameState.upgrades[item.id] || 0) : (gameState.research[item.id] ? 1 : 0);
    const isBoughtOneTime = (type === 'research' && count > 0);

    if (isBoughtOneTime && type !== 'upgrade') {
        if (el) el.remove();
        return previousSibling;
    }

    // Calculate Dynamic Cost
    const currentCost = (type === 'upgrade') ? getUpgradeCost(item, count) : item.cost;

    if (!el) {
        el = document.createElement('button');
        el.id = `${type}-${item.id}`;
        el.className = 'upgrade-item ps1-btn';
        el.style.display = 'flex';
        el.style.width = '100%';
        el.style.justifyContent = 'space-between';
        el.style.alignItems = 'center';
        el.style.marginBottom = '10px';
        el.style.textAlign = 'left';

        // Architect Items have special styling (Red)
        if (type === 'architect') {
            el.style.borderColor = "#AA0000";
            el.style.color = "#AA0000";
        }

        // Inner HTML structure init
        el.innerHTML = `
            <div class="info" style="flex:1;">
                <strong style="display:block;">${item.name} <span class="count"></span></strong>
                <small class="desc-text" style="opacity:0.8;">${item.description}</small>
            </div>
            <div class="cost" style="text-align:right; font-size:0.9em; margin-left:10px;"></div>
        `;

        el.onclick = () => buyItem(item, type);
    }

    // Insert into DOM if not attached
    if (!el.parentNode) {
        if (type === 'architect') {
            // Append for architect (simple list)
            container.appendChild(el);
        } else {
            // Strict ordering for others
            if (previousSibling) {
                if (previousSibling.nextElementSibling !== el) {
                    container.insertBefore(el, previousSibling.nextElementSibling);
                }
            } else {
                if (container.firstElementChild !== el) {
                    container.prepend(el);
                }
            }
        }
    }

    // Dynamic Description Update
    const descEl = el.querySelector('.desc-text');
    if (descEl) {
        let desc = item.description;
        // Calculate dynamic rate if it's a producer
        if (item.passiveInk) {
            let mult = CONFIG.passiveMultiplier;

            // Prestige
            if (gameState.resources.forbiddenKnowledge > 0) {
                mult *= (1 + (gameState.resources.forbiddenKnowledge * 0.1));
            }
            // Artifacts
            const artifactRates = { inkMultiplier: 1.0, pageMultiplier: 1.0 };
            ARTIFACTS.forEach(artifact => {
                if (gameState.flags[artifact.id] && artifact.apply) {
                    artifact.apply(artifactRates);
                }
            });

            const rate = item.passiveInk * mult * artifactRates.inkMultiplier;
            // Replace the static text with dynamic one using regex
            // Original: "+1 Encre / sec" or "+10 Encre / sec"
            desc = desc.replace(/\+(\d+) Encre \/ sec/, `+${rate.toFixed(1)} Encre / sec`);
        }
        else if (item.passivePage) {
            let mult = CONFIG.passiveMultiplier;
            // Prestige
            if (gameState.resources.forbiddenKnowledge > 0) {
                mult *= (1 + (gameState.resources.forbiddenKnowledge * 0.1));
            }
            // Artifacts
            const artifactRates = { inkMultiplier: 1.0, pageMultiplier: 1.0 };
            ARTIFACTS.forEach(artifact => {
                if (gameState.flags[artifact.id] && artifact.apply) {
                    artifact.apply(artifactRates);
                }
            });

            const rate = item.passivePage * mult * artifactRates.pageMultiplier;

            // Regex replacements for Page Producers
            // Apprenti: "Relie 1 page / 2.5 sec."
            if (item.id === 'apprentice') {
                desc = desc.replace(/Relie 1 page \/ 2.5 sec/, `Prod: ${rate.toFixed(1)} pages / sec`);
            }
            // Scribe: "Relie 2 pages / sec."
            else if (item.id === 'silent_scribe') {
                desc = desc.replace(/Relie 2 pages \/ sec/, `Prod: ${rate.toFixed(1)} pages / sec`);
            }
            // Presse: "10 pages / sec."
            else if (item.id === 'ink_press') {
                desc = desc.replace(/10 pages \/ sec/, `Prod: ${rate.toFixed(1)} pages / sec`);
            }
        }
        descEl.textContent = desc;
    }

    // Update Text (Cost & Count)
    const costDiv = el.querySelector('.cost');
    if (costDiv) {
        costDiv.style.display = 'flex';
        costDiv.style.flexDirection = 'column';
        costDiv.style.alignItems = 'flex-end';

        let html = '';
        if (currentCost.knowledge) html += `<div style="color: #AA0000; font-weight:bold;">${currentCost.knowledge} Savoir</div>`;
        if (currentCost.ink) html += `<div>${formatNumber(currentCost.ink)} E</div>`;
        if (currentCost.pages) html += `<div>${formatNumber(currentCost.pages)} P</div>`;
        costDiv.innerHTML = html;
    }

    const countLabel = el.querySelector('.count');
    if (countLabel) {
        countLabel.textContent = (count > 0 && type === 'upgrade') ? `(x${count})` : '';
        countLabel.style.color = '#AA0000';
    }

    // Affordability Check
    let canAfford = true;
    if (currentCost.pages && gameState.resources.pages < currentCost.pages) canAfford = false;
    if (currentCost.ink && gameState.resources.ink < currentCost.ink) canAfford = false;
    if (currentCost.knowledge && gameState.resources.forbiddenKnowledge < currentCost.knowledge) canAfford = false;

    if (el.disabled !== !canAfford) {
        el.disabled = !canAfford;
    }
    el.classList.toggle('disabled', !canAfford);

    return el;
}

function buyItem(item, type) {
    const count = (type === 'upgrade') ? (gameState.upgrades[item.id] || 0) : 0;
    const currentCost = (type === 'upgrade') ? getUpgradeCost(item, count) : item.cost;

    if (currentCost.pages && gameState.resources.pages < currentCost.pages) return;
    if (currentCost.ink && gameState.resources.ink < currentCost.ink) return;
    if (currentCost.knowledge && gameState.resources.forbiddenKnowledge < currentCost.knowledge) return;

    // Deduct Costs
    if (currentCost.pages) gameState.resources.pages -= currentCost.pages;
    if (currentCost.ink) gameState.resources.ink -= currentCost.ink;
    if (currentCost.knowledge) gameState.resources.forbiddenKnowledge -= currentCost.knowledge;


    if (type === 'upgrade') {
        gameState.upgrades[item.id] = (gameState.upgrades[item.id] || 0) + 1;
    } else {
        // Research AND Architect items are one-time
        gameState.research[item.id] = true;
    }

    if (item.effect) item.effect();

    if (type === 'research' || type === 'architect') {
        Narrative.log(`Acquis: ${item.name}`);
    }

    updateUI();
    renderShop();
}

function updateUI() {
    if (ui.inkCount) ui.inkCount.textContent = formatNumber(gameState.resources.ink);
    if (ui.pageCount) ui.pageCount.textContent = formatNumber(gameState.resources.pages);

    const knowledgeEl = document.getElementById('knowledge-count');
    const knowledgeContainer = document.getElementById('res-knowledge-container');
    const knowledgeBonusEl = document.getElementById('knowledge-bonus');

    if (knowledgeEl && knowledgeContainer) {
        if (gameState.resources.forbiddenKnowledge > 0) {
            knowledgeContainer.style.display = 'flex';
            knowledgeEl.textContent = gameState.resources.forbiddenKnowledge;

            if (knowledgeBonusEl) {
                const prodBonus = (gameState.resources.forbiddenKnowledge * 10).toFixed(0);
                const clickBonus = (gameState.resources.forbiddenKnowledge * 5).toFixed(0);
                knowledgeBonusEl.textContent = `+${prodBonus}% Prod. / +${clickBonus}% Clics`;
            }
        } else {
            knowledgeContainer.style.display = 'none';
        }
    }

    const canCreatePage = gameState.resources.ink >= (CONFIG.inkPageCost * (CONFIG.pagesPerClick || 1));
    if (ui.btnCreatePage) {
        ui.btnCreatePage.disabled = !canCreatePage;
        ui.btnCreatePage.classList.toggle('disabled', !canCreatePage);
    }

    if (ui.btnInkSub) {
        let clickMult = CONFIG.clickMultiplier;
        if (gameState.resources.forbiddenKnowledge > 0) {
            clickMult *= (1 + (gameState.resources.forbiddenKnowledge * 0.05));
        }
        const val = CONFIG.inkPerClick * clickMult;
        ui.btnInkSub.textContent = `+${val % 1 === 0 ? val : val.toFixed(1)} Encre`;
    }
    if (ui.btnPageSub) {
        const batchSize = CONFIG.pagesPerClick || 1;
        ui.btnPageSub.textContent = `${CONFIG.inkPageCost * batchSize} Encre${batchSize > 1 ? ' (' + batchSize + ' Pages)' : ''}`;
    }

    if (ui.btnPrestige && !ui.btnPrestige.classList.contains('hidden')) {
        const knowledgePerPoint = 5000;
        const projectedK = Math.floor(gameState.stats.totalPages / knowledgePerPoint);
        const gain = Math.max(0, projectedK - gameState.resources.forbiddenKnowledge);

        const sub = ui.btnPrestige.querySelector('.btn-subtext');
        if (sub) {
            if (gain > 0) {
                sub.textContent = `Brûler et Obtenir +${gain} Savoir`;
                ui.btnPrestige.classList.remove('disabled');
                ui.btnPrestige.disabled = false;
            } else {
                const nextAt = (projectedK + 1) * knowledgePerPoint;
                sub.textContent = `Prochain point à ${formatNumber(nextAt)} Pages (Total)`;
                ui.btnPrestige.classList.add('disabled');
                ui.btnPrestige.disabled = true;
            }
        }
    }

    if (gameState.flags.researchVisible && ui.tabResearch) {
        ui.tabResearch.style.display = 'block';
    }
    if (gameState.research['infinite_shelves'] && ui.tabArchitect) {
        ui.tabArchitect.style.display = 'block';
    }

    renderShop();
    renderArchives(); // Call renderArchives here to update display

    const timerEl = document.getElementById('play-timer');
    if (timerEl) {
        timerEl.textContent = formatTime(gameState.stats.playTime);
    }
}



let lastTick = Date.now(); // Initialize lastTick for gameLoop

// Game Loop
function gameLoop() {
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;

    // --- Calculate Production ---

    // Base Rates
    let inkRate = 0; // Per second
    let pageRate = 0; // Per second

    // Upgrades that give passive ink
    // "Bougie de Graisse": +1 ink/sec * count
    let candleRate = 1;
    if (gameState.research['tallow_processing']) candleRate *= 2;
    if (gameState.upgrades['tallow_candle']) {
        inkRate += (candleRate * gameState.upgrades['tallow_candle']);
    }
    // "Livraison Clandestine": +10 ink/sec * count
    let deliveryRate = 10;
    if (gameState.research['ink_supply_chain']) deliveryRate *= 2;
    if (gameState.upgrades['ink_delivery']) {
        inkRate += (deliveryRate * gameState.upgrades['ink_delivery']);
    }
    // "Puits d'Ombre": +50 ink/sec * count
    if (gameState.upgrades['shadow_well']) {
        inkRate += (50 * gameState.upgrades['shadow_well']);
    }

    // Multipliers
    let currentInkMultiplier = CONFIG.passiveMultiplier;

    // ARCHITECT/ARTIFACT Multipliers
    const artifactRates = { inkMultiplier: 1.0, pageMultiplier: 1.0 };
    ARTIFACTS.forEach(artifact => {
        if (gameState.flags[artifact.id] && artifact.apply) {
            artifact.apply(artifactRates);
        }
    });
    currentInkMultiplier *= artifactRates.inkMultiplier;

    // PRESTIGE Multiplier (Dynamic)
    let prestigeMult = 1;
    if (gameState.resources.forbiddenKnowledge > 0) {
        prestigeMult = 1 + (gameState.resources.forbiddenKnowledge * 0.1); // +10% per point
        currentInkMultiplier *= prestigeMult;
    }


    inkRate *= currentInkMultiplier;

    // Page Production (Scribes)
    // "Apprenti Copiste": 1 page / 2.5 sec -> 0.4 pages/sec
    // Cost: Ink. We need to check if we have enough ink.
    // Complex logic: Scribes consume ink to produce pages.
    // We do this simulation step-by-step or estimate?
    // Let's simple simulation:

    let scribes = gameState.upgrades['apprentice'] || 0;
    let muteScribes = gameState.upgrades['silent_scribe'] || 0;
    let presses = gameState.upgrades['ink_press'] || 0;

    let potentialPages = 0;
    let inkConsumption = 0;

    // Stats
    // Stats
    let scribeRate = 0.4; // 1 every 2.5s
    if (gameState.research['apprentice_network']) scribeRate += 0.1; // +0.1 per apprentice

    // Calculate cost reduction based on manual cost improvements (Base 10)
    const baseManualCost = 10;
    const currentManualCost = CONFIG.inkPageCost;
    const costReduction = Math.max(0, baseManualCost - currentManualCost); // Savings per page

    // Apply reduction to automated costs (min 1 ink/page)
    const scribeCost = Math.max(1, 5 - costReduction);

    const muteRate = 2;
    const muteCost = Math.max(1, 8 - costReduction);

    const pressRate = 10;
    const pressCost = Math.max(1, 20 - costReduction);

    potentialPages += (scribes * scribeRate);
    inkConsumption += (scribes * scribeRate * scribeCost);

    potentialPages += (muteScribes * muteRate);
    inkConsumption += (muteScribes * muteRate * muteCost);

    potentialPages += (presses * pressRate);
    inkConsumption += (presses * pressRate * pressCost);

    // Apply Artifact & Passive & Prestige Multiplier to Pages
    // Note: In original design, passiveMultiplier might not have applied to manual scribes?
    // But Prestige definitely should. CONFIG.passiveMultiplier should too if it comes from 'shadow_automation'.

    const pageMult = CONFIG.passiveMultiplier * prestigeMult * artifactRates.pageMultiplier;
    potentialPages *= pageMult;
    // Consumption scales with production? 
    // Usually standard incremental logic: Improved efficiency = Higher output for same input, OR Higher output for higher input.
    // Let's assume Efficiency: Same cost, more pages?
    // User requested "prod monter", not "cost monter".
    // So we invoke the multiplier on PotentialPages but KEEP inkConsumption static (Efficiency Boost).
    // OR we scale consumption too?
    // Let's keep consumption static -> This acts as a huge efficiency buff (True Prestige).

    // potentialPages *= artifactRates.pageMultiplier; // Replaced by above

    // Check Ink for consumption
    // We have `inkRate` coming in. We have `inkConsumption` going out.
    // Net Ink = inkRate - inkConsumption
    // If Net is negative, and we hit 0, production stops/slows.

    const maxInkConsumption = inkConsumption;
    let actualPageProduction = 0;
    let actualInkConsumption = 0;

    if (potentialPages > 0) {
        let costThisTick = inkConsumption * dt;
        let producedThisTick = inkRate * dt;

        // Available ink is current stock plus what we just produced implicitly (or about to produce)
        // We simulate that production happens continuously.
        let availableInk = gameState.resources.ink + producedThisTick;

        if (availableInk >= costThisTick) {
            actualPageProduction = potentialPages;
            actualInkConsumption = inkConsumption;
        } else {
            // Starvation
            // If we don't have enough ink, we run at partial efficiency
            if (costThisTick > 0) {
                const ratio = Math.max(0, availableInk / costThisTick);
                actualPageProduction = potentialPages * ratio;
                actualInkConsumption = Math.min(availableInk / dt, inkConsumption); // Consume max available rate
            }
        }
    }

    // Apply Changes
    // Net change = Production - Consumption
    const inkChange = (inkRate - actualInkConsumption) * dt;
    gameState.resources.ink += inkChange;
    // Safety clamp
    if (gameState.resources.ink < 0) gameState.resources.ink = 0;

    gameState.resources.pages += (actualPageProduction * dt);

    // Update Stats
    gameState.stats.totalInk += (inkRate * dt);
    gameState.stats.totalPages += (actualPageProduction * dt);
    gameState.stats.lastPassiveRate = inkRate;
    gameState.stats.playTime = (gameState.stats.playTime || 0) + dt;

    // Auto-save (every 30s approx)
    if (Date.now() % 30000 < CONFIG.tickRate) {
        saveGame();
    }

    // Update UI Rates
    const inkNet = inkRate - actualInkConsumption;
    if (ui.inkCount) {
        const rateEl = document.getElementById('ink-rate');
        if (rateEl) {
            rateEl.innerHTML = `
                <span class="pos">+${inkRate.toFixed(1)}/s</span>
                ${inkConsumption > 0 ? `<span class="warn">(-${inkConsumption.toFixed(1)})</span>` : ''}
            `;
        }
    }
    if (ui.pageCount) {
        const rateEl = document.getElementById('page-rate');
        if (rateEl) rateEl.innerHTML = `+${actualPageProduction.toFixed(1)}/s`;
    }

    // Check Events
    if (window.Events) {
        window.Events.check(gameState);
    }
    if (window.Achievements) {
        window.Achievements.check(gameState);
    }

    updateCorruptionVisuals();
    checkUnlocks(); // Critical for passive unlocking
    updateUI();
}

// Init
function init() {
    let isResetting = false;

    // Buttons
    if (ui.btnGenerateInk) ui.btnGenerateInk.addEventListener('click', (e) => generateInk(null, e));
    if (ui.btnCreatePage) ui.btnCreatePage.addEventListener('click', (e) => createPage(e));
    if (ui.btnPrestige) {
        ui.btnPrestige.addEventListener('click', () => {
            const knowledgePerPoint = 5000;
            const projectedK = Math.floor(gameState.stats.totalPages / knowledgePerPoint);
            const gained = Math.max(0, projectedK - gameState.resources.forbiddenKnowledge);

            if (gained <= 0) {
                const currentK = gameState.resources.forbiddenKnowledge;
                const nextThreshold = (projectedK + 1) * knowledgePerPoint;

                Events.showPopup({
                    title: "Le feu ne prendrait pas",
                    text: `Le Grand Incendie ne vous apporterait rien pour le moment.\n\nSavoir Actuel : ${currentK}\nProchain point à : ${formatNumber(nextThreshold)} Pages Totales.`,
                    choices: [{ text: "Compris", effect: () => { } }]
                }, gameState);
                return;
            }

            Events.showPopup({
                title: "INITIER LE GRAND INCENDIE ?",
                text: `Vous allez brûler votre bibliothèque pour obtenir +${gained} Savoir Interdit.\n\nCeci réinitialisera votre progression actuelle (Encre, Pages, Bâtiments).\n\nLe Savoir Interdit augmente votre production de manière permanente.\n\nÊtes-vous sûr ?`,
                choices: [
                    {
                        text: "BRÛLER TOUT",
                        effect: () => { prestigeReset(); }
                    },
                    {
                        text: "Attendre encore",
                        effect: () => { }
                    }
                ]
            }, gameState);
        });
    }

    // Achievement Modal
    const achModal = document.getElementById('achievements-modal');
    const btnOpenAch = document.getElementById('btn-open-achievements');
    const btnCloseAch = document.getElementById('btn-close-achievements');

    if (btnOpenAch && achModal) {
        btnOpenAch.addEventListener('click', () => {
            achModal.classList.remove('hidden');
            if (window.Achievements) window.Achievements.render(gameState);
        });
    }
    if (btnCloseAch && achModal) {
        btnCloseAch.addEventListener('click', () => {
            achModal.classList.add('hidden');
        });
    }

    // Save Manager Modal
    const saveModal = document.getElementById('save-manager-modal');
    const btnOpenSave = document.getElementById('btn-save-manager');
    const btnCloseSave = document.getElementById('btn-close-save-manager');
    const saveTextArea = document.getElementById('save-export-area');
    const btnCopySave = document.getElementById('btn-copy-save');
    const btnImportSave = document.getElementById('btn-import-save');
    const saveNotif = document.getElementById('save-notification');

    if (btnOpenSave && saveModal) {
        btnOpenSave.addEventListener('click', () => {
            saveModal.classList.remove('hidden');
            // Generate Export
            try {
                const saveString = btoa(JSON.stringify(gameState));
                if (saveTextArea) {
                    saveTextArea.value = saveString;
                    saveTextArea.readOnly = true; // Default to read-only for export
                }
            } catch (e) {
                console.error("Export failed", e);
                if (saveNotif) saveNotif.textContent = "Erreur d'exportation.";
            }
            if (saveNotif) saveNotif.textContent = "";
        });
    }
    if (btnCloseSave && saveModal) {
        btnCloseSave.addEventListener('click', () => {
            saveModal.classList.add('hidden');
        });
    }

    if (btnCopySave && saveTextArea) {
        btnCopySave.addEventListener('click', () => {
            saveTextArea.select();
            navigator.clipboard.writeText(saveTextArea.value).then(() => {
                if (saveNotif) {
                    saveNotif.style.color = 'gold';
                    saveNotif.textContent = "Copié dans le presse-papier !";
                    setTimeout(() => saveNotif.textContent = "", 3000);
                }
            });
        });
    }

    if (btnImportSave && saveTextArea) {
        btnImportSave.addEventListener('click', () => {
            // If readonly (export mode), switch to import mode
            if (saveTextArea.readOnly) {
                saveTextArea.readOnly = false;
                saveTextArea.value = "";
                saveTextArea.placeholder = "Collez votre sauvegarde ici...";
                saveTextArea.focus();
                btnImportSave.textContent = "Valider l'Import";
                btnCopySave.style.display = 'none'; // Hide copy button during import
                if (saveNotif) saveNotif.textContent = "Collez le code et validez.";
                return;
            }

            // Execute Import
            const importString = saveTextArea.value.trim();
            if (!importString) return;

            try {
                const decoded = atob(importString);
                const json = JSON.parse(decoded);

                // Basic validation
                if (json.resources && json.stats) {
                    localStorage.setItem('shadowLibrarianSave', JSON.stringify(json));
                    if (saveNotif) {
                        saveNotif.style.color = '#0f0';
                        saveNotif.textContent = "Sauvegarde restaurée ! Rechargement...";
                    }
                    setTimeout(() => location.reload(), 1000);
                } else {
                    throw new Error("Invalid save structure");
                }
            } catch (e) {
                console.error("Import failed", e);
                if (saveNotif) {
                    saveNotif.style.color = 'red';
                    saveNotif.textContent = "Code de sauvegarde invalide !";
                }
            }
        });
    }

    // Reset
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (confirm("Effacer la sauvegarde et recommencer ?")) {
                isResetting = true;
                localStorage.removeItem('shadowLibrarianSave');
                location.reload();
            }
        });
    }

    // Corruption Visuals
    updateCorruptionVisuals();


    const btnDebug = document.getElementById('btn-toggle-debug');
    if (btnDebug) btnDebug.addEventListener('click', () => {
        document.getElementById('debug-panel').classList.toggle('hidden');
    });

    const btnCloseDebug = document.getElementById('close-debug');
    if (btnCloseDebug) btnCloseDebug.addEventListener('click', () => {
        document.getElementById('debug-panel').classList.add('hidden');
    });

    document.getElementById('debug-ink')?.addEventListener('click', () => {
        const amount = parseInt(document.getElementById('debug-ink-input').value) || 0;
        gameState.resources.ink += amount;
        gameState.stats.totalInk += amount;
        updateUI();
        checkUnlocks();
        Narrative.log(`DEBUG: +${formatNumber(amount)} Encre`);
    });
    document.getElementById('debug-pages')?.addEventListener('click', () => {
        const amount = parseInt(document.getElementById('debug-pages-input').value) || 0;
        gameState.resources.pages += amount;
        gameState.stats.totalPages += amount; // Critical for unlocks
        updateUI();
        checkUnlocks();
        renderShop(); // Refresh shop triggers
        Narrative.log(`DEBUG: +${formatNumber(amount)} Pages`);
    });
    document.getElementById('debug-knowledge')?.addEventListener('click', () => {
        const amount = parseInt(document.getElementById('debug-knowledge-input').value) || 0;
        gameState.resources.forbiddenKnowledge += amount;
        updateUI();
        renderShop();
        Narrative.log(`DEBUG: +${formatNumber(amount)} Savoir Interdit`);
    });

    // Auto-save on exit
    window.addEventListener('beforeunload', () => {
        if (!isResetting) {
            saveGame();
        }
    });

    if (typeof Events !== 'undefined') {
        Events.init();
    }
    loadGame();

    // Intro Sequence (New Game or Prestige Reset)
    if (!gameState.flags.seenIntro && typeof playIntroSequence === 'function') {
        playIntroSequence();
    }

    setInterval(gameLoop, CONFIG.tickRate);
    updateUI();
}


window.addEventListener('DOMContentLoaded', init);

function updateCorruptionVisuals() {
    const k = gameState.resources.forbiddenKnowledge;
    const body = document.body;

    // Reset if no corruption (simplification)
    if (k <= 0) {
        body.style.textShadow = 'none';
        // Only reset filter if we think IT IS currently corrupted (to avoid clearing other filters if any)
        // But for this game, we control body filter.
        if (body.style.filter.includes('hue') || body.style.filter.includes('invert')) {
            body.style.filter = 'none';
        }
        return;
    }

    // Intensity scales from 0 to 1 (capped at 20 knowledge)
    const intensity = Math.min(k, 20) / 20;

    // 1. Permanent Jitter (Text Shadow) - Always active if k > 0
    // Scales: k=1 -> small jitter. k=20 -> large jitter.
    const shake = 2 + (intensity * 5); // 2px to 7px
    const xOff = (Math.random() - 0.5) * shake;
    const yOff = (Math.random() - 0.5) * shake;
    const color = `rgba(${200 + Math.random() * 50}, 0, 0, ${0.4 + 0.4 * intensity})`; // Red glow

    body.style.textShadow = `${xOff}px ${yOff}px ${intensity * 2}px ${color}`;

    // 2. Glitch Spikes (Filters)
    // Chance increases with K.
    // Base chance: 5% + (1% per K). Max ~25% per tick (10Hz) -> 2.5/sec
    const glitchChance = 0.05 + (k * 0.01);

    if (Math.random() < glitchChance) {
        const filters = [
            `hue-rotate(${Math.random() * 45}deg)`, // Color shift
            `contrast(${1.2 + Math.random()})`, // High contrast
            `saturate(${2 + Math.random() * 3})`, // Deep fried
        ];
        // At high levels (30+), add BLACKOUT (FLASH NOIR)
        if (k >= 30) filters.push(`brightness(${Math.random() * 0.2})`); // 0 to 0.2 brightness (Very Dark)

        body.style.filter = filters[Math.floor(Math.random() * filters.length)];

        // Quick reset (flicker)
        setTimeout(() => {
            body.style.filter = "none";
        }, 50 + Math.random() * 100);
    }
}

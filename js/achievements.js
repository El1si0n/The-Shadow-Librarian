const Achievements = {
    // Database
    list: [
        {
            id: 'first_steps',
            title: 'Premier Mot',
            description: 'Produire 1 Page.',
            hidden: false,
            condition: (state) => state.stats.totalPages >= 1
        },
        {
            id: 'getting_serious',
            title: 'Chapitre Un',
            description: 'Produire 100 Pages.',
            hidden: false,
            condition: (state) => state.stats.totalPages >= 100
        },
        {
            id: 'dedicated_scribe',
            title: 'Livre Entier',
            description: 'Produire 1 000 Pages.',
            hidden: false,
            condition: (state) => state.stats.totalPages >= 1000
        },
        {
            id: 'ink_master',
            title: 'Maître de l\'Encre',
            description: 'Produire 10 000 unités d\'Encre (Total).',
            hidden: true,
            condition: (state) => state.stats.totalInk >= 10000
        },
        {
            id: 'scriptorium_unlock',
            title: 'Le Scriptorium',
            description: 'Découvrir la pièce cachée.',
            hidden: true,
            condition: (state) => state.flags.seenScriptorium
        },
        {
            id: 'automation_begin',
            title: 'L\'Usine à Mots',
            description: 'Posséder 10 Apprentis Copistes.',
            hidden: false,
            condition: (state) => (state.upgrades['apprentice'] || 0) >= 10
        },
        {
            id: 'mouse_clicker',
            title: 'Doigts Agiles',
            description: 'Cliquer 1 000 fois manuellement (non suivi actuellement, placeholder).',
            hidden: true,
            condition: (state) => false // TODO: Tracking manual clicks
        },
        {
            id: 'prestige_1',
            title: 'Tabula Rasa',
            description: 'Effectuer un Grand Incendie.',
            hidden: true,
            condition: (state) => state.resources.forbiddenKnowledge >= 1
        },
        {
            id: 'occult_knowledge',
            title: 'L\'Architecte',
            description: 'Atteindre la Phase 3.',
            hidden: true,
            condition: (state) => state.research['infinite_logic']
        },
        // --- NEW ACHIEVEMENTS ---
        {
            id: 'ink_hoarder',
            title: 'Océan Noir',
            description: 'Produire 1 000 000 unités d\'Encre.',
            hidden: true,
            condition: (state) => state.stats.totalInk >= 1000000
        },
        {
            id: 'library_builder',
            title: 'Bibliothèque d\'Alexandrie',
            description: 'Produire 1 000 000 Pages.',
            hidden: true,
            condition: (state) => state.stats.totalPages >= 1000000
        },
        {
            id: 'industrial_revolution',
            title: 'Révolution Industrielle',
            description: 'Posséder 20 Presses Mécaniques.',
            hidden: false,
            condition: (state) => (state.upgrades['ink_press'] || 0) >= 20
        },
        {
            id: 'army_of_scribes',
            title: 'Armée des Ombres',
            description: 'Posséder 100 Copistes Muets.',
            hidden: false,
            condition: (state) => (state.upgrades['silent_scribe'] || 0) >= 100
        },
        {
            id: 'blood_pact',
            title: 'Pacte de Sang',
            description: 'Découvrir l\'Encre de Sang.',
            hidden: true,
            condition: (state) => state.research['blood_ink']
        },
        {
            id: 'forbidden_power',
            title: 'Savoir Interdit',
            description: 'Avoir 10 points de Savoir Interdit.',
            hidden: true,
            condition: (state) => state.resources.forbiddenKnowledge >= 10
        },
        {
            id: 'madness_begins',
            title: 'Le Début de la Folie',
            description: 'Avoir 50 points de Savoir Interdit.',
            hidden: true,
            condition: (state) => state.resources.forbiddenKnowledge >= 50
        },
        {
            id: 'glitch_matrix',
            title: 'Glitch dans la Matrice',
            description: 'Acheter le Glitch Temporel.',
            hidden: true,
            condition: (state) => state.research['temporal_glitch']
        },
        {
            id: 'code_breaker',
            title: 'Hacker la Réalité',
            description: 'Effectuer une Injection de Code.',
            hidden: true,
            condition: (state) => state.research['code_injection']
        },
        {
            id: 'the_end_is_nigh',
            title: 'La Fin est Proche',
            description: 'Débloquer l\'action finale "Déchirer le Voile".',
            hidden: true,
            condition: (state) => state.research['code_injection'] && state.resources.forbiddenKnowledge >= 10 // Approximation
        },
        // --- TIME BASED ACHIEVEMENTS ---
        {
            id: 'speedrun_scriptorium',
            title: 'Lecteur Rapide',
            description: 'Atteindre le Scriptorium en moins de 5 minutes.',
            hidden: false,
            condition: (state) => state.flags.seenScriptorium && state.stats.playTime < 300
        },
        {
            id: 'speedrun_phase3',
            title: 'L\'Éclair Noir',
            description: 'Atteindre la Phase 3 en moins de 30 minutes.',
            hidden: false,
            condition: (state) => state.research['infinite_logic'] && state.stats.playTime < 1800
        },
        {
            id: 'speedrun_prestige',
            title: 'Pyromane Pressé',
            description: 'Déclencher le Grand Incendie en moins de 45 minutes.',
            hidden: false,
            condition: (state) => state.resources.forbiddenKnowledge >= 1 && state.stats.lastRunDuration && state.stats.lastRunDuration < 2700
        },
        {
            id: 'speedrun_finish',
            title: 'Élu de l\'Instant',
            description: 'Terminer la simulation en moins de 2 heures.',
            hidden: false,
            condition: (state) => state.research['tear_veil'] && state.stats.playTime < 7200 // Check unlocked action
        },
        {
            id: 'time_waste',
            title: 'Éternité',
            description: 'Passer 10 heures dans la bibliothèque.',
            hidden: false,
            condition: (state) => state.stats.playTime >= 36000
        }
    ],

    init: function () {
        // Prepare UI if needed
        this.render(window.gameState);
    },

    check: function (state) {
        if (!state.achievements) state.achievements = [];
        let changed = false;

        this.list.forEach(ach => {
            if (!state.achievements.includes(ach.id)) {
                if (ach.condition(state)) {
                    this.unlock(ach, state);
                    changed = true;
                }
            }
        });

        if (changed) {
            this.render(state);
            if (window.saveGame) window.saveGame();
        }
    },

    unlock: function (ach, state) {
        state.achievements.push(ach.id);
        // Notification
        if (window.Narrative) {
            window.Narrative.log(`SUCCÈS DÉVERROUILLÉ : ${ach.title}`);
        }
        // Visual feedback (Popup?)
        const notif = document.createElement('div');
        notif.style.position = 'fixed';
        notif.style.bottom = '20px';
        notif.style.right = '20px';
        notif.style.backgroundColor = '#333';
        notif.style.border = '2px solid gold';
        notif.style.color = 'gold';
        notif.style.padding = '15px';
        notif.style.zIndex = '9999';
        notif.style.fontFamily = "'VT323', monospace";
        notif.style.fontSize = '1.2rem';
        notif.innerHTML = `<strong>SUCCÈS !</strong><br>${ach.title}`;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 1s';
            setTimeout(() => notif.remove(), 1000);
        }, 4000);
    },

    render: function (state) {
        const listEl = document.getElementById('achievement-list');
        const barEl = document.getElementById('achievement-bar');
        const percentEl = document.getElementById('achievement-percent');

        if (!listEl) return;

        // Calculate progress
        const unlockedCount = state.achievements ? state.achievements.length : 0;
        const totalCount = this.list.length; // Or ignore placeholders?
        const percent = Math.floor((unlockedCount / totalCount) * 100);

        if (barEl) barEl.style.width = `${percent}%`;
        if (percentEl) percentEl.textContent = `${percent}%`;

        // Render List
        // We only re-render completely for simplicity
        listEl.innerHTML = '';

        this.list.forEach(ach => {
            const isUnlocked = state.achievements && state.achievements.includes(ach.id);

            const el = document.createElement('div');
            el.className = 'achievement-item';
            el.style.padding = '10px';
            el.style.marginBottom = '5px';
            el.style.border = '1px solid #444';
            el.style.display = 'flex';
            el.style.alignItems = 'center';

            if (isUnlocked) {
                el.style.borderColor = 'gold';
                el.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
                el.innerHTML = `
                    <img src="image/success.png" style="width: 32px; height: 32px; margin-right: 15px; image-rendering: pixelated;">
                    <div>
                        <div style="color: gold; font-weight: bold; font-size: 1.1rem;">${ach.title}</div>
                        <div style="color: #ccc; font-size: 0.9rem;">${ach.description}</div>
                    </div>
                `;
            } else {
                // Locked
                if (ach.hidden) {
                    el.innerHTML = `
                        <img src="image/success_locked.png" style="width: 32px; height: 32px; margin-right: 15px; opacity: 0.5; image-rendering: pixelated;">
                        <div>
                            <div style="color: #666; font-weight: bold;">???</div>
                            <div style="color: #444; font-size: 0.9rem;">Ce succès est secret.</div>
                        </div>
                    `;
                } else {
                    el.innerHTML = `
                        <img src="image/success_locked.png" style="width: 32px; height: 32px; margin-right: 15px; image-rendering: pixelated;">
                        <div>
                            <div style="color: #888; font-weight: bold;">${ach.title}</div>
                            <div style="color: #666; font-size: 0.9rem;">${ach.description}</div>
                        </div>
                    `;
                }
            }
            listEl.appendChild(el);
        });
    }
};

window.Achievements = Achievements;

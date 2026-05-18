
const Events = {
    // Configuration
    eventChance: 0.04, // Chance per tick (10Hz) -> ~4% -> ~34% chance per second.
    lastEventTime: 0,
    minEventInterval: 10000, // Minimum 10 seconds between events

    // State for story progression
    storyProgress: 0,

    init: function () {
        // Load event history/flags if needed (could be added to gameState later)
    },

    // Helper to track resource changes
    trackAndLogChanges: function (state, effectFn, eventText = null) {
        if (!effectFn && eventText) {
            Narrative.log(eventText);
            return;
        }
        if (!effectFn) return;

        const before = { ...state.resources };
        const resultText = effectFn(state);
        const after = state.resources;

        const changes = [];
        if (after.ink !== before.ink) {
            const diff = after.ink - before.ink;
            const sign = diff > 0 ? '+' : '';
            changes.push(`${sign}${Math.floor(diff)} Encre`);
        }
        if (after.pages !== before.pages) {
            const diff = after.pages - before.pages;
            const sign = diff > 0 ? '+' : '';
            changes.push(`${sign}${Math.floor(diff)} Page${Math.abs(diff) > 1 ? 's' : ''}`);
        }
        if (after.forbiddenKnowledge !== before.forbiddenKnowledge) {
            const diff = after.forbiddenKnowledge - before.forbiddenKnowledge;
            const sign = diff > 0 ? '+' : '';
            changes.push(`${sign}${Math.floor(diff)} Savoir`);
        }

        const changeString = changes.length > 0 ? ` (${changes.join(', ')})` : '';
        const textToLog = eventText || resultText;

        if (textToLog) {
            // Log combined text
            Narrative.log(`${textToLog}${changeString}`);
        } else if (changeString) {
            // Log just changes (for popups/other sources where text is handled internally)
            Narrative.log(changeString);
        }

        if (changes.length > 0 && window.updateUI) {
            window.updateUI();
        }
    },

    check: function (state) {
        const now = Date.now();

        // 1. Check Story Milestones (Priority)
        this.checkStoryMilestones(state);

        // 2. Check Random Events
        if (now - this.lastEventTime > this.minEventInterval) {
            if (Math.random() < this.eventChance) {
                this.triggerRandomEvent(state);
                this.lastEventTime = now;
            }
        }
    },

    checkStoryMilestones: function (state) {
        // Filter milestones that haven't been triggered yet and whose condition is met
        const potentialMilestones = this.storyMilestones.filter(m =>
            !state.flags['story_' + m.id] && m.condition(state)
        );

        if (potentialMilestones.length > 0) {
            const milestone = potentialMilestones[0];
            Narrative.log(`[JOURNAL] ${milestone.text}`, 'journal-entry');
            state.flags['story_' + milestone.id] = true;

            // Optional: Add visual flair for story moments
            const feedback = document.createElement('div');
            feedback.style.position = 'fixed';
            feedback.style.bottom = '20px';
            feedback.style.left = '50%';
            feedback.style.transform = 'translateX(-50%)';
            feedback.style.color = '#AA0000';
            feedback.style.textShadow = '0 0 5px #000';
            feedback.style.pointerEvents = 'none';
            feedback.style.zIndex = '999';
            feedback.textContent = "Nouvelle entrée de journal...";
            feedback.className = 'story-feedback'; // We can animate this in CSS
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 3000);
        }
    },

    triggerRandomEvent: function (state) {
        // Filter valid events. Default condition to true if missing.
        const validEvents = this.randomEvents.filter(e => !e.condition || e.condition(state));

        if (validEvents.length === 0) return;

        // Pick one weighted or random
        const event = validEvents[Math.floor(Math.random() * validEvents.length)];

        // Execute
        if (event.type === 'log') {
            // Narrative.log(event.text); // REMOVED
            this.trackAndLogChanges(state, event.effect, event.text);
        } else if (event.type === 'popup') {
            this.showPopup(event, state);
        }
    },

    showPopup: function (event, state) {
        const modal = document.getElementById('event-modal');
        const title = document.getElementById('event-title');
        const desc = document.getElementById('event-desc');
        const options = document.getElementById('event-options');

        if (!modal) return; // Safety check

        title.textContent = event.title || "Événement";
        desc.innerHTML = event.text.replace(/\n/g, '<br>');
        options.innerHTML = '';

        let choices = event.choices;
        if (typeof choices === 'function') {
            choices = choices(state);
        }

        if (choices && Array.isArray(choices)) {
            choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'ps1-btn small-btn';
                btn.textContent = choice.text;
                btn.onclick = () => {
                    this.trackAndLogChanges(state, choice.effect);
                    modal.classList.add('hidden');
                };
                options.appendChild(btn);
            });
        } else {
            // Default OK button
            const btn = document.createElement('button');
            btn.className = 'ps1-btn small-btn';
            btn.textContent = "Continuer";
            btn.onclick = () => {
                this.trackAndLogChanges(state, event.effect);
                modal.classList.add('hidden');
            };
            options.appendChild(btn);
        }

        modal.classList.remove('hidden');
    },

    // --- DATA ---

    storyMilestones: [
        {
            id: '10_pages',
            condition: (state) => state.resources.pages >= 10,
            text: "10 pages. Mes doigts sont tachés d'encre. Je commence à sentir le rythme."
        },
        {
            id: '50_pages',
            condition: (state) => state.resources.pages >= 50,
            text: "50 pages. Le tas grandit. Parfois, j'ai l'impression que les mots bougent quand je ne les regarde pas."
        },
        {
            id: '100_pages',
            condition: (state) => state.resources.pages >= 100,
            text: "100 pages. J'ai rêvé de cette bibliothèque avant d'y entrer. Ou est-ce la bibliothèque qui rêve de moi ?"
        },
        {
            id: '250_pages',
            condition: (state) => state.resources.pages >= 250,
            text: "250 pages. Le silence ici est lourd. Il a une texture, une odeur de poussière et de vieux papier."
        },
        {
            id: '500_pages',
            condition: (state) => state.resources.pages >= 500,
            text: "500 pages. Je ne me souviens plus de mon nom. Le Bibliothécaire suffit."
        },
        {
            id: '1000_pages',
            condition: (state) => state.resources.pages >= 1000,
            text: "1000 pages. Les ombres s'allongent. Elles semblent vouloir lire par-dessus mon épaule."
        },
        {
            id: '2500_pages',
            condition: (state) => state.resources.pages >= 2500,
            text: "2500 pages. J'ai vu un rat aujourd'hui. Il portait un monocle et lisait un fragment de parchemin. Je dois être fatigué."
        },
        {
            id: '5000_pages',
            condition: (state) => state.resources.pages >= 5000,
            text: "5000 pages. L'encre ne vient plus du pot. Elle vient du plafond, des murs, de mes veines."
        },
        {
            id: '10000_pages',
            condition: (state) => state.resources.pages >= 10000,
            text: "10000 pages. Nous sommes légion. Les écrits, l'encre, et moi. Nous ne faisons qu'un."
        },
        {
            id: '20000_pages',
            condition: (state) => state.resources.pages >= 20000,
            text: "20000 pages. Les murs de la bibliothèque ne sont plus faits de pierre, mais de mots compressés."
        },
        {
            id: '30000_pages',
            condition: (state) => state.resources.pages >= 30000,
            text: "30000 pages. Le temps n'existe plus ici. Il n'y a que le grattement éternel de la plume."
        },
        {
            id: '50000_pages',
            condition: (state) => state.resources.pages >= 50000,
            text: "50000 pages. J'ai aperçu l'Architecte de l'autre côté d'un miroir d'encre. Il a mon visage."
        },
        {
            id: '100000_pages',
            condition: (state) => state.resources.pages >= 100000,
            text: "100000 pages. Tout a été écrit. Tout ce qui a été, est, et sera. Je suis la Bibliothèque."
        }
    ],

    randomEvents: [
        // Small Flavor / Minor Resource Events (Logs)
        // --- AMBIENCE & HORROR ---
        { type: 'log', text: "Le silence est rompu par le son d'une page qui se tourne... mais vous êtes seul." },
        { type: 'log', text: "L'odeur de vieux papier devient soudainement écœurante." },
        { type: 'log', text: "Vous croyez voir votre propre nom écrit dans une marge." },
        { type: 'log', text: "L'encre semble vouloir remonter dans la plume." },
        { type: 'log', text: "Une poussière dorée flotte dans le rai de lumière." },
        { type: 'log', text: "Quelqu'un a déplacé votre encrier pendant que vous cligniez des yeux." },
        { type: 'log', text: "Vous entendez un grattement provenant de sous le plancher." },
        { type: 'log', text: "Les ombres des étagères forment des barreaux de prison." },
        { type: 'log', text: "Vous avez oublié depuis combien de temps vous êtes assis ici." },
        { type: 'log', text: "Le mot 'FIN' apparaît brièvement sur votre rétine." },

        // --- RESOURCE FLUCTUATIONS ---
        {
            type: 'log',
            text: "Une tache d'encre forme une fractale parfaite. Inspirant.",
            condition: (state) => state.resources.ink > 5,
            effect: (state) => { state.resources.pages += 2; }
        },
        {
            type: 'log',
            text: "Votre manche accroche le parchemin. Une page gâchée.",
            condition: (state) => state.resources.pages > 10,
            effect: (state) => { state.resources.pages -= 1; }
        },
        {
            type: 'log',
            text: "Vous trouvez un fond de bouteille d'encre oublié.",
            condition: (state) => true,
            effect: (state) => { state.resources.ink += 25; }
        },
        {
            type: 'log',
            text: "L'humidité a fait gondoler quelques feuilles.",
            condition: (state) => state.resources.pages > 50,
            effect: (state) => { state.resources.pages = Math.max(0, state.resources.pages - 3); }
        },
        {
            type: 'log',
            text: "Une soudaine fièvre d'écriture vous prend. La plume fume !",
            condition: (state) => state.resources.ink > 50,
            effect: (state) => { state.resources.ink -= 20; state.resources.pages += 5; }
        },

        // --- BUILDING SPECIFIC ---
        {
            type: 'log',
            text: "Un apprenti vous demande la permission de dormir. Vous refusez.",
            condition: (state) => state.upgrades['apprentice'] > 2,
            effect: (state) => { state.resources.pages += 1; } // Efficiency enforcement
        },
        {
            type: 'log',
            text: "Les copistes muets communiquent par signes complexes.",
            condition: (state) => state.upgrades['silent_scribe'] > 0
        },
        {
            type: 'log',
            text: "Une presse s'enraye avec un bruit d'os brisé.",
            condition: (state) => state.upgrades['ink_press'] > 0,
            effect: (state) => { state.resources.ink -= 5; } // Wasted ink
        },
        {
            type: 'log',
            text: "Le bruit rythmique des presses devient hypnotique.",
            condition: (state) => state.upgrades['ink_press'] > 5
        },

        // --- LATE GAME / WEIRD ---
        {
            type: 'log',
            text: "Les murs saignent de l'encre noire.",
            condition: (state) => state.resources.forbiddenKnowledge > 0
        },
        {
            type: 'log',
            text: "Vous vous souvenez d'un monde avec un soleil bleu. Était-ce réel ?",
            condition: (state) => state.resources.forbiddenKnowledge > 2
        },
        {
            type: 'log',
            text: "Le code source de l'univers est visible dans les coins sombres.",
            condition: (state) => state.research['reality_engine']
        },
        {
            type: 'log',
            text: "01001000 01000101 01001100 01010000",
            condition: (state) => state.research['code_injection']
        },

        // EXISTING EVENTS...
        {
            type: 'log',
            text: "Une goutte d'encre tombe sur le sol et forme un œil qui vous regarde.",
            condition: (state) => state.resources.ink > 10,
            effect: (state) => { state.resources.ink -= 1; }
        },
        {
            type: 'log',
            text: "Un courant d'air froid traverse la pièce, bien qu'il n'y ait aucune fenêtre.",
            condition: (state) => true
        },
        {
            type: 'log',
            text: "Vous retrouvez une page que vous pensiez avoir perdue.",
            condition: (state) => true,
            effect: (state) => { state.resources.pages += 1; }
        },
        {
            type: 'log',
            text: "L'encre bouillonne doucement dans l'encrier.",
            condition: (state) => state.resources.ink > 50
        },
        {
            type: 'log',
            text: "Un murmure s'élève des étagères.",
            condition: (state) => state.resources.pages > 100
        },
        {
            type: 'log',
            text: "Une page vierge vous coupe le doigt. Quelques gouttes de sang se mêlent à l'encre.",
            condition: (state) => true,
            effect: (state) => { state.resources.ink += 5; }
        },
        {
            type: 'log',
            text: "Votre plume se brise. Vous devez la tailler à nouveau.",
            condition: (state) => state.resources.ink > 0,
            effect: (state) => { state.resources.ink = Math.max(0, state.resources.ink - 2); }
        },
        {
            type: 'log',
            text: "Un apprenti trébuche et renverse un peu d'encre.",
            condition: (state) => state.upgrades['apprentice'] > 0,
            effect: (state) => { state.resources.ink = Math.max(0, state.resources.ink - 10); }
        },
        {
            type: 'log',
            text: "Un scribe muet vous tend une page parfaite, sans un mot.",
            condition: (state) => state.upgrades['silent_scribe'] > 0,
            effect: (state) => { state.resources.pages += 1; }
        },
        {
            type: 'log',
            text: "La lueur de la bougie vacille, formant des ombres dansantes.",
            condition: (state) => state.upgrades['tallow_candle'] > 0
        },
        {
            type: 'log',
            text: "Vous trouvez une vieille note dans une marge : 'Ne les laissez pas sortir'.",
            condition: (state) => state.resources.pages > 50
        },
        {
            type: 'log',
            text: "Un livre tombe de l'étagère. Il est ouvert à la page que vous venez d'écrire.",
            condition: (state) => state.resources.pages > 200
        },
        {
            type: 'log',
            text: "La poussière danse dans un rayon de lumière inexistant.",
            condition: (state) => true
        },
        {
            type: 'log',
            text: "Votre reflet dans l'encrier ne cligne pas des yeux en même temps que vous.",
            condition: (state) => state.resources.ink > 20
        },
        {
            type: 'log',
            text: "Une araignée tisse sa toile entre deux piles de pages.",
            condition: (state) => state.resources.pages > 300
        },
        {
            type: 'log',
            text: "Le bruit de votre plume gratte comme un ongle sur un tableau.",
            condition: (state) => true
        },
        {
            type: 'log',
            text: "Vous croyez entendre quelqu'un respirer derrière vous.",
            condition: (state) => state.resources.pages > 1000
        },
        {
            type: 'log',
            text: "L'encre semble vouloir retourner dans le pot.",
            condition: (state) => state.resources.ink > 50 && Math.random() < 0.5,
            effect: (state) => { state.resources.ink = Math.max(0, state.resources.ink - 5); }
        },
        {
            type: 'log',
            text: "Une page vierge s'envole et atterrit sur vos genoux.",
            condition: (state) => Math.random() < 0.1,
            effect: (state) => { state.resources.pages += 1; }
        },
        {
            type: 'log',
            text: "Un rat emporte un morceau de parchemin.",
            condition: (state) => state.resources.pages > 10,
            effect: (state) => { state.resources.pages = Math.max(0, state.resources.pages - 1); }
        },
        {
            type: 'log',
            text: "La température chute brusquement. L'encre gèle un instant.",
            condition: (state) => true
        },

        // --- New Popular Events ---
        {
            type: 'popup',
            title: "Le Rat de Bibliothèque",
            text: "Un énorme rat gris est en train de ronger une de vos précieuses pages !",
            condition: (state) => state.resources.pages > 10 && Math.random() < 0.5, // Increased probability
            choices: [
                {
                    text: "Le chasser (Risque de perdre la page)",
                    effect: (state) => {
                        if (Math.random() > 0.5) {
                            state.resources.pages -= 1;
                            return "Le rat s'enfuit avec le morceau de parchemin.";
                        } else {
                            return "Vous réussissez à l'effrayer avant qu'il ne fasse des dégâts.";
                        }
                    }
                },
                {
                    text: "Lui donner de l'encre (Coût: 10 Encre)",
                    effect: (state) => {
                        if (state.resources.ink >= 10) {
                            state.resources.ink -= 10;
                            return "Le rat lèche l'encre avec avidité et laisse la page tranquille.";
                        } else {
                            state.resources.pages -= 1;
                            return "Vous n'avez pas assez d'encre ! Le rat mange la page. (-1 Page)";
                        }
                    }
                }
            ]
        },
        {
            type: 'popup',
            title: "Le Visiteur Égaré",
            text: "Une silhouette confuse erre dans les rayons. Elle semble chercher la sortie.",
            condition: (state) => state.resources.ink > 50 && Math.random() < 0.5,
            choices: [
                {
                    text: "Lui indiquer le chemin",
                    effect: (state) => {
                        state.resources.ink += 50;
                        return "Elle vous remercie en vous tendant une fiole d'encre avant de disparaître. (+50 Encre)";
                    }
                },
                {
                    text: "Lui voler ses papiers",
                    effect: (state) => {
                        state.resources.pages += 5;
                        return "Vous profitez de sa confusion pour subtiliser quelques pages vierges. (+5 Pages)";
                    }
                },
                {
                    text: "L'ignorer",
                    effect: () => "Elle finira par faire partie de la bibliothèque, comme nous tous."
                }
            ]
        },
        {
            type: 'log',
            text: "Une fuite dans le plafond laisse tomber des gouttes d'eau noire. Vous récupérez le liquide.",
            condition: (state) => Math.random() < 0.05,
            effect: (state) => { state.resources.ink += 25; return "Récupération inattendue."; }
        },

        // --- NEW POPUPS ---
        {
            type: 'popup',
            title: "L'Encre Vivante",
            text: "Le contenu de votre encrier commence à bouger de lui-même et prend une forme vaguement humanoïde.",
            condition: (state) => state.resources.ink > 200 && Math.random() < 0.5,
            choices: [
                {
                    text: "Lui apprendre à écrire (-50 Encre)",
                    effect: (state) => {
                        if (state.resources.ink >= 50) {
                            state.resources.ink -= 50;
                            // Small permanent buff? Or just pages?
                            state.resources.pages += 2;
                            return "La petite créature gribouille deux pages avant de se dissoudre.";
                        } else {
                            return "Elle s'ennuie et retombe en flaque.";
                        }
                    }
                },
                {
                    text: "La remettre en bouteille (+20 Encre)",
                    effect: (state) => {
                        state.resources.ink += 20;
                        return "Pas de gaspillage.";
                    }
                }
            ]
        },
        {
            type: 'popup',
            title: "Le Silence Pesant",
            text: "Le silence de la bibliothèque devient si lourd qu'il vous oppresse la poitrine.",
            condition: (state) => state.stats.totalPages > 500 && Math.random() < 0.5,
            choices: [
                {
                    text: "Crier pour briser le silence",
                    effect: (state) => {
                        // Stress relief?
                        return "Votre cri résonne à l'infini. Le silence revient, mais moins lourd.";
                    }
                },
                {
                    text: "Écrire pour se calmer (-5 Encre)",
                    effect: (state) => {
                        if (state.resources.ink >= 5) {
                            state.resources.ink -= 5;
                            state.resources.pages += 1;
                            return "Le grattement de la plume est apaisant. (+1 Page)";
                        }
                    }
                }
            ]
        },
        {
            type: 'popup',
            title: "Début d'Incendie",
            text: "Une bougie est tombée ! Une pile de papier commence à fumer.",
            condition: (state) => state.resources.pages > 100 && Math.random() < 0.5,
            choices: [
                {
                    text: "Étouffer avec de l'encre (-20 Encre)",
                    effect: (state) => {
                        if (state.resources.ink >= 20) {
                            state.resources.ink -= 20;
                            return "Le feu est éteint. L'odeur d'encre brûlée est atroce.";
                        } else {
                            state.resources.pages = Math.max(0, state.resources.pages - 10);
                            return "Pas assez d'encre ! Le feu dévore quelques pages.";
                        }
                    }
                },
                {
                    text: "Piétiner le feu (Risque de brûlure)",
                    effect: (state) => {
                        if (Math.random() > 0.3) {
                            state.resources.pages = Math.max(0, state.resources.pages - 2);
                            return "Vous éteignez le feu, mais abîmez quelques pages.";
                        } else {
                            return "Le feu est maîtrisé sans dégâts majeurs.";
                        }
                    }
                }
            ]
        },

        // Dilemma Events (Popups) - RARE
        {
            type: 'popup',
            title: "Le Marchand Ambulant",
            text: "Un homme encapuchonné frappe à la porte. Il propose un échange.",
            condition: (state) => state.resources.pages > 50 && Math.random() < 0.5, // Much more common
            choices: (state) => {
                const roll = Math.random();
                let offerText = "";
                let costType = "pages";
                let rewardType = "ink";
                let costAmount = 0;
                let rewardAmount = 0;
                let isScam = false;

                // Randomize Plan
                if (roll < 0.4) {
                    // Bad Deal / Scam
                    offerText = "Il a un sourire en coin désagréable.";
                    costAmount = Math.floor(state.resources.pages * 0.2) + 10; // High cost
                    rewardAmount = 50; // Low reward
                    isScam = true;
                } else if (roll < 0.8) {
                    // Fair-ish Deal
                    offerText = "Il semble pressé.";
                    costAmount = 10;
                    rewardAmount = 100;
                } else {
                    // Great Deal
                    offerText = "Il veut s'alléger de son fardeau.";
                    costAmount = 5;
                    rewardAmount = 500;
                }

                return [
                    {
                        text: `Echanger ${costAmount} Pages contre ${rewardAmount} Encre (${isScam ? 'Risqué' : 'Offre'})`,
                        effect: (s) => {
                            if (s.resources.pages >= costAmount) {
                                s.resources.pages -= costAmount;
                                s.resources.ink += rewardAmount;
                                return isScam ? "L'encre est de mauvaise qualité, mais elle servira." : "L'échange est conclu.";
                            } else {
                                return "Vous n'avez pas assez de pages.";
                            }
                        }
                    },
                    {
                        text: "Refuser",
                        effect: () => "Il hausse les épaules et disparaît dans l'ombre."
                    }
                ];
            }
        },
        // --- Event Chains & Artifacts ---
        {
            type: 'popup',
            title: "L'Objet Étrange",
            text: "Vous trébuchez sur un petit objet métallique à moitié enfoui sous une pile de livres.",
            condition: (state) => state.resources.pages > 100 && !state.flags['artifact_strange_object'] && Math.random() < 0.6,
            choices: [
                {
                    text: "Le ramasser",
                    effect: (state) => {
                        state.flags['artifact_strange_object'] = true;
                        return "Il est froid et vibre légèrement. Vous le posez sur votre bureau.";
                    }
                },
                {
                    text: "L'ignorer",
                    effect: () => "Mieux vaut ne pas toucher à ce qu'on ne comprend pas."
                }
            ]
        },
        {
            type: 'popup',
            title: "L'Objet S'éveille",
            text: "L'objet métallique que vous avez trouvé s'est ouvert. Il contient une lentille complexe.",
            condition: (state) => state.flags['artifact_strange_object'] && !state.flags['artifact_lens'] && Math.random() < 0.6, // Follow-up
            choices: [
                {
                    text: "Examiner la lentille (Gagner 'Lentille de Vérité')",
                    effect: (state) => {
                        state.flags['artifact_lens'] = true;
                        // Passive effect could be handled in main loop (e.g. see exact stats or hidden triggers)
                        // For now, let's give a resource bonus
                        state.resources.ink += 1000;
                        return "À travers la lentille, l'encre brille d'une lueur dorée. (+1000 Encre)";
                    }
                },
                {
                    text: "Jeter l'objet",
                    effect: (state) => {
                        state.flags['artifact_strange_object'] = false; // Lost
                        return "Vous le jetez par la fenêtre (qui n'existe pas).";
                    }
                }
            ]
        },
        {
            type: 'popup',
            title: "L'Inspiration Soudaine",
            text: "Une idée vous traverse l'esprit comme un éclair. Elle est dangereuse mais brillante.",
            condition: (state) => state.resources.ink > 100 && Math.random() < 0.5,
            choices: [
                {
                    text: "Écrire frénétiquement (-100 Encre)",
                    effect: (state) => {
                        if (state.resources.ink >= 100) {
                            state.resources.ink -= 100;
                            state.resources.pages += 15;
                            return "Votre main a bougé toute seule.";
                        } else {
                            return "L'encre a manqué avant la fin de l'idée.";
                        }
                    }
                },
                {
                    text: "Se reposer (+10 Encre)",
                    effect: (state) => {
                        state.resources.ink += 10;
                        return "Vous laissez l'idée s'échapper pour économiser vos forces.";
                    }
                }
            ]
        },
        {
            type: 'popup',
            title: "Le Chat Noir",
            text: "Un chat noir aux yeux jaunes est entré. Il fixe votre réserve de papier.",
            condition: (state) => state.resources.pages > 5 && Math.random() < 0.5,
            choices: [
                {
                    text: "Le chasser",
                    effect: (state) => {
                        return "Le chat feule et disparaît dans une ombre.";
                    }
                },
                {
                    text: "Lui donner une page froissée (-1 Page)",
                    effect: (state) => {
                        if (state.resources.pages >= 1) {
                            state.resources.pages -= 1;
                            return "Le chat joue avec la boule de papier puis s'endort.";
                        }
                    }
                }
            ]
        },
        {
            type: 'popup',
            title: "Erreur de Copie",
            text: "Vous réalisez qu'un de vos textes contient une incantation mineure involontaire.",
            condition: (state) => state.resources.pages > 150 && Math.random() < 0.5,
            choices: [
                {
                    text: "Détruire la page (-1 Page)",
                    effect: (state) => {
                        if (state.resources.pages >= 1) {
                            state.resources.pages -= 1;
                            return "Mieux vaut prévenir que guérir.";
                        }
                    }
                },
                {
                    text: "La garder (Risqué)",
                    effect: (state) => {
                        if (Math.random() < 0.5) {
                            state.resources.ink += 100;
                            return "L'incantation attire de l'encre des alentours !";
                        } else {
                            state.resources.ink = Math.max(0, state.resources.ink - 50);
                            return "L'incantation a bu votre encre !";
                        }
                    }
                }
            ]
        },
        {
            type: 'popup',
            title: "Le Murmure du Vide",
            text: "Le vide vous appelle. Il demande un sacrifice.",
            condition: (state) => state.resources.pages > 500 && Math.random() < 0.1,
            choices: [
                {
                    text: "Sacrifier 500 Pages",
                    effect: (state) => {
                        if (state.resources.pages >= 500) {
                            state.resources.pages -= 500;
                            // Rare knowledge gain
                            state.resources.forbiddenKnowledge = (state.resources.forbiddenKnowledge || 0) + 1;
                            updateUI();
                            return "Le vide accepte votre offrande. Une vérité vous brûle l'esprit.";
                        } else {
                            return "Vous n'avez pas assez de pages pour satisfaire le vide.";
                        }
                    }
                },
                {
                    text: "Ignorer",
                    effect: (state) => {
                        return "Le murmure s'estompe, mécontent.";
                    }
                }
            ]
        },
        {
            type: 'popup',
            title: "Artefact : La Plume de Cendres",
            text: "Sous une pile de vieux parchemins, vous trouvez une plume grise qui semble fumer.",
            condition: (state) => state.resources.pages > 2000 && !state.flags['artifact_ash_quill'] && Math.random() < 0.4,
            choices: [
                {
                    text: "La prendre",
                    effect: (state) => {
                        state.flags['artifact_ash_quill'] = true;
                        state.resources.ink += 5000;
                        return "Elle est chaude au toucher. L'encre semble bouillir à son contact. (+5000 Encre)";
                    }
                },
                {
                    text: "La laisser",
                    effect: () => "Trop dangereux. Vous la recouvrez de papier."
                }
            ]
        }
    ]
};

window.Events = Events;

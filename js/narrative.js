const Narrative = {
    log: function (text, cssClass = null) {
        const logElement = document.getElementById('narrative-log');
        if (!logElement) return;

        const p = document.createElement('p');
        p.textContent = `> ${text}`;
        p.classList.add('story-text', 'story-new');
        if (cssClass) p.classList.add(cssClass);

        logElement.appendChild(p);
        logElement.scrollTop = logElement.scrollHeight;

        if (logElement.children.length > 50) {
            logElement.removeChild(logElement.children[0]);
        }
    },

    logHTML: function (html, cssClass = null) {
        const logElement = document.getElementById('narrative-log');
        if (!logElement) return;

        const p = document.createElement('p');
        // No "> " prefix for raw HTML logs usually, or maybe we want it? Let's skip it for resources
        // Maybe add a small symbol like [i] or something
        p.innerHTML = html;
        p.classList.add('story-text', 'story-new');
        if (cssClass) p.classList.add(cssClass);

        logElement.appendChild(p);
        logElement.scrollTop = logElement.scrollHeight;

        if (logElement.children.length > 50) {
            logElement.removeChild(logElement.children[0]);
        }
    },

    events: [
        {
            id: 'start',
            trigger: (state) => true,
            text: "Le pot d'encre est plein. La première page est vierge.",
            once: true
        }
        // distinct events can be added here
    ]
};

// Make it available globally if needed, or simply let other scripts use Narrative.log
window.Narrative = Narrative;

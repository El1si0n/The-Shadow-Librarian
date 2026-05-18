
function playIntroSequence() {
    // 1. Create Overlay Elements
    const overlay = document.createElement('div');
    overlay.id = 'intro-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        zIndex: '10000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
    });

    const bgImage = document.createElement('div');
    Object.assign(bgImage.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: '0', // Start hidden
        transition: 'opacity 0.1s linear'
    });
    overlay.appendChild(bgImage);

    const textContainer = document.createElement('div');
    Object.assign(textContainer.style, {
        position: 'absolute',
        bottom: '20%',
        color: '#e0e0e0',
        fontFamily: "'VT323', monospace",
        fontSize: '2rem',
        textAlign: 'center',
        opacity: '0',
        transition: 'opacity 2s ease',
        maxWidth: '80%',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        zIndex: '10001',
        pointerEvents: 'none'
    });
    overlay.appendChild(textContainer);

    document.body.appendChild(overlay);

    // 2. Sequence Data
    const sequence = [
        { img: 'black', duration: 500, opacity: 0 },
        { img: 'occulte.png', duration: 150, flash: true, opacity: 1 },
        { img: 'black', duration: 100, opacity: 0 },
        { img: 'scriptorium.png', duration: 150, flash: true, opacity: 1 },
        { img: 'black', duration: 500, opacity: 0 },
        {
            img: 'cave.png',
            duration: 6000,
            fadeIn: true,
            text: "L'obscurité de la cave vous accueille.\nLa poussière et l'encre... comme un vieux souvenir."
        }
    ];

    let index = 0;

    function nextStep() {
        if (index >= sequence.length) {
            // End of sequence
            overlay.style.transition = 'opacity 2s ease-out';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();

                // Set flag and save
                gameState.flags.seenIntro = true;
                saveGame();

                if (window.Narrative) {
                    Narrative.log("La vision s'estompe. Vous devez écrire.");
                }
            }, 2000);
            return;
        }

        const step = sequence[index];
        index++;

        // Handle Image Source
        if (step.img && step.img !== 'black') {
            bgImage.style.backgroundImage = `url('image/${step.img}')`;
        } else {
            bgImage.style.backgroundImage = 'none';
        }

        // Handle Transition to Opacity 1 (Fade In)
        if (step.fadeIn) {
            // Ensure we start from low opacity for the fade
            bgImage.style.transition = 'none';
            bgImage.style.opacity = '0';

            // Force reflow
            void bgImage.offsetWidth;

            bgImage.style.transition = 'opacity 3s ease-in-out';
            bgImage.style.opacity = '1';
        }
        // Handle Direct Opacity Set (Cuts/Flashes)
        else {
            bgImage.style.transition = 'opacity 0.1s linear';
            bgImage.style.opacity = step.opacity !== undefined ? step.opacity : 1;
        }

        // Handle Flash visual effect
        if (step.flash) {
            bgImage.style.filter = 'brightness(3) contrast(1.5)';
            setTimeout(() => {
                bgImage.style.filter = 'brightness(1)';
            }, 50);
        } else {
            bgImage.style.filter = 'brightness(1)';
        }

        // Handle Text
        if (step.text) {
            textContainer.innerText = step.text;
            // Delay text fade in so it appears after/during image fade
            setTimeout(() => {
                textContainer.style.opacity = '1';
            }, 1500);
        } else {
            textContainer.style.opacity = '0';
            // Clear text after fade out
            setTimeout(() => {
                if (!step.text) textContainer.innerText = '';
            }, 500);
        }

        setTimeout(nextStep, step.duration);
    }

    // Start
    nextStep();
}

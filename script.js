/*==================== Toggle Icon Navbar ====================*/
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

const setMobileMenuOpen = isOpen => {
    menuIcon.classList.toggle('bx-x', isOpen);
    navbar.classList.toggle('active', isOpen);
    menuIcon.setAttribute('aria-expanded', String(isOpen));
    menuIcon.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
};

menuIcon.onclick = () => setMobileMenuOpen(!navbar.classList.contains('active'));

/*==================== Smooth Scroll for Nav Links ====================*/
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            if (menuIcon && navbar) {
                setMobileMenuOpen(false);
            }
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

/*==================== Parallax Effect on Hero Image ====================*/
const homeImg = document.querySelector('.home-img img');
if (homeImg) {
    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 10;
        const y = (e.clientY / window.innerHeight - 0.5) * 10;
        homeImg.style.setProperty('--pointer-x', `${Math.round(x)}px`);
        homeImg.style.setProperty('--pointer-y', `${Math.round(y)}px`);
    });
}

/*==================== Color Theme Picker ====================*/
const themeSelect = document.getElementById('theme-select');
const availableThemes = new Set(Array.from(themeSelect.options, option => option.value));
const themeStorageKey = 'portfolio-theme';

const applyTheme = (theme, persist = false) => {
    if (!availableThemes.has(theme)) return;

    document.documentElement.dataset.theme = theme;
    themeSelect.value = theme;

    if (persist) {
        document.documentElement.dataset.customColors = 'true';
        try {
            localStorage.setItem(themeStorageKey, theme);
        } catch {}
    }
};

if (themeSelect) {
    const initialTheme = document.documentElement.dataset.theme;
    applyTheme(availableThemes.has(initialTheme) ? initialTheme : 'ocean');
    themeSelect.addEventListener('change', () => {
        applyTheme(themeSelect.value, true);
    });
}

/*==================== Light and Dark Appearance Toggle ====================*/
const schemeToggle = document.getElementById('scheme-toggle');
const schemeStorageKey = 'portfolio-scheme';

const applyScheme = (scheme, persist = false, resetCustomBackground = false) => {
    const isLight = scheme === 'light';
    const root = document.documentElement;
    const shouldResetBackground = persist && resetCustomBackground && root.dataset.userBackground === 'true';

    if (shouldResetBackground) {
        root.style.removeProperty('--user-bg-color');
        delete root.dataset.userBackground;
        try {
            localStorage.removeItem('portfolio-background');
        } catch {}
    }

    root.dataset.scheme = isLight ? 'light' : 'dark';
    schemeToggle.setAttribute('aria-checked', String(isLight));
    schemeToggle.setAttribute('title', `Switch to ${isLight ? 'dark' : 'light'} appearance`);
    schemeToggle.querySelector('span').textContent = isLight ? 'Light' : 'Dark';

    const schemeIcon = schemeToggle.querySelector('i');
    schemeIcon.classList.toggle('bx-sun', isLight);
    schemeIcon.classList.toggle('bx-moon', !isLight);

    if (shouldResetBackground && backgroundColorInput) {
        const defaultColor = defaultBackgroundByTheme[themeSelect.value]?.[root.dataset.scheme] ?? '#0b0f19';
        backgroundColorInput.value = defaultColor;
        markBackgroundPreset(defaultColor);
    }

    if (persist) {
        document.documentElement.dataset.customColors = 'true';
        try {
            localStorage.setItem(schemeStorageKey, isLight ? 'light' : 'dark');
        } catch {}
    }
};

if (schemeToggle) {
    const initialScheme = document.documentElement.dataset.scheme === 'light' ? 'light' : 'dark';
    applyScheme(initialScheme);
    schemeToggle.addEventListener('click', () => {
        applyScheme(schemeToggle.getAttribute('aria-checked') === 'false' ? 'light' : 'dark', true, true);
    });
}

/*==================== Custom Page Background ====================*/
const backgroundMenu = document.getElementById('background-menu');
const backgroundColorInput = document.getElementById('background-color');
const backgroundPresetButtons = Array.from(document.querySelectorAll('[data-background-preset]'));
const backgroundResetButton = document.getElementById('background-reset');
const blackHoleBackgroundButton = document.getElementById('black-hole-background');
const videoBackgroundButton = document.getElementById('video-background');
const backgroundEffectStatus = document.getElementById('background-effect-status');
const blackHoleCanvas = document.getElementById('black-hole-canvas');
const backgroundVideo = document.getElementById('background-video');
const backgroundStorageKey = 'portfolio-background';
const backgroundEffectStorageKey = 'portfolio-background-effect';
let blackHoleRenderState = null;
let blackHoleLoadPromise = null;
let blackHoleAnimationFrame = 0;
let blackHoleResizeHandler = null;
let blackHolePointerHandler = null;
const defaultBackgroundByTheme = {
    ocean: { dark: '#0b0f19', light: '#f8fafc' },
    forest: { dark: '#08140e', light: '#f0fdf4' },
    amber: { dark: '#16110a', light: '#fffbeb' },
    rose: { dark: '#160b13', light: '#fff1f2' }
};

const backgroundRgb = hex => {
    const value = hex.slice(1);
    return [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16));
};

const backgroundLuminance = hex => {
    const [red, green, blue] = backgroundRgb(hex).map(channel => {
        const normalized = channel / 255;
        return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
    });
    return .2126 * red + .7152 * green + .0722 * blue;
};

const markBackgroundPreset = color => {
    backgroundPresetButtons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.backgroundPreset === color));
    });
};

const applyBackground = (color, persist = false, adjustScheme = true) => {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;

    const root = document.documentElement;
    root.style.setProperty('--user-bg-color', color);
    root.dataset.userBackground = 'true';
    root.dataset.customColors = 'true';
    backgroundColorInput.value = color;
    markBackgroundPreset(color);

    if (persist && root.dataset.backgroundEffect) {
        stopBackgroundEffect();
    }

    if (adjustScheme) {
        applyScheme(backgroundLuminance(color) > .42 ? 'light' : 'dark', persist, false);
    }

    if (persist) {
        try {
            localStorage.setItem(backgroundStorageKey, color);
        } catch {}
    }
};

if (backgroundMenu && backgroundColorInput) {
    let savedBackground = null;
    try {
        savedBackground = localStorage.getItem(backgroundStorageKey);
    } catch {}

    if (savedBackground && /^#[0-9a-f]{6}$/i.test(savedBackground)) {
        applyBackground(savedBackground, false, false);
    } else {
        const defaultColor = defaultBackgroundByTheme[themeSelect.value]?.[document.documentElement.dataset.scheme] ?? '#0b0f19';
        backgroundColorInput.value = defaultColor;
        markBackgroundPreset(defaultColor);
    }

    backgroundPresetButtons.forEach(button => {
        button.addEventListener('click', () => {
            applyBackground(button.dataset.backgroundPreset, true);
            backgroundMenu.open = false;
        });
    });

    backgroundColorInput.addEventListener('input', () => {
        applyBackground(backgroundColorInput.value, false);
    });

    backgroundColorInput.addEventListener('change', () => {
        applyBackground(backgroundColorInput.value, true);
    });

    backgroundResetButton.addEventListener('click', () => {
        const root = document.documentElement;
        stopBackgroundEffect();
        root.style.removeProperty('--user-bg-color');
        delete root.dataset.userBackground;
        backgroundMenu.open = false;

        const defaultColor = defaultBackgroundByTheme[themeSelect.value]?.[root.dataset.scheme] ?? '#0b0f19';
        backgroundColorInput.value = defaultColor;
        markBackgroundPreset(defaultColor);

        try {
            localStorage.removeItem(backgroundStorageKey);
            localStorage.removeItem(backgroundEffectStorageKey);
        } catch {}
    });
}

const stopBackgroundEffect = (clearPreference = true) => {
    const root = document.documentElement;
    delete root.dataset.backgroundEffect;
    blackHoleCanvas.hidden = true;
    backgroundVideo.pause();
    backgroundVideo.hidden = true;
    blackHoleBackgroundButton.setAttribute('aria-pressed', 'false');
    videoBackgroundButton.setAttribute('aria-pressed', 'false');
    backgroundEffectStatus.textContent = '';

    if (blackHoleAnimationFrame) {
        cancelAnimationFrame(blackHoleAnimationFrame);
        blackHoleAnimationFrame = 0;
    }
    if (blackHoleResizeHandler) {
        window.removeEventListener('resize', blackHoleResizeHandler);
        blackHoleResizeHandler = null;
    }
    if (blackHolePointerHandler) {
        window.removeEventListener('pointermove', blackHolePointerHandler);
        blackHolePointerHandler = null;
    }

    if (clearPreference) {
        try {
            localStorage.removeItem(backgroundEffectStorageKey);
        } catch {}
    }
};

const startBlackHoleBackground = async (persist = true) => {
    if (document.documentElement.dataset.backgroundEffect !== 'black-hole') {
        stopBackgroundEffect(false);
    }

    const root = document.documentElement;
    root.dataset.backgroundEffect = 'black-hole';
    blackHoleCanvas.hidden = false;
    blackHoleBackgroundButton.setAttribute('aria-pressed', 'true');
    videoBackgroundButton.setAttribute('aria-pressed', 'false');
    backgroundVideo.pause();
    backgroundVideo.hidden = true;
    backgroundEffectStatus.textContent = 'Loading 3D background...';

    if (persist) {
        try {
            localStorage.setItem(backgroundEffectStorageKey, 'black-hole');
        } catch {}
    }

    try {
        if (!blackHoleLoadPromise) {
            blackHoleLoadPromise = (async () => {
                const [THREE, { GLTFLoader }] = await Promise.all([
                    import('three'),
                    import('three/addons/loaders/GLTFLoader.js')
                ]);

                const renderer = new THREE.WebGLRenderer({ canvas: blackHoleCanvas, alpha: true, antialias: true });
                renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.75), 2));
                renderer.setClearColor(0x000000, 0);
                renderer.outputColorSpace = THREE.SRGBColorSpace;

                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, .1, 100);
                camera.position.z = window.innerWidth < 768 ? 8.4 : 6.8;
                scene.add(new THREE.AmbientLight(0x9fc9ff, 1.8));

                const coolLight = new THREE.PointLight(0x48c8ff, 65, 30);
                coolLight.position.set(-4, 2, 5);
                scene.add(coolLight);

                const warmLight = new THREE.PointLight(0xff713d, 35, 25);
                warmLight.position.set(4, -2, 3);
                scene.add(warmLight);

                const starPositions = new Float32Array(900 * 3);
                for (let index = 0; index < starPositions.length; index += 3) {
                    starPositions[index] = (Math.random() - .5) * 48;
                    starPositions[index + 1] = (Math.random() - .5) * 30;
                    starPositions[index + 2] = -8 - Math.random() * 28;
                }
                const starGeometry = new THREE.BufferGeometry();
                starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
                const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
                    color: 0xb8d9ff,
                    size: .045,
                    transparent: true,
                    opacity: .75,
                    sizeAttenuation: true
                }));
                scene.add(stars);

                const modelGroup = new THREE.Group();
                scene.add(modelGroup);

                const gltf = await new GLTFLoader().loadAsync(new URL('black_hole.glb', document.baseURI).href);
                const model = gltf.scene;
                const bounds = new THREE.Box3().setFromObject(model);
                const center = bounds.getCenter(new THREE.Vector3());
                const size = bounds.getSize(new THREE.Vector3());
                const largestDimension = Math.max(size.x, size.y, size.z) || 1;
                const scale = 5.2 / largestDimension;

                model.scale.setScalar(scale);
                model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
                modelGroup.add(model);

                return { THREE, renderer, scene, camera, modelGroup, stars };
            })();
        }

        blackHoleRenderState = await blackHoleLoadPromise;
        if (root.dataset.backgroundEffect !== 'black-hole') return;

        const { renderer, scene, camera, modelGroup, stars } = blackHoleRenderState;
        const resize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            camera.aspect = width / height;
            camera.position.z = width < 768 ? 8.4 : 6.8;
            camera.updateProjectionMatrix();
            renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.75), 2));
            renderer.setSize(width, height, false);
        };
        resize();

        if (!blackHoleResizeHandler) {
            blackHoleResizeHandler = resize;
            window.addEventListener('resize', blackHoleResizeHandler, { passive: true });
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            renderer.render(scene, camera);
        } else {
            let pointerX = 0;
            let pointerY = 0;
            blackHolePointerHandler = event => {
                pointerX = (event.clientX / window.innerWidth - .5) * .12;
                pointerY = (event.clientY / window.innerHeight - .5) * .08;
            };
            window.addEventListener('pointermove', blackHolePointerHandler, { passive: true });

            const animate = () => {
                if (root.dataset.backgroundEffect !== 'black-hole') return;
                blackHoleAnimationFrame = requestAnimationFrame(animate);
                modelGroup.rotation.y += .0015;
                modelGroup.rotation.x += (pointerY - modelGroup.rotation.x) * .015;
                modelGroup.rotation.z += (pointerX - modelGroup.rotation.z) * .015;
                stars.rotation.y -= .00015;
                renderer.render(scene, camera);
            };
            animate();
        }

        backgroundEffectStatus.textContent = '3D background active';
    } catch (error) {
        console.error('Could not load black_hole.glb background:', error);
        blackHoleLoadPromise = null;
        stopBackgroundEffect();
        backgroundEffectStatus.textContent = 'Could not load 3D background. Open the site through a local server.';
    }
};

const startVideoBackground = async (persist = true) => {
    if (document.documentElement.dataset.backgroundEffect !== 'video') {
        stopBackgroundEffect(false);
    }

    const root = document.documentElement;
    root.dataset.backgroundEffect = 'video';
    blackHoleCanvas.hidden = true;
    videoBackgroundButton.setAttribute('aria-pressed', 'true');
    blackHoleBackgroundButton.setAttribute('aria-pressed', 'false');
    backgroundVideo.hidden = false;
    backgroundEffectStatus.textContent = 'Loading video background...';

    if (persist) {
        try {
            localStorage.setItem(backgroundEffectStorageKey, 'video');
        } catch {}
    }

    try {
        await backgroundVideo.play();
        if (root.dataset.backgroundEffect !== 'video') return;
        backgroundEffectStatus.textContent = 'Video background active';
    } catch (error) {
        if (root.dataset.backgroundEffect !== 'video' || error.name === 'AbortError') return;
        console.error('Could not play video background:', error);
        stopBackgroundEffect();
        backgroundEffectStatus.textContent = 'Could not play the video background.';
    }
};

if (blackHoleBackgroundButton) {
    blackHoleBackgroundButton.addEventListener('click', () => {
        if (document.documentElement.dataset.backgroundEffect === 'black-hole') {
            stopBackgroundEffect();
        } else {
            startBlackHoleBackground();
        }
        backgroundMenu.open = true;
    });

    if (document.documentElement.dataset.backgroundEffect === 'black-hole') {
        startBlackHoleBackground(false);
    }
}

if (videoBackgroundButton) {
    videoBackgroundButton.addEventListener('click', () => {
        if (document.documentElement.dataset.backgroundEffect === 'video') {
            stopBackgroundEffect();
        } else {
            startVideoBackground();
        }
        backgroundMenu.open = true;
    });

    if (document.documentElement.dataset.backgroundEffect === 'video') {
        startVideoBackground(false);
    }
}

/*==================== Services Rainbow Icon Toggle ====================*/
const servicesRainbowToggle = document.getElementById('services-rainbow');
const servicesRainbowStorageKey = 'services-rainbow-icons';

if (servicesRainbowToggle) {
    let rainbowEnabled = document.documentElement.dataset.serviceIcons === 'rainbow';
    try {
        rainbowEnabled = rainbowEnabled || localStorage.getItem(servicesRainbowStorageKey) === 'true';
    } catch {}

    servicesRainbowToggle.checked = rainbowEnabled;
    if (rainbowEnabled) document.documentElement.dataset.serviceIcons = 'rainbow';

    servicesRainbowToggle.addEventListener('change', () => {
        if (servicesRainbowToggle.checked) {
            document.documentElement.dataset.serviceIcons = 'rainbow';
            try {
                localStorage.setItem(servicesRainbowStorageKey, 'true');
            } catch {}
        } else {
            delete document.documentElement.dataset.serviceIcons;
            try {
                localStorage.removeItem(servicesRainbowStorageKey);
            } catch {}
        }
    });
}

/*==================== Scroll Sections Active Link ====================*/
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if (top >= offset && top < offset + height) {
            navLinks.forEach(links => {
                links.classList.remove('active');
                document.querySelector('header nav a[href*=' + id + ']').classList.add('active');
            });
        };
    });

    /*==================== Sticky Navbar ====================*/
    let header = document.querySelector('header');
    header.classList.toggle('sticky', window.scrollY > 100);

    /*==================== Remove Toggle Icon and Navbar when click navbar link (scroll) ====================*/
    setMobileMenuOpen(false);
};

/*==================== Scroll Reveal ====================*/
ScrollReveal({ 
    distance: '60px',
    duration: 1800,
    delay: 150,
    reset: false
});

ScrollReveal().reveal('.hero-badge, .home-content h3, .home-content h1, .hero-desc, .hero-btn-group, .heading, .section-tag', { origin: 'top', interval: 80 });
ScrollReveal().reveal('.home-img-wrapper, .hero-stats, .skills-container, .services-container, .portfolio-card, .contact-wrapper', { origin: 'bottom', interval: 100 });
ScrollReveal().reveal('.about-img-wrapper', { origin: 'left' });
ScrollReveal().reveal('.about-content', { origin: 'right' });

/*==================== Typed JS ====================*/
new Typed('.multiple-text', {
    strings: ['Backend Developer', 'Web Developer', 'Robotics & IoT Enthusiast', 'AI Explorer'],
    typeSpeed: 65,
    backSpeed: 45,
    backDelay: 1500,
    loop: true,
    contentType: 'null'
});

/*==================== Read More / Read Less (About Me) ====================*/
const readMoreBtn = document.getElementById('read-more-btn');
const moreText = document.querySelector('.more-text');

if (readMoreBtn && moreText) {
    readMoreBtn.addEventListener('click', function(e) {
        e.preventDefault(); 
        
        if (moreText.style.display === 'inline' || moreText.style.display === 'block') {
            moreText.style.display = 'none';
            readMoreBtn.textContent = 'Read More';
        } else {
            moreText.style.display = 'inline';
            readMoreBtn.textContent = 'Read Less';
        }
    });
}

/*==================== Feedback Confirmation Popup ====================*/
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const returnFocus = document.activeElement;
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'feedback-modal-backdrop';

        const modalBox = document.createElement('section');
        modalBox.className = 'feedback-modal';
        modalBox.setAttribute('role', 'dialog');
        modalBox.setAttribute('aria-modal', 'true');
        modalBox.setAttribute('aria-labelledby', 'feedback-modal-title');

        const confetti = document.createElement('div');
        confetti.className = 'feedback-confetti';
        confetti.setAttribute('aria-hidden', 'true');

        const themeStyles = getComputedStyle(document.documentElement);
        const confettiColors = [
            themeStyles.getPropertyValue('--main-color').trim(),
            themeStyles.getPropertyValue('--confetti-alt-color').trim(),
            themeStyles.getPropertyValue('--text-color').trim()
        ];
        for (let index = 0; index < 28; index++) {
            const piece = document.createElement('span');
            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 100;

            piece.className = 'feedback-confetti-piece';
            piece.style.setProperty('--confetti-x', `${Math.cos(angle) * distance}px`);
            piece.style.setProperty('--confetti-y', `${Math.sin(angle) * distance}px`);
            piece.style.setProperty('--confetti-rotation', `${Math.random() * 720 - 360}deg`);
            piece.style.setProperty('--confetti-color', confettiColors[index % confettiColors.length]);
            piece.style.setProperty('--confetti-delay', `${Math.random() * 0.12}s`);
            confetti.appendChild(piece);
        }

        const successMark = document.createElement('div');
        successMark.className = 'feedback-modal-mark';
        successMark.setAttribute('aria-hidden', 'true');

        const checkIcon = document.createElement('i');
        checkIcon.className = 'bx bx-check';
        successMark.appendChild(checkIcon);

        const modalTitle = document.createElement('h2');
        modalTitle.id = 'feedback-modal-title';
        modalTitle.textContent = 'Thank you!';

        const modalText = document.createElement('p');
        modalText.className = 'feedback-modal-message';
        modalText.textContent = 'Your message has been sent successfully.';

        const modalActions = document.createElement('div');
        modalActions.className = 'feedback-modal-actions';

        const actionHint = document.createElement('p');
        actionHint.textContent = 'Select OK to close this message.';

        const modalBtn = document.createElement('button');
        modalBtn.type = 'button';
        modalBtn.className = 'feedback-modal-button';
        modalBtn.textContent = 'OK';

        const closeModal = () => {
            modalOverlay.remove();
            window.removeEventListener('keydown', handleKeydown);
            contactForm.reset();
            returnFocus?.focus();
        };

        const handleKeydown = (keyEvent) => {
            if (keyEvent.key === 'Escape') {
                closeModal();
            }
        };

        modalBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (clickEvent) => {
            if (clickEvent.target === modalOverlay) {
                closeModal();
            }
        });
        window.addEventListener('keydown', handleKeydown);

        modalActions.append(actionHint, modalBtn);
        modalBox.append(confetti, successMark, modalTitle, modalText, modalActions);
        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);
        modalBtn.focus();
    });
}

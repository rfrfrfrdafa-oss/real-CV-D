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

/*==================== Light and Dark Appearance Toggle & Background System ====================*/
const schemeToggle = document.getElementById('scheme-toggle');
const schemeStorageKey = 'portfolio-scheme';
const nightModeRecommendation = document.getElementById('night-mode-recommendation');
const nightModeRecommendationText = document.getElementById('night-mode-recommendation-text');
const useDarkModeButton = document.getElementById('use-dark-mode');
const backgroundMenu = document.getElementById('background-menu');
const backgroundColorInput = document.getElementById('background-color');
const backgroundPresetButtons = Array.from(document.querySelectorAll('[data-background-preset]'));
const backgroundResetButton = document.getElementById('background-reset');
const blackHoleBackgroundButton = document.getElementById('black-hole-background');
const videoBackgroundButton = document.getElementById('video-background');
const backgroundEffectStatus = document.getElementById('background-effect-status');
const blackHoleCanvas = document.getElementById('black-hole-canvas');
const backgroundVideo = document.getElementById('background-video');
const meteorCanvas = document.getElementById('meteor-canvas');
const meteorShowerToggle = document.getElementById('meteor-shower-toggle');
const meteorEventBtn = document.getElementById('meteor-event-btn');
const heroMeteorBtn = document.getElementById('hero-meteor-btn');
const meteorEventToast = document.getElementById('meteor-event-toast');
const toastEventTitle = document.getElementById('toast-event-title');
const toastEventDesc = document.getElementById('toast-event-desc');
const toastCloseBtn = document.getElementById('toast-close-btn');
const toastProgressBar = document.getElementById('toast-progress-bar');
const backgroundStorageKey = 'portfolio-background';
const backgroundEffectStorageKey = 'portfolio-background-effect';
const meteorStorageKey = 'portfolio-meteor-shower';
let meteorShower = null;
let blackHoleRenderState = null;
let blackHoleLoadPromise = null;
let blackHoleAnimationFrame = 0;
let blackHoleResizeHandler = null;
let blackHolePointerHandler = null;
const defaultBackgroundByTheme = {
    ocean: { dark: '#0b0f19', light: '#ffffff' },
    forest: { dark: '#08140e', light: '#ffffff' },
    amber: { dark: '#16110a', light: '#ffffff' },
    rose: { dark: '#160b13', light: '#ffffff' }
};

const recommendDarkMode = message => {
    if (document.documentElement.dataset.scheme !== 'light' || !nightModeRecommendation || !nightModeRecommendationText) return;
    nightModeRecommendationText.textContent = message;
    nightModeRecommendation.hidden = false;
    if (backgroundMenu) backgroundMenu.open = true;
};

const hideDarkModeRecommendation = () => {
    if (nightModeRecommendation) nightModeRecommendation.hidden = true;
};

const stopBackgroundEffect = (clearPreference = true) => {
    const root = document.documentElement;
    delete root.dataset.backgroundEffect;
    if (blackHoleCanvas) blackHoleCanvas.hidden = true;
    if (backgroundVideo) {
        backgroundVideo.pause();
        backgroundVideo.hidden = true;
    }
    if (blackHoleBackgroundButton) blackHoleBackgroundButton.setAttribute('aria-pressed', 'false');
    if (videoBackgroundButton) videoBackgroundButton.setAttribute('aria-pressed', 'false');
    if (backgroundEffectStatus) backgroundEffectStatus.textContent = '';

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
    if (schemeToggle) {
        schemeToggle.setAttribute('aria-checked', String(isLight));
        schemeToggle.setAttribute('title', `Switch to ${isLight ? 'dark' : 'light'} appearance`);
        schemeToggle.querySelector('span').textContent = isLight ? 'Light' : 'Dark';

        const schemeIcon = schemeToggle.querySelector('i');
        schemeIcon.classList.toggle('bx-sun', isLight);
        schemeIcon.classList.toggle('bx-moon', !isLight);
    }

    // Automatically stop video/black-hole and disable meteor trails on white/light background
    if (isLight) {
        stopBackgroundEffect(persist);
        if (meteorShower) {
            meteorShower.setActive(false, persist);
        } else {
            root.dataset.meteorShower = 'false';
        }
        if (meteorShowerToggle) {
            meteorShowerToggle.setAttribute('aria-pressed', 'false');
        }
    }

    if (shouldResetBackground && backgroundColorInput) {
        const defaultColor = defaultBackgroundByTheme[themeSelect?.value]?.[root.dataset.scheme] ?? '#ffffff';
        backgroundColorInput.value = defaultColor;
        markBackgroundPreset(defaultColor);
    }

    if (persist) {
        document.documentElement.dataset.customColors = 'true';
        try {
            localStorage.setItem(schemeStorageKey, isLight ? 'light' : 'dark');
        } catch {}
    }

    if (!isLight) hideDarkModeRecommendation();
};

if (schemeToggle) {
    const initialScheme = document.documentElement.dataset.scheme === 'light' ? 'light' : 'dark';
    applyScheme(initialScheme);
    schemeToggle.addEventListener('click', () => {
        applyScheme(schemeToggle.getAttribute('aria-checked') === 'false' ? 'light' : 'dark', true, true);
    });
}

if (useDarkModeButton) {
    useDarkModeButton.addEventListener('click', () => {
        applyScheme('dark', true, false);
        if (backgroundMenu) backgroundMenu.open = true;
    });
}

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
        button.setAttribute('aria-pressed', String(button.dataset.backgroundPreset.toLowerCase() === color.toLowerCase()));
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

    const isLight = backgroundLuminance(color) > .42;

    // Automatically stop video/black-hole and disable meteor trails on white/light background
    if (isLight) {
        stopBackgroundEffect(persist);
        if (meteorShower) {
            meteorShower.setActive(false, persist);
        } else {
            root.dataset.meteorShower = 'false';
        }
        if (meteorShowerToggle) {
            meteorShowerToggle.setAttribute('aria-pressed', 'false');
        }
    } else if (persist && root.dataset.backgroundEffect) {
        stopBackgroundEffect();
    }

    if (adjustScheme) {
        applyScheme(isLight ? 'light' : 'dark', persist, false);
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
        const defaultColor = defaultBackgroundByTheme[themeSelect?.value]?.[document.documentElement.dataset.scheme] ?? '#0b0f19';
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

        const isLight = root.dataset.scheme === 'light';
        const defaultColor = defaultBackgroundByTheme[themeSelect?.value]?.[root.dataset.scheme] ?? (isLight ? '#ffffff' : '#0b0f19');
        backgroundColorInput.value = defaultColor;
        markBackgroundPreset(defaultColor);

        try {
            localStorage.removeItem(backgroundStorageKey);
            localStorage.removeItem(backgroundEffectStorageKey);
        } catch {}

        if (meteorShower) {
            meteorShower.setActive(!isLight, true);
        }
        if (meteorShowerToggle) {
            meteorShowerToggle.setAttribute('aria-pressed', String(!isLight));
        }
    });
}

const startBlackHoleBackground = async (persist = true) => {
    const root = document.documentElement;
    if (root.dataset.scheme === 'light') {
        applyScheme('dark', true, true);
    }

    if (root.dataset.backgroundEffect !== 'black-hole') {
        stopBackgroundEffect(false);
    }

    root.dataset.backgroundEffect = 'black-hole';
    blackHoleCanvas.hidden = false;
    blackHoleBackgroundButton.setAttribute('aria-pressed', 'true');
    videoBackgroundButton.setAttribute('aria-pressed', 'false');
    backgroundVideo.pause();
    backgroundVideo.hidden = true;
    backgroundEffectStatus.textContent = 'Loading deep-space scene…';
    recommendDarkMode('Deep-space visuals are designed for dark mode, where contrast and depth look their best.');

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

        backgroundEffectStatus.textContent = 'Deep-space scene active.';
    } catch (error) {
        console.error('Could not load black_hole.glb background:', error);
        blackHoleLoadPromise = null;
        stopBackgroundEffect();
        backgroundEffectStatus.textContent = 'Could not load 3D background. Open the site through a local server.';
    }
};

const startVideoBackground = async (persist = true) => {
    const root = document.documentElement;
    if (root.dataset.scheme === 'light') {
        applyScheme('dark', true, true);
    }

    if (root.dataset.backgroundEffect !== 'video') {
        stopBackgroundEffect(false);
    }

    root.dataset.backgroundEffect = 'video';
    blackHoleCanvas.hidden = true;
    videoBackgroundButton.setAttribute('aria-pressed', 'true');
    blackHoleBackgroundButton.setAttribute('aria-pressed', 'false');
    backgroundVideo.hidden = false;
    backgroundEffectStatus.textContent = 'Loading cinematic video scene…';
    recommendDarkMode('Video backgrounds look more cinematic in dark mode and keep the foreground easy to read.');

    if (persist) {
        try {
            localStorage.setItem(backgroundEffectStorageKey, 'video');
        } catch {}
    }

    try {
        await backgroundVideo.play();
        if (root.dataset.backgroundEffect !== 'video') return;
        backgroundEffectStatus.textContent = 'Cinematic video scene active.';
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

/*==================== Space Meteor Shower (Custom Interactive Animation) ====================*/
class MeteorShower {
    constructor(canvas) {
        if (!canvas) return;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        if (!this.ctx) return;

        this.meteors = [];
        this.sparks = [];
        this.shockwaves = [];
        this.flashes = [];
        this.embers = [];
        this.rafId = 0;
        const isSchemeLight = document.documentElement.dataset.scheme === 'light';
        this.active = !isSchemeLight && document.documentElement.dataset.meteorShower !== 'false';
        if (!this.active) {
            this.canvas.hidden = true;
            document.documentElement.dataset.meteorShower = 'false';
        }
        this.lastTime = performance.now();
        this.nextSpawn = this.lastTime + this.getRandomDelay();
        this.pointer = { x: -1000, y: -1000, active: false };
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.cosmicEventTimeout = 0;
        this.toastTimeout = 0;
        this.isCosmicEventActive = false;

        this.init();
    }

    getRandomDelay() {
        return 2200 + Math.random() * 2600;
    }

    getThemeAccent() {
        try {
            const root = document.documentElement;
            const style = getComputedStyle(root);
            const rgbStr = style.getPropertyValue('--accent-rgb').trim();
            if (rgbStr) {
                const parts = rgbStr.split(',').map(s => parseInt(s.trim(), 10));
                if (parts.length === 3 && parts.every(n => !isNaN(n))) {
                    return parts;
                }
            }
        } catch {}
        return [0, 229, 255];
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize(), { passive: true });

        window.addEventListener('pointermove', (e) => {
            this.pointer.x = e.clientX;
            this.pointer.y = e.clientY;
            this.pointer.active = true;
        }, { passive: true });

        window.addEventListener('pointerleave', () => {
            this.pointer.active = false;
        });

        window.addEventListener('pointerdown', (e) => {
            if (!this.active) return;
            const interactive = e.target.closest('a, button, input, textarea, select, label, summary, details, .theme-picker, .background-menu, .meteor-event-toast');
            if (interactive) return;

            this.summonMeteor(e.clientX, e.clientY, true);
        });

        window.addEventListener('keydown', (e) => {
            if ((e.key === 'm' || e.key === 'M') && !e.target.matches('input, textarea')) {
                this.triggerRandomCosmicEvent();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
                if (this.cosmicEventTimeout) {
                    clearTimeout(this.cosmicEventTimeout);
                    this.cosmicEventTimeout = 0;
                }
            } else if (this.active) {
                this.lastTime = performance.now();
                this.start();
                this.scheduleNextCosmicEvent();
            }
        });

        this.scheduleNextCosmicEvent(15000 + Math.random() * 8000);

        if (this.active && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.start();
        } else {
            this.draw();
        }
    }

    resize() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    start() {
        if (this.rafId) return;
        this.lastTime = performance.now();
        const loop = (currentTime) => {
            const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;

            if (this.active) {
                this.update(currentTime, dt);
                this.draw();
                this.rafId = requestAnimationFrame(loop);
            } else {
                this.rafId = 0;
                this.ctx.clearRect(0, 0, this.width, this.height);
            }
        };
        this.rafId = requestAnimationFrame(loop);
    }

    pause() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    setActive(shouldBeActive, persist = true) {
        this.active = shouldBeActive;
        const root = document.documentElement;
        root.dataset.meteorShower = shouldBeActive ? 'true' : 'false';
        this.canvas.hidden = !shouldBeActive;

        if (meteorShowerToggle) {
            meteorShowerToggle.setAttribute('aria-pressed', String(shouldBeActive));
        }

        if (backgroundEffectStatus) {
            backgroundEffectStatus.textContent = shouldBeActive
                ? 'Meteor shower active (tap anywhere to summon)'
                : 'Meteor shower disabled';
        }

        if (persist) {
            try {
                localStorage.setItem(meteorStorageKey, shouldBeActive ? 'true' : 'false');
            } catch {}
        }

        if (shouldBeActive) {
            this.lastTime = performance.now();
            this.nextSpawn = this.lastTime + 600;
            this.start();
            this.scheduleNextCosmicEvent();
        } else {
            this.pause();
            this.meteors = [];
            this.sparks = [];
            this.embers = [];
            this.shockwaves = [];
            this.flashes = [];
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.width, this.height);
            }
            if (this.cosmicEventTimeout) {
                clearTimeout(this.cosmicEventTimeout);
                this.cosmicEventTimeout = 0;
            }
            this.hideCosmicEventNotification();
        }
    }

    spawnMeteor(options = {}) {
        if (this.meteors.length >= 25) return;

        const isBolide = !!options.isBolide;
        const angle = options.angle ?? (Math.PI / 180 * (35 + Math.random() * 18));
        const speed = options.speed ?? (isBolide ? 1350 : 950 + Math.random() * 650);
        const length = options.length ?? (isBolide ? 290 : 130 + Math.random() * 140);
        const thickness = options.thickness ?? (isBolide ? 4.5 : 1.6 + Math.random() * 1.3);

        let x = options.x;
        let y = options.y;
        if (x === undefined || y === undefined) {
            if (Math.random() < 0.65) {
                x = Math.random() * (this.width * 0.95);
                y = -40;
            } else {
                x = -40;
                y = Math.random() * (this.height * 0.45);
            }
        }

        const maxLife = options.maxLife ?? (isBolide ? 1.25 : 0.75 + Math.random() * 0.55);
        const canCollide = options.canCollide !== undefined ? options.canCollide : (isBolide || Math.random() < 0.58);

        this.meteors.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            speed,
            length,
            thickness,
            age: 0,
            maxLife,
            target: options.target || null,
            canCollide,
            isBolide,
            sparkTimer: 0
        });
    }

    summonMeteor(targetX, targetY, makeBurstAtTarget = true) {
        const angle = Math.PI / 180 * (38 + Math.random() * 10);
        const distance = 380 + Math.random() * 220;
        const startX = targetX - Math.cos(angle) * distance;
        const startY = targetY - Math.sin(angle) * distance;
        const speed = 1250 + Math.random() * 400;
        const timeToTarget = distance / speed;

        this.spawnMeteor({
            x: startX,
            y: startY,
            angle,
            speed,
            length: 190,
            thickness: 2.6,
            maxLife: timeToTarget + 0.35,
            canCollide: true,
            target: makeBurstAtTarget ? { x: targetX, y: targetY, reached: false } : null
        });

        this.createExplosion(targetX, targetY, null, { isBolide: false });
    }

    triggerFlurry(count = 6, isEvent = false) {
        if (!this.active) {
            this.setActive(true, true);
        }
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (this.active) {
                    const isBolide = isEvent && i === Math.floor(count / 2);
                    this.spawnMeteor({
                        x: Math.random() * (this.width * 0.75),
                        y: -30 - Math.random() * 50,
                        speed: 1050 + Math.random() * 650,
                        length: 140 + Math.random() * 130,
                        canCollide: Math.random() < 0.7,
                        isBolide
                    });
                }
            }, i * 190 + Math.random() * 70);
        }
    }

    createExplosion(x, y, targetBox = null, meteor = null) {
        const isBolide = !!meteor?.isBolide;
        const accent = this.getThemeAccent();

        // 1. Expanding Shockwave Ring
        this.shockwaves.push({
            x,
            y,
            radius: 8,
            maxRadius: isBolide ? 85 : 55,
            speed: isBolide ? 280 : 220,
            alpha: 1,
            decay: isBolide ? 1.5 : 2.1,
            color: accent,
            lineWidth: isBolide ? 4.5 : 3
        });

        // 2. Central Plasma Flash
        this.flashes.push({
            x,
            y,
            radius: isBolide ? 70 : 42,
            alpha: 1,
            decay: isBolide ? 3.5 : 4.8,
            color: [255, 255, 255]
        });

        // 3. Stardust Sparks Burst
        const sparkCount = isBolide ? 38 : (targetBox ? 26 : 14);
        const maxSpeed = isBolide ? 260 : 190;
        for (let i = 0; i < sparkCount; i++) {
            if (this.sparks.length >= 170) break;
            const angle = Math.random() * Math.PI * 2;
            const spd = (Math.random() * 0.8 + 0.2) * maxSpeed;
            this.sparks.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: Math.random() * 2.4 + 1.2,
                alpha: 1,
                decay: Math.random() * 0.04 + 0.025,
                color: Math.random() < 0.35 ? [255, 255, 255] : accent
            });
        }

        // 4. Trigger UI Element Impact Shake & Fiery Burning Effect
        if (targetBox) {
            targetBox.classList.remove('meteor-impacted');
            void targetBox.offsetWidth;
            targetBox.classList.add('meteor-impacted');

            // Apply intense fiery burning aura!
            targetBox.classList.add('meteor-burning');

            // Spawn floating fire embers rising from the hit element
            this.spawnBurningEmbers(x, y, targetBox, isBolide ? 35 : 22);

            setTimeout(() => {
                targetBox.classList.remove('meteor-impacted');
            }, 500);

            // Secondary crackling puff of embers
            setTimeout(() => {
                if (this.active) {
                    this.spawnBurningEmbers(x, y - 8, targetBox, 10);
                }
            }, 800);

            // Extinguish burning effect after 2.4 seconds
            setTimeout(() => {
                targetBox.classList.remove('meteor-burning');
            }, 2400);
        }
    }

    spawnBurningEmbers(x, y, targetBox = null, count = 22) {
        if (this.embers.length >= 130) return;
        const rect = targetBox ? targetBox.getBoundingClientRect() : null;

        for (let i = 0; i < count; i++) {
            let startX = x + (Math.random() - 0.5) * 45;
            let startY = y + (Math.random() - 0.5) * 25;

            if (rect) {
                startX = Math.max(rect.left + 6, Math.min(rect.right - 6, startX));
                startY = Math.max(rect.top + 6, Math.min(rect.bottom - 6, startY));
            }

            const maxLife = 1.3 + Math.random() * 0.9;
            this.embers.push({
                x: startX,
                y: startY,
                vx: (Math.random() - 0.5) * 45,
                vy: -(Math.random() * 85 + 40),
                size: Math.random() * 2.8 + 1.2,
                alpha: 1,
                age: 0,
                maxLife,
                decay: 1 / maxLife,
                flutterSpeed: 3 + Math.random() * 5,
                color: [255, 230, 110]
            });
        }
    }

    /*==================== Random Cosmic Events ====================*/
    scheduleNextCosmicEvent(customDelay = null) {
        if (this.cosmicEventTimeout) {
            clearTimeout(this.cosmicEventTimeout);
        }
        const delay = customDelay !== null ? customDelay : 32000 + Math.random() * 26000;
        this.cosmicEventTimeout = setTimeout(() => {
            if (this.active && !document.hidden) {
                this.triggerRandomCosmicEvent();
            }
            this.scheduleNextCosmicEvent();
        }, delay);
    }

    triggerRandomCosmicEvent() {
        if (this.isCosmicEventActive) return;
        this.isCosmicEventActive = true;

        const events = [
            {
                title: 'Perseid Meteor Storm',
                desc: 'Intense cosmic debris cluster entering the atmosphere',
                count: 22,
                waves: 3,
                bolide: false
            },
            {
                title: 'Geminids Stardust Surge',
                desc: 'Ionized stardust wave blazing across local space sector',
                count: 18,
                waves: 2,
                bolide: false
            },
            {
                title: 'Superbolide Fireball Event',
                desc: 'Rare giant cosmic fireball detected on collision trajectory!',
                count: 15,
                waves: 2,
                bolide: true
            }
        ];

        const chosenEvent = events[Math.floor(Math.random() * events.length)];
        this.showCosmicEventNotification(chosenEvent);

        for (let wave = 0; wave < chosenEvent.waves; wave++) {
            setTimeout(() => {
                if (this.active) {
                    this.triggerFlurry(Math.round(chosenEvent.count / chosenEvent.waves), chosenEvent.bolide);
                }
            }, wave * 1400);
        }

        setTimeout(() => {
            this.isCosmicEventActive = false;
        }, 5500);
    }

    showCosmicEventNotification(event) {
        if (!meteorEventToast) return;
        if (toastEventTitle) toastEventTitle.textContent = event.title;
        if (toastEventDesc) toastEventDesc.textContent = event.desc;

        meteorEventToast.setAttribute('aria-hidden', 'false');
        meteorEventToast.classList.add('show');

        if (toastProgressBar) {
            toastProgressBar.style.transition = 'none';
            toastProgressBar.style.transform = 'scaleX(1)';
            void toastProgressBar.offsetWidth;
            toastProgressBar.style.transition = 'transform 5s linear';
            toastProgressBar.style.transform = 'scaleX(0)';
        }

        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        this.toastTimeout = setTimeout(() => {
            this.hideCosmicEventNotification();
        }, 5200);
    }

    hideCosmicEventNotification() {
        if (!meteorEventToast) return;
        meteorEventToast.classList.remove('show');
        meteorEventToast.setAttribute('aria-hidden', 'true');
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
            this.toastTimeout = 0;
        }
    }

    update(currentTime, dt) {
        if (currentTime >= this.nextSpawn) {
            this.spawnMeteor();
            if (Math.random() < 0.22) {
                setTimeout(() => {
                    if (this.active) this.spawnMeteor();
                }, 180 + Math.random() * 140);
            }
            this.nextSpawn = currentTime + this.getRandomDelay();
        }

        const accent = this.getThemeAccent();

        // 1. Update Meteors & Collision Detection
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            m.age += dt;

            if (this.pointer.active) {
                const dx = this.pointer.x - m.x;
                const dy = this.pointer.y - m.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 20 && dist < 140) {
                    const pull = (1 - dist / 140) * 160 * dt;
                    m.vx += (dx / dist) * pull;
                    m.vy += (dy / dist) * pull;
                }
            }

            m.x += m.vx * dt;
            m.y += m.vy * dt;

            if (m.target && !m.target.reached) {
                const distToTarget = Math.hypot(m.x - m.target.x, m.y - m.target.y);
                if (distToTarget < 35 || m.age >= m.maxLife * 0.65) {
                    m.target.reached = true;
                    this.createExplosion(m.target.x, m.target.y, null, m);
                    this.meteors.splice(i, 1);
                    continue;
                }
            }

            // Real-time Collision Detection with UI text / cards / buttons / boxes
            if (m.canCollide && m.age > 0.08 && m.x > 10 && m.x < this.width - 10 && m.y > 65 && m.y < this.height - 10) {
                const hitEl = document.elementFromPoint(m.x, m.y);
                if (hitEl && !hitEl.closest('.header, .background-menu, .meteor-event-toast, #meteor-canvas, #black-hole-canvas, #background-video')) {
                    const targetBox = hitEl.closest(
                        '.stat-card, .btn, .hero-name, .hero-greeting, .hero-role, .heading, .section-tag, ' +
                        '.about-img-card, .about-card-badge, .highlight-item, .service-card, .services-box, ' +
                        '.portfolio-card, .portfolio-box, .skill-card, .skill-box, .floating-chip, ' +
                        '.chip-top, .chip-bottom, .social-media a, h1, h2, h3, h4, ' +
                        '.hero-desc, .about-content p, .home-img, .contact-card, .hero-badge, .feedback-modal'
                    );
                    if (targetBox) {
                        this.createExplosion(m.x, m.y, targetBox, m);
                        this.meteors.splice(i, 1);
                        continue;
                    }
                }
            }

            m.sparkTimer += dt;
            const sparkInterval = m.isBolide ? 0.02 : 0.035;
            if (m.sparkTimer >= sparkInterval && this.sparks.length < 150) {
                m.sparkTimer = 0;
                const dir = Math.atan2(m.vy, m.vx);
                const sparkDist = Math.random() * (m.length * 0.45);
                this.sparks.push({
                    x: m.x - Math.cos(dir) * sparkDist + (Math.random() - 0.5) * 4,
                    y: m.y - Math.sin(dir) * sparkDist + (Math.random() - 0.5) * 4,
                    vx: -Math.cos(dir) * (m.speed * 0.05) + (Math.random() - 0.5) * 20,
                    vy: -Math.sin(dir) * (m.speed * 0.05) + (Math.random() - 0.5) * 20,
                    size: m.isBolide ? Math.random() * 2.2 + 1.2 : Math.random() * 1.6 + 0.8,
                    alpha: 0.95,
                    decay: Math.random() * 0.045 + 0.03,
                    color: Math.random() < 0.35 ? [255, 255, 255] : accent
                });
            }

            const isOffScreen = m.x > this.width + m.length + 50 || m.y > this.height + m.length + 50;
            if (m.age >= m.maxLife || isOffScreen) {
                if (Math.random() < 0.4 && !isOffScreen) {
                    this.createExplosion(m.x, m.y, null, m);
                }
                this.meteors.splice(i, 1);
            }
        }

        // 2. Update Sparks
        for (let j = this.sparks.length - 1; j >= 0; j--) {
            const s = this.sparks[j];
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vx *= 0.97;
            s.vy *= 0.97;
            s.alpha -= s.decay;

            if (s.alpha <= 0) {
                this.sparks.splice(j, 1);
            }
        }

        // 3. Update Shockwaves
        for (let k = this.shockwaves.length - 1; k >= 0; k--) {
            const sw = this.shockwaves[k];
            sw.radius += sw.speed * dt;
            sw.alpha -= sw.decay * dt;
            if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
                this.shockwaves.splice(k, 1);
            }
        }

        // 4. Update Flashes
        for (let f = this.flashes.length - 1; f >= 0; f--) {
            const fl = this.flashes[f];
            fl.alpha -= fl.decay * dt;
            if (fl.alpha <= 0) {
                this.flashes.splice(f, 1);
            }
        }

        // 5. Update Burning Fire Embers
        for (let e = this.embers.length - 1; e >= 0; e--) {
            const ember = this.embers[e];
            ember.age += dt;
            ember.x += (ember.vx + Math.sin(ember.age * ember.flutterSpeed) * 35) * dt;
            ember.y += ember.vy * dt;
            ember.vy *= 0.985;
            ember.alpha -= ember.decay * dt;

            const progress = ember.age / ember.maxLife;
            const isLight = document.documentElement.dataset.scheme === 'light' && !document.documentElement.dataset.backgroundEffect;
            if (isLight) {
                if (progress < 0.25) {
                    ember.color = [234, 88, 12];
                } else if (progress < 0.65) {
                    ember.color = [220, 38, 38];
                } else {
                    ember.color = [153, 27, 27];
                }
            } else {
                if (progress < 0.25) {
                    ember.color = [255, 230, 110];
                } else if (progress < 0.65) {
                    ember.color = [255, 100, 15];
                } else {
                    ember.color = [220, 35, 5];
                }
            }

            if (ember.alpha <= 0 || ember.age >= ember.maxLife) {
                this.embers.splice(e, 1);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const accent = this.getThemeAccent();
        const isLight = document.documentElement.dataset.scheme === 'light' && !document.documentElement.dataset.backgroundEffect;

        // 1. Draw Sparks
        for (let i = 0; i < this.sparks.length; i++) {
            const s = this.sparks[i];
            let [r, g, b] = s.color;
            if (isLight && r > 240 && g > 240 && b > 240) {
                [r, g, b] = [accent[0], accent[1], accent[2]];
            }
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(s.alpha, 0)})`;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, isLight ? s.size * 1.15 : s.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 2. Draw Shockwaves
        for (let i = 0; i < this.shockwaves.length; i++) {
            const sw = this.shockwaves[i];
            const [r, g, b] = sw.color;
            this.ctx.beginPath();
            this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            const swAlpha = isLight ? Math.min(1, sw.alpha * 1.25) : sw.alpha;
            this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(swAlpha, 0)})`;
            const baseWidth = isLight ? sw.lineWidth * 1.4 : sw.lineWidth;
            this.ctx.lineWidth = Math.max(0.7, baseWidth * (1 - sw.radius / sw.maxRadius));
            this.ctx.stroke();
        }

        // 3. Draw Flashes
        for (let i = 0; i < this.flashes.length; i++) {
            const fl = this.flashes[i];
            const flashGrad = this.ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, fl.radius);
            if (isLight) {
                flashGrad.addColorStop(0, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${Math.max(fl.alpha * 0.45, 0)})`);
                flashGrad.addColorStop(0.4, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${Math.max(fl.alpha * 0.2, 0)})`);
                flashGrad.addColorStop(1, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, 0)`);
            } else {
                flashGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.max(fl.alpha, 0)})`);
                flashGrad.addColorStop(0.35, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${Math.max(fl.alpha * 0.75, 0)})`);
                flashGrad.addColorStop(1, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, 0)`);
            }
            this.ctx.fillStyle = flashGrad;
            this.ctx.beginPath();
            this.ctx.arc(fl.x, fl.y, fl.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 3.5. Draw Burning Fire Embers
        for (let i = 0; i < this.embers.length; i++) {
            const ember = this.embers[i];
            const [r, g, b] = ember.color;
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(ember.alpha, 0)})`;
            this.ctx.beginPath();
            this.ctx.arc(ember.x, ember.y, isLight ? ember.size * 1.1 : ember.size, 0, Math.PI * 2);
            this.ctx.fill();

            if (ember.alpha > 0.3) {
                const auraColor = isLight ? `rgba(234, 88, 12, ${ember.alpha * 0.35})` : `rgba(255, 80, 0, ${ember.alpha * 0.3})`;
                this.ctx.fillStyle = auraColor;
                this.ctx.beginPath();
                this.ctx.arc(ember.x, ember.y, ember.size * 2.2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // 4. Draw Meteors
        for (let i = 0; i < this.meteors.length; i++) {
            const m = this.meteors[i];
            const progress = m.age / m.maxLife;

            let alpha = 1;
            if (progress < 0.15) {
                alpha = progress / 0.15;
            } else if (progress > 0.75) {
                alpha = Math.max(0, (1 - progress) / 0.25);
            }

            const dir = Math.atan2(m.vy, m.vx);
            const tailX = m.x - Math.cos(dir) * m.length;
            const tailY = m.y - Math.sin(dir) * m.length;

            const grad = this.ctx.createLinearGradient(m.x, m.y, tailX, tailY);
            if (isLight) {
                grad.addColorStop(0, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${alpha * 0.98})`);
                grad.addColorStop(0.12, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${alpha * 0.85})`);
                grad.addColorStop(0.5, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${alpha * 0.4})`);
                grad.addColorStop(1, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, 0)`);
            } else {
                grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                grad.addColorStop(0.08, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${alpha * 0.95})`);
                grad.addColorStop(0.4, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${alpha * 0.4})`);
                grad.addColorStop(1, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, 0)`);
            }

            this.ctx.beginPath();
            this.ctx.moveTo(tailX, tailY);
            this.ctx.lineTo(m.x, m.y);
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = isLight ? m.thickness * 1.3 : m.thickness;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();

            const headRadius = isLight ? m.thickness * 4.2 : m.thickness * 3.8;
            const headGlow = this.ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, headRadius);
            if (isLight) {
                headGlow.addColorStop(0, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${alpha})`);
                headGlow.addColorStop(0.4, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${alpha * 0.55})`);
                headGlow.addColorStop(1, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, 0)`);
            } else {
                headGlow.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                headGlow.addColorStop(0.35, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${alpha * 0.85})`);
                headGlow.addColorStop(1, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, 0)`);
            }

            this.ctx.fillStyle = headGlow;
            this.ctx.beginPath();
            this.ctx.arc(m.x, m.y, headRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

meteorShower = meteorCanvas ? new MeteorShower(meteorCanvas) : null;

if (meteorShowerToggle && meteorShower) {
    meteorShowerToggle.setAttribute('aria-pressed', String(meteorShower.active));
    meteorShowerToggle.addEventListener('click', () => {
        meteorShower.setActive(!meteorShower.active, true);
        if (meteorShower.active) {
            recommendDarkMode('Meteor trails are recommended in dark mode for a clearer night-sky effect.');
        }
        backgroundMenu.open = true;
    });
}

if (meteorEventBtn && meteorShower) {
    meteorEventBtn.addEventListener('click', () => {
        meteorShower.triggerRandomCosmicEvent();
        recommendDarkMode('Meteor events are recommended in dark mode for a clearer night-sky effect.');
        backgroundMenu.open = true;
    });
}

if (heroMeteorBtn && meteorShower) {
    heroMeteorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        meteorShower.triggerRandomCosmicEvent();
        recommendDarkMode('Meteor events are recommended in dark mode for a clearer night-sky effect.');
    });
    heroMeteorBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            meteorShower.triggerRandomCosmicEvent();
            recommendDarkMode('Meteor events are recommended in dark mode for a clearer night-sky effect.');
        }
    });
}

if (toastCloseBtn && meteorShower) {
    toastCloseBtn.addEventListener('click', () => {
        meteorShower.hideCosmicEventNotification();
    });
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

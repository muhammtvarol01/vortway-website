document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Icons
    lucide.createIcons();

    // 1.3 Hero atmospheric fog (Vanta.FOG) — theme-aware, re-inits on toggle
    initVantaFog();

    // 1.3b Hero gold dust (tsParticles) — drifting golden specks
    initHeroDust();

    // 1.3c Service Card 3D Tilt (mouse-tracked perspective)
    initServiceCardTilt();

    // 1.3c 3D Logistics Visualization (lazy — boots on vision-section intersection)
    initLogisticsScene();

    // 1.3d Cursor Dot — desktop-only gold follower
    initCursorDot();

    // 1.3e Magnetic Buttons — GSAP-driven pull
    initMagneticButtons();

    // 1.3f Extend card spotlight to service + testimonial cards
    initExtendedSpotlight();

    // 1.3g Button click ripple (gold expanding circle)
    initButtonRipple();

    // 1.4 Split hero title into per-character spans for staggered reveal
    const heroTitleEl = document.querySelector('.hero-title');
    if (heroTitleEl && !heroTitleEl.querySelector('.hero-title-char')) {
        const chars = [...heroTitleEl.textContent];
        heroTitleEl.innerHTML = chars
            .map(ch => `<span class="hero-title-char">${ch === ' ' ? '&nbsp;' : ch}</span>`)
            .join('');
    }

    // 1.4 GSAP Hero Staggered Reveal
    if (typeof gsap !== 'undefined') {
        gsap.set('.hero-subtitle, .hero-desc, .hero-actions, .scroll-indicator', { opacity: 0, y: 30 });
        gsap.set('.hero-title-char', { opacity: 0, y: 50, scale: 0.7 });

        const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });
        heroTL
            .to('.hero-title-char', {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.7,
                stagger: 0.08,
                ease: 'back.out(1.4)'
            })
            .to('.hero-subtitle', { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
            .to('.hero-desc', { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
            .to('.hero-actions', { opacity: 1, y: 0, duration: 0.5 }, '-=0.4')
            .to('.scroll-indicator', { opacity: 0.6, y: 0, duration: 0.4 }, '-=0.3');

        // Animate the gold underline via CSS custom property (pseudo-elements can't be targeted by GSAP directly)
        const subtitleEl = document.querySelector('.hero-subtitle');
        if (subtitleEl) {
            heroTL.add(() => {
                subtitleEl.style.setProperty('--underline-width', '100%');
            }, 1.0);
        }
    }

    // 1.5 GSAP ScrollTrigger Animations
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        const reduceMotionGSAP = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Set initial hidden states
        gsap.set('.section-header', { opacity: 0, y: 30 });
        gsap.set('.pillar-card', { opacity: 0, y: 40 });
        gsap.set('.service-card', { opacity: 0, y: 40 });
        gsap.set('.contact-wrapper', { opacity: 0, scale: 0.95 });

        // .section-header: fade in + slide up from 30px below
        gsap.utils.toArray('.section-header').forEach(header => {
            gsap.to(header, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: header,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                }
            });

            // Parallax depth: header drifts a fraction slower than page (yPercent composes
            // with the y from the reveal above — GSAP keeps the deltas separate).
            if (!reduceMotionGSAP) {
                gsap.to(header, {
                    yPercent: -22,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: header,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 0.8
                    }
                });
            }
        });

        // Marquee perspective tilt — starts at rotateX(2deg), flattens as it scrolls past.
        if (!reduceMotionGSAP) {
            const marqueeTrack = document.querySelector('.marquee-strip .marquee-track');
            if (marqueeTrack) {
                gsap.fromTo(marqueeTrack,
                    { rotateX: 2 },
                    {
                        rotateX: 0,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: '.marquee-strip',
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: 0.6
                        }
                    }
                );
            }
        }

        // .pillar-card: staggered fade in from bottom (0.2s delay between cards)
        const pillarCards = gsap.utils.toArray('.pillar-card');
        if (pillarCards.length) {
            gsap.to(pillarCards, {
                opacity: 1,
                y: 0,
                duration: 0.7,
                stagger: 0.2,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: pillarCards[0],
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                }
            });
        }

        // .service-card: staggered fade in from bottom (same treatment as pillars)
        const serviceCards = gsap.utils.toArray('.service-card');
        if (serviceCards.length) {
            gsap.to(serviceCards, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.15,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: serviceCards[0],
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                }
            });
        }

        // .contact-wrapper: fade in + scale from 0.95 to 1
        gsap.to('.contact-wrapper', {
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.contact-wrapper',
                start: 'top 80%',
                toggleActions: 'play none none none'
            }
        });

        // Stats counter animation
        const statNumbers = gsap.utils.toArray('.stat-number');
        const statsSection = document.getElementById('stats');
        if (statNumbers.length && statsSection) {
            ScrollTrigger.create({
                trigger: '#stats',
                start: 'top 80%',
                once: true,
                onEnter: () => {
                    statsSection.classList.add('in-view');
                    statNumbers.forEach(el => {
                        const target = parseFloat(el.getAttribute('data-target'));
                        const suffix = el.getAttribute('data-suffix') || '';
                        const decimals = parseInt(el.getAttribute('data-decimals')) || 0;
                        const obj = { val: 0 };
                        gsap.to(obj, {
                            val: target,
                            duration: 2,
                            ease: 'power2.out',
                            onUpdate: () => {
                                el.textContent = obj.val.toFixed(decimals) + suffix;
                            }
                        });
                    });
                }
            });
        }
    }

    // 1.6 Pillar Card Spotlight Effect — rAF-throttled to cap at ~60fps
    document.querySelectorAll('.pillar-card').forEach(card => {
        let rafPending = false;
        card.addEventListener('mousemove', (e) => {
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                rafPending = false;
            });
        });
    });

    // 2. Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Navbar scroll state
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        if (backToTop) {
            if (window.scrollY > window.innerHeight) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
    });

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 2.5 Theme Toggle (dark / light) — bootstrap script in <head> already set initial state
    initThemeToggle();

    // 3. Language Selector
    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
    const langOptions = document.querySelectorAll('.lang-option');
    let currentLang = 'en';

    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            langDropdown.classList.remove('show');
        });

        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                currentLang = lang;
                
                // Update Button text
                langBtn.innerHTML = `${lang.toUpperCase()} <i data-lucide="chevron-down" style="width: 14px;"></i>`;
                lucide.createIcons();
                
                // Translate Page
                translatePage(lang);

                // Close mobile nav after language selection
                if (navLinks) navLinks.classList.remove('active');
            });
        });
    }

    // Keys that intentionally contain HTML (br tags for line breaks)
    const HTML_KEYS = new Set(['hero_desc', 'vision_text_2']);

    function translatePage(lang) {
        if (!translations || !translations[lang]) return;

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = translations[lang][key];
            if (value === undefined) return;
            if (HTML_KEYS.has(key)) {
                el.innerHTML = value; // intentional HTML (<br>)
            } else {
                el.textContent = value;
            }
        });
    }

    // Call immediately to sync HTML with the EN translation on page load
    translatePage('en');

    // 3.5 Track Selector
    const trackBtn = document.getElementById('trackBtn');
    const trackDropdown = document.getElementById('trackDropdown');
    const trackForm = document.getElementById('trackForm');

    if (trackBtn && trackDropdown) {
        trackBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            trackDropdown.classList.toggle('show');
            // Close lang dropdown if open
            if (langDropdown) langDropdown.classList.remove('show');
        });

        trackDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.addEventListener('click', () => {
            trackDropdown.classList.remove('show');
        });
    }

    if (trackForm) {
        trackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const toastEl = document.getElementById('toast');
            const toastMsgEl = document.getElementById('toastMsg');
            if (toastEl && toastMsgEl) {
                let msg = "Real-time tracking launching soon. Contact us for shipment updates.";
                if (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang]['toast_tracking']) {
                    msg = translations[currentLang]['toast_tracking'];
                }
                toastMsgEl.textContent = msg;
                toastEl.classList.add('show');
                setTimeout(() => { toastEl.classList.remove('show'); }, 3000);
            }
            trackForm.reset();
            trackDropdown.classList.remove('show');
        });
    }

    // 3.6 Testimonial Slider — GSAP slide+scale transition (out left, in from right)
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const testimonialDots = document.querySelectorAll('.dot');
    let currentTestimonial = 0;
    let testimonialInterval;
    let testimonialAnimating = false;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Set initial visibility on first card
    if (testimonialCards[0]) {
        testimonialCards[0].classList.add('active');
        if (typeof gsap !== 'undefined') {
            gsap.set(testimonialCards[0], { opacity: 1, x: 0, scale: 1 });
        } else {
            testimonialCards[0].style.opacity = '1';
        }
    }

    function showTestimonial(index) {
        if (index === currentTestimonial || testimonialAnimating) return;
        if (!testimonialCards[index]) return;

        const outCard = testimonialCards[currentTestimonial];
        const inCard = testimonialCards[index];

        // Dots update immediately
        testimonialDots.forEach(d => d.classList.remove('active'));
        testimonialDots[index]?.classList.add('active');

        if (typeof gsap === 'undefined' || reduceMotion) {
            outCard?.classList.remove('active');
            inCard.classList.add('active');
            if (outCard) outCard.style.opacity = '0';
            inCard.style.opacity = '1';
            currentTestimonial = index;
            return;
        }

        testimonialAnimating = true;
        inCard.classList.add('active');

        const tl = gsap.timeline({
            onComplete: () => {
                outCard?.classList.remove('active');
                if (outCard) gsap.set(outCard, { x: 0, scale: 1, opacity: 0 });
                testimonialAnimating = false;
            }
        });

        tl.to(outCard, {
            x: -80,
            scale: 0.9,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.in'
        }, 0)
        .fromTo(inCard,
            { x: 80, scale: 0.9, opacity: 0 },
            { x: 0, scale: 1, opacity: 1, duration: 0.65, ease: 'power3.out' },
            0.15
        );

        currentTestimonial = index;
    }

    function startTestimonialRotation() {
        testimonialInterval = setInterval(() => {
            const next = (currentTestimonial + 1) % testimonialCards.length;
            showTestimonial(next);
        }, 5000);
    }

    if (testimonialCards.length && testimonialDots.length) {
        testimonialDots.forEach(dot => {
            dot.addEventListener('click', () => {
                clearInterval(testimonialInterval);
                showTestimonial(parseInt(dot.getAttribute('data-dot')));
                startTestimonialRotation();
            });
        });
        startTestimonialRotation();
    }

    // 4. Smooth Scrolling for Internal Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                if(window.innerWidth <= 640 && navLinks) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });

    // 5. Connect Button
    const btnConnect = document.getElementById('btnConnect');
    if (btnConnect) {
        btnConnect.addEventListener('click', () => {
            document.querySelector('#contact').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }

    // 6. Quote Modal Logic
    const btnInitiateQuote = document.getElementById('btnInitiateQuote');
    const quoteModal = document.getElementById('quoteModal');
    const closeQuoteModal = document.getElementById('closeQuoteModal');
    const quoteForm = document.getElementById('quoteForm');
    const quoteResult = document.getElementById('quoteResult');
    const quotePriceValue = document.getElementById('quotePriceValue');

    function resetQuoteModalState() {
        quoteResult.style.display = 'none';
        quoteForm.reset();
        // clear autocomplete-resolved cities and any stale suggestion list / error
        if (typeof selectedCity !== 'undefined') {
            selectedCity.origin = null;
            selectedCity.destination = null;
        }
        const errEl = document.getElementById('quoteError');
        if (errEl) { errEl.textContent = ''; errEl.hidden = true; }
        document.querySelectorAll('.quote-suggestions').forEach(ul => {
            ul.hidden = true;
            ul.innerHTML = '';
        });
        document.querySelectorAll('.quote-autocomplete input[aria-expanded]')
            .forEach(inp => inp.setAttribute('aria-expanded', 'false'));
    }

    if (btnInitiateQuote && quoteModal && closeQuoteModal) {
        function openQuoteModal() {
            quoteModal.classList.add('active');
            // lock background scroll so scrollIntoView / page wheel can't drift the body
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        }

        function dismissQuoteModal() {
            quoteModal.classList.remove('active');
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            resetQuoteModalState();
        }

        btnInitiateQuote.addEventListener('click', openQuoteModal);

        closeQuoteModal.addEventListener('click', dismissQuoteModal);

        // CLOSE button inside the result block
        const quoteCloseResult = document.getElementById('quoteCloseResult');
        if (quoteCloseResult) {
            quoteCloseResult.addEventListener('click', dismissQuoteModal);
        }

        // Close on overlay click (scrim, not modal body)
        quoteModal.addEventListener('click', (e) => {
            if (e.target === quoteModal) {
                dismissQuoteModal();
            }
        });

        // Close on Escape key + focus trap when modal open
        document.addEventListener('keydown', (e) => {
            if (!quoteModal.classList.contains('active')) return;

            if (e.key === 'Escape') {
                dismissQuoteModal();
                return;
            }

            if (e.key === 'Tab') {
                const focusables = quoteModal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusables.length) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }

    // 6b. Quote Calculator — city autocomplete + distance-based pricing
    const EU_CITIES = [
        { name: "Kaunas", country: "LT", lat: 54.8985, lng: 23.9036 },
        { name: "Vilnius", country: "LT", lat: 54.6872, lng: 25.2797 },
        { name: "Klaipeda", country: "LT", lat: 55.7033, lng: 21.1443 },
        { name: "Riga", country: "LV", lat: 56.9496, lng: 24.1052 },
        { name: "Tallinn", country: "EE", lat: 59.4370, lng: 24.7536 },
        { name: "Helsinki", country: "FI", lat: 60.1699, lng: 24.9384 },
        { name: "Stockholm", country: "SE", lat: 59.3293, lng: 18.0686 },
        { name: "Gothenburg", country: "SE", lat: 57.7089, lng: 11.9746 },
        { name: "Malmo", country: "SE", lat: 55.6050, lng: 13.0038 },
        { name: "Oslo", country: "NO", lat: 59.9139, lng: 10.7522 },
        { name: "Copenhagen", country: "DK", lat: 55.6761, lng: 12.5683 },
        { name: "Berlin", country: "DE", lat: 52.5200, lng: 13.4050 },
        { name: "Hamburg", country: "DE", lat: 53.5511, lng: 9.9937 },
        { name: "Munich", country: "DE", lat: 48.1351, lng: 11.5820 },
        { name: "Frankfurt", country: "DE", lat: 50.1109, lng: 8.6821 },
        { name: "Cologne", country: "DE", lat: 50.9375, lng: 6.9603 },
        { name: "Dusseldorf", country: "DE", lat: 51.2277, lng: 6.7735 },
        { name: "Stuttgart", country: "DE", lat: 48.7758, lng: 9.1829 },
        { name: "Hannover", country: "DE", lat: 52.3759, lng: 9.7320 },
        { name: "Amsterdam", country: "NL", lat: 52.3676, lng: 4.9041 },
        { name: "Rotterdam", country: "NL", lat: 51.9244, lng: 4.4777 },
        { name: "Brussels", country: "BE", lat: 50.8503, lng: 4.3517 },
        { name: "Antwerp", country: "BE", lat: 51.2194, lng: 4.4025 },
        { name: "Paris", country: "FR", lat: 48.8566, lng: 2.3522 },
        { name: "Lyon", country: "FR", lat: 45.7640, lng: 4.8357 },
        { name: "Marseille", country: "FR", lat: 43.2965, lng: 5.3698 },
        { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
        { name: "Dublin", country: "IE", lat: 53.3498, lng: -6.2603 },
        { name: "Madrid", country: "ES", lat: 40.4168, lng: -3.7038 },
        { name: "Barcelona", country: "ES", lat: 41.3851, lng: 2.1734 },
        { name: "Lisbon", country: "PT", lat: 38.7223, lng: -9.1393 },
        { name: "Rome", country: "IT", lat: 41.9028, lng: 12.4964 },
        { name: "Milan", country: "IT", lat: 45.4642, lng: 9.1900 },
        { name: "Genoa", country: "IT", lat: 44.4056, lng: 8.9463 },
        { name: "Naples", country: "IT", lat: 40.8518, lng: 14.2681 },
        { name: "Turin", country: "IT", lat: 45.0703, lng: 7.6869 },
        { name: "Zurich", country: "CH", lat: 47.3769, lng: 8.5417 },
        { name: "Vienna", country: "AT", lat: 48.2082, lng: 16.3738 },
        { name: "Prague", country: "CZ", lat: 50.0755, lng: 14.4378 },
        { name: "Bratislava", country: "SK", lat: 48.1486, lng: 17.1077 },
        { name: "Budapest", country: "HU", lat: 47.4979, lng: 19.0402 },
        { name: "Warsaw", country: "PL", lat: 52.2297, lng: 21.0122 },
        { name: "Krakow", country: "PL", lat: 50.0647, lng: 19.9450 },
        { name: "Gdansk", country: "PL", lat: 54.3520, lng: 18.6466 },
        { name: "Ljubljana", country: "SI", lat: 46.0569, lng: 14.5058 },
        { name: "Zagreb", country: "HR", lat: 45.8150, lng: 15.9819 },
        { name: "Bucharest", country: "RO", lat: 44.4268, lng: 26.1025 },
        { name: "Sofia", country: "BG", lat: 42.6977, lng: 23.3219 },
        { name: "Athens", country: "GR", lat: 37.9838, lng: 23.7275 },
        { name: "Istanbul", country: "TR", lat: 41.0082, lng: 28.9784 },
        { name: "Ankara", country: "TR", lat: 39.9334, lng: 32.8597 },
        { name: "Izmir", country: "TR", lat: 38.4237, lng: 27.1428 },
        { name: "Minsk", country: "BY", lat: 53.9006, lng: 27.5590 },
        { name: "Kyiv", country: "UA", lat: 50.4501, lng: 30.5234 }
    ];

    function haversineKm(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    const CARGO_MULTIPLIERS = {
        general:    { label: 'General',    mult: 1.00 },
        fragile:    { label: 'Fragile',    mult: 1.15 },
        perishable: { label: 'Perishable', mult: 1.25 },
        automotive: { label: 'Automotive', mult: 1.10 },
        hazmat:     { label: 'Hazmat (ADR)', mult: 1.40 }
    };
    const SPEED_MULTIPLIERS = {
        standard:  { label: 'Standard',  mult: 1.00 },
        express:   { label: 'Express',   mult: 1.35 },
        overnight: { label: 'Overnight', mult: 1.60 }
    };

    const quoteOriginInput = document.getElementById('quoteOrigin');
    const quoteDestinationInput = document.getElementById('quoteDestination');
    const selectedCity = { origin: null, destination: null };

    function initQuoteAutocomplete(input, kind) {
        if (!input) return;
        const list = document.getElementById(input.getAttribute('aria-controls'));
        if (!list) return;
        let activeIdx = -1;
        let currentMatches = [];

        function renderMatches(query) {
            const q = query.trim().toLowerCase();
            list.innerHTML = '';
            if (!q) {
                list.hidden = true;
                input.setAttribute('aria-expanded', 'false');
                currentMatches = [];
                activeIdx = -1;
                return;
            }
            currentMatches = EU_CITIES.filter(c =>
                c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
            ).slice(0, 6);

            if (!currentMatches.length) {
                list.hidden = true;
                input.setAttribute('aria-expanded', 'false');
                activeIdx = -1;
                return;
            }

            currentMatches.forEach((c, i) => {
                const li = document.createElement('li');
                li.className = 'quote-suggestion';
                li.setAttribute('role', 'option');
                li.setAttribute('data-index', String(i));
                li.id = `${list.id}-opt-${i}`;
                li.innerHTML = `<span class="qs-name">${c.name}</span><span class="qs-cc">${c.country}</span>`;
                li.addEventListener('mousedown', (ev) => {
                    ev.preventDefault();
                    selectCity(i);
                });
                li.addEventListener('mouseenter', () => setActive(i));
                list.appendChild(li);
            });
            list.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            activeIdx = -1;
        }

        function setActive(i) {
            const items = list.querySelectorAll('.quote-suggestion');
            items.forEach(el => el.classList.remove('is-active'));
            if (i >= 0 && i < items.length) {
                items[i].classList.add('is-active');
                input.setAttribute('aria-activedescendant', items[i].id);
                activeIdx = i;
            } else {
                input.removeAttribute('aria-activedescendant');
                activeIdx = -1;
            }
        }

        function selectCity(i) {
            const c = currentMatches[i];
            if (!c) return;
            input.value = `${c.name} (${c.country})`;
            selectedCity[kind] = c;
            list.hidden = true;
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            activeIdx = -1;
        }

        input.addEventListener('input', () => {
            // typing invalidates a previously-selected city
            selectedCity[kind] = null;
            renderMatches(input.value);
        });

        input.addEventListener('keydown', (e) => {
            if (list.hidden) {
                if (e.key === 'ArrowDown' && input.value.trim()) {
                    renderMatches(input.value);
                    setActive(0);
                    e.preventDefault();
                }
                return;
            }
            const max = currentMatches.length - 1;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive(activeIdx >= max ? 0 : activeIdx + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive(activeIdx <= 0 ? max : activeIdx - 1);
            } else if (e.key === 'Enter') {
                if (activeIdx >= 0) {
                    e.preventDefault();
                    selectCity(activeIdx);
                }
            } else if (e.key === 'Escape') {
                list.hidden = true;
                input.setAttribute('aria-expanded', 'false');
                setActive(-1);
            }
        });

        input.addEventListener('blur', () => {
            // delay so mousedown can fire first
            setTimeout(() => {
                list.hidden = true;
                input.setAttribute('aria-expanded', 'false');
            }, 120);
        });
    }

    initQuoteAutocomplete(quoteOriginInput, 'origin');
    initQuoteAutocomplete(quoteDestinationInput, 'destination');

    const quoteError = document.getElementById('quoteError');
    const quoteWeightInput = document.getElementById('quoteWeight');
    const quoteVolumeInput = document.getElementById('quoteVolume');
    const quoteCargoTypeSelect = document.getElementById('quoteCargoTypeSelect');
    const quoteSpeedSelect = document.getElementById('quoteSpeedSelect');
    const quoteKm = document.getElementById('quoteKm');
    const quoteBase = document.getElementById('quoteBase');
    const weightSurchargeLine = document.getElementById('weightSurchargeLine');
    const volumeSurchargeLine = document.getElementById('volumeSurchargeLine');
    const quoteWeightExtra = document.getElementById('quoteWeightExtra');
    const quoteVolumeExtra = document.getElementById('quoteVolumeExtra');
    const quoteCargoTypeOut = document.getElementById('quoteCargoType');
    const quoteSpeedOut = document.getElementById('quoteSpeed');
    const quoteRoute = document.getElementById('quoteRoute');

    function showQuoteError(msg) {
        if (!quoteError) return;
        quoteError.textContent = msg;
        quoteError.hidden = false;
    }
    function clearQuoteError() {
        if (!quoteError) return;
        quoteError.textContent = '';
        quoteError.hidden = true;
    }
    function fmtEUR(n) {
        return '€' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }

    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearQuoteError();

            const origin = selectedCity.origin;
            const destination = selectedCity.destination;
            if (!origin || !destination) {
                showQuoteError('Please select a city from the suggestions.');
                return;
            }
            if (origin.name === destination.name && origin.country === destination.country) {
                showQuoteError('Origin and destination must be different.');
                return;
            }
            const weight = parseFloat(quoteWeightInput?.value);
            const volume = parseFloat(quoteVolumeInput?.value);
            if (!Number.isFinite(weight) || weight <= 0) {
                showQuoteError('Cargo weight must be greater than 0.');
                return;
            }
            if (!Number.isFinite(volume) || volume <= 0) {
                showQuoteError('Cargo volume must be greater than 0.');
                return;
            }

            const cargoKey = quoteCargoTypeSelect?.value || 'general';
            const speedKey = quoteSpeedSelect?.value || 'standard';
            const cargo = CARGO_MULTIPLIERS[cargoKey] || CARGO_MULTIPLIERS.general;
            const speed = SPEED_MULTIPLIERS[speedKey] || SPEED_MULTIPLIERS.standard;

            const straightKm = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
            const roadKm = straightKm * 1.35;
            const basePrice = Math.max(roadKm * 2.00, 350);
            const weightSurcharge = Math.max(0, (weight - 5000) / 1000) * 50;
            const volumeSurcharge = Math.max(0, volume - 33) * 30;
            const subtotal = basePrice + weightSurcharge + volumeSurcharge;
            const finalPrice = subtotal * cargo.mult * speed.mult;

            const roundedKm = Math.round(roadKm);
            quoteKm.textContent = roundedKm.toLocaleString('en-US') + ' km';
            quoteBase.textContent = fmtEUR(basePrice);

            if (weightSurcharge > 0) {
                quoteWeightExtra.textContent = fmtEUR(weightSurcharge);
                weightSurchargeLine.hidden = false;
            } else {
                weightSurchargeLine.hidden = true;
            }
            if (volumeSurcharge > 0) {
                quoteVolumeExtra.textContent = fmtEUR(volumeSurcharge);
                volumeSurchargeLine.hidden = false;
            } else {
                volumeSurchargeLine.hidden = true;
            }

            quoteCargoTypeOut.textContent = `${cargo.label} (×${cargo.mult.toFixed(2)})`;
            quoteSpeedOut.textContent = `${speed.label} (×${speed.mult.toFixed(2)})`;

            quotePriceValue.textContent = finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            if (quoteRoute) {
                quoteRoute.textContent = `${origin.name} → ${destination.name}: ~${roundedKm.toLocaleString('en-US')} km (road estimate)`;
                quoteRoute.hidden = false;
            }

            quoteResult.style.display = 'block';
            // Scroll the modal's inner body — X button stays anchored to .modal.
            const modalBody = quoteModal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.scrollTo({
                    top: quoteResult.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });

        // clear errors when user changes inputs after a failed submit
        [quoteOriginInput, quoteDestinationInput, quoteWeightInput, quoteVolumeInput, quoteCargoTypeSelect, quoteSpeedSelect]
            .filter(Boolean)
            .forEach(el => el.addEventListener('input', clearQuoteError));
    }

    // 7. Contact Form & Toast
    const contactForm = document.getElementById('contactForm');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    if (contactForm && toast) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'TRANSMITTING…';

            const hideToast = () => {
                toast.classList.remove('show', 'toast-error');
            };

            try {
                const response = await fetch('https://formspree.io/f/FORMSPREE_ID', {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { Accept: 'application/json' }
                });

                if (response.ok) {
                    toastMsg.textContent = translations[currentLang]?.toast_success
                        || "Your inquiry has been transmitted. Our team will respond within 24 hours.";
                    toast.classList.remove('toast-error');
                    toast.classList.add('show');
                    contactForm.reset();
                } else {
                    throw new Error('non-ok');
                }
            } catch {
                toastMsg.textContent = translations[currentLang]?.toast_error
                    || "Transmission failed. Email us directly: mvarol@vortway.lt";
                toast.classList.add('show', 'toast-error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                setTimeout(hideToast, 5000);
            }
        });
    }

    // 9. FAQ Accordion — GSAP-driven height for smooth expansion
    const faqReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const closeItem = (i) => {
        const a = i.querySelector('.faq-answer');
        const q = i.querySelector('.faq-question');
        if (!a) return;
        // Lock current rendered height inline so removing .open doesn't snap to 0
        const currentPx = a.getBoundingClientRect().height;
        a.style.height = currentPx + 'px';
        i.classList.remove('open');
        q?.setAttribute('aria-expanded', 'false');
        if (typeof gsap === 'undefined' || faqReduce) {
            a.style.height = '0px';
            return;
        }
        gsap.to(a, { height: 0, duration: 0.35, ease: 'power2.inOut', overwrite: true });
    };

    const openItem = (i) => {
        const a = i.querySelector('.faq-answer');
        const q = i.querySelector('.faq-question');
        if (!a) return;
        // Lock at 0 before .open adds, otherwise CSS would snap to auto
        a.style.height = '0px';
        i.classList.add('open');
        q?.setAttribute('aria-expanded', 'true');
        if (typeof gsap === 'undefined' || faqReduce) {
            a.style.height = 'auto';
            return;
        }
        gsap.to(a, {
            height: 'auto',
            duration: 0.45,
            ease: 'power3.out',
            overwrite: true,
            onComplete: () => { a.style.height = ''; /* CSS .open rule keeps it auto */ }
        });
    };

    document.querySelectorAll('.faq-item').forEach(item => {
        const btn = item.querySelector('.faq-question');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const wasOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item.open').forEach(closeItem);
            if (!wasOpen) openItem(item);
        });
    });

    // 10. Cookie Consent Banner
    const cookieBanner = document.getElementById('cookieBanner');
    if (cookieBanner) {
        if (!localStorage.getItem('cookie-consent')) {
            setTimeout(() => cookieBanner.classList.add('visible'), 800);
        }
        const hideBanner = () => cookieBanner.classList.remove('visible');
        document.getElementById('cookieAccept')?.addEventListener('click', () => {
            localStorage.setItem('cookie-consent', 'accepted');
            hideBanner();
        });
        document.getElementById('cookieReject')?.addEventListener('click', () => {
            localStorage.setItem('cookie-consent', 'rejected');
            hideBanner();
        });
    }

    // 10. Preloader (2s — lets the animated mark complete its draw cycle: 1.2s draw + 0.8s hold)
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('hidden');
            let removed = false;
            const cleanup = () => {
                if (removed) return;
                removed = true;
                preloader.remove();
            };
            preloader.addEventListener('transitionend', cleanup, { once: true });
            // Safety net in case transitionend never fires (reduced-motion users)
            setTimeout(cleanup, 1200);
        }, 2000);
    }
});

/**
 * initVantaFog — atmospheric gold/dark fog backdrop for the hero.
 * Vanta inserts a <canvas> as the first child of the target #hero element; CSS
 * pins it to z-index 0 so all other hero content renders above. Re-initialised
 * on theme toggle with warm-cream colors for light mode.
 */
function initVantaFog() {
    if (typeof VANTA === 'undefined' || !VANTA.FOG || typeof THREE === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let vantaInstance = null;

    const DARK_CFG = {
        el: '#hero',
        THREE: THREE,
        mouseControls: true,
        touchControls: false,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        highlightColor: 0xD4AF37,
        midtoneColor: 0x4A2F00,
        lowlightColor: 0x030504,
        baseColor: 0x0F0900,
        blurFactor: 0.65,
        speed: 1.5,
        zoom: 0.8
    };

    const LIGHT_CFG = {
        el: '#hero',
        THREE: THREE,
        mouseControls: true,
        touchControls: false,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        highlightColor: 0xD4AF37,
        midtoneColor: 0xB27300,
        lowlightColor: 0xf0ede5,
        baseColor: 0xe8e4d8,
        blurFactor: 0.55,
        speed: 1.2,
        zoom: 0.85
    };

    const applyTheme = (theme) => {
        if (vantaInstance) {
            try { vantaInstance.destroy(); } catch (_) {}
            vantaInstance = null;
        }
        const cfg = theme === 'light' ? LIGHT_CFG : DARK_CFG;
        try {
            vantaInstance = VANTA.FOG(cfg);
        } catch (e) {
            // CSS fallback (hero-glow + bg-dark gradient) keeps the hero readable
            console.warn('Vanta.FOG init failed', e);
        }
    };

    // Expose for the theme toggle
    window.__vortwayApplyVantaTheme = applyTheme;

    const initialTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(initialTheme);
}

/**
 * initHeroDust — drifting gold specks across the hero (tsParticles).
 * Pure decorative layer, sits in front of Vanta fog but behind the wordmark.
 * Skipped under reduced-motion (CSS hides the canvas via the wrapper).
 */
function initHeroDust() {
    if (typeof tsParticles === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!document.getElementById('heroParticles')) return;

    tsParticles.load({
        id: 'heroParticles',
        options: {
            fpsLimit: 60,
            background: { color: 'transparent' },
            fullScreen: { enable: false },
            detectRetina: true,
            particles: {
                number: {
                    value: 50,
                    density: { enable: true, width: 1000, height: 800 }
                },
                color: { value: ['#D4AF37', '#FFC300', '#B27300'] },
                shape: { type: 'circle' },
                opacity: {
                    value: { min: 0.3, max: 0.8 },
                    animation: { enable: true, speed: 0.8, sync: false, startValue: 'random' }
                },
                size: { value: { min: 1, max: 3 } },
                move: {
                    enable: true,
                    speed: 0.3,
                    direction: 'top',
                    random: true,
                    straight: false,
                    outModes: { default: 'out' }
                }
            },
            interactivity: {
                detectsOn: 'window',
                events: {
                    onHover: { enable: true, mode: 'repulse' },
                    resize: { enable: true }
                },
                modes: {
                    repulse: { distance: 100, duration: 0.4 }
                }
            }
        }
    }).catch(err => console.warn('tsParticles failed to load', err));
}

/**
 * initThemeToggle — dark/light mode switch.
 * Persists choice to localStorage under 'vortway-theme'.
 * Swaps the navbar horizontal-logo SVG to its light variant in light mode.
 * Notifies the Three.js hero scene so it can adjust lighting.
 */
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    const html = document.documentElement;

    const applyTheme = (theme) => {
        const next = theme === 'light' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        toggle.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false');
        // Logo swap is handled by CSS via [data-theme] selectors — no JS needed.
        if (typeof window.__vortwayApplyVantaTheme === 'function') {
            window.__vortwayApplyVantaTheme(next);
        }
        try { localStorage.setItem('vortway-theme', next); } catch (_) {}
    };

    // Initialise visuals from whatever the bootstrap script set
    const initial = html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(initial);

    toggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        applyTheme(current === 'light' ? 'dark' : 'light');
    });
}

/**
 * initLogisticsScene — Three.js cargo/truck scene under the vision pillars.
 * Lazy: boots when #vision intersects viewport. Pauses rendering when offscreen.
 * Mobile (<768px): skips models, shows grid + particles only.
 * Reduced-motion: renders one static frame, no animation loop.
 */
function initLogisticsScene() {
    const canvas = document.getElementById('logisticsCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const visionEl = canvas.closest('.vision');
    if (!visionEl) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    let booted = false;
    let renderer, scene, camera, ambient, hemi, spot, underGlow;
    let containers = [], truck = null, particleSystem = null, gridHelper = null;
    let routeCurve = null;
    let isVisible = false;
    let rafId = null;
    let width = visionEl.clientWidth;
    let height = visionEl.clientHeight;

    const ensureSize = () => {
        width = visionEl.clientWidth;
        height = visionEl.clientHeight;
        if (renderer) {
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    };

    function buildContainer() {
        const group = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xD4AF37,
            metalness: 0.85,
            roughness: 0.25,
            envMapIntensity: 1.0
        });
        const dimMat = new THREE.MeshStandardMaterial({
            color: 0x4A2F00,
            metalness: 0.6,
            roughness: 0.4
        });

        // Body — 20ft container ~ 6×2.5×2.5 (scaled down for scene)
        const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1.4, 1.4), bodyMat);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Door ridges on one face (back of container)
        for (let i = -1; i <= 1; i++) {
            const r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.25, 0.04), dimMat);
            r.position.set(1.51, 0, i * 0.35);
            group.add(r);
        }

        // Top + bottom ribs (corrugated effect, simplified)
        for (let i = -1.3; i <= 1.3; i += 0.32) {
            const rib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.4), dimMat);
            rib.position.set(i, 0.72, 0);
            group.add(rib);
        }

        // Corner castings — 8 small cubes at each corner
        const cornerGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
        const cornerMat = new THREE.MeshStandardMaterial({
            color: 0xB27300,
            metalness: 0.8,
            roughness: 0.35
        });
        for (let x of [-1.5, 1.5]) {
            for (let y of [-0.7, 0.7]) {
                for (let z of [-0.7, 0.7]) {
                    const c = new THREE.Mesh(cornerGeo, cornerMat);
                    c.position.set(x, y, z);
                    group.add(c);
                }
            }
        }

        return group;
    }

    function buildTruck() {
        const group = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xD4AF37,
            metalness: 0.9,
            roughness: 0.2
        });
        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x141a17,
            metalness: 0.5,
            roughness: 0.6
        });
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x0F0900,
            metalness: 0.3,
            roughness: 0.85
        });

        // Cab
        const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.4), goldMat);
        cab.position.set(-1.6, 0.55, 0);
        cab.castShadow = true;
        group.add(cab);

        // Cab top (sleeper) — slight stepped roof
        const cabTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 1.3), goldMat);
        cabTop.position.set(-1.7, 1.25, 0);
        cabTop.castShadow = true;
        group.add(cabTop);

        // Windshield (dark)
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 1.2), darkMat);
        windshield.position.set(-1.05, 0.75, 0);
        group.add(windshield);

        // Trailer bed
        const trailerBed = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 1.4), darkMat);
        trailerBed.position.set(0.5, 0.4, 0);
        trailerBed.castShadow = true;
        group.add(trailerBed);

        // Trailer container box (matches container style but smaller)
        const trailerBox = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.2, 1.35), goldMat);
        trailerBox.position.set(0.5, 1.1, 0);
        trailerBox.castShadow = true;
        group.add(trailerBox);

        // Wheels — 4 sets of 2 wheels
        const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 18);
        const wheelPositions = [
            [-1.9, 0.2, -0.65], [-1.9, 0.2, 0.65],   // front cab
            [-1.1, 0.2, -0.65], [-1.1, 0.2, 0.65],   // rear cab
            [ 1.4, 0.2, -0.65], [ 1.4, 0.2, 0.65],   // mid trailer
            [ 2.0, 0.2, -0.65], [ 2.0, 0.2, 0.65]    // rear trailer
        ];
        wheelPositions.forEach(([x, y, z]) => {
            const w = new THREE.Mesh(wheelGeo, tireMat);
            w.rotation.x = Math.PI / 2;
            w.position.set(x, y, z);
            w.castShadow = true;
            group.add(w);
        });

        return group;
    }

    function buildEnvironment() {
        // Procedural equirect for env reflections — dark scene with gold horizon.
        const c = document.createElement('canvas');
        c.width = 256; c.height = 128;
        const g = c.getContext('2d');
        const grad = g.createLinearGradient(0, 0, 0, 128);
        grad.addColorStop(0, '#1a1410');
        grad.addColorStop(0.45, '#3a2a10');
        grad.addColorStop(0.55, '#D4AF37');
        grad.addColorStop(0.7, '#4A2F00');
        grad.addColorStop(1, '#030504');
        g.fillStyle = grad;
        g.fillRect(0, 0, 256, 128);

        const tex = new THREE.CanvasTexture(c);
        tex.mapping = THREE.EquirectangularReflectionMapping;
        if (typeof THREE.PMREMGenerator !== 'undefined') {
            const pmrem = new THREE.PMREMGenerator(renderer);
            pmrem.compileEquirectangularShader();
            const envTex = pmrem.fromEquirectangular(tex).texture;
            pmrem.dispose();
            tex.dispose();
            return envTex;
        }
        return tex;
    }

    function boot() {
        if (booted) return;
        booted = true;

        const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: !isMobile,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height, false);
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = !isMobile;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 6.5, 14);
        camera.lookAt(0, 1, 0);

        // Lighting
        hemi = new THREE.HemisphereLight(0xFFC300, 0x080a09, 0.55);
        scene.add(hemi);

        ambient = new THREE.AmbientLight(0xffffff, 0.12);
        scene.add(ambient);

        spot = new THREE.SpotLight(0xFFFDF0, 1.2, 50, Math.PI * 0.18, 0.4, 1.5);
        spot.position.set(8, 14, 8);
        spot.castShadow = !isMobile;
        if (!isMobile) {
            spot.shadow.mapSize.set(1024, 1024);
            spot.shadow.camera.near = 1;
            spot.shadow.camera.far = 40;
        }
        scene.add(spot);

        underGlow = new THREE.PointLight(0xD4AF37, 0.7, 18);
        underGlow.position.set(0, -1.5, 0);
        scene.add(underGlow);

        // Environment for metallic reflections
        try {
            scene.environment = buildEnvironment();
        } catch (e) {
            // gracefully skip — metallic surfaces will still get lit by hemi/spot
        }

        // Gold ground grid
        gridHelper = new THREE.GridHelper(40, 40, 0xD4AF37, 0x4A2F00);
        gridHelper.material.opacity = 0.35;
        gridHelper.material.transparent = true;
        gridHelper.position.y = -0.05;
        scene.add(gridHelper);

        // Dark receiver plane for shadows
        if (!isMobile) {
            const groundGeo = new THREE.PlaneGeometry(50, 50);
            const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
            const ground = new THREE.Mesh(groundGeo, groundMat);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            scene.add(ground);
        }

        // Route curve — gentle S-shape across the floor
        const curvePoints = [
            new THREE.Vector3(-8, 0.4, 3),
            new THREE.Vector3(-3, 0.4, -1),
            new THREE.Vector3( 2, 0.4, 2),
            new THREE.Vector3( 7, 0.4, -1.5),
            new THREE.Vector3( 9, 0.4,  1)
        ];
        routeCurve = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5);

        // Route line — tube along the curve
        const tubeGeo = new THREE.TubeGeometry(routeCurve, 80, 0.05, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
            color: 0xFFC300,
            transparent: true,
            opacity: 0.55
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(tube);

        // Particle trail along route
        const particleCount = isMobile ? 60 : 140;
        const positions = new Float32Array(particleCount * 3);
        const offsets = new Float32Array(particleCount); // each particle's progress along curve
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            const p = routeCurve.getPointAt(t);
            positions[i * 3 + 0] = p.x;
            positions[i * 3 + 1] = p.y + Math.random() * 0.3;
            positions[i * 3 + 2] = p.z;
            offsets[i] = t;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pMat = new THREE.PointsMaterial({
            color: 0xFFFDF0,
            size: 0.09,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        particleSystem = new THREE.Points(pGeo, pMat);
        particleSystem.userData = { offsets, count: particleCount };
        scene.add(particleSystem);

        // Containers — skip on mobile (heavy)
        if (!isMobile) {
            const positionsRaw = [
                { pos: [-5, 1.8,  -2], rotY: 0.3 },
                { pos: [ 0, 2.2,   2], rotY: -0.5 },
                { pos: [ 5, 1.6,  -1], rotY: 0.15 },
                { pos: [-2, 3.0,   3], rotY: -0.2 }
            ];
            for (const { pos, rotY } of positionsRaw) {
                const c = buildContainer();
                c.position.set(pos[0], pos[1], pos[2]);
                c.rotation.y = rotY;
                c.userData = {
                    baseY: pos[1],
                    phase: Math.random() * Math.PI * 2,
                    rotSpeed: 0.002 + Math.random() * 0.003
                };
                scene.add(c);
                containers.push(c);
            }

            // Truck — drives along the curve
            truck = buildTruck();
            scene.add(truck);
            truck.userData = { t: 0 };
        }

        window.addEventListener('resize', ensureSize, { passive: true });
        canvas.classList.add('ready');
        if (reducedMotion) {
            renderer.render(scene, camera);
        } else {
            rafId = requestAnimationFrame(animate);
        }
    }

    function animate() {
        rafId = null;
        if (!isVisible) return;

        const t = performance.now() * 0.001;

        // Containers: float + slow rotate
        for (const c of containers) {
            c.position.y = c.userData.baseY + Math.sin(t + c.userData.phase) * 0.18;
            c.rotation.y += c.userData.rotSpeed;
        }

        // Truck: drive along curve
        if (truck && routeCurve) {
            truck.userData.t = (truck.userData.t + 0.0009) % 1;
            const p = routeCurve.getPointAt(truck.userData.t);
            const next = routeCurve.getPointAt(Math.min(truck.userData.t + 0.005, 1));
            truck.position.set(p.x, p.y - 0.4, p.z);
            // Face direction of travel
            truck.lookAt(next.x, p.y - 0.4, next.z);
        }

        // Particles: shift offsets along curve
        if (particleSystem) {
            const { count } = particleSystem.userData;
            const off = particleSystem.userData.offsets;
            const arr = particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < count; i++) {
                off[i] = (off[i] + 0.0015) % 1;
                const p = routeCurve.getPointAt(off[i]);
                arr[i * 3] = p.x;
                arr[i * 3 + 1] = p.y + Math.sin(t * 2 + i) * 0.04;
                arr[i * 3 + 2] = p.z;
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        // Subtle camera orbit
        camera.position.x = Math.sin(t * 0.12) * 1.2;
        camera.lookAt(0, 1, 0);

        renderer.render(scene, camera);
        if (!reducedMotion) rafId = requestAnimationFrame(animate);
    }

    // Lazy boot + visibility pause
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    if (!booted) { ensureSize(); boot(); }
                    isVisible = true;
                    if (!reducedMotion && rafId === null && booted) {
                        rafId = requestAnimationFrame(animate);
                    }
                } else {
                    isVisible = false;
                }
            }
        }, { threshold: 0.05 });
        io.observe(visionEl);
    } else {
        // No IO support — boot immediately
        ensureSize();
        boot();
        isVisible = true;
    }
}

/**
 * initCursorDot — desktop-only 8px gold dot that trails the cursor with a 0.15s lag.
 * Hidden via CSS on coarse pointers, <=1024px screens, and prefers-reduced-motion.
 */
function initCursorDot() {
    const dot = document.getElementById('cursorDot');
    if (!dot) return;
    if (window.matchMedia('(max-width: 1024px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches) {
        return;
    }
    let mx = -50, my = -50;
    let pending = false;

    const onMove = (e) => {
        mx = e.clientX;
        my = e.clientY;
        if (!dot.classList.contains('visible')) dot.classList.add('visible');
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
            dot.style.transform = `translate3d(${mx - 4}px, ${my - 4}px, 0)`;
            pending = false;
        });
    };

    const onLeave = () => dot.classList.remove('visible');

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave, { passive: true });
}

/**
 * initMagneticButtons — primary/outline buttons pull toward cursor within 100px.
 * GSAP drives smooth attraction + elastic release. Skipped on coarse pointers
 * and reduced-motion users.
 */
function initMagneticButtons() {
    if (typeof gsap === 'undefined') return;
    if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;

    const btns = document.querySelectorAll('.btn-primary, .btn-outline');
    if (!btns.length) return;

    const RADIUS = 100;
    const PULL = 0.32;

    let rafPending = false;
    let lastEvent = null;

    const trackedRects = new WeakMap();
    const magnetState = new WeakMap();

    const recalcRects = () => {
        btns.forEach(b => trackedRects.set(b, b.getBoundingClientRect()));
    };
    recalcRects();
    window.addEventListener('resize', recalcRects, { passive: true });
    window.addEventListener('scroll', () => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => { recalcRects(); rafPending = false; });
    }, { passive: true });

    const update = () => {
        const e = lastEvent;
        if (!e) return;
        btns.forEach(btn => {
            const rect = trackedRects.get(btn) || btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.hypot(dx, dy);
            const wasIn = magnetState.get(btn);
            if (dist < RADIUS) {
                const force = (1 - dist / RADIUS) * PULL;
                gsap.to(btn, {
                    x: dx * force,
                    y: dy * force,
                    duration: 0.35,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
                magnetState.set(btn, true);
            } else if (wasIn) {
                gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.6,
                    ease: 'elastic.out(1, 0.45)',
                    overwrite: 'auto'
                });
                magnetState.set(btn, false);
            }
        });
    };

    let movePending = false;
    window.addEventListener('mousemove', (e) => {
        lastEvent = e;
        if (movePending) return;
        movePending = true;
        requestAnimationFrame(() => {
            update();
            movePending = false;
        });
    }, { passive: true });
}

/**
 * initExtendedSpotlight — injects a .spotlight div into each service-card and
 * testimonial-card and tracks mousemove to drive --mouse-x / --mouse-y vars.
 * Service cards already have transform-style preserve-3d, so the spotlight
 * sits on a separate z-layer below the content.
 */
function initExtendedSpotlight() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cards = document.querySelectorAll('.service-card, .testimonial-card');
    cards.forEach(card => {
        if (card.querySelector(':scope > .spotlight')) return;
        const sp = document.createElement('div');
        sp.className = 'spotlight';
        card.insertBefore(sp, card.firstChild);

        let rafPending = false;
        card.addEventListener('mousemove', (e) => {
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                rafPending = false;
            });
        });
    });
}

/**
 * initButtonRipple — gold expanding-circle ripple on .btn-primary click.
 * Skipped under prefers-reduced-motion (CSS hides ripple via display:none anyway).
 */
function initButtonRipple() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rect = btn.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = size + 'px';
            ripple.style.height = size + 'px';
            // Position at click coordinates relative to button
            ripple.style.left = (e.clientX - rect.left) + 'px';
            ripple.style.top = (e.clientY - rect.top) + 'px';
            btn.appendChild(ripple);
            // Clean up after the CSS animation finishes (0.6s + small buffer)
            setTimeout(() => ripple.remove(), 700);
        });
    });
}

/**
 * initServiceCardTilt — perspective tilt on .service-card mousemove (max 5deg).
 * rAF-throttled; resets on mouseleave. Skips if prefers-reduced-motion.
 */
function initServiceCardTilt() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const cards = document.querySelectorAll('.service-card');
    if (!cards.length) return;

    const MAX_TILT = 5; // degrees

    cards.forEach(card => {
        let rafPending = false;
        let lastX = 0;
        let lastY = 0;

        card.addEventListener('mousemove', (e) => {
            lastX = e.clientX;
            lastY = e.clientY;
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const dx = (lastX - rect.left - cx) / cx; // -1..1
                const dy = (lastY - rect.top - cy) / cy;  // -1..1
                const rotateY = Math.max(-MAX_TILT, Math.min(MAX_TILT, dx * MAX_TILT));
                const rotateX = Math.max(-MAX_TILT, Math.min(MAX_TILT, -dy * MAX_TILT));
                card.classList.add('is-tilting');
                card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
                rafPending = false;
            });
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('is-tilting');
            card.style.transform = '';
        });
    });
}

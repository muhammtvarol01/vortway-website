// Desktop+pointer gate computed once. The bespoke Three.js hero atmosphere and
// the cinematic preloader truck are desktop-only; mobile gets clean CSS fallbacks.
const VW_DESKTOP = !window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;

// ============================================================================
// CINEMATIC PRELOADER — kicks off BEFORE DOMContentLoaded so the truck animation
// starts as early as possible. Synced to real asset-load progress (fonts + images).
// ============================================================================
initPreloader();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Icons
    if (window.lucide) lucide.createIcons();

    // 1.0 Lenis smooth scroll (desktop only). Hero atmosphere is now pure CSS
    // on cream — no Three.js scene, no procedural geometry.
    if (VW_DESKTOP && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        initLenisSmoothScroll();
    }

    // 1.3c Service Card 3D Tilt (mouse-tracked perspective)
    initServiceCardTilt();

    // 1.3d Cursor Dot — desktop-only gold follower
    initCursorDot();

    // 1.3d2 Hero cursor glow retired Phase A — orange halo over cream reads dirty.
    //       initHeroCursorGlow() definition is kept dormant for now; caller retired.

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

    // 1.4 GSAP Hero Staggered Reveal — cinematic top-down cascade
    if (typeof gsap !== 'undefined') {
        gsap.set('.hero-subtitle, .hero-desc, .scroll-indicator', { opacity: 0, y: 30 });
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
            .to('.hero-desc',     { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
            .to('.scroll-indicator', { opacity: 0.85, y: 0, duration: 0.4 }, '-=0.3');

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
        // .pillar-card initial state set inside the mask-reveal block (clip-path inset)
        gsap.set('.contact-wrapper', { opacity: 0, scale: 0.95 });

        // 2026-05-17 v4: scroll-velocity skew — pages "bend" under fast scrolls,
        // snap back when scroll settles. Sets a CSS var on <html>; consumers
        // (.pillar-card, .showcase-content) apply skewY(var(--scroll-warp)).
        // Pure motion-language; falls back to 0 on any error.
        if (!reduceMotionGSAP) {
            let lastSkew = 0;
            gsap.ticker.add(() => {
                try {
                    const v = ScrollTrigger.getVelocity ? ScrollTrigger.getVelocity() : 0;
                    // Map scroll velocity (px/s) to skew degrees, clamp ±1.8°
                    const target = Math.max(-1.8, Math.min(1.8, v / 1800));
                    lastSkew += (target - lastSkew) * 0.08;
                    if (Math.abs(lastSkew) < 0.02) lastSkew = 0;
                    document.documentElement.style.setProperty('--scroll-warp', lastSkew.toFixed(3) + 'deg');
                } catch (e) {
                    document.documentElement.style.setProperty('--scroll-warp', '0deg');
                }
            });
        }

        // .section-header: fade in + slide up from 30px below.
        // Phase D extended cadence — 1.4s duration with power4.out so reveals
        // settle slowly into place (lodisna's silky deceleration). Start moved
        // to top 92% so the reveal begins as the header crests into the viewport.
        gsap.utils.toArray('.section-header').forEach(header => {
            gsap.to(header, {
                opacity: 1,
                y: 0,
                duration: 1.4,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: header,
                    start: 'top 92%',
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

        // Scroll-arrow drift — the hero's .scroll-indicator translates ~110% to the
        // right and fades to 0 as the hero scrolls past. Mirrors lodisna's .arrow
        // motion: a cue that travels off the edge in sync with leaving the hero.
        if (!reduceMotionGSAP) {
            const scrollInd = document.querySelector('.scroll-indicator');
            const heroEl = document.getElementById('hero');
            if (scrollInd && heroEl) {
                gsap.to(scrollInd, {
                    x: () => window.innerWidth * 0.55,
                    opacity: 0,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: heroEl,
                        start: 'top top',
                        end: 'bottom 60%',
                        scrub: 0.6
                    }
                });
            }
        }

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

        // .pillar-card: 2026-05-17 v4 — scrub-driven left-to-right clip-path
        // mask reveal. Cards are fully laid out (no opacity flash) and get
        // *uncovered* by the viewport's scroll progress. Lodisna/payanamuseum's
        // signature reveal. Parallax block deleted so it doesn't compete.
        const pillarCards = gsap.utils.toArray('.pillar-card');
        if (pillarCards.length) {
            pillarCards.forEach((card, i) => {
                gsap.set(card, {
                    clipPath: 'inset(0 100% 0 0)',
                    opacity: 1,
                    y: 0
                });
                gsap.to(card, {
                    clipPath: 'inset(0 0% 0 0)',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '#vision',
                        start: 'top 78%',
                        end: 'top 22%',
                        scrub: 0.8
                    },
                    delay: i * 0.06
                });
            });
        }

        // .ftl-card: staggered fade in from bottom
        const ftlCards = gsap.utils.toArray('.ftl-card');
        if (ftlCards.length) {
            gsap.to(ftlCards, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.15,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: ftlCards[0],
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

    // 1.5b Premium reveals — SplitText titles + stats flash. The 3D showcase
    // (Phase 3) and FTL card reveals are wired by their own initializers below.
    initSplitTextReveals();
    initStatsFlash();
    // 2026-05-18 v4 Awwwards polish: cursor-follow spotlight on dark surfaces.
    initCursorSpotlight();

    // 1.5c Phase A v3 (2026-05-17): hero is now full-bleed <video> driven by native
    //      HTML5 autoplay/loop — no JS init needed. initHeroScene() retired; the
    //      function definition stays dormant in case we revive a 3D hero later.

    // 1.5d 3D Showcase (Section 2) — lazy-mounted Three.js scene of vortway-truck.glb.
    // Mobile keeps the static photo fallback in CSS; JS short-circuits there.
    initShowcase();

    // 1.5e Pillar icons — 3 auto-rotating GLB scenes (compass/shield/medal).
    // Lazy-mounted when .vision section enters view; mobile keeps Lucide fallbacks.
    initPillarIcons();

    // 1.5f Hero scroll-out (Phase E.2, 2026-05-17) — cinematic departure.
    // Video subtly zooms + parallaxes upward as the user scrolls past the hero;
    // text glides up and fades. Lodisna signature. Reduced-motion safe.
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined'
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.to('.hero-video', {
            scale: 1.08,
            yPercent: -10,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 0.6
            }
        });
        gsap.to('.hero-content', {
            yPercent: -28,
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: '70% top',
                scrub: 0.4
            }
        });
    }

    // 1.5g Cinematic section reveals (Phase E.2 v2, 2026-05-17) — each major
    // section enters via a horizontal-band clip-path wipe (lodisna signature):
    // starts as a slit `inset(15% 0)` and expands to `inset(0% 0)` as the
    // section translates up into view. No clip-path on #showcase (would
    // break the GSAP pin measurements). Plays once per session.
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined'
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        ['#services', '#vision', '#trust', '#faq', '#contact'].forEach(sel => {
            const el = document.querySelector(sel);
            if (!el) return;
            gsap.fromTo(el,
                {
                    clipPath: 'inset(15% 0% 15% 0%)',
                    webkitClipPath: 'inset(15% 0% 15% 0%)',
                    y: 50,
                    opacity: 0.5
                },
                {
                    clipPath: 'inset(0% 0% 0% 0%)',
                    webkitClipPath: 'inset(0% 0% 0% 0%)',
                    y: 0,
                    opacity: 1,
                    duration: 1.6,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 82%',
                        once: true
                    }
                });
        });
    }

    // 1.6 Pillar Card Spotlight + 3D Tilt (Phase E v3, 2026-05-17)
    //     CSS mouse-x/y for the glow, GSAP tilt for depth. Disabled when
    //     prefers-reduced-motion is on so vestibular users aren't penalised.
    {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hasGsap = typeof gsap !== 'undefined';
        const MAX_TILT = 6; // degrees, generous but not nauseating
        document.querySelectorAll('.pillar-card').forEach(card => {
            let rafPending = false;
            let pointerX = 0, pointerY = 0;
            // Pre-create a tween cache so GSAP overrides the CSS transition cleanly
            const tiltSet = hasGsap ? gsap.quickTo(card, 'rotationY', { duration: 0.35, ease: 'power2.out' }) : null;
            const tiltSetX = hasGsap ? gsap.quickTo(card, 'rotationX', { duration: 0.35, ease: 'power2.out' }) : null;
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                pointerX = e.clientX - rect.left;
                pointerY = e.clientY - rect.top;
                if (rafPending) return;
                rafPending = true;
                requestAnimationFrame(() => {
                    card.style.setProperty('--mouse-x', `${pointerX}px`);
                    card.style.setProperty('--mouse-y', `${pointerY}px`);
                    if (!reduceMotion && tiltSet && tiltSetX) {
                        const cx = rect.width / 2;
                        const cy = rect.height / 2;
                        const rx = ((pointerY - cy) / cy) * -MAX_TILT;
                        const ry = ((pointerX - cx) / cx) * MAX_TILT;
                        tiltSetX(rx);
                        tiltSet(ry);
                    }
                    rafPending = false;
                });
            });
            if (!reduceMotion && hasGsap) {
                gsap.set(card, { transformPerspective: 1200, transformOrigin: 'center center' });
                card.addEventListener('mouseleave', () => {
                    gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.6, ease: 'power3.out' });
                });
            }
        });
    }

    // 1.6b Magnetic cursor on primary CTAs (Phase E v3)
    //      Each button's content lerps toward the pointer when the pointer is
    //      inside a generous radius around the button. Subtle, lodisna-grade.
    if (typeof gsap !== 'undefined') {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduceMotion) {
            const RADIUS = 90;            // px of magnetic field around button centre
            const STRENGTH = 0.35;        // 0–1; how strongly the button follows
            const selectors = ['#navCta', '.btn-primary'];
            const targets = document.querySelectorAll(selectors.join(','));
            targets.forEach(btn => {
                let rafPending = false;
                const reset = () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
                const move = (e) => {
                    if (rafPending) return;
                    rafPending = true;
                    requestAnimationFrame(() => {
                        const rect = btn.getBoundingClientRect();
                        const cx = rect.left + rect.width / 2;
                        const cy = rect.top + rect.height / 2;
                        const dx = e.clientX - cx;
                        const dy = e.clientY - cy;
                        const dist = Math.hypot(dx, dy);
                        if (dist < RADIUS) {
                            gsap.to(btn, {
                                x: dx * STRENGTH,
                                y: dy * STRENGTH,
                                duration: 0.4,
                                ease: 'power3.out'
                            });
                        } else {
                            reset();
                        }
                        rafPending = false;
                    });
                };
                window.addEventListener('mousemove', move, { passive: true });
                btn.addEventListener('mouseleave', reset);
            });
        }
    }

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
            if (window.__vortwayLenis) {
                window.__vortwayLenis.scrollTo(0, { duration: 1.5 });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

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

    // 4. Smooth Scrolling for Internal Links — defers to Lenis when present
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                if (window.__vortwayLenis) {
                    window.__vortwayLenis.scrollTo(target, { offset: -60, duration: 1.4 });
                } else {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
                if(window.innerWidth <= 840 && navLinks) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });

    // 5. Connect Button retired Phase A — the navbar CONTACT link handles this
    //    flow via the generic a[href^="#"] handler above.

    // 6. Quote Modal Logic — opened only by the navbar #navCta button now.
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

    if (quoteModal && closeQuoteModal) {
        function openQuoteModal() {
            quoteModal.classList.add('active');
            // lock background scroll so scrollIntoView / page wheel can't drift the body
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            if (window.__vortwayLenis) window.__vortwayLenis.stop();
        }

        function dismissQuoteModal() {
            quoteModal.classList.remove('active');
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            if (window.__vortwayLenis) window.__vortwayLenis.start();
            resetQuoteModalState();
        }

        // Navbar "GET A QUOTE" is the only opener now (the hero buttons retired Phase A)
        const navCta = document.getElementById('navCta');
        if (navCta) navCta.addEventListener('click', openQuoteModal);

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
        // Detect placeholder Formspree URL. If still unconfigured we skip the
        // network call entirely and route the user's email client (mailto:).
        const formspreeAction = contactForm.getAttribute('action') || '';
        const formspreeConfigured = formspreeAction.includes('formspree.io/f/')
            && !formspreeAction.endsWith('FORMSPREE_ID');

        const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const COMPANY_INPUT  = document.getElementById('c_company');
        const EMAIL_INPUT    = document.getElementById('c_email');
        const DETAILS_INPUT  = document.getElementById('c_details');
        const REPLYTO_INPUT  = document.getElementById('c_replyto');

        function showToast(msg, isError) {
            toastMsg.textContent = msg;
            toast.classList.toggle('toast-error', !!isError);
            toast.classList.add('show');
            clearTimeout(showToast._t);
            showToast._t = setTimeout(() => toast.classList.remove('show', 'toast-error'), 5000);
        }

        function validateForm() {
            const company = (COMPANY_INPUT?.value || '').trim();
            const email   = (EMAIL_INPUT?.value || '').trim();
            const message = (DETAILS_INPUT?.value || '').trim();
            if (!company || !email || !message) {
                showToast(translations[currentLang]?.toast_validation || 'Please fill in all required fields.', true);
                return null;
            }
            if (!EMAIL_RE.test(email)) {
                showToast(translations[currentLang]?.toast_email_invalid || 'Please enter a valid email address.', true);
                EMAIL_INPUT?.focus();
                return null;
            }
            return { company, email, message };
        }

        function openMailto(data) {
            const subject = encodeURIComponent(`Inquiry from ${data.company}`);
            const body = encodeURIComponent(
                `Company: ${data.company}\nFrom: ${data.email}\n\n${data.message}`
            );
            // Opens the user's default mail client with everything pre-filled.
            window.location.href = `mailto:info@vortway.lt?subject=${subject}&body=${body}`;
        }

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = validateForm();
            if (!data) return;

            // Mirror email into the Formspree _replyto field so replies route correctly.
            if (REPLYTO_INPUT) REPLYTO_INPUT.value = data.email;

            // Path A — Formspree not configured yet: open user's mail client.
            if (!formspreeConfigured) {
                showToast(translations[currentLang]?.toast_mailto_opening
                    || 'Opening your email client to send to info@vortway.lt…', false);
                openMailto(data);
                return;
            }

            // Path B — Formspree is wired. Submit asynchronously.
            const submitBtn = contactForm.querySelector('[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'TRANSMITTING…';

            try {
                const response = await fetch(formspreeAction, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { Accept: 'application/json' }
                });

                if (response.ok) {
                    showToast(translations[currentLang]?.toast_success
                        || 'Your inquiry has been transmitted. Our team will respond within 24 hours.', false);
                    contactForm.reset();
                } else {
                    throw new Error('non-ok');
                }
            } catch {
                // Formspree failed (offline, rate-limit, etc) — fall back to mailto.
                showToast(translations[currentLang]?.toast_error
                    || 'Transmission failed. Opening your email client as a fallback…', true);
                setTimeout(() => openMailto(data), 1200);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
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

    // 10. Preloader dismiss — initPreloader() (called pre-DOMContentLoaded) owns the
    // truck animation, progress tracking, and the dock-and-dissolve sequence. Nothing
    // to do here.
});

/* ============================================================================
   CINEMATIC PRELOADER — Video-driven cream luxury intro (2026-05-16).
   preloader.mp4 plays in full; the HUD bar tracks the video's own playhead so
   progress feels honest. Reduced-motion / video decode failure -> static PNG
   fallback dismissed after a short fade.
   ============================================================================ */
function initPreloader() {
    const preloaderEl = document.getElementById("preloader");
    if (!preloaderEl) return;
    const video = document.getElementById("preloaderVideo");
    const barFill = document.getElementById("preloaderBarFill");
    const pctEl = document.getElementById("preloaderPct");

    document.documentElement.classList.add("preloading");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const HARD_CAP_MS = 7000;          // never hold the visitor longer than this
    const FALLBACK_MS = 1600;          // when no video plays, fade out after this
    let dismissed = false;

    function setProgress(pct) {
        const clamped = Math.max(0, Math.min(pct, 1));
        const display = Math.round(clamped * 100);
        if (barFill) barFill.style.width = display + "%";
        if (pctEl) pctEl.textContent = String(display).padStart(2, "0");
    }

    function dismiss() {
        if (dismissed) return;
        dismissed = true;
        setProgress(1);
        const finish = () => {
            preloaderEl.classList.add("hidden");
            setTimeout(() => {
                preloaderEl.parentNode && preloaderEl.parentNode.removeChild(preloaderEl);
                document.documentElement.classList.remove("preloading");
                // Recompute ScrollTrigger positions now that the preloader is gone
                // and the page has settled — otherwise the .showcase pin range is
                // computed against pre-load layout and releases far too early.
                if (typeof ScrollTrigger !== "undefined") {
                    requestAnimationFrame(() => ScrollTrigger.refresh());
                }
            }, 900);
        };

        if (typeof gsap !== "undefined" && !reduced) {
            gsap.timeline({ onComplete: finish })
                .to(".preloader-hud", { opacity: 0, y: 6, duration: 0.35, ease: "power2.out" })
                .to(preloaderEl, { opacity: 0, duration: 0.85, ease: "power2.inOut" }, "<0.1");
        } else {
            setTimeout(finish, 200);
        }
    }

    // ----- Video path -----
    function startVideoFlow() {
        // attempt to play; autoplay may be blocked even with muted+playsinline in rare cases
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => useFallback());
        }

        video.addEventListener("timeupdate", () => {
            if (!video.duration || !isFinite(video.duration)) return;
            setProgress(video.currentTime / video.duration);
        });
        video.addEventListener("ended", dismiss, { once: true });
        video.addEventListener("error", useFallback, { once: true });
    }

    function useFallback() {
        preloaderEl.classList.add("no-video");
        // Animate the bar over the fallback window
        let t0 = performance.now();
        (function tick() {
            const p = Math.min((performance.now() - t0) / FALLBACK_MS, 1);
            setProgress(p);
            if (p < 1 && !dismissed) requestAnimationFrame(tick);
            else dismiss();
        })();
    }

    if (reduced || !video || !video.canPlayType || !video.canPlayType("video/mp4")) {
        useFallback();
    } else {
        // If metadata never loads within 1.2s, treat it as a decode failure
        const metaTimer = setTimeout(useFallback, 1200);
        video.addEventListener("loadedmetadata", () => {
            clearTimeout(metaTimer);
            startVideoFlow();
        }, { once: true });
    }

    // Hard cap regardless of video state
    setTimeout(dismiss, HARD_CAP_MS);
}

/**
 * initHeroVideos — desktop-only crossfade between hero-background-1.mp4
 * (golden-hour highway) and hero-background-2.mp4 (night network map).
 *
 * Mobile / coarse-pointer / reduced-motion users keep the static poster image
 * already in the HTML — we never even fetch the ~88 MB of MP4 on those devices.
 *
 * Both clips loop independently; we just toggle .is-active on one at a time and
 * let CSS handle the cross-fade via a 1.6 s opacity transition.
 */
function initHeroVideos() {
    if (!VW_DESKTOP) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const media = document.querySelector('.hero-media');
    if (!media) return;

    const sources = [
        'assets/hero-background-1.mp4',
        'assets/hero-background-2.mp4'
    ];

    const videos = sources.map((src, i) => {
        const v = document.createElement('video');
        v.className = 'hero-video' + (i === 0 ? ' is-active' : '');
        v.autoplay = true;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.preload = i === 0 ? 'auto' : 'metadata';   // stagger network priority
        v.setAttribute('disablepictureinpicture', '');
        v.setAttribute('aria-hidden', 'true');
        const source = document.createElement('source');
        source.src = src;
        source.type = 'video/mp4';
        v.appendChild(source);
        media.appendChild(v);
        return v;
    });

    // Once the first video is decodable, mark the media container so the
    // poster fades out and the videos take over.
    videos[0].addEventListener('loadeddata', () => {
        media.classList.add('has-video');
    }, { once: true });

    // Try to start both clips; if autoplay is blocked we just keep the poster.
    videos.forEach(v => {
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
    });

    // Crossfade every 8 s (the CSS opacity transition is 1.6 s so the overlap
    // is generous and never reveals a hard cut).
    let activeIdx = 0;
    setInterval(() => {
        activeIdx = (activeIdx + 1) % videos.length;
        videos.forEach((v, i) => v.classList.toggle('is-active', i === activeIdx));
    }, 8000);
}

/**
 * initShowcase — Section 2's pinned 3D scene of vortway-truck.glb.
 *
 * Lifecycle:
 *   1. Gate: desktop only. Mobile / coarse-pointer / reduced-motion / slow
 *      network all keep the static photograph fallback in CSS and exit early.
 *   2. Wait for the section to come within 600 px of the viewport before
 *      touching THREE — the GLB is ~50 MB and we don't want to fetch it on
 *      page load for a visitor who bounces from the hero.
 *   3. Set up scene + camera + renderer (alpha-on so the cream-floor gradient
 *      bleeds through) and a warm key light to mimic the gallery spotlight.
 *   4. Load GLB. On success, fade canvas in, ScrollTrigger pin the section,
 *      and wire scroll-driven Y rotation + mouse parallax tilt (±20° yaw).
 *
 * No DRACO/KTX2 loaders — image-to-3D conversions ship as raw glTF. If a
 * future GLB uses Draco, the GLTFLoader.load call will throw and we'll
 * silently fall back to the photo (the canvas just stays hidden).
 */
/**
 * initTruckGLB — load and cache vortway-truck.glb once across the entire page.
 * Both initHeroScene and initShowcase await this Promise and clone the result
 * into their own scenes. One network fetch, one parse, two scene graphs.
 *
 * Cleanup (placeholder cubes, untextured white materials) runs ONCE on the
 * source — clones inherit the cleaned state via shared geometry/material refs.
 *
 * Returns Promise<THREE.Object3D | null>. Null on failure → callers can fall
 * back to their poster image.
 */
function initTruckGLB() {
    if (window.__vortwayTruckGLBPromise) return window.__vortwayTruckGLBPromise;
    window.__vortwayTruckGLBPromise = new Promise((resolve) => {
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader) {
            resolve(null);
            return;
        }
        const loader = new THREE.GLTFLoader();
        // Phase D v3 (2026-05-17): v2 GLB is meshopt-compressed (50 MB → 5 MB).
        // Requires MeshoptDecoder, loaded via CDN in <head>.
        if (typeof MeshoptDecoder !== 'undefined') {
            loader.setMeshoptDecoder(MeshoptDecoder);
        }
        loader.load(
            // Phase D v4 (2026-05-17): v3 = Meshy-generated semi-truck (Volvo FH
            // style) with PBR refine. Renamed from v2 to force browser fresh
            // fetch — GLTFLoader caches by URL and v2 was overwritten in place.
            'assets/vortway-truck-v3.glb?v=premium1',
            (gltf) => {
                const source = gltf.scene;
                const PLACEHOLDER_RE = /^(box|cube|placeholder|empty|dummy|plane|untitled)\b/i;
                source.traverse((node) => {
                    if (!node.isMesh) return;
                    if (PLACEHOLDER_RE.test(node.name || '')) { node.visible = false; return; }
                    const m = node.material;
                    if (m) {
                        const noMaps = !m.map && !m.normalMap && !m.roughnessMap;
                        const isNearWhite = m.color && m.color.r > 0.92 && m.color.g > 0.92 && m.color.b > 0.92;
                        if (noMaps && isNearWhite) { node.visible = false; return; }
                        m.depthWrite = true;
                        if (m.envMapIntensity !== undefined) m.envMapIntensity = 1.6;
                    }
                });
                resolve(source);
            },
            undefined,
            () => resolve(null)
        );
    });
    return window.__vortwayTruckGLBPromise;
}

/**
 * initEnvMap — load the Polyhaven studio HDR once, cache as a PMREM-processed
 * envMap on window.__vortwayEnvMap. Both initHeroScene and initShowcase await
 * this so they share lighting and look like the same product across the page.
 *
 * Returns a Promise<THREE.Texture | null>. Null on failure → callers fall back
 * to the legacy 4-light ambient+key+rim setup so the scene still renders.
 */
function initEnvMap() {
    if (window.__vortwayEnvMapPromise) return window.__vortwayEnvMapPromise;
    window.__vortwayEnvMapPromise = new Promise((resolve) => {
        if (typeof THREE === 'undefined' || !THREE.RGBELoader) {
            resolve(null);
            return;
        }
        const loader = new THREE.RGBELoader();
        loader.setDataType(THREE.UnsignedByteType);
        loader.load(
            // Phase D v3 (2026-05-17): swapped studio_small_09_2k.hdr (6.3 MB) for
            // studio_small_03_1k.hdr (1.7 MB) per perf budget. Visually equivalent
            // for our cream-leaning showcase scene.
            'assets/studio_small_03_1k.hdr',
            (texture) => {
                // We need a renderer to PMREM-process — create a temporary disposable one
                const tmp = new THREE.WebGLRenderer({ alpha: true });
                const pmrem = new THREE.PMREMGenerator(tmp);
                pmrem.compileEquirectangularShader();
                const envMap = pmrem.fromEquirectangular(texture).texture;
                texture.dispose();
                pmrem.dispose();
                tmp.dispose();
                window.__vortwayEnvMap = envMap;
                resolve(envMap);
            },
            undefined,
            () => resolve(null)
        );
    });
    return window.__vortwayEnvMapPromise;
}

// initHeroScene() retired 2026-05-18 — hero section uses HTML5 video background,
// #heroCanvas no longer exists in the DOM. Function removed to eliminate dead code.

function _initHeroScene_RETIRED() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const stage = canvas.parentElement; // .hero-stage
    const poster = stage && stage.querySelector('.hero-stage-poster');

    if (!VW_DESKTOP) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) return;

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0.4, 0.5, 5.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
        canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // Fallback lighting in case the HDR fails to load.
    const ambient = new THREE.AmbientLight(0xfbfbfd, 0.55);
    scene.add(ambient);
    const rim = new THREE.DirectionalLight(0xffe6c4, 1.1);
    rim.position.set(-3, 4, 2);
    scene.add(rim);

    const truckGroup = new THREE.Group();
    scene.add(truckGroup);

    // Gentle idle parallax tied to the cursor.
    let targetYaw = 0;
    let targetPitch = 0;
    let currentYaw = 0;
    let currentPitch = 0;
    stage.addEventListener('mousemove', (e) => {
        const rect = stage.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        targetYaw = nx * (Math.PI / 18);   // ~10°
        targetPitch = ny * (Math.PI / 28); // ~6°
    });
    stage.addEventListener('mouseleave', () => { targetYaw = 0; targetPitch = 0; });

    function resize() {
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // Hero awaits BOTH the env map and the GLB. Both are shared Promise caches —
    // showcase consumes the same instances, so only one fetch + one parse total.
    Promise.all([initEnvMap(), initTruckGLB()]).then(([envMap, source]) => {
        if (envMap) scene.environment = envMap;
        if (!source) return; // keep poster visible

        const model = source.clone(true);

        // Fit to frame
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.9 / maxDim;
        model.scale.setScalar(scale);

        box.setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.sub(center);
        model.position.y -= size.y * scale * 0.12;
        // Slight 3/4 angle so the truck reads as a product shot, not a side profile
        model.rotation.y = -Math.PI / 6;

        truckGroup.add(model);
        canvas.classList.add('is-ready');
        if (poster) poster.classList.add('is-hidden');
    });

    function tick() {
        currentYaw += (targetYaw - currentYaw) * 0.06;
        currentPitch += (targetPitch - currentPitch) * 0.06;
        truckGroup.rotation.y = currentYaw;
        truckGroup.rotation.x = currentPitch;
        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }
    tick();
}

function initShowcase() {
    const section = document.getElementById('showcase');
    if (!section) return;
    const canvas = document.getElementById('showcaseCanvas');
    const stage = section.querySelector('.showcase-stage');
    const fallback = document.getElementById('showcaseFallback');
    if (!canvas || !stage) return;

    if (!VW_DESKTOP) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) return;

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return;

    let mounted = false;
    const io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting) && !mounted) {
            mounted = true;
            io.disconnect();
            mountScene();
        }
    }, { rootMargin: '600px 0px' });
    io.observe(section);

    function mountScene() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        // 2026-05-17: camera elevation y=1.2 (was 0.6) + lookAt(0, 0.05, 0) so
        // the camera always looks DOWN at the truck on a slight diagonal. This
        // way at every rotation angle — including head-on (where the trailer
        // would otherwise be hidden behind the cab) — the trailer roof stays
        // visible past the cab line. Full rig is never occluded.
        camera.position.set(0, 1.2, 5.4);
        camera.lookAt(0, 0.05, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // Phase D v3 (2026-05-17): 1.05 → 1.2 for premium wet-paint sheen on the
        // showcase truck. The Polyhaven 1k HDRI is slightly under-bright; this
        // exposure bump gives the model the studio-lit lodisna feel.
        renderer.toneMappingExposure = 1.2;

        // Lighting — shared HDRI environment (matches the hero scene). The 4-light
        // ambient+key+rim+top setup is retired; the env map carries reflection +
        // diffuse cues. One soft ambient stays as a fallback if HDR fails to load.
        const ambient = new THREE.AmbientLight(0xfbfbfd, 0.45);
        scene.add(ambient);
        const rimLight = new THREE.DirectionalLight(0xffe6c4, 0.9);
        rimLight.position.set(-4, 3, 4);
        scene.add(rimLight);
        initEnvMap().then((envMap) => {
            if (envMap) scene.environment = envMap;
        });

        const truckGroup = new THREE.Group();
        scene.add(truckGroup);

        let targetYaw = 0;
        let targetPitch = 0;
        let currentYaw = 0;
        let currentPitch = 0;
        // Scroll-driven transform — full 6-field state (rotation × 3 axes + position
        // × 3 axes). GSAP animates the state object directly; the tick loop reads it
        // every frame. Initial pose = slat 1's resting target (3/4 front angle).
        const SLAT_HOME = { rx: 0, ry: -Math.PI / 8, rz: 0, px: 0, py: 0, pz: 0 };
        const stateRef = { value: { ...SLAT_HOME } };

        function resize() {
            const w = stage.clientWidth;
            const h = stage.clientHeight;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
        resize();
        window.addEventListener('resize', resize);

        stage.addEventListener('mousemove', (e) => {
            const rect = stage.getBoundingClientRect();
            const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
            targetYaw = nx * (Math.PI / 10);
            targetPitch = ny * (Math.PI / 20);
        });
        stage.addEventListener('mouseleave', () => {
            targetYaw = 0;
            targetPitch = 0;
        });

        initTruckGLB().then((source) => {
            if (!source) {
                canvas.style.display = 'none';
                return;
            }
            // Clone the shared cleaned-up source; geometry + material refs are
            // shared with the hero scene (intentional — saves memory + parse time).
            const model = source.clone(true);

            // 2026-05-17 v4: realism layer 1 — DoubleSide + clearcoat + AO boost.
            // Force DoubleSide so faces don't vanish at any yaw. Apply clearcoat
            // (wet automotive paint look) and bump AO so the under-trailer + cab
            // crevices read deeper without changing the texture bake.
            model.traverse((node) => {
                if (node.isMesh && node.material) {
                    node.material.side = THREE.DoubleSide;
                    if (node.material.envMapIntensity !== undefined) {
                        node.material.envMapIntensity = 1.4;
                    }
                    // Clearcoat — MeshStandardMaterial doesn't have it natively
                    // but the standard glTF importer instantiates MeshPhysicalMaterial
                    // when the source has clearcoat extension. The body materials
                    // here come from Meshy as MeshStandardMaterial; setting these
                    // properties is harmless (no-op) on non-physical, and applied
                    // when physical. Three.js r134+ supports the physical path.
                    if ('clearcoat' in node.material) {
                        node.material.clearcoat = 0.75;
                        node.material.clearcoatRoughness = 0.18;
                    }
                    if (node.material.aoMapIntensity !== undefined) {
                        node.material.aoMapIntensity = 1.4;
                    }
                    node.material.needsUpdate = true;
                }
            });

            // 2026-05-17 v4: realism layer 2 — contact shadow under the truck.
            // A flat plane with a radial-alpha texture (generated in an offscreen
            // canvas — no asset). Gives the rig a soft "floor anchor."
            try {
                const shadowCanvas = document.createElement('canvas');
                shadowCanvas.width = 256;
                shadowCanvas.height = 256;
                const sctx = shadowCanvas.getContext('2d');
                const grad = sctx.createRadialGradient(128, 128, 8, 128, 128, 120);
                grad.addColorStop(0, 'rgba(15,15,18,0.55)');
                grad.addColorStop(0.6, 'rgba(15,15,18,0.18)');
                grad.addColorStop(1, 'rgba(15,15,18,0)');
                sctx.fillStyle = grad;
                sctx.fillRect(0, 0, 256, 256);
                const shadowTex = new THREE.CanvasTexture(shadowCanvas);
                const shadowMat = new THREE.MeshBasicMaterial({
                    map: shadowTex,
                    transparent: true,
                    depthWrite: false
                });
                const shadowGeo = new THREE.PlaneGeometry(size.x * scale * 1.3, size.z * scale * 1.2);
                const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
                shadowMesh.rotation.x = -Math.PI / 2;
                shadowMesh.position.y = -size.y * scale * 0.55;
                truckGroup.add(shadowMesh);
            } catch (e) {
                // Shadow is decorative; skip silently on any error.
            }

            // 2026-05-17 v4: realism layer 3 — floor reflector (lodisna signature).
            // Gated to hardware concurrency >= 8 and non-mobile so weak machines
            // fall back to just the contact shadow. Reflector is THREE's mirror
            // plane; ~12 KB module from the existing three@0.134 CDN.
            const canDoReflector = (
                navigator.hardwareConcurrency >= 8 &&
                window.matchMedia('(min-width: 1024px)').matches &&
                typeof THREE.Reflector === 'function'
            );
            if (canDoReflector) {
                try {
                    const reflectorGeo = new THREE.PlaneGeometry(size.x * scale * 1.8, size.z * scale * 1.6);
                    const reflector = new THREE.Reflector(reflectorGeo, {
                        textureWidth: 512,
                        textureHeight: 512,
                        color: 0x1F1F22
                    });
                    reflector.rotation.x = -Math.PI / 2;
                    reflector.position.y = -size.y * scale * 0.56;
                    truckGroup.add(reflector);
                    // Fade overlay so reflector edges blend into the page bg.
                    const fadeGeo = new THREE.PlaneGeometry(size.x * scale * 1.8, size.z * scale * 1.6);
                    const fadeCanvas = document.createElement('canvas');
                    fadeCanvas.width = 256; fadeCanvas.height = 256;
                    const fctx = fadeCanvas.getContext('2d');
                    const fgrad = fctx.createRadialGradient(128, 128, 40, 128, 128, 128);
                    fgrad.addColorStop(0, 'rgba(251,251,253,0)');
                    fgrad.addColorStop(1, 'rgba(251,251,253,0.92)');
                    fctx.fillStyle = fgrad;
                    fctx.fillRect(0, 0, 256, 256);
                    const fadeTex = new THREE.CanvasTexture(fadeCanvas);
                    const fadeMat = new THREE.MeshBasicMaterial({ map: fadeTex, transparent: true, depthWrite: false });
                    const fadeMesh = new THREE.Mesh(fadeGeo, fadeMat);
                    fadeMesh.rotation.x = -Math.PI / 2;
                    fadeMesh.position.y = -size.y * scale * 0.555;
                    truckGroup.add(fadeMesh);
                } catch (e) {
                    // Reflector is decorative; not all THREE builds bundle it.
                }
            }

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            // 3.0 instead of 3.2 leaves breathing room on either side so the
            // truck never clips the canvas edges while rotating 90° / 270°.
            const scale = 3.0 / maxDim;
            model.scale.setScalar(scale);

            box.setFromObject(model);
            const center = new THREE.Vector3();
            box.getCenter(center);
            model.position.sub(center);
            model.position.y -= size.y * scale * 0.15;

            truckGroup.add(model);
            canvas.classList.add('is-ready');
            if (fallback) fallback.style.display = 'none';

            // Centered 360° turntable (Phase D v5 2026-05-17). Previous keyframes
            // shifted px/py/pz dramatically (0.8 right, 0.8 back) which pushed the
            // truck partially off-screen at side angles. Now: pure rotation, the
            // truck stays dead-centered, the eye sees every panel of the rig as
            // it spins. Gentle py "breathing" only — no horizontal drift.
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                const contents = gsap.utils.toArray('.showcase-content');
                const state = { ...SLAT_HOME };
                stateRef.value = state;

                const choreoTL = gsap.timeline({
                    scrollTrigger: {
                        trigger: section,
                        start: 'top top',
                        end: 'bottom bottom',
                        pin: '.showcase-pin',
                        // 0.55 lengthens the "follow-the-scroll" latency — the
                        // truck rotation lerps toward target instead of snapping,
                        // matching lodisna's signature silky feel.
                        scrub: 0.55
                    }
                });
                const EASE = 'power2.inOut';
                const YAW_HOME = -Math.PI / 6;
                // Slat 1 → Slat 2 — rotate 120° to reveal side profile
                choreoTL.to(state, {
                    rx: 0, ry: YAW_HOME + (Math.PI * 2 / 3), rz: 0,
                    px: 0, py: 0.02, pz: 0,
                    duration: 1, ease: EASE
                });
                // Slat 2 → Slat 3 — rotate further 120° to reveal rear-3/4
                choreoTL.to(state, {
                    rx: 0, ry: YAW_HOME + (Math.PI * 4 / 3), rz: 0,
                    px: 0, py: -0.02, pz: 0,
                    duration: 1, ease: EASE
                });
                // Slat 3 → Outro — close the 360° back to the front-3/4 hero pose
                choreoTL.to(state, {
                    rx: 0, ry: YAW_HOME + (Math.PI * 2), rz: 0,
                    px: 0, py: 0, pz: 0,
                    duration: 1, ease: EASE
                });

                // Content swap — independent ScrollTriggers tied to thirds of the section.
                contents.forEach((content, i) => {
                    const start = i / contents.length;
                    const end = (i + 1) / contents.length;

                    ScrollTrigger.create({
                        trigger: section,
                        start: `top+=${start * 100}% top`,
                        end: `top+=${end * 100}% top`,
                        onEnter: () => {
                            contents.forEach(c => c.classList.remove('active'));
                            content.classList.add('active');
                        },
                        onEnterBack: () => {
                            contents.forEach(c => c.classList.remove('active'));
                            content.classList.add('active');
                        }
                    });
                });
            }
        });

        // Pause rendering when #showcase is off-screen (saves GPU + battery).
        let showcaseRafActive = true;
        const showcaseVisIO = new IntersectionObserver(
            ([e]) => { showcaseRafActive = e.isIntersecting; },
            { rootMargin: '200px' }
        );
        showcaseVisIO.observe(section);

        function tick() {
            if (!showcaseRafActive) { requestAnimationFrame(tick); return; }
            currentYaw += (targetYaw - currentYaw) * 0.08;
            currentPitch += (targetPitch - currentPitch) * 0.08;
            const s = stateRef.value;
            // Compose mouse-parallax (currentYaw/Pitch) on top of scroll-driven
            // rotation. Position is purely scroll-driven (parallax shouldn't move
            // the truck around in space — only tilt it).
            truckGroup.rotation.x = s.rx + currentPitch;
            truckGroup.rotation.y = s.ry + currentYaw;
            truckGroup.rotation.z = s.rz;
            truckGroup.position.set(s.px, s.py, s.pz);
            renderer.render(scene, camera);
            requestAnimationFrame(tick);
        }
        tick();
    }
}

/**
 * initPillarIcons — 2026-05-17 v4: SVG draw-on reveal.
 *
 * Replaces the previous Three.js GLB-per-icon scenes (~110 lines + 3 Three.js
 * contexts + ~7 MB GLB loads) with vector-clean SVG icons that draw themselves
 * via stroke-dashoffset as #vision scrolls into view. ~20 lines, zero new deps,
 * zero asset weight, retina-sharp.
 *
 * The icons (network / partnership / north-star) are inlined in index.html so
 * we can target their <path>/<circle> elements directly from JS.
 */
function initPillarIcons() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const svgs = Array.from(document.querySelectorAll('.pillar-icon-svg'));
    if (!svgs.length) return;

    svgs.forEach((svg, cardIndex) => {
        const drawables = Array.from(svg.querySelectorAll('path, circle'));
        // Compute total stroke path length for each shape, set initial dash state.
        drawables.forEach((el) => {
            const len = (typeof el.getTotalLength === 'function') ? el.getTotalLength() : 200;
            el.style.strokeDasharray = len;
            el.style.strokeDashoffset = len;
        });
        // Stagger draw-on per element as #vision crosses the viewport. Each
        // element's dashoffset eases from `len` → 0 as scroll progresses.
        gsap.to(drawables, {
            strokeDashoffset: 0,
            ease: 'none',
            stagger: 0.04,
            scrollTrigger: {
                trigger: '#vision',
                start: 'top 75%',
                end: 'top 30%',
                scrub: 0.6
            },
            delay: cardIndex * 0.08
        });
    });
}

/* initFtlCardReveal retired 2026-05-16 — the FTL Showroom Card was replaced
   by the 3-block pinned Showcase. Reveal logic lives inside initShowcase(). */

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

/**
 * initLenisSmoothScroll — page-wide buttery momentum scrolling.
 * Synced with GSAP's ticker so ScrollTrigger updates land in the same frame.
 * Skipped under prefers-reduced-motion (the browser's native scroll is used).
 * Exposes window.__vortwayLenis so the quote modal can stop/start it.
 */
function initLenisSmoothScroll() {
    if (!VW_DESKTOP) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof Lenis === 'undefined') return;

    // Lerp mode delivers lodisna's "weightless follow" feel: every frame the
    // scroll position moves 8% of the remaining distance toward the input
    // target. Lower wheelMultiplier prevents accidental fast jumps.
    const lenis = new Lenis({
        // 2026-05-17 v4: duration-mode with cubic ease-out. Constant-per-frame
        // lerp produces a linear "follow" — duration-mode delivers the elastic
        // exit tail (lodisna's signature). 1.35s with 1-(1-t)^3.6 = strong
        // initial momentum that bleeds out gradually.
        duration: 1.35,
        easing: (t) => 1 - Math.pow(1 - t, 3.6),
        smoothWheel: true,
        wheelMultiplier: 0.92,
        touchMultiplier: 1.2
    });

    // Hook into GSAP's ticker once both libs are present
    const wireGsap = () => {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return false;
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        return true;
    };
    if (!wireGsap()) {
        // GSAP may load slightly later (defer order) — poll briefly
        let tries = 0;
        const t = setInterval(() => {
            if (wireGsap() || ++tries > 40) clearInterval(t);
        }, 50);
        // Fallback: run Lenis on its own RAF until GSAP attaches
        function fallbackTick(time) {
            lenis.raf(time);
            if (typeof gsap === 'undefined') requestAnimationFrame(fallbackTick);
        }
        requestAnimationFrame(fallbackTick);
    }

    window.__vortwayLenis = lenis;
}

/**
 * initHeroCursorGlow — large soft gold halo that follows the cursor across the hero.
 * Position is updated via CSS custom properties; element is fixed-positioned inside .hero.
 * Disabled on coarse pointers and reduced-motion.
 */
function initHeroCursorGlow() {
    const glow = document.getElementById('heroCursorGlow');
    if (!glow) return;
    if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) {
        glow.style.display = 'none';
        return;
    }

    const hero = document.getElementById('hero');
    if (!hero) return;

    let mx = -400, my = -400;
    let pending = false;
    const apply = () => {
        glow.style.setProperty('--gx', mx + 'px');
        glow.style.setProperty('--gy', my + 'px');
        pending = false;
    };

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mx = e.clientX - rect.left;
        my = e.clientY - rect.top;
        if (pending) return;
        pending = true;
        requestAnimationFrame(apply);
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
        mx = -400; my = -400;
        requestAnimationFrame(apply);
    });
}

/**
 * initSplitTextReveals — cinematic letter-by-letter reveals on section titles.
 * Falls back to whole-word fade if SplitText isn't available.
 * Skipped under prefers-reduced-motion.
 */
function initSplitTextReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Phase D: include .showcase-title — the 3 pinned showcase headlines now get
    // the same cinematic per-character reveal that .section-title already has.
    const titles = document.querySelectorAll('.section-title, .showcase-title');
    if (!titles.length) return;

    // Wait for webfonts so SplitText measures glyph widths correctly.
    const ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    ready.then(() => splitAndAnimate(titles));
}

function splitAndAnimate(titles) {
    titles.forEach((title) => {
        const isHero = title.classList.contains('hero-title');

        let chars;
        if (typeof SplitText !== 'undefined') {
            try {
                const split = new SplitText(title, { type: 'chars,words' });
                chars = split.chars;
            } catch (_) { /* fallthrough */ }
        }

        if (!chars) {
            // Fallback: simple fade-up reveal on the whole title
            gsap.from(title, {
                opacity: 0, y: 30, duration: 0.8, ease: 'power3.out',
                scrollTrigger: isHero
                    ? undefined
                    : { trigger: title, start: 'top 85%', toggleActions: 'play none none none' }
            });
            return;
        }

        if (isHero) {
            // Hero VORTWAY — cinematic per-character entry tied to preloader exit.
            // Plays once on load (no scroll-trigger) so the wordmark is the first thing
            // the visitor sees materialize as the preloader dissolves.
            gsap.set(chars, { opacity: 0, y: 80, rotateX: -60, transformOrigin: '50% 50% -30px' });
            gsap.to(chars, {
                opacity: 1, y: 0, rotateX: 0,
                stagger: 0.06, duration: 1.0, ease: 'expo.out',
                delay: 0.8  // wait for preloader to start dissolving
            });
            return;
        }

        // 2026-05-18 v4 Awwwards upgrade: scrub-driven clip-path mask reveal.
        // Chars are "uncovered" from below as the section enters viewport instead
        // of one-shot fading up. Matches the .pillar-card mask reveal so the
        // whole site speaks one motion language. The chars stay fully opaque —
        // it's the clip-path that does the entire reveal.
        gsap.set(chars, { opacity: 1, y: 0, clipPath: 'inset(0 0 100% 0)' });
        gsap.to(chars, {
            clipPath: 'inset(0 0 0% 0)',
            ease: 'none',
            stagger: 0.025,
            scrollTrigger: {
                trigger: title,
                start: 'top 88%',
                end: 'top 52%',
                scrub: 0.65
            }
        });
    });
}

/**
 * initStatsFlash — after the stats counter finishes, fire a brief gold shimmer.
 * The shimmer is driven by CSS animation; we just toggle a class.
 */
function initStatsFlash() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const statsSection = document.getElementById('stats');
    if (!statsSection || typeof ScrollTrigger === 'undefined') return;
    ScrollTrigger.create({
        trigger: '#stats',
        start: 'top 75%',
        once: true,
        onEnter: () => {
            // Delay matches the GSAP counter duration (~2s)
            setTimeout(() => {
                document.querySelectorAll('.stat-number').forEach((el, i) => {
                    setTimeout(() => {
                        el.classList.add('stat-flash');
                        setTimeout(() => el.classList.remove('stat-flash'), 900);
                    }, i * 120);
                });
            }, 2050);
        }
    });
}

/**
 * initCursorSpotlight — 2026-05-18 v4: orange glow follows the cursor on
 * dark-surface sections (.contact-info, .standard-card). A single fixed
 * div renders a radial-gradient via CSS custom properties --cx/--cy.
 *
 * Activation: opacity 0 by default; CSS gates visibility to hover state of
 * the dark panels via `:has()` so the glow only appears on graphite surfaces.
 *
 * Gates: desktop only, prefers-reduced-motion off, fine pointer.
 */
function initCursorSpotlight() {
    if (window.matchMedia('(max-width: 1024px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches) {
        return;
    }
    if (document.getElementById('cursorSpotlight')) return;
    const el = document.createElement('div');
    el.id = 'cursorSpotlight';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    let rafPending = false;
    let lastX = 0, lastY = 0;
    const onMove = (ev) => {
        lastX = ev.clientX;
        lastY = ev.clientY;
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            el.style.setProperty('--cx', lastX + 'px');
            el.style.setProperty('--cy', lastY + 'px');
            rafPending = false;
        });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
}


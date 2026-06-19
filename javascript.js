
// ==========================================================================
// 1. CONFIGURACIÓN DEL MOTOR GRÁFICO DEL ESPACIO (CANVAS STARFIELD - HERO ONLY)
// ==========================================================================
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
const heroSection = document.querySelector('.hero');

let stars = [];
let nebulas = [];
const numStars = 120; 
let isHeroVisible = true;

let shootingStar = {
    x: 0, y: 0, dx: 0, dy: 0,
    length: 0, speed: 0,
    active: false, opacity: 0
};

let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
let scroll = { current: 0, target: 0, speed: 0 };

// OPTIMIZACIÓN: Constante precalculada para evitar multiplicar en cada frame
const TWO_PI = Math.PI * 2;

function resizeCanvas() {
    if (!heroSection) return;
    
    // OPTIMIZACIÓN: Forzado de Pixel Ratio controlado para evitar lag en pantallas densas
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = window.innerWidth;
    const height = heroSection.offsetHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr; 
    
    ctx.scale(dpr, dpr);

    if (width < 768) {
        isHeroVisible = false;
        canvas.style.display = 'none';
    } else {
        isHeroVisible = true;
        canvas.style.display = 'block';
        initSpace(width, height);
    }
}

function initSpace(width, height) {
    if (width === 0 || height === 0) return;

    stars = [];
    for(let i = 0; i < numStars; i++) {
        const isLucero = Math.random() < 0.08; 

        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: isLucero ? Math.random() * 1.5 + 2.5 : Math.random() * 1.4 + 0.3, 
            baseOpacity: isLucero ? Math.random() * 0.4 + 0.6 : Math.random() * 0.6 + 0.4, 
            opacity: Math.random() * 0.6,
            speed: isLucero ? Math.random() * 0.008 + 0.003 : Math.random() * 0.01 + 0.004, 
            factor: Math.random() > 0.5 ? 1 : -1,
            isLucero: isLucero 
        });
    }

    const baseScale = Math.max(width, height);
    nebulas = [
        { x: width * 0.2, y: height * 0.3, vx: 0.22, vy: 0.14, radius: baseScale * 0.75, hue: 270, hueSpeed: 0.15, maxOpacity: 0.18 },
        { x: width * 0.8, y: height * 0.7, vx: -0.18, vy: 0.11, radius: baseScale * 0.85, hue: 210, hueSpeed: 0.12, maxOpacity: 0.15 },
        { x: width * 0.5, y: height * 0.4, vx: 0.13, vy: -0.18, radius: baseScale * 0.55, hue: 330, hueSpeed: 0.20, maxOpacity: 0.13 }
    ];
}

function drawSpace() {
    if (!isHeroVisible || canvas.width === 0 || canvas.height === 0) {
        requestAnimationFrame(drawSpace);
        return;
    }

    // Cache de dimensiones lógicas del viewport
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;
    
    const lastScrollCurrent = scroll.current;
    scroll.current += (scroll.target - scroll.current) * 0.1;
    scroll.speed = Math.abs(scroll.current - lastScrollCurrent); 

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';
    
    const nebulaScrollY = scroll.current * 0.04; 

    // RENDER DE NEBULOSAS
    nebulas.forEach(nebula => {
        nebula.x += nebula.vx; nebula.y += nebula.vy;
        if (nebula.x < -nebula.radius/3 || nebula.x > w + nebula.radius/3) nebula.vx *= -1;
        if (nebula.y < -nebula.radius/3 || nebula.y > h + nebula.radius/3) nebula.vy *= -1;
        nebula.hue = (nebula.hue + nebula.hueSpeed) % 360;

        let gradient = ctx.createRadialGradient(nebula.x, nebula.y - nebulaScrollY, 0, nebula.x, nebula.y - nebulaScrollY, nebula.radius);
        gradient.addColorStop(0, `hsla(${nebula.hue}, 85%, 60%, ${nebula.maxOpacity})`);
        gradient.addColorStop(0.3, `hsla(${nebula.hue}, 80%, 55%, ${nebula.maxOpacity * 0.4})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient; 
        ctx.fillRect(0, 0, w, h);
    });

    // RENDER DE ESTRELLA FUGAZ
    if (shootingStar.active) {
        shootingStar.x += shootingStar.dx; shootingStar.y += shootingStar.dy;
        shootingStar.opacity -= 0.02;
        if (shootingStar.opacity <= 0 || shootingStar.x > w || shootingStar.y > h) {
            shootingStar.active = false;
        } else {
            ctx.beginPath();
            let travelX = shootingStar.dx * (shootingStar.length / shootingStar.speed);
            let travelY = shootingStar.dy * (shootingStar.length / shootingStar.speed);
            let starGrad = ctx.createLinearGradient(
                shootingStar.x, shootingStar.y, 
                shootingStar.x - travelX, 
                shootingStar.y - travelY
            );
            starGrad.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
            starGrad.addColorStop(0.2, `rgba(176, 130, 199, ${shootingStar.opacity * 0.6})`);
            starGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.strokeStyle = starGrad; ctx.lineWidth = 2;
            ctx.moveTo(shootingStar.x, shootingStar.y);
            ctx.lineTo(shootingStar.x - travelX, shootingStar.y - travelY);
            ctx.stroke();
        }
    }

    // ==========================================================================
    // RENDER OPTIMIZADO DEL POLVO DE ESTRELLAS (FASE 1: ESTRELLAS COMUNES)
    // ==========================================================================
    ctx.beginPath();
    stars.forEach(star => {
        star.opacity += star.speed * star.factor;
        if(star.opacity >= star.baseOpacity || star.opacity <= 0.05) star.factor *= -1;

        // Saltamos los luceros para procesarlos de forma aislada en la fase 2
        if (star.isLucero) return;

        let starY = star.y; 
        let starX = star.x;

        const dx = mouse.x - starX; 
        const dy = mouse.y - starY;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < 48400) { // 220 * 220 = 48400
            const distance = Math.sqrt(distSq);
            if (distance > 0) {
                const force = (220 - distance) / 220;
                starX -= (dx / distance) * force * 28; 
                starY -= (dy / distance) * force * 28;
            }
        }

        ctx.moveTo(starX + star.radius, starY);
        ctx.arc(starX, starY, star.radius, 0, TWO_PI);
    });
    
    ctx.fillStyle = 'rgba(245, 245, 255, 0.55)'; 
    ctx.fill();

    // ==========================================================================
    // RENDER OPTIMIZADO DEL POLVO DE ESTRELLAS (FASE 2: LUCEROS CON GLOW)
    // ==========================================================================
    stars.forEach(star => {
        if (!star.isLucero) return;

        let starY = star.y; 
        let starX = star.x;

        const dx = mouse.x - starX; 
        const dy = mouse.y - starY;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < 48400) { 
            const distance = Math.sqrt(distSq);
            if (distance > 0) {
                const force = (220 - distance) / 220;
                starX -= (dx / distance) * force * 28; 
                starY -= (dy / distance) * force * 28;
            }
        }

        ctx.save(); 
        ctx.shadowBlur = star.radius * 35; 
        ctx.shadowColor = `rgba(186, 140, 255, ${star.opacity < 0.35 ? 0.35 : star.opacity})`; 
        
        let glowGrad = ctx.createRadialGradient(starX, starY, 0, starX, starY, star.radius * 6);
        glowGrad.addColorStop(0, `rgba(255, 255, 255, ${star.opacity < 0.2 ? 0.2 : star.opacity})`);
        glowGrad.addColorStop(0.3, `rgba(160, 100, 255, ${star.opacity * 0.36})`);
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(starX, starY, star.radius * 3, 0, TWO_PI);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        ctx.shadowBlur = 0; 
        ctx.beginPath();
        ctx.arc(starX, starY, star.radius, 0, TWO_PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity < 0.4 ? 0.4 : star.opacity})`;
        ctx.fill();
        ctx.restore(); 
    });

    requestAnimationFrame(drawSpace);
}

function launchShootingStar() {
    if (shootingStar.active || !isHeroVisible) return; 
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    
    shootingStar.x = Math.random() * w * 0.7;
    shootingStar.y = Math.random() * h * 0.4;
    shootingStar.speed = Math.random() * 15 + 15; 
    shootingStar.length = Math.random() * 80 + 60; 
    const angle = Math.PI / 4 + (Math.random() * 0.2 - 0.1); 
    shootingStar.dx = Math.cos(angle) * shootingStar.speed;
    shootingStar.dy = Math.sin(angle) * shootingStar.speed;
    shootingStar.opacity = 1;
    shootingStar.active = true;
}

function setupShootingStarTimer() {
    const randomTime = Math.random() * 5000 + 4000;
    setTimeout(() => {
        launchShootingStar();
        setupShootingStarTimer();
    }, randomTime);
}

// OPTIMIZACIÓN: Throttling del evento scroll con rAF para evitar saltos en pantallas grandes
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
        window.requestAnimationFrame(() => {
            scroll.target = window.scrollY;
            scrollTimeout = false;
        });
        scrollTimeout = true;
    }
}, { passive: true });

window.addEventListener('resize', resizeCanvas);

if (heroSection) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isHeroVisible = entry.isIntersecting;
        });
    }, { threshold: 0.05 });
    observer.observe(heroSection);
}

// ==========================================================================
// 2. INTERACCIONES DE INTERFAZ Y ENGINE DE ANIMACIÓN (GSAP)
// ==========================================================================
gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(false);

document.addEventListener("DOMContentLoaded", () => {
    resizeCanvas();
    drawSpace();
    setupShootingStarTimer();

    const introTl = gsap.timeline();
    introTl.to('.logo img, .nav-center a, .header-btn', { opacity: 1, duration: 0.8, stagger: 0.04, ease: "power2.out" })
           .to('.hero h1', { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=0.6")
           .to('.hero p', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.7")
           .to('.hero-geometry', { opacity: 1, scale: 1, duration: 1.2, ease: "power4.out" }, "-=0.8");

    gsap.to('.hero-geometry .main-shape', { y: "+=12", rotationY: "+=4", duration: 4.5, ease: "sine.inOut", repeat: -1, yoyo: true });
    gsap.to('.geometry-glow', { scale: 1.15, opacity: 0.4, duration: 3.5, ease: "sine.inOut", repeat: -1, yoyo: true });
    
    gsap.to('.hero-background-galaxy', { 
        rotation: 360,              
        transformOrigin: "50% 65%", 
        duration: 30,               
        repeat: -1,                 
        ease: "none"                
    });

    gsap.to('.hero-background-galaxy', {
        scale: 1.17,                
        transformOrigin: "50% 65%", 
        duration: 8,                
        repeat: -1,                 
        yoyo: true,                 
        ease: "sine.inOut"          
    });
    
    // OPTIMIZACIÓN: force3D activo para renderizar transformaciones vía hardware
    gsap.to('.hero-astronaut', { y: -35, rotation: 4, duration: 5.5, repeat: -1, yoyo: true, ease: "sine.inOut", force3D: true });

    let lastMouseX = 0;

    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;

        const moveX = (e.clientX - window.innerWidth / 2);
        const moveY = (e.clientY - window.innerHeight / 2);
        
        const mouseSpeed = Math.abs(e.clientX - lastMouseX);
        lastMouseX = e.clientX;

        const skewAmount = Math.min(mouseSpeed * 0.15, 8); 
        const hueRotateAmount = Math.min(mouseSpeed * 0.6, 45);

        gsap.to('.hero-geometry .main-shape', {
            x: moveX * 0.018, 
            y: moveY * 0.018, 
            skewX: skewAmount * (moveX > 0 ? 1 : -1),
            filter: `hue-rotate(${hueRotateAmount}deg) drop-shadow(0px 0px 15px rgba(168, 85, 247, 0.4))`,
            duration: 1.3, 
            ease: "power2.out",
            overwrite: "auto"
        });
        
        gsap.to('.hero-geometry .main-shape', { 
            skewX: 0, 
            filter: "hue-rotate(0deg) drop-shadow(0px 0px 0px rgba(0,0,0,0))", 
            duration: 0.8, 
            delay: 0.1, 
            ease: "power1.out", 
            overwrite: "none" 
        });

        gsap.to('.hero-astronaut', {
            x: moveX * 0.045,
            y: moveY * 0.045,
            duration: 1.5,
            ease: "power2.out",
            force3D: true
        });
    }, { passive: true });

    gsap.timeline({ 
        scrollTrigger: { 
            trigger: '.hero', 
            start: 'top top', 
            end: 'bottom top', 
            scrub: 1, 
            invalidateOnRefresh: true 
        } 
    })
    .to('.hero-geometry', { 
        y: -80,         
        scale: 0.85,    
        opacity: 0.4,   
        ease: "none" 
    });

    const portfolioHorizontal = document.querySelector('.portfolio-horizontal');
    
    if (portfolioHorizontal) {
        const horizontalTween = gsap.to(portfolioHorizontal, {
            x: () => -(portfolioHorizontal.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
                trigger: "#portfolio",
                pin: true,
                scrub: 1,
                start: "top top",
                end: () => "+=" + portfolioHorizontal.scrollWidth, 
                invalidateOnRefresh: true
            }
        });

        document.querySelectorAll('.portfolio-item').forEach(item => {
            const screen = item.querySelector('.project-screen');
            const floatPng = item.querySelector('.project-floating-png');
            const glowBg = item.querySelector('.project-glow-bg');

            if (screen) {
                gsap.fromTo(screen, 
                    { rotationY: -18, rotationX: 6 },
                    { 
                        rotationY: 12, rotationX: -4,
                        scrollTrigger: {
                            trigger: item,
                            containerAnimation: horizontalTween,
                            start: "left right",
                            end: "right left",
                            scrub: true
                        }
                    }
                );
            }

            if(floatPng) {
                gsap.fromTo(floatPng,
                    { x: -35, scale: 0.96 },
                    {
                        x: 45, scale: 1.04,
                        scrollTrigger: {
                            trigger: item,
                            containerAnimation: horizontalTween,
                            start: "left right",
                            end: "right left",
                            scrub: true
                        }
                    }
                );
            }

            if(glowBg) {
                gsap.to(glowBg, {
                    y: "+=25", scale: 1.08, duration: 5,
                    repeat: -1, yoyo: true, ease: "sine.inOut"
                });
            }
        });
    }

    const cards = document.querySelectorAll('.cosmic-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        }, { passive: true });
    });
});

// ==========================================================================
// 3. SISTEMA DE CUERDA DE FÍSICA FLUIDA AVANCED (CURVAS CÚBICAS)
// ==========================================================================
const ropePath = document.getElementById('space-rope');
const galaxyContainer = document.querySelector('.hero-geometry'); 
const astronautElement = document.querySelector('.hero-astronaut'); 
const heroEl = document.querySelector('.hero');

let waveTimeline = 0;

function updateRope() {
    // OPTIMIZACIÓN: Si la sección principal no está visible, pausamos cálculos complejos de la cuerda
    if (!ropePath || !galaxyContainer || !astronautElement || !isHeroVisible) {
        requestAnimationFrame(updateRope);
        return;
    }

    const rectGalaxy = galaxyContainer.getBoundingClientRect();
    const rectAstronaut = astronautElement.getBoundingClientRect();
    const rectHero = heroEl.getBoundingClientRect();

    const startX = (rectGalaxy.left + rectGalaxy.width / 2) - rectHero.left;
    const startY = (rectGalaxy.top + rectGalaxy.height * 0.65) - rectHero.top;

    const endX = (rectAstronaut.left + rectAstronaut.width * 0.3) - rectHero.left;
    const endY = (rectAstronaut.top + rectAstronaut.height * 0.4) - rectHero.top;

    waveTimeline += 0.015; 

    const dx = endX - startX;
    const dy = endY - startY;
    
    const wave1X = Math.sin(waveTimeline) * 12; 
    const wave1Y = Math.cos(waveTimeline * 0.8) * 15; 
    
    const wave2X = Math.sin(waveTimeline * 2.2 + 1) * 6; 
    const wave2Y = Math.cos(waveTimeline * 1.9) * 4;

    const currentWaveX = wave1X + wave2X;
    const currentWaveY = wave1Y + wave2Y;

    const control1X = startX + (dx * 0.35) + currentWaveX;
    const control1Y = startY + (dy * 0.35) + 100 + currentWaveY; 

    const control2X = startX + (dx * 0.65) - currentWaveX; 
    const control2Y = startY + (dy * 0.65) - 60 - currentWaveY; 

    ropePath.setAttribute('d', `M ${startX} ${startY} C ${control1X} ${control1Y} ${control2X} ${control2Y}, ${endX} ${endY}`);

    requestAnimationFrame(updateRope);
}

requestAnimationFrame(updateRope);

// ==========================================================================
// 4. MOVIMIENTO DE HUINCHA DE ASTEROIDES (SCROLL TRIGGER HORIZONTAL)
// ==========================================================================
gsap.to('.asteroid-belt-strip', {
    y: "+=15",
    duration: 5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
});
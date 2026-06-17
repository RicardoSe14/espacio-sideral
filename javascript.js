// ==========================================================================
// 1. CONFIGURACIÓN DEL MOTOR GRÁFICO DEL ESPACIO (CANVAS STARFIELD - HERO ONLY)
// ==========================================================================
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
const heroSection = document.querySelector('.hero');

let stars = [];
let nebulas = [];
const numStars = 200; 
let isHeroVisible = true;

let shootingStar = {
    x: 0, y: 0, dx: 0, dy: 0,
    length: 0, speed: 0,
    active: false, opacity: 0
};

let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
let scroll = { current: 0, target: 0, speed: 0 };

function resizeCanvas() {
    if (!heroSection) return;
    canvas.width = window.innerWidth;
    canvas.height = heroSection.offsetHeight; 
    initSpace();
}

function initSpace() {
    if (canvas.width === 0 || canvas.height === 0) return;

    stars = [];
    for(let i = 0; i < numStars; i++) {
        // Un 8% de las estrellas totales se convertirán en Luceros grandes con Aura
        const isLucero = Math.random() < 0.08; 

        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: isLucero ? Math.random() * 1.5 + 2.5 : Math.random() * 1.4 + 0.3, 
            baseOpacity: isLucero ? Math.random() * 0.4 + 0.6 : Math.random() * 0.6 + 0.4, 
            opacity: Math.random() * 0.6,
            speed: isLucero ? Math.random() * 0.008 + 0.003 : Math.random() * 0.01 + 0.004, 
            factor: Math.random() > 0.5 ? 1 : -1,
            isLucero: isLucero 
        });
    }

    const baseScale = Math.max(canvas.width, canvas.height);
    nebulas = [
        { x: canvas.width * 0.2, y: canvas.height * 0.3, vx: 0.22, vy: 0.14, radius: baseScale * 0.75, hue: 270, hueSpeed: 0.15, maxOpacity: 0.18 },
        { x: canvas.width * 0.8, y: canvas.height * 0.7, vx: -0.18, vy: 0.11, radius: baseScale * 0.85, hue: 210, hueSpeed: 0.12, maxOpacity: 0.15 },
        { x: canvas.width * 0.5, y: canvas.height * 0.4, vx: 0.13, vy: -0.18, radius: baseScale * 0.55, hue: 330, hueSpeed: 0.20, maxOpacity: 0.13 }
    ];
}

function drawSpace() {
    if (!isHeroVisible || canvas.width === 0 || canvas.height === 0) {
        requestAnimationFrame(drawSpace);
        return;
    }

    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;
    
    const lastScrollCurrent = scroll.current;
    scroll.current += (scroll.target - scroll.current) * 0.1;
    scroll.speed = Math.abs(scroll.current - lastScrollCurrent); 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'screen';
    
    const nebulaScrollY = scroll.current * 0.04; 

    // RENDER DE NEBULOSAS
    nebulas.forEach(nebula => {
        nebula.x += nebula.vx; nebula.y += nebula.vy;
        if (nebula.x < -nebula.radius/3 || nebula.x > canvas.width + nebula.radius/3) nebula.vx *= -1;
        if (nebula.y < -nebula.radius/3 || nebula.y > canvas.height + nebula.radius/3) nebula.vy *= -1;
        nebula.hue = (nebula.hue + nebula.hueSpeed) % 360;

        let gradient = ctx.createRadialGradient(nebula.x, nebula.y - nebulaScrollY, 0, nebula.x, nebula.y - nebulaScrollY, nebula.radius);
        gradient.addColorStop(0, `hsla(${nebula.hue}, 85%, 60%, ${nebula.maxOpacity})`);
        gradient.addColorStop(0.3, `hsla(${nebula.hue}, 80%, 55%, ${nebula.maxOpacity * 0.4})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    // RENDER DE ESTRELLA FUGAZ
    if (shootingStar.active) {
        shootingStar.x += shootingStar.dx; shootingStar.y += shootingStar.dy;
        shootingStar.opacity -= 0.02;
        if (shootingStar.opacity <= 0 || shootingStar.x > canvas.width || shootingStar.y > canvas.height) {
            shootingStar.active = false;
        } else {
            ctx.beginPath();
            let starGrad = ctx.createLinearGradient(
                shootingStar.x, shootingStar.y, 
                shootingStar.x - shootingStar.dx * (shootingStar.length / shootingStar.speed), 
                shootingStar.y - shootingStar.dy * (shootingStar.length / shootingStar.speed)
            );
            starGrad.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
            starGrad.addColorStop(0.2, `rgba(176, 130, 199, ${shootingStar.opacity * 0.6})`);
            starGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.strokeStyle = starGrad; ctx.lineWidth = 2;
            ctx.moveTo(shootingStar.x, shootingStar.y);
            ctx.lineTo(shootingStar.x - shootingStar.dx * (shootingStar.length / shootingStar.speed), shootingStar.y - shootingStar.dy * (shootingStar.length / shootingStar.speed));
            ctx.stroke();
        }
    }

    // RENDER DEL POLVO DE ESTRELLAS Y LUCEROS
    stars.forEach(star => {
        star.opacity += star.speed * star.factor;
        if(star.opacity >= star.baseOpacity || star.opacity <= 0.05) star.factor *= -1;

        let starY = star.y; 
        let starX = star.x;

        const dx = mouse.x - starX; const dy = mouse.y - starY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 220) {
            const force = (220 - distance) / 220;
            starX -= (dx / distance) * force * 28; starY -= (dy / distance) * force * 28;
        }

        // Se eliminó la deformación estirada por scroll para mantener forma esférica pura
if (star.isLucero) {
            // --- NUEVO: RENDER DE LUCERO CON MÁS AURA TODAVÍA ---
            ctx.save(); // Aislamos los estilos para que el aura no afecte a las estrellas comunes
            
            // 1. MODIFICADO: Aumentamos radicalmente el radio del Aura.
            // Original: star.radius * 15. Nuevo: star.radius * 35.
            ctx.shadowBlur = star.radius * 35; // Aura súper expansiva
            
            // 2. MODIFICADO: Hacemos el color del aura más intenso y presente.
            // Subimos la opacidad mínima de 0.1 a 0.35 para que el resplandor sea muy visible.
            ctx.shadowColor = `rgba(186, 140, 255, ${Math.max(0.35, star.opacity)})`; 
            
            // 3. MODIFICADO: Gradiente interno más suave y grande.
            // Expandimos el gradiente radial de star.radius * 3 a star.radius * 6.
            let glowGrad = ctx.createRadialGradient(starX, starY, 0, starX, starY, star.radius * 6);
            glowGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.max(0.2, star.opacity)})`);
            glowGrad.addColorStop(0.3, `rgba(160, 100, 255, ${Math.max(0.1, star.opacity * 0.6)})`);
            glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            // Pintamos el área del destello base que proyectará la sombra/aura.
            ctx.beginPath();
            // Original: star.radius * 2. Nuevo: star.radius * 3.
            ctx.arc(starX, starY, star.radius * 3, 0, Math.PI * 2);
            ctx.fillStyle = glowGrad;
            ctx.fill();

            // 4. Apagamos la sombra temporalmente para dibujar el núcleo blanco puro y denso.
            ctx.shadowBlur = 0; 
            ctx.beginPath();
            ctx.arc(starX, starY, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.4, star.opacity)})`;
            ctx.fill();
            
            ctx.restore(); // Devolvemos el lienzo a su estado normal para el siguiente ciclo
        } else {
            ctx.beginPath();
            ctx.arc(starX, starY, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(245, 245, 255, ${Math.max(0.1, star.opacity)})`; 
            ctx.fill();
        }
    });

    requestAnimationFrame(drawSpace);
}

function launchShootingStar() {
    if (shootingStar.active || !isHeroVisible) return; 
    shootingStar.x = Math.random() * canvas.width * 0.7;
    shootingStar.y = Math.random() * canvas.height * 0.4;
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

window.addEventListener('scroll', () => {
    scroll.target = window.scrollY;
}, { passive: true });

window.addEventListener('resize', resizeCanvas);

// IntersectionObserver para congelar el motor si salimos del Hero
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
    // Inicialización del motor stelar una sola vez en el DOM
    resizeCanvas();
    drawSpace();
    setupShootingStarTimer();

    // --- TIMELINE DE INTRODUCCIÓN (ENTRY ANIMATION) ---
    const introTl = gsap.timeline();
    introTl.to('.logo img, .nav-center a, .header-btn', { opacity: 1, duration: 0.8, stagger: 0.04, ease: "power2.out" })
           .to('.hero h1', { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=0.6")
           .to('.hero p', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.7")
           .to('.hero-geometry', { opacity: 1, scale: 1, duration: 1.2, ease: "power4.out" }, "-=0.8");

    // --- ANIMACIONES FLOTANTES CONTINUAS ---
    gsap.to('.hero-geometry .main-shape', { y: "+=12", rotationY: "+=4", duration: 4.5, ease: "sine.inOut", repeat: -1, yoyo: true });
    gsap.to('.geometry-glow', { scale: 1.15, opacity: 0.4, duration: 3.5, ease: "sine.inOut", repeat: -1, yoyo: true });
    
    // Rotación infinita y constante de la galaxia de fondo
    gsap.to('.hero-background-galaxy', { 
        rotation: 360,              
        transformOrigin: "50% 65%", 
        duration: 30,               
        repeat: -1,                 
        ease: "none"                
    });

    // Efecto respiración de la galaxia (Expansión y contracción sutil)
    gsap.to('.hero-background-galaxy', {
        scale: 1.17,                
        transformOrigin: "50% 65%", 
        duration: 8,                
        repeat: -1,                 
        yoyo: true,                 
        ease: "sine.inOut"          
    });
    
    // Flotación del astronauta en ingravidez
    gsap.to('.hero-astronaut', { y: -35, rotation: 4, duration: 5.5, repeat: -1, yoyo: true, ease: "sine.inOut" });

    // --- EVENTO INTEGRADO MOUSEMOVE (PARALAJE PROFUNDO) ---
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

        // Capa Media: El Logo Central
        gsap.to('.hero-geometry .main-shape', {
            x: moveX * 0.018, 
            y: moveY * 0.018, 
            skewX: skewAmount * (moveX > 0 ? 1 : -1),
            filter: `hue-rotate(${hueRotateAmount}deg) drop-shadow(0px 0px 15px rgba(168, 85, 247, 0.4))`,
            duration: 1.3, 
            ease: "power2.out",
            overwrite: "auto"
        });
        
        // Retorno elástico del Logo
        gsap.to('.hero-geometry .main-shape', { 
            skewX: 0, 
            filter: "hue-rotate(0deg) drop-shadow(0px 0px 0px rgba(0,0,0,0))", 
            duration: 0.8, 
            delay: 0.1, 
            ease: "power1.out", 
            overwrite: "none" 
        });

        // Capa Cercana: El Astronauta
        gsap.to('.hero-astronaut', {
            x: moveX * 0.045,
            y: moveY * 0.045,
            duration: 1.5,
            ease: "power2.out"
        });
    });

    // --- ANIMACIONES BASADAS EN SCROLL (SCROLLTRIGGER HERO) ---
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

    // --- SECCIÓN PORTFOLIO HORIZONTAL SINCRO ---
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

    // --- EFECTO SPOTLIGHT INTERACTIVO EN TARJETAS ---
    const cards = document.querySelectorAll('.cosmic-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });
});

// ==========================================================================
// 3. SISTEMA DE CUERDA DE FÍSICA FLUIDA AVANZADA (CURVAS CÚBICAS)
// ==========================================================================
const ropePath = document.getElementById('space-rope');
const galaxyContainer = document.querySelector('.hero-geometry'); 
const astronautElement = document.querySelector('.hero-astronaut'); 

let waveTimeline = 0;

function updateRope() {
    if (!ropePath || !galaxyContainer || !astronautElement) return;

    const rectGalaxy = galaxyContainer.getBoundingClientRect();
    const rectAstronaut = astronautElement.getBoundingClientRect();
    const rectHero = document.querySelector('.hero').getBoundingClientRect();

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

    const dAttribute = `M ${startX} ${startY} C ${control1X} ${control1Y} ${control2X} ${control2Y}, ${endX} ${endY}`;
    ropePath.setAttribute('d', dAttribute);

    requestAnimationFrame(updateRope);
}

// Activa el bucle de la física de la cuerda
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

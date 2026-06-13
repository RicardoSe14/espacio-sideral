
// ==========================================================================
// 1. CONFIGURACIÓN DEL MOTOR GRÁFICO DEL ESPACIO (CANVAS STARFIELD)
// ==========================================================================
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let stars = [];
let nebulas = [];
const numStars = 250; 

let shootingStar = {
    x: 0, y: 0, dx: 0, dy: 0,
    length: 0, speed: 0,
    active: false, opacity: 0
};

let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
let scroll = { current: 0, target: 0, speed: 0 };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initSpace();
}

function initSpace() {
    if (canvas.width === 0 || canvas.height === 0) return;

    stars = [];
    for(let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.4 + 0.3, 
            baseOpacity: Math.random() * 0.6 + 0.4, 
            opacity: Math.random() * 0.6,
            speed: Math.random() * 0.01 + 0.004, 
            factor: Math.random() > 0.5 ? 1 : -1
        });
    }

    const baseScale = Math.max(canvas.width, canvas.height);
    nebulas = [
        { x: canvas.width * 0.2, y: canvas.height * 0.3, vx: 0.22, vy: 0.14, radius: baseScale * 0.75, hue: 270, hueSpeed: 0.15, maxOpacity: 0.18 },
        { x: canvas.width * 0.8, y: canvas.height * 0.7, vx: -0.18, vy: 0.11, radius: baseScale * 0.85, hue: 210, hueSpeed: 0.12, maxOpacity: 0.15 },
        { x: canvas.width * 0.5, y: canvas.height * 0.4, vx: 0.13, vy: -0.18, radius: baseScale * 0.55, hue: 330, hueSpeed: 0.20, maxOpacity: 0.13 }
    ];
}

function launchShootingStar() {
    if (shootingStar.active) return;
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

function drawSpace() {
    if (canvas.width === 0 || canvas.height === 0) {
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
    
    const nebulaScrollY = (scroll.current * 0.08) % canvas.height;

    // RENDER DE NEBULOSAS DEL CANVAS
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

    // RENDER DEL POLVO DE ESTRELLAS
    stars.forEach(star => {
        star.opacity += star.speed * star.factor;
        if(star.opacity >= star.baseOpacity || star.opacity <= 0.1) star.factor *= -1;

        let starY = (star.y - (scroll.current * 0.05)) % canvas.height;
        if (starY < 0) starY += canvas.height;
        let starX = star.x;

        const dx = mouse.x - starX; const dy = mouse.y - starY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 220) {
            const force = (220 - distance) / 220;
            starX -= (dx / distance) * force * 28; starY -= (dy / distance) * force * 28;
        }

        ctx.beginPath();
        if (scroll.speed > 1.5) {
            const stretch = scroll.speed * 0.65;
            ctx.moveTo(starX, starY); ctx.lineTo(starX, starY - stretch);
            ctx.strokeStyle = `rgba(240, 245, 255, ${Math.max(0.1, star.opacity)})`;
            ctx.lineWidth = star.radius * 1.2; ctx.stroke();
        } else {
            ctx.arc(starX, starY, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(245, 245, 255, ${Math.max(0.1, star.opacity)})`; ctx.fill();
        }
    });

    requestAnimationFrame(drawSpace);
}

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);

// ==========================================================================
// 2. INTERACCIONES DE INTERFAZ Y ENGINE DE ANIMACIÓN (GSAP)
// ==========================================================================
gsap.registerPlugin(ScrollTrigger);
// Desactiva el suavizado por lag para animaciones infinitas de fondo
gsap.ticker.lagSmoothing(false);

document.addEventListener("DOMContentLoaded", () => {
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
    
    // Rotación ultra lenta y constante de la galaxia de fondo
    gsap.to('.hero-background-galaxy', { rotation: 360, duration: 240, repeat: -1, ease: "none" });
    
    // Flotación del astronauta en ingravidez
    gsap.to('.hero-astronaut', { y: -35, rotation: 4, duration: 5.5, repeat: -1, yoyo: true, ease: "sine.inOut" });


    // --- EVENTO INTEGRADO MOUSEMOVE (PARALAJE PROFUNDO SIN CONFLICTOS) ---
    let lastMouseX = 0;

    window.addEventListener('mousemove', (e) => {
        // Variables para el Canvas global
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;

        // Coordenadas calculadas desde el centro de la pantalla
        const moveX = (e.clientX - window.innerWidth / 2);
        const moveY = (e.clientY - window.innerHeight / 2);
        
        // Cálculo de velocidad del mouse para efectos reactivos en el logo
        const mouseSpeed = Math.abs(e.clientX - lastMouseX);
        lastMouseX = e.clientX;

        const skewAmount = Math.min(mouseSpeed * 0.15, 8); 
        const hueRotateAmount = Math.min(mouseSpeed * 0.6, 45);

        // 1. Capa Lejana (La Galaxia del Fondo - se mueve inversamente y muy lento)
// 1. ROTACIÓN INFINITA Y CONSTANTE (Se mantiene exactamente como te gustó)
gsap.to('.hero-background-galaxy', { 
    rotation: 360,              
    transformOrigin: "50% 65%", 
    duration: 30,              
    repeat: -1,                 
    ease: "none"                
});

// 2. EFECTO DE RESPIRACIÓN (Expansión y contracción sutil)
gsap.to('.hero-background-galaxy', {
    scale: 1.17,                // Se expande un 8% (sutil pero perceptible)
    transformOrigin: "50% 65%", // Usamos el mismo eje para que expanda desde el centro del remolino
    duration: 8,                // Tiempo que tarda en "respirar" (ajustable)
    repeat: -1,                 // Infinito
    yoyo: true,                 // Hace el efecto de ida y vuelta (achicarse y agrandarse)
    ease: "sine.inOut"          // Suave al arrancar y suave al frenar la respiración
});

        // 2. Capa Media (El Logo Central - Reactivo con inclinación e iluminación)
        gsap.to('.hero-geometry .main-shape', {
            x: moveX * 0.018, 
            y: moveY * 0.018, 
            skewX: skewAmount * (moveX > 0 ? 1 : -1),
            filter: `hue-rotate(${hueRotateAmount}deg) drop-shadow(0px 0px 15px rgba(168, 85, 247, 0.4))`,
            duration: 1.3, 
            ease: "power2.out",
            overwrite: "auto"
        });
        
        // Retorno elástico del Logo a su estado natural tras detener el mouse
        gsap.to('.hero-geometry .main-shape', { 
            skewX: 0, 
            filter: "hue-rotate(0deg) drop-shadow(0px 0px 0px rgba(0,0,0,0))", 
            duration: 0.8, 
            delay: 0.1, 
            ease: "power1.out", 
            overwrite: "none" 
        });

        // 3. Capa Cercana (El Astronauta - Se desplaza más rápido acentuando el 3D)
        gsap.to('.hero-astronaut', {
            x: moveX * 0.045,
            y: moveY * 0.045,
            duration: 1.5,
            ease: "power2.out"
        });
    });


    // --- ANIMACIONES BASADAS EN SCROLL (SCROLLTRIGGER) ---
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom center', scrub: 1, invalidateOnRefresh: true } })
        .to('.hero-geometry', { y: 120, scale: 0.7, opacity: 0, ease: "none" });

    gsap.from('.cosmic-card', {
        scrollTrigger: { trigger: '.services', start: 'top 75%', toggleActions: 'play none none reverse' },
        opacity: 0, y: 50, duration: 1, stagger: 0.15, ease: "power3.out"
    });


    // ==========================================================================
    // 3. SECCIÓN PORTFOLIO SINCRO: CONFIGURACIÓN SCROLLTRIGGER HORIZONTAL
    // ==========================================================================
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

        // EFECTOS PARALLAX ASÍNCRONOS DENTRO DEL CONTENEDOR HORIZONTAL
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

    // --- EFECTO SPOTLIGHT INTERACTIVO PARA TARJETAS ---
    const cards = document.querySelectorAll('.cosmic-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });
});

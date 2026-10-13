// Navegación fluida del menú vinculada a la línea de tiempo de GSAP
document.querySelectorAll('.nav-center a').forEach(enlace => {
    enlace.addEventListener('click', function(e) {
        e.preventDefault(); // Evita el salto brusco del navegador
        
        const targetId = this.getAttribute('href').replace('#', '');
        
        // Mapeamos los IDs de tus enlaces con las "etiquetas" (labels) creadas en el timeline de GSAP
        const labelMap = {
            'services': 'services-container',
            'portfolio': 'project-0', // Te lleva al inicio de los proyectos
            'contact': 'contacto'
        };
        
        const targetLabel = labelMap[targetId];
        const scrollTriggerInstance = ScrollTrigger.getById("mainScroll");
        
        if (scrollTriggerInstance && scrollTriggerInstance.animation && targetLabel) {
            const timeline = scrollTriggerInstance.animation;
            // Calcula el progreso en la línea de tiempo donde está la etiqueta
            const labelProgress = timeline.labels[targetLabel] / timeline.totalDuration();
            // Calcula los pixeles exactos de scroll que corresponden a ese progreso
            const targetScroll = scrollTriggerInstance.start + (scrollTriggerInstance.end - scrollTriggerInstance.start) * labelProgress;
            
            // Realiza la animación suave hacia esa sección
            gsap.to(window, { scrollTo: targetScroll, duration: 1.5, ease: "power3.out" });
        }
    });
});





let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
        let scroll = { current: 0, target: 0, speed: 0 };
        
        // OPTIMIZACIÓN: Variable para controlar la ejecución del Canvas secundario
        let isAlternateCanvasVisible = false;

        const projectsData = [
            {
                tag: "CASOS DE ÉXITO • 01",
                title: "Codipan",
                desc: "Diseño web y UX/UI, implementación de catalogos de productos y desarrollo de marca.",
                link: "https://www.codipan.cl/"
            },
            {
                tag: "DISEÑO WEB • 02",
                title: "Portal Bioma",
                desc: "Directorio local consciente con arquitectura responsiva moderna. Integración completa de mapas interactivos de Valdivia",
                link: "https://ricardose14.github.io/Biomapp-"
            },
            {
                tag: "E-COMMERCE • 03",
                title: "Animall Store",
                desc: "Logística y pasarelas de pago integradas con calculadoras dinámicas y un sistema fluido de envíos automatizados.",
                link: "https://animallstore.cl/"
            },
            {
                tag: "AGILE METHOD • 04",
                title: "Ambiental",
                desc: "Implementación de metodologías ágiles en el desarrollo de web y creación de sitio.",
                link: "https://ambientalltda.cl/"
            }
        ];

        let currentAngleOffset = Math.PI; 
        let lastFocusedIndex = -1;
        let orbitExpansionFactor = 0; 

        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
        gsap.ticker.lagSmoothing(false);

        window.addEventListener("load", () => {
            window.scrollTo(0, 0);
            resizeCanvas();
            drawSpace();
            setupShootingStarTimer();

            const introTl = gsap.timeline({
                onComplete: () => {
                    initScrollTriggers();
                }
            });
            introTl.to('header', { opacity: 1, duration: 1 }) 
                   .to('.hero-text-container h1', { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=0.6")
                   .to('.hero-text-container p', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.7")
                   .to('.triangle-wrapper', { opacity: 1, scale: 1, duration: 1.2, ease: "power4.out" }, "-=0.8");
            
            gsap.to('.triangle-container', { y: "+=12", rotationY: "+=4", duration: 4.5, ease: "sine.inOut", repeat: -1, yoyo: true });
            gsap.to('.geometry-glow', { scale: 1.15, opacity: 0.3, duration: 3.5, ease: "sine.inOut", repeat: -1, yoyo: true });
            gsap.to('.triangle-container', { 
                filter: "drop-shadow(0 0 25px rgba(210, 183, 229, 0.75)) drop-shadow(0 0 45px rgba(138, 43, 226, 0.5))", 
                duration: 3, 
                repeat: -1, 
                yoyo: true, 
                ease: "sine.inOut" 
            });
            gsap.to('#services-penrose', { rotation: 360, duration: 14, repeat: -1, ease: "none" });
            gsap.to('#services-astronaut', { y: "-=15", duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });
            gsap.to(['#rocket-on', '#rocket-off'], { y: "+=12", duration: 5, ease: "sine.inOut", repeat: -1, yoyo: true });
            gsap.to('#orbit-asteroid .orbit-asteroid-inner', { y: "-=15", rotation: "-=8", duration: 6, ease: "sine.inOut", repeat: -1, yoyo: true });
            
            window.addEventListener('mousemove', (e) => {
                const moveX = (e.clientX - window.innerWidth / 2);
                const moveY = (e.clientY - window.innerHeight / 2);
                gsap.to('#geometry-mouse-node', { x: moveX * 0.018, y: moveY * 0.018, duration: 1.3, ease: "power2.out", overwrite: "auto" });
                gsap.to('.hero-satellite-webp', { x: moveX * 0.02, y: moveY * 0.02, duration: 2, ease: "power1.out", overwrite: "auto" });
                gsap.to('.hero-astronaut-webp', { x: moveX * -0.03, y: moveY * -0.03, duration: 1.8, ease: "power1.out", overwrite: "auto" });
            });

            document.querySelectorAll('.orbit-node').forEach(node => {
                node.addEventListener('click', () => {
                    const index = parseInt(node.getAttribute('data-index'));
                    const scrollTriggerInstance = ScrollTrigger.getById("mainScroll");
                    if (scrollTriggerInstance && scrollTriggerInstance.animation) {
                        const timeline = scrollTriggerInstance.animation;
                        const labelProgress = timeline.labels[`project-${index}`] / timeline.totalDuration();
                        const targetScroll = scrollTriggerInstance.start + (scrollTriggerInstance.end - scrollTriggerInstance.start) * labelProgress;
                        gsap.to(window, { scrollTo: targetScroll, duration: 1.5, ease: "power3.out" });
                    }
                });
            });
        });

        function positionOrbitNodes() {
            const nodes = document.querySelectorAll('.orbit-node');
            const container = document.getElementById('orbit-ring');
            const moon = document.getElementById('main-moon');
            const portfolioSec = document.getElementById('portfolio');
            if (!container || !moon) return;

            if (portfolioSec) {
                if (orbitExpansionFactor < 0.95) {
                    portfolioSec.style.zIndex = "7";
                } else {
                    portfolioSec.style.zIndex = "9";
                }
            }

            const rx = (container.offsetWidth / 2) * orbitExpansionFactor;
            const ry = (container.offsetHeight / 2) * orbitExpansionFactor;

            const containerRect = container.getBoundingClientRect();
            const moonRect = moon.getBoundingClientRect();
            const moonCenterX = (moonRect.left + moonRect.width / 2) - (containerRect.left + containerRect.width / 2);
            const moonCenterY = (moonRect.top + moonRect.height / 2) - (containerRect.top + containerRect.height / 2);

            nodes.forEach((node, idx) => {
                const index = parseInt(node.getAttribute('data-index'));
                const angle = currentAngleOffset + (index * (Math.PI / 2)); 

                const targetX = rx * Math.cos(angle);
                const targetY = ry * Math.sin(angle);

                const rotRad = -15 * (Math.PI / 180);
                let finalX = targetX * Math.cos(rotRad) - targetY * Math.sin(rotRad);
                let finalY = targetX * Math.sin(rotRad) + targetY * Math.cos(rotRad);

                finalX = gsap.utils.interpolate(moonCenterX, finalX, orbitExpansionFactor);
                finalY = gsap.utils.interpolate(moonCenterY, finalY, orbitExpansionFactor);

                const rawAngleNorm = (angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                let focusFactor = Math.cos(rawAngleNorm - Math.PI);
                focusFactor = (focusFactor + 1) / 2; 

                const scale = gsap.utils.mapRange(0, 1, 0.45, 1.05, focusFactor) * orbitExpansionFactor;
                const zIndexBase = Math.round(gsap.utils.mapRange(0, 1, 1, 10, focusFactor));

                const finalZIndex = orbitExpansionFactor < 0.98 ? 2 : zIndexBase;

                gsap.set(node, { 
                    x: finalX, 
                    y: finalY, 
                    scale: scale, 
                    zIndex: finalZIndex,
                    opacity: orbitExpansionFactor > 0.15 ? 1 : 0, 
                    overwrite: "auto" 
                });

                if (focusFactor > 0.85 && lastFocusedIndex !== index && orbitExpansionFactor > 0.8) {
                    lastFocusedIndex = index;
                    document.querySelectorAll('.orbit-node').forEach(n => n.classList.remove('focused'));
                    node.classList.add('focused');
                    updateProjectDetails(index);
                }
            });
        }

        function updateProjectDetails(index) {
            const data = projectsData[index];
            const textElements = ["#project-tag", "#project-title", "#project-desc", "#project-link"];
            
            gsap.to(textElements, { 
                opacity: 0, 
                y: -8, 
                duration: 0.25, 
                stagger: 0.04, 
                overwrite: "auto",
                onComplete: () => {
                    document.getElementById('project-tag').innerText = data.tag;
                    document.getElementById('project-title').innerText = data.title;
                    document.getElementById('project-desc').innerText = data.desc;
                    document.getElementById('project-link').onclick = () => {
                        window.location.href = data.link;
                    };
                    gsap.to(textElements, { 
                        opacity: 1, 
                        y: 0, 
                        duration: 0.35, 
                        stagger: 0.04, 
                        ease: "power2.out", 
                        overwrite: "auto" 
                    });
                }
            });
        }

        function initScrollTriggers() {
            const tl = gsap.timeline({
                id: "mainScroll",
                scrollTrigger: {
                    trigger: "#scroll-container",
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 3.5, 
                    invalidateOnRefresh: true,
                }
            });

            tl.addLabel("hero")
              .to("#triangle-holder", { scale: 6.5, duration: 5, ease: "power2.inOut", immediateRender: false })
              .to("#triangle-holder", { opacity: 0, duration: 2.5, ease: "power1.in" }, "-=5")
              .to(".hero-text-container", { opacity: 0, y: "-50px", duration: 2.5, ease: "power1.out" }, "-=5")
              .to(".hero-satellite-webp", { x: "-75vw", y: "-75vh", rotation: -15, duration: 5, ease: "none", immediateRender: false }, "-=5")
              .to(".hero-astronaut-webp", { x: "75vw", y: "-75vh", rotation: 10, duration: 5, ease: "none", immediateRender: false }, "-=5")
              .to(".hero-asteroids-webp", { x: "90vw", y: "75vh", duration: 5, ease: "none", immediateRender: false }, "-=5")
              
              // OPTIMIZACIÓN: Control del segundo canvas para que no gaste GPU si no está visible
              .to("#dimension-dos", { opacity: 1, duration: 2, 
                  onStart: () => { isAlternateCanvasVisible = true; }, 
                  onReverseComplete: () => { isAlternateCanvasVisible = false; } 
              }, "-=1.5")
              
              .to("#dimension-uno", { backgroundColor: "transparent", duration: 2 }, "-=1.5")
              .to("#hero", { opacity: 0, pointerEvents: "none", duration: 2 }, "-=1.5");

            tl.addLabel("servicios")
              .to("#services", { opacity: 1, duration: 1 })
              .to("#services-penrose", { right: "80%", duration: 5, ease: "power2.out" }, "-=1")
              
              .to("#services-astronaut", { right: "4%", bottom: "15%", duration: 5, ease: "power2.out" }, "-=5")
              
              .to(".services-grid .service-card:nth-child(1)", { opacity: 1, filter: "grayscale(0) brightness(1)", borderColor: "rgba(30, 58, 138, 0.7)", boxShadow: "0 0 35px rgba(7, 18, 36, 0.9)", duration: 2 })
              .to(".services-grid .service-card:nth-child(2)", { opacity: 1, filter: "grayscale(0) brightness(1)", borderColor: "rgba(30, 58, 138, 0.7)", boxShadow: "0 0 35px rgba(7, 18, 36, 0.9)", duration: 2 })
              .to(".services-grid .service-card:nth-child(3)", { opacity: 1, filter: "grayscale(0) brightness(1)", borderColor: "rgba(30, 58, 138, 0.7)", boxShadow: "0 0 35px rgba(7, 18, 36, 0.9)", duration: 2 })
              
              .to(".services-left", { x: "-120vw", duration: 10, ease: "power2.in" }, "+=1")
              
              .to("#services-astronaut", { right: "120%", bottom: "-20%", duration: 10, ease: "power2.in", rotation: -10 }, "-=4.5")
              .to("#services-penrose", { x: "-120vw", y: "-30vh", duration: 4, ease: "power2.in" }, "-=4.7")
              
              .to("#portfolio", { opacity: 1, duration: 4 }, "-=1.5")
              .to("#main-moon", { left: "70%", top: "50%", scale: 1.1, opacity: 1, duration: 10, ease: "power2.inOut" }, "<")
              .to("#orbit-asteroid", { left: "-85%", bottom: "-20%", duration: 10, ease: "power2.inOut" }, "<")
              .to("#services", { pointerEvents: "none", duration: 0.1 })
              .call(() => {
                  lastFocusedIndex = -1;
                  document.querySelectorAll('.orbit-node').forEach(n => n.classList.remove('focused'));
              })
              .to("#orbit-astronaut", { left: "-15%", top: "60%", scale: 1, rotation: -30, duration: 10, ease: "power2.out" }, "+=0.2")
              .to("#rocket-on", { opacity: 0, duration: 3.5, ease: "power1.inOut" }, ">")
              .to("#rocket-off", { opacity: 1, duration: 3.5, ease: "power1.inOut" }, "<")
              .to({ factor: 0 }, {
                  factor: 1, duration: 10, ease: "back.out(1.1)",
                  onUpdate: function() {
                      orbitExpansionFactor = this.targets()[0].factor;
                      positionOrbitNodes();
                  }
              }, ">")
              .to("#details-card", { opacity: 1, x: 0, pointerEvents: "all", duration: 2, ease: "power2.out" }, ">");

            tl.addLabel("project-0").to({ angle: Math.PI }, { angle: Math.PI / 2, duration: 6, ease: "none", onUpdate: function() { currentAngleOffset = this.targets()[0].angle; positionOrbitNodes(); } });
            tl.addLabel("project-1").to({ angle: Math.PI / 2 }, { angle: 0, duration: 6, ease: "none", onUpdate: function() { currentAngleOffset = this.targets()[0].angle; positionOrbitNodes(); } });
            tl.addLabel("project-2").to({ angle: 0 }, { angle: -Math.PI / 2, duration: 6, ease: "none", onUpdate: function() { currentAngleOffset = this.targets()[0].angle; positionOrbitNodes(); } });
            tl.addLabel("project-3").to({}, { duration: 6 });

            tl.addLabel("project-final-stop")
              .to("#details-card", { opacity: 0, x: -30, pointerEvents: "none", duration: 1.5, ease: "power2.in" })
              .to({ factor: 1 }, {
                  factor: 0, duration: 10, ease: "power2.inOut",
                  onUpdate: function() { orbitExpansionFactor = this.targets()[0].factor; positionOrbitNodes(); }
              }, "-=1")
              .to("#orbit-asteroid", { left: "-160%", bottom: "50%", duration: 8, ease: "power2.in" }, "-=2.2")
              .to("#rocket-on", { opacity: 1, duration: 4, ease: "power1.inOut" }, "-=3.5")
              .to("#rocket-off", { opacity: 0, duration: 4, ease: "power1.inOut" }, "<")
              .to("#orbit-astronaut", { left: "25%", top: "22%", scale: 0.5, rotation: -30, zIndex: 10, duration: 8 }, "-=2.5")
              .to(["#main-moon", "#orbit-astronaut"], { x: "60vw", y: "60vh", duration: 10, ease: "power2.in" }, "+=0.3")
              .to("#portfolio", { opacity: 1, scale: 0.9, duration: 3.5 }, "-=3.5");

            tl.addLabel("contacto")
              .to("#contact", { opacity: 1, pointerEvents: "all", duration: 4 })
              .fromTo(".earth-crust", { y: "100%", opacity: 0 }, { y: "0%", opacity: 1, duration: 6, ease: "power2.out" }, "<")
              .fromTo(".contact-content", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 6, ease: "power3.out" }, "<")
              
              .to({}, { duration: 4 })

              .addLabel("salida-contacto")
              .to(".contact-content, .contact-ship", { opacity: 0, y: -50, pointerEvents: "none", duration: 3 }, "salida-contacto")
              
              .to(".earth-crust", { scale: 3.5, y: "10%", transformOrigin: "bottom center", duration: 8, ease: "power1.inOut" }, "salida-contacto")
              
              .to("#nubes-atmosfera", { y: "0vh", scale: 1.5, duration: 8, ease: "power1.inOut" }, "salida-contacto");

            tl.addLabel("descenso-nubes")
              .set("#contact", { opacity: 0 }) 
              
              .to("#nubes-atmosfera", { scale: 5.0, duration: 8, ease: "power1.inOut" })
              
              .set("#landing", { opacity: 1, pointerEvents: "all" }, "-=6")

              .to("#nubes-atmosfera", { opacity: 0, scale: 8.0, filter: "blur(20px)", duration: 6, ease: "power2.inOut" }, "-=4");

            tl.addLabel("landing")
              .fromTo(".landing-scene", { y: "20vh", opacity: 0 }, { y: "0vh", opacity: 1, duration: 6, ease: "power3.out" }, "-=6")
              .fromTo(".landing-content", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 5 }, "-=4");

            ScrollTrigger.refresh();
        }

        const canvas1 = document.getElementById('starfield');
        const ctx1 = canvas1.getContext('2d');
        const canvas2 = document.getElementById('starfield-alternate');
        const ctx2 = canvas2.getContext('2d');

        let stars1 = [];
        let stars2 = [];
        let shootingStar = { x: 0, y: 0, speed: 0, length: 0, opacity: 0, active: false };

        function resizeCanvas() {
            canvas1.width = window.innerWidth;
            canvas1.height = window.innerHeight;
            canvas2.width = window.innerWidth;
            canvas2.height = window.innerHeight;
            initStars();
        }

        function initStars() {
            stars1 = [];
            stars2 = [];
            const count = Math.floor((canvas1.width * canvas1.height) / 7000);
            for (let i = 0; i < count; i++) {
                stars1.push({ x: Math.random() * canvas1.width, y: Math.random() * canvas1.height, radius: Math.random() * 1.1 + 0.3, speed: Math.random() * 0.02 + 0.005 });
                stars2.push({ x: Math.random() * canvas2.width, y: Math.random() * canvas2.height, radius: Math.random() * 1.3 + 0.4, speed: Math.random() * 0.05 + 0.01 });
            }
        }

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('scroll', () => { scroll.target = window.scrollY; });

        // OPTIMIZACIÓN: Solo renderizar Canvas 2 si está visible
        function drawSpace() {
            scroll.current += (scroll.target - scroll.current) * 0.08;
            
            // Renderizado Canvas 1
            ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
            ctx1.beginPath();
            stars1.forEach(star => {
                let starY = (star.y - (scroll.current * 0.015) % canvas1.height + canvas1.height) % canvas1.height;
                ctx1.moveTo(star.x + star.radius, starY);
                ctx1.arc(star.x, starY, star.radius, 0, Math.PI * 2);
            });
            ctx1.fillStyle = 'rgba(255, 255, 255, 0.55)'; 
            ctx1.fill();

            // Renderizado Condicional Canvas 2
            if (isAlternateCanvasVisible) {
                ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
                ctx2.beginPath();
                stars2.forEach(star => {
                    let starY = (star.y - (scroll.current * 0.04) % canvas2.height + canvas2.height) % canvas2.height; 
                    ctx2.moveTo(star.x + star.radius, starY); 
                    ctx2.arc(star.x, starY, star.radius, 0, Math.PI*2);
                });
                ctx2.fillStyle = 'rgba(220, 230, 255, 0.8)'; 
                ctx2.fill(); 

                if (shootingStar.active) {
                    ctx2.beginPath();
                    const grad = ctx2.createLinearGradient(shootingStar.x, shootingStar.y, shootingStar.x - shootingStar.dx, shootingStar.y - shootingStar.dy);
                    grad.addColorStop(0, `rgba(167, 139, 250, ${shootingStar.opacity})`);
                    grad.addColorStop(1, 'rgba(167, 139, 250, 0)');
                    ctx2.strokeStyle = grad; ctx2.lineWidth = 2;
                    ctx2.moveTo(shootingStar.x, shootingStar.y); ctx2.lineTo(shootingStar.x - shootingStar.dx, shootingStar.y - shootingStar.dy);
                    ctx2.stroke();
                    shootingStar.x += shootingStar.dx * 0.6; shootingStar.y += shootingStar.dy * 0.6; shootingStar.opacity -= 0.015;
                    if (shootingStar.opacity <= 0) shootingStar.active = false;
                }
            }
            requestAnimationFrame(drawSpace);
        }

        function launchShootingStar() {
            if (shootingStar.active) return;
            shootingStar.x = Math.random() * canvas1.width * 0.8; shootingStar.y = Math.random() * canvas1.height * 0.5;
            shootingStar.speed = Math.random() * 12 + 12; shootingStar.length = Math.random() * 80 + 50;
            const angle = Math.PI / 4; shootingStar.dx = Math.cos(angle) * shootingStar.speed; shootingStar.dy = Math.sin(angle) * shootingStar.speed;
            shootingStar.opacity = 1; shootingStar.active = true;
        }

        function setupShootingStarTimer() { 
            setTimeout(() => { launchShootingStar(); setupShootingStarTimer(); }, Math.random() * 9000 + 4000);
        }
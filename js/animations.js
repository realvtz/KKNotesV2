


let scene, camera, renderer, stars, animationFrame;
const starContainer = document.createElement('div');
starContainer.id = 'star-background';
starContainer.style.position = 'fixed';
starContainer.style.top = '0';
starContainer.style.left = '0';
starContainer.style.width = '100%';
starContainer.style.height = '100%';
starContainer.style.zIndex = '-1';
starContainer.style.overflow = 'hidden';
starContainer.style.pointerEvents = 'none';


document.addEventListener('DOMContentLoaded', () => {
    
    document.body.insertBefore(starContainer, document.body.firstChild);
    
    
    initStarField();
    
    
    setupLoginAnimation();
    
    
    setupPageTransitions();
    
    
    listenForThemeChanges();
});


function initStarField() {
    
    scene = new THREE.Scene();
    
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1;
    
    
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    starContainer.appendChild(renderer.domElement);
    
    
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: getCurrentTheme() === 'dark' ? 0xFFFFFF : 0x4263eb,
        size: 0.07,
        transparent: true,
        opacity: 0.8
    });
    
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 10;
        const y = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    
    function animateStars() {
        animationFrame = requestAnimationFrame(animateStars);
        
        stars.rotation.x += 0.0005;
        stars.rotation.y += 0.0003;
        
        renderer.render(scene, camera);
    }
    
    
    animateStars();
    
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}


function setupLoginAnimation() {
    const loginCard = document.querySelector('.login-card');
    const loginForm = document.querySelector('.login-form');
    
    if (loginCard) {
        
        gsap.from(loginCard, {
            duration: 1.2,
            y: 50,
            opacity: 0,
            scale: 0.9,
            ease: "back.out(1.7)",
            delay: 0.3
        });
        
        
        gsap.to(loginCard, {
            duration: 2.5,
            y: "10px",
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
        });
        
        
        const loginElements = loginCard.querySelectorAll('h1, h2, p, .form-message');
        gsap.from(loginElements, {
            duration: 0.7,
            y: 20,
            opacity: 0,
            stagger: 0.15,
            ease: "power3.out",
            delay: 0.7
        });
    }
    
    
    const loginBtn = document.getElementById('site-login-btn');
    if (loginBtn) {
        
        loginBtn.style.opacity = "1";
        loginBtn.style.visibility = "visible";
        
        
        gsap.to(loginBtn, {
            duration: 1.5,
            boxShadow: "0 0 20px rgba(66, 99, 235, 0.5)",
            repeat: 2,
            yoyo: true,
            ease: "sine.inOut",
            delay: 1.5
        });
        
        loginBtn.addEventListener('mouseenter', () => {
            gsap.to(loginBtn, {
                duration: 0.3,
                scale: 1.05,
                boxShadow: "0 10px 20px rgba(66, 99, 235, 0.2)",
                ease: "power1.out"
            });
        });
        
        loginBtn.addEventListener('mouseleave', () => {
            gsap.to(loginBtn, {
                duration: 0.3,
                scale: 1,
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                ease: "power1.out"
            });
        });
    }
}


function setupPageTransitions() {
    
    const main = document.querySelector('main');
    if (main) {
        gsap.from(main, {
            duration: 1,
            opacity: 0,
            y: 20,
            ease: "power2.out",
            delay: 0.5
        });
    }
    
    
    const navLinks = document.querySelectorAll('.nav-links a');
    gsap.from(navLinks, {
        duration: 0.8,
        opacity: 0,
        y: -20,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.3
    });
    
    
    const sectionHeaders = document.querySelectorAll('section h2');
    
    if (typeof ScrollTrigger !== 'undefined') {
        sectionHeaders.forEach(header => {
            gsap.from(header, {
                scrollTrigger: {
                    trigger: header,
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                duration: 0.8,
                y: 30,
                opacity: 0,
                ease: "power3.out"
            });
        });
    }
    
    
    const sections = document.querySelectorAll('section');
    
    if (typeof ScrollTrigger !== 'undefined') {
        sections.forEach(section => {
            const content = section.querySelectorAll('p, .semester-tabs, .notes-container, .videos-container, .chat-container');
            
            gsap.from(content, {
                scrollTrigger: {
                    trigger: section,
                    start: "top 70%",
                    toggleActions: "play none none none"
                },
                duration: 0.7,
                y: 20,
                opacity: 0,
                stagger: 0.1,
                ease: "power2.out"
            });
        });
    }
}


function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}


function listenForThemeChanges() {
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                updateStarColor();
            }
        });
    });
    
    
    observer.observe(document.documentElement, { attributes: true });
}


function updateStarColor() {
    if (stars && stars.material) {
        stars.material.color.set(getCurrentTheme() === 'dark' ? 0xFFFFFF : 0x4263eb);
    }
}


function showLoginSuccessAnimation() {
    const loginOverlay = document.getElementById('login-overlay');
    const loginCard = document.querySelector('.login-card');
    
    if (loginOverlay && loginCard) {
        
        gsap.to(loginCard, {
            duration: 0.5,
            scale: 1.05,
            boxShadow: "0 20px 30px rgba(66, 99, 235, 0.3)",
            ease: "power2.out"
        });
        
        
        gsap.to(loginCard, {
            duration: 0.8,
            delay: 0.5,
            scale: 0.8,
            opacity: 0,
            y: -100,
            ease: "power3.inOut"
        });
        
        gsap.to(loginOverlay, {
            duration: 1,
            delay: 0.6,
            opacity: 0,
            ease: "power3.inOut",
            onComplete: () => {
                loginOverlay.classList.add('hidden');
            }
        });
    }
}


function cleanupAnimations() {
    
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    
    
    if (stars) {
        scene.remove(stars);
        stars.geometry.dispose();
        stars.material.dispose();
    }
    
    if (renderer) {
        renderer.dispose();
    }
}


window.animationFunctions = {
    showLoginSuccessAnimation,
    cleanupAnimations
};



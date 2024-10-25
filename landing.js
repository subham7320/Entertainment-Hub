document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initCardEffects();
});

function initParticles() {
    const particlesContainer = document.querySelector('.particles');
    const particleCount = 50;
    const particles = [];

    class Particle {
        constructor() {
            this.element = document.createElement('div');
            this.element.className = 'particle';
            this.reset();
            particlesContainer.appendChild(this.element);
        }

        reset() {
            const size = Math.random() * 4 + 1;
            this.x = Math.random() * window.innerWidth;
            this.y = window.innerHeight + size;
            this.speedY = (Math.random() * 2 + 1) * -1;
            this.speedX = (Math.random() - 0.5) * 2;
            this.element.style.width = `${size}px`;
            this.element.style.height = `${size}px`;
            this.element.style.opacity = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            
            if (this.y < -10) {
                this.reset();
            }

            this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
        }
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Animation loop
    function animate() {
        particles.forEach(particle => particle.update());
        requestAnimationFrame(animate);
    }

    animate();
}

function initCardEffects() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / card.clientWidth) * 100;
            const y = ((e.clientY - rect.top) / card.clientHeight) * 100;

            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);

            // Tilt effect
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const rotateX = (e.clientY - centerY) / 20;
            const rotateY = -(e.clientX - centerX) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}
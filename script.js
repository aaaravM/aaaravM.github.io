// Animated Background with Particles
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
const particleCount = 100;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `rgba(${Math.random() > 0.5 ? '0, 245, 255' : '123, 47, 247'}, ${Math.random() * 0.5 + 0.2})`;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function init() {
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
                ctx.strokeStyle = `rgba(0, 245, 255, ${0.2 - distance / 600})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    connectParticles();
    requestAnimationFrame(animate);
}

init();
animate();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Cursor Trail Effect
const trails = [
    document.getElementById('trail1'),
    document.getElementById('trail2'),
    document.getElementById('trail3')
];
let mouseX = 0, mouseY = 0;
const trailPositions = trails.map(() => ({ x: 0, y: 0 }));

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateTrails() {
    trailPositions[0].x += (mouseX - trailPositions[0].x) * 0.2;
    trailPositions[0].y += (mouseY - trailPositions[0].y) * 0.2;

    for (let i = 1; i < trails.length; i++) {
        trailPositions[i].x += (trailPositions[i - 1].x - trailPositions[i].x) * 0.15;
        trailPositions[i].y += (trailPositions[i - 1].y - trailPositions[i].y) * 0.15;
    }

    trails.forEach((trail, i) => {
        trail.style.left = trailPositions[i].x - 10 + 'px';
        trail.style.top = trailPositions[i].y - 10 + 'px';
    });

    requestAnimationFrame(animateTrails);
}

animateTrails();

// Scroll Effects
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Intersection Observer for Reveal Animations
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
}, { threshold: 0.15 });

reveals.forEach(section => observer.observe(section));

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});
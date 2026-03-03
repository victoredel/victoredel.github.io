// victoredel - Enhanced 3D Network Logic

const canvas = document.getElementById('canvas-3d');
const ctx = canvas.getContext('2d');
let width, height;

// Particle Sphere Constants (Dynamic)
let PARTICLE_COUNT = 600; 
let sphereRadius = 400; 
let maxLineDist = 140; 
let sphereOffsetX = 0.15; // default desktop
let isMobile = false;

const particles = [];
let rotationX = 0;
let rotationY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let scrollRotationY = 0;
let targetScrollRotationY = 0;

// Section State
let currentSection = 0;
const sections = document.querySelectorAll('.scene-section');
const totalSections = sections.length;
let isAnimating = false;

class Particle {
  constructor() {
    this.setRandomPos();
    this.initMotion();
  }

  initMotion() {
    this.vx = (Math.random() - 0.5) * 0.1; // Slower movement
    this.vy = (Math.random() - 0.5) * 0.1;
    this.vz = (Math.random() - 0.5) * 0.1;
    this.distMoved = 0;
    this.maxDist = 10 + Math.random() * 20; 
  }

  setRandomPos() {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos((Math.random() * 2) - 1);
    this.x = sphereRadius * Math.sin(phi) * Math.cos(theta);
    this.y = sphereRadius * Math.sin(phi) * Math.sin(theta);
    this.z = sphereRadius * Math.cos(phi);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.distMoved += Math.sqrt(this.vx**2 + this.vy**2 + this.vz**2);

    if (this.distMoved > this.maxDist) {
      this.initMotion();
    }
  }

  project(rx, ry) {
    let dx = this.x;
    let dy = this.y;
    let dz = this.z;

    // Rotation Y
    let x = dx * Math.cos(ry) - dz * Math.sin(ry);
    let z = dx * Math.sin(ry) + dz * Math.cos(ry);
    // Rotation X
    let y = dy * Math.cos(rx) - z * Math.sin(rx);
    z = dy * Math.sin(rx) + z * Math.cos(rx);

    const perspective = 800 / (800 - z);
    
    // Dynamic positioning based on screen size
    const px = x * perspective + width * sphereOffsetX;
    const py = y * perspective + height * (isMobile ? 0.35 : 0.5);
    
    const size = Math.max(1, 2.5 * perspective);
    const alpha = Math.max(0.05, (perspective - 0.4) * 0.6);

    return { px, py, z, size, alpha };
  }
}

function init() {
  resize();
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
  animate(0);
}

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  
  isMobile = width < 768;
  sphereRadius = isMobile ? 300 : 400;
  maxLineDist = isMobile ? 100 : 140;
  sphereOffsetX = isMobile ? 0.5 : 0.15;
}

function animate(time) {
  ctx.clearRect(0, 0, width, height);

  rotationX += (targetRotationX - rotationX) * 0.05;
  rotationY += (targetRotationY - rotationY) * 0.05;
  scrollRotationY += (targetScrollRotationY - scrollRotationY) * 0.05;
  
  const finalRx = rotationX;
  const finalRy = rotationY + scrollRotationY;

  const points = particles.map(p => {
    p.update();
    return p.project(finalRx, finalRy);
  });

  // Draw lines first (Network)
  const MAX_CONN_PER_PARTICLE = 3;
  const connectionCounts = new Array(points.length).fill(0);
  
  ctx.lineWidth = 0.6;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (connectionCounts[i] >= MAX_CONN_PER_PARTICLE || connectionCounts[j] >= MAX_CONN_PER_PARTICLE) continue;
      
      const p1 = points[i];
      const p2 = points[j];
      const dx = p1.px - p2.px;
      const dy = p1.py - p2.py;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < maxLineDist) {
        connectionCounts[i]++;
        connectionCounts[j]++;
        
        // Higher base opacity and clearer color
        const opacity = Math.min(p1.alpha, p2.alpha) * (1 - dist / maxLineDist) * 0.8;
        ctx.strokeStyle = `rgba(180, 200, 255, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }
    }
  }

  // Draw points
  points.forEach(p => {
    ctx.fillStyle = `rgba(180, 210, 255, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.px, p.py, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(animate);
}

// Interactions
window.addEventListener('resize', resize);

window.addEventListener('mousemove', (e) => {
  targetRotationY = (e.clientX / width - 0.5) * 0.5;
  targetRotationX = (e.clientY / height - 0.5) * 0.5;
});

window.addEventListener('wheel', (e) => {
  if (isAnimating) return;
  
  if (e.deltaY > 0 && currentSection < totalSections - 1) {
    transition(1);
  } else if (e.deltaY < 0 && currentSection > 0) {
    transition(-1);
  }
}, { passive: true });

function transition(direction) {
  isAnimating = true;
  
  // Update sphere target rotation (Y axis)
  targetScrollRotationY += direction * (Math.PI / 1.5);

  sections[currentSection].classList.remove('active');
  if (direction > 0) {
    sections[currentSection].classList.add('prev');
  } else {
    sections[currentSection].classList.remove('prev');
  }

  currentSection += direction;
  
  sections[currentSection].classList.add('active');
  sections[currentSection].classList.remove('prev');

  setTimeout(() => {
    isAnimating = false;
  }, 1200);
}

// Button Controls
document.getElementById('prev-btn').addEventListener('click', () => {
    if (!isAnimating && currentSection > 0) transition(-1);
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (!isAnimating && currentSection < totalSections - 1) transition(1);
});

init();

// GSAP Init
gsap.registerPlugin(ScrollTrigger);

// 1. Background Circles Animation
gsap.to('.circle-1', {
  x: '+=100',
  y: '+=50',
  duration: 8,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

gsap.to('.circle-2', {
  x: '-=80',
  y: '-=120',
  duration: 10,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
  delay: 1
});

// 2. Header & Mobile Menu
const header = document.querySelector('.header');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

mobileMenuToggle.addEventListener('click', () => {
  mobileMenuToggle.classList.toggle('active');
  nav.classList.toggle('active');
  document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : 'auto';
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenuToggle.classList.remove('active');
    nav.classList.remove('active');
    document.body.style.overflow = 'auto';
  });
});


// 3. Hero Entrance Animation
const heroTl = gsap.timeline();

heroTl.from('.badge', {
  y: 20,
  opacity: 0,
  duration: 0.8,
  ease: 'custom'
})
.from('.hero-title', {
  y: 60,
  opacity: 0,
  duration: 1.2,
  ease: 'expo.out'
}, '-=0.4')
.from('.hero-date', {
  y: 30,
  opacity: 0,
  duration: 1,
  ease: 'power3.out'
}, '-=0.8')
.from('.hero-text', {
  y: 20,
  opacity: 0,
  duration: 1,
  ease: 'power3.out'
}, '-=0.8')
.from('.hero-actions .btn', {
  y: 20,
  opacity: 0,
  stagger: 0.2,
  duration: 0.8,
  ease: 'back.out(1.7)'
}, '-=0.6');

// 4. Reveal Sections on Scroll
const sections = document.querySelectorAll('.section');

sections.forEach((section) => {
  const revealElements = section.querySelectorAll('.pricing-card, .benefit-item, .contest-info, .section-title, .contest-image, .team-card');
  
  gsap.from(revealElements, {
    scrollTrigger: {
      trigger: section,
      start: 'top 85%',
      toggleActions: 'play none none none'
    },
    y: 30,
    scale: 0.95,
    opacity: 0,
    duration: 1,
    stagger: {
      amount: 0.4,
      from: 'start'
    },
    ease: 'expo.out',
    onComplete: () => {
      // Ensure opacity is 1 and clear from props
      gsap.set(revealElements, { clearProps: 'all' });
    }
  });
});

// 5. Special Hover Effects for Cards
document.querySelectorAll('.pricing-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    gsap.to(card, {
      y: -16,
      duration: 0.6,
      ease: 'expo.out'
    });
  });
  
  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      y: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.75)'
    });
  });
});

// 6. Smooth Scroll (already handled by CSS but adding GSAP for extra smoothness if needed)
// Using CSS scroll-behavior: smooth is usually enough for simple sites.

// 7. Background Parallax Logo
const parallaxLogo = document.getElementById('parallax-logo');

if (parallaxLogo) {
  let posX = 0;
  let posY = 0;
  let targetX = 0;
  let targetY = 0;
  let isMouseMode = false;
  let lastGamma = null;
  let lastBeta = null;

  // Desktop mouse movement parallax (only for non-touch devices)
  const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
       (navigator.maxTouchPoints > 0) ||
       (navigator.msMaxTouchPoints > 0));
  };

  if (!isTouchDevice()) {
    document.addEventListener('mousemove', (e) => {
      isMouseMode = true;
      targetX = (e.clientX / window.innerWidth - 0.5) * 60; // Max 30px move
      targetY = (e.clientY / window.innerHeight - 0.5) * 60;
    });
  }

  // Mobile device orientation (gyroscope)
  const handleOrientation = (e) => {
    if (e.gamma !== null && e.beta !== null) {
      isMouseMode = false; // Switch to gyro mode
      
      if (lastGamma !== null && lastBeta !== null) {
        let deltaX = e.gamma - lastGamma;
        let deltaY = e.beta - lastBeta;
        
        // Ignore large jumps (like flipping the phone)
        if (Math.abs(deltaX) > 30) deltaX = 0;
        if (Math.abs(deltaY) > 30) deltaY = 0;

        // Add delta to current position (multiplied for sensitivity)
        posX += deltaX * 4;
        posY += deltaY * 4;

        // Cap the maximum displacement
        if (posX > 80) posX = 80;
        if (posX < -80) posX = -80;
        if (posY > 80) posY = 80;
        if (posY < -80) posY = -80;
      }
      
      lastGamma = e.gamma;
      lastBeta = e.beta;
    }
  };

  // Animation Loop for smooth physics and spring back
  const updateParallax = () => {
    if (isMouseMode) {
      // Smoothly follow the mouse target
      posX += (targetX - posX) * 0.1;
      posY += (targetY - posY) * 0.1;
    } else {
      // Gyro mode: Spring back to center (0,0) gently
      posX *= 0.95; 
      posY *= 0.95;
    }

    if (Math.abs(posX) < 0.01) posX = 0;
    if (Math.abs(posY) < 0.01) posY = 0;

    parallaxLogo.style.transform = `translate(${posX}px, ${posY}px)`;
    requestAnimationFrame(updateParallax);
  };
  
  updateParallax();

  // iOS 13+ requires explicit permission for DeviceOrientation
  let orientationInitialized = false;

  const initOrientation = () => {
    if (orientationInitialized) return;

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
            orientationInitialized = true;
          }
        })
        .catch(console.error);
    } else {
      // Non-iOS 13+ devices
      window.addEventListener('deviceorientation', handleOrientation);
      orientationInitialized = true;
    }
  };

  // Request permission on the first click/touch on the page
  document.body.addEventListener('click', initOrientation, { once: true });
  document.body.addEventListener('touchstart', initOrientation, { once: true });
}

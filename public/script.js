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

heroTl.to('.badge', {
  y: 0,
  opacity: 1,
  duration: 0.8,
  ease: 'power2.out'
})
.to('.hero-title', {
  y: 0,
  opacity: 1,
  duration: 1.2,
  ease: 'expo.out'
}, '-=0.4')
.to('.hero-date', {
  y: 0,
  opacity: 1,
  duration: 1,
  ease: 'power3.out'
}, '-=0.8')
.to('.hero-text', {
  y: 0,
  opacity: 1,
  duration: 1,
  ease: 'power3.out'
}, '-=0.8')
.to('.hero-actions', {
  y: 0,
  opacity: 1,
  duration: 0.8,
  ease: 'power3.out'
}, '-=0.6');

// 4. Reveal Sections on Scroll
const sections = document.querySelectorAll('.section');

sections.forEach((section) => {
  const revealElements = section.querySelectorAll('.pricing-card, .benefit-item, .contest-info, .section-title, .contest-image, .team-card, .exp-card, .facility-item');
  
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

// 8. Dynamic Content System
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

async function initPageContent() {
  const path = window.location.pathname;

  // --- TEAM PAGE ---
  if (path.includes('/equipo/')) {
    const teamWrapper = document.getElementById('team-wrapper');
    if (!teamWrapper) return;

    try {
      const res = await fetch('/api/team');
      let members = await res.json();
      if (members.length > 0) {
        // members = shuffleArray(members); // Optional: if you want them random in the carousel too
        teamWrapper.innerHTML = members.map(m => `
          <div class="swiper-slide">
            <div class="team-card">
              <div class="team-photo-container">
                <img src="${m.photo || '../logo.png'}" alt="${m.name}" class="team-photo">
              </div>
              <div class="team-info">
                <h3 class="team-name">${m.name}</h3>
                <p class="team-desc">${m.desc}</p>
              </div>
            </div>
          </div>
        `).join('');

        // Initialize Swiper
        new Swiper('.team-carousel', {
          slidesPerView: 1,
          spaceBetween: 30,
          loop: true,
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
          },
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
          },
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          breakpoints: {
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }
        });
      }
    } catch (e) { console.error('Error loading team carousel:', e); }
  }

  // --- INSTALLATIONS PAGE ---
  if (path.includes('/instalaciones/')) {
    const items = document.querySelectorAll('.facility-item');
    items.forEach(async (item) => {
      const album = item.getAttribute('data-album') || 'fuerza';
      try {
        const res = await fetch(`/api/images/${album}`);
        let images = await res.json();
        if (images.length > 0) {
          const placeholder = item.querySelector('.facility-image-placeholder');
          if (!placeholder) return;
          
          const slides = shuffleArray(images);
          placeholder.innerHTML = `
            <div class="content-slider">
              ${slides.map(img => `<img src="${img}" class="slide-img">`).join('')}
            </div>
          `;
          startMiniSlider(placeholder.querySelector('.content-slider'));
        }
      } catch (e) { console.error(`Error loading installations (${album}):`, e); }
    });
  }

  // --- EXPERIENCE/BENEFITS PAGE ---
  if (path.includes('/beneficios/')) {
    const cards = document.querySelectorAll('.exp-card');
    try {
      const res = await fetch('/api/images/beneficios');
      let images = await res.json();
      if (images.length > 0) {
        cards.forEach(card => {
          const placeholder = card.querySelector('.exp-image-placeholder');
          if (!placeholder) return;
          
          const slides = shuffleArray(images);
          placeholder.innerHTML = `
            <div class="content-slider">
              ${slides.map(img => `<img src="${img}" class="slide-img">`).join('')}
            </div>
          `;
          startMiniSlider(placeholder.querySelector('.content-slider'));
        });
      }
    } catch (e) { console.error('Error loading experience:', e); }
  }
}

function startMiniSlider(container) {
  const imgs = container.querySelectorAll('.slide-img');
  if (imgs.length <= 1) return;

  let current = 0;
  imgs.forEach((img, i) => {
    img.style.opacity = i === 0 ? '1' : '0';
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.transition = 'opacity 1s ease-in-out';
  });

  setInterval(() => {
    const next = (current + 1) % imgs.length;
    imgs[current].style.opacity = '0';
    imgs[next].style.opacity = '1';
    current = next;
  }, 3000 + Math.random() * 2000); // Random delay for more "natural" look
}

window.addEventListener('load', initPageContent);

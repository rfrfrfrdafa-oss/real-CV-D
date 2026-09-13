/*==================== Toggle Icon Navbar ====================*/
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
};

/*==================== Scroll Sections Active Link ====================*/
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if (top >= offset && top < offset + height) {
            navLinks.forEach(links => {
                links.classList.remove('active');
                document.querySelector('header nav a[href*=' + id + ']').classList.add('active');
            });
        };
    });

    /*==================== Sticky Navbar ====================*/
    let header = document.querySelector('header');
    header.classList.toggle('sticky', window.scrollY > 100);

    /*==================== Remove Toggle Icon and Navbar when click navbar link (scroll) ====================*/
    menuIcon.classList.remove('bx-x');
    navbar.classList.remove('active');
};

/*==================== Scroll Reveal ====================*/
ScrollReveal({ 
    distance: '80px',
    duration: 2000,
    delay: 200
});

ScrollReveal().reveal('.home-content, .heading', { origin: 'top' });
ScrollReveal().reveal('.home-img, .services-container, .portfolio-box, .contact form', { origin: 'bottom' });
ScrollReveal().reveal('.home-content h1, .about-img', { origin: 'left' });
ScrollReveal().reveal('.home-content p, .about-content', { origin: 'right' });

/*==================== Typed JS ====================*/
new Typed('.multiple-text', {
    strings: ['Backend Developer', 'Web Development', 'Robotics & AI Developer'],
    typeSpeed: 100,
    backSpeed: 100,
    backDelay: 1000,
    loop: true,
    contentType: 'null'
});

/*==================== Read More / Read Less (About Me) ====================*/
const readMoreBtn = document.getElementById('read-more-btn');
const moreText = document.querySelector('.more-text');

if (readMoreBtn && moreText) {
    readMoreBtn.addEventListener('click', function(e) {
        e.preventDefault(); 
        
        if (moreText.style.display === 'inline' || moreText.style.display === 'block') {
            moreText.style.display = 'none';
            readMoreBtn.textContent = 'Read More';
        } else {
            moreText.style.display = 'inline';
            readMoreBtn.textContent = 'Read Less';
        }
    });
}

/*==================== Custom Send Message Popup ====================*/
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault(); 
        
        const modalOverlay = document.createElement('div');
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modalOverlay.style.display = 'flex';
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.alignItems = 'center';
        modalOverlay.style.zIndex = '9999';

        const modalBox = document.createElement('div');
        modalBox.style.backgroundColor = '#1f242d'; 
        modalBox.style.border = '2px solid #0ef';   
        modalBox.style.padding = '25px 20px';
        modalBox.style.borderRadius = '12px';
        modalBox.style.textAlign = 'center';
        modalBox.style.color = '#fff';
        modalBox.style.width = '80%';
        modalBox.style.maxWidth = '320px';
        modalBox.style.boxShadow = '0 0 15px rgba(0, 238, 255, 0.4)';

        const modalText = document.createElement('p');
        modalText.textContent = 'Thank you! Your message has been sent successfully.';
        modalText.style.marginBottom = '20px';
        modalText.style.fontSize = '15px';
        modalText.style.lineHeight = '1.4';

        const modalBtn = document.createElement('button');
        modalBtn.textContent = 'OK';
        modalBtn.style.backgroundColor = '#0ef';
        modalBtn.style.color = '#1f242d';
        modalBtn.style.border = 'none';
        modalBtn.style.padding = '8px 25px';
        modalBtn.style.borderRadius = '6px';
        modalBtn.style.fontWeight = 'bold';
        modalBtn.style.cursor = 'pointer';

        modalBtn.addEventListener('click', function() {
            modalOverlay.remove();
            contactForm.reset();
        });

        modalBox.appendChild(modalText);
        modalBox.appendChild(modalBtn);
        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);
    });
}

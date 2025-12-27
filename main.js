document.addEventListener('DOMContentLoaded', () => {

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            // Toggle icon
            const icon = menuToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
    }));

    // Scroll Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px" // Trigger a bit earlier
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up, .scale-in');
    animatedElements.forEach(el => observer.observe(el));

    // Stats Counter Animation
    const statsSection = document.querySelector('.stats');
    let statsAnimated = false;

    const statsObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !statsAnimated) {
            const counters = document.querySelectorAll('.counter');

            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                // Adjust speed based on number magnitude
                const speed = 200;

                const updateCount = () => {
                    const count = +counter.innerText;
                    const inc = target / speed;

                    if (count < target) {
                        counter.innerText = Math.ceil(count + inc);
                        setTimeout(updateCount, 15);
                    } else {
                        counter.innerText = target;
                        if (target > 100) {
                            counter.innerText = target + '+';
                        }
                    }
                }
                updateCount();
            });
            statsAnimated = true;
        }
    });

    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // Appointment Form Submission
    const appointmentForm = document.querySelector('.contact-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = appointmentForm.querySelector('input[placeholder="Enter Full Name"]');
            const phoneInput = appointmentForm.querySelector('input[placeholder="Enter Mobile Number"]');
            const reasonInput = appointmentForm.querySelector('textarea');

            const formData = {
                name: nameInput.value,
                phone: phoneInput.value,
                reason: reasonInput.value
            };

            const submitBtn = appointmentForm.querySelector('button');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Booking...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    alert('Appointment processed successfully! We will contact you shortly.');
                    appointmentForm.reset();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Something went wrong. Please try again later.');
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});

/**
 * PROLUKE.COM – Główny skrypt aplikacyjny (app.js)
 * Obsługuje:
 * 1. Automatyczny rok w stopce
 * 2. Nawigację mobilną (hamburger menu)
 * 3. Hero Slider (automatyczna rotacja, strzałki, kropki, pauza po najechaniu)
 * 4. Obsługę formularza kontaktowego (PL / EN)
 * 5. Płynne przewijanie do góry strony (Scroll to Top)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Aktualny rok w stopce
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. Menu mobilne
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Zamknij menu mobilne po kliknięciu w link kotwicy
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Obsługa Hero Slidera
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.getElementById('prevSlideBtn');
  const nextBtn = document.getElementById('nextSlideBtn');
  const sliderContainer = document.querySelector('.hero-slider');

  let currentSlide = 0;
  let slideInterval = null;
  const INTERVAL_TIME = 6000;

  function showSlide(index) {
    if (!slides.length) return;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentSlide = index;
  }

  function nextSlide() {
    const next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }

  function prevSlide() {
    const prev = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(prev);
  }

  function startAutoSlide() {
    stopAutoSlide();
    slideInterval = setInterval(nextSlide, INTERVAL_TIME);
  }

  function stopAutoSlide() {
    if (slideInterval) {
      clearInterval(slideInterval);
    }
  }

  if (slides.length > 0) {
    startAutoSlide();

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        startAutoSlide();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        startAutoSlide();
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const slideIndex = parseInt(dot.getAttribute('data-slide'), 10);
        if (!isNaN(slideIndex)) {
          showSlide(slideIndex);
          startAutoSlide();
        }
      });
    });

    // Zatrzymaj rotację po najechaniu kursorem na slider
    if (sliderContainer) {
      sliderContainer.addEventListener('mouseenter', stopAutoSlide);
      sliderContainer.addEventListener('mouseleave', startAutoSlide);
    }
  }

  // 4. Obsługa preferencji kontaktu (E-mail / Telefon) i przycisku prośby o telefon
  const requestCallBtn = document.getElementById('requestCallBtn');
  const prefRadios = document.querySelectorAll('input[name="preferred_contact"]');
  const phoneGroup = document.getElementById('phoneGroup');
  const phoneInput = document.getElementById('phone');

  function updatePhoneVisibility() {
    const selectedPref = document.querySelector('input[name="preferred_contact"]:checked');
    const isPhone = selectedPref && selectedPref.value === 'phone';

    if (phoneGroup && phoneInput) {
      if (isPhone) {
        phoneGroup.style.display = 'block';
        phoneInput.required = true;
      } else {
        phoneGroup.style.display = 'none';
        phoneInput.required = false;
      }
    }
  }

  prefRadios.forEach((radio) => {
    radio.addEventListener('change', updatePhoneVisibility);
  });

  if (requestCallBtn) {
    requestCallBtn.addEventListener('click', () => {
      const prefPhoneRadio = document.getElementById('prefPhone');
      if (prefPhoneRadio) {
        prefPhoneRadio.checked = true;
        updatePhoneVisibility();
      }

      const formElement = document.getElementById('contactForm');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      setTimeout(() => {
        if (phoneInput) {
          phoneInput.focus();
        }
      }, 400);
    });
  }

  // 5. Obsługa wysyłki formularza kontaktowego przez backend PHP (Hostido.pl)
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const lang = contactForm.getAttribute('data-lang') || 'pl';

      const originalBtnText = submitBtn
        ? submitBtn.textContent
        : (lang === 'en' ? 'Send Inquiry' : 'Wyślij zapytanie');

      if (formStatus) {
        formStatus.className = 'form-status';
        formStatus.textContent =
          lang === 'en'
            ? 'Sending your message, please wait...'
            : 'Przesyłanie wiadomości do serwera...';
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent =
          lang === 'en' ? 'Sending...' : 'Wysyłanie...';
      }

      try {
        const formData = new FormData(contactForm);

        // Zapytanie do backendu PHP
        const response = await fetch('api/contact.php', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result && result.success) {
          if (formStatus) {
            formStatus.className = 'form-status success';
            formStatus.textContent =
              result.message ||
              (lang === 'en'
                ? 'Thank you! Your message has been sent successfully.'
                : 'Dziękujemy! Twoja wiadomość została pomyślnie wysłana.');
          }

          contactForm.reset();
          updatePhoneVisibility();

          // Reset widgetu Cloudflare Turnstile po pomyślnej wysyłce
          if (window.turnstile && typeof window.turnstile.reset === 'function') {
            try {
              window.turnstile.reset();
            } catch (_) {}
          }
        } else {
          const errorMessage =
            (result && result.error) ||
            (lang === 'en'
              ? 'An error occurred while sending your message. Please try again.'
              : 'Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie lub skontaktuj się bezpośrednio.');

          if (formStatus) {
            formStatus.className = 'form-status error';
            formStatus.textContent = errorMessage;
          }

          // Reset Turnstile po błędzie, aby umożliwić ponowną próbę
          if (window.turnstile && typeof window.turnstile.reset === 'function') {
            try {
              window.turnstile.reset();
            } catch (_) {}
          }
        }
      } catch (err) {
        if (formStatus) {
          formStatus.className = 'form-status error';
          formStatus.textContent =
            lang === 'en'
              ? 'Could not connect to the server. Please check your internet connection.'
              : 'Nie udało się nawiązać połączenia z serwerem. Sprawdź połączenie z internetem i spróbuj ponownie.';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }

  // 5. Przycisk przewijania do góry (Scroll to Top)
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    const SCROLL_THRESHOLD = 300;

    const handleScroll = () => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Inicjalne sprawdzenie pozycji scrolla po załadowaniu strony
    handleScroll();

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }
});

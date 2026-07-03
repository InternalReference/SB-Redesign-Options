document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

  // ---------- Presentation-style slide navigation ----------
  const getSlides = () => Array.from(document.querySelectorAll(".slide"));

  const currentSlideIndex = (slides) => {
    let idx = 0;
    let minDist = Infinity;
    slides.forEach((el, i) => {
      const dist = Math.abs(el.getBoundingClientRect().top);
      if (dist < minDist) {
        minDist = dist;
        idx = i;
      }
    });
    return idx;
  };

  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let isAnimating = false;
  let safetyRelease = null;

  const animateScrollTo = (targetY, duration = 800) => {
    const startY = window.scrollY;
    const distance = targetY - startY;

    if (Math.abs(distance) < 1) {
      isAnimating = false;
      return;
    }

    isAnimating = true;
    clearTimeout(safetyRelease);
    // Guards against requestAnimationFrame stalling (e.g. a backgrounded tab),
    // which would otherwise leave the scroll lock stuck on permanently.
    safetyRelease = setTimeout(() => {
      isAnimating = false;
    }, duration + 400);

    const startTime = performance.now();

    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(t));
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        isAnimating = false;
        clearTimeout(safetyRelease);
      }
    };

    requestAnimationFrame(step);
  };

  const goToSlide = (index, slides) => {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    const target = slides[clamped].getBoundingClientRect().top + window.scrollY;
    animateScrollTo(target);
  };

  document.addEventListener("keydown", (e) => {
    const direction = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key];
    if (!direction || isAnimating) return;
    e.preventDefault();
    const slides = getSlides();
    goToSlide(currentSlideIndex(slides) + direction, slides);
  });

  document.addEventListener(
    "wheel",
    (e) => {
      if (isAnimating) {
        e.preventDefault();
        return;
      }
      if (Math.abs(e.deltaY) < 10) return;
      e.preventDefault();
      const slides = getSlides();
      goToSlide(currentSlideIndex(slides) + (e.deltaY > 0 ? 1 : -1), slides);
    },
    { passive: false }
  );

  document.querySelectorAll(".scroll-cue").forEach((cue) => {
    cue.addEventListener("click", (e) => {
      e.preventDefault();
      if (isAnimating) return;
      const slides = getSlides();
      goToSlide(currentSlideIndex(slides) + 1, slides);
    });
  });

  // ---------- Greening slider (crossfade between staged images with magnetic snap) ----------
  document.querySelectorAll(".greening-slider").forEach((slider) => {
    const stack = slider.closest(".option-slide").querySelector(".greening-stack");
    const images = Array.from(stack.querySelectorAll(".greening-img"));
    const segments = images.length - 1;
    const MAX = Number(slider.max);
    const stepSize = MAX / segments;
    const snapZone = stepSize * 0.12;

    const render = (value) => {
      const t = (value / MAX) * segments;
      const idx = Math.min(Math.floor(t), segments - 1);
      const localT = t - idx;
      images.forEach((img) => {
        img.style.opacity = 0;
      });
      images[idx].style.opacity = String(1 - localT);
      images[idx + 1].style.opacity = String(localT);
    };

    const applyMagnetism = (value) => {
      const nearest = Math.round(value / stepSize) * stepSize;
      return Math.abs(value - nearest) < snapZone ? nearest : value;
    };

    slider.addEventListener("input", () => {
      const magnetized = applyMagnetism(Number(slider.value));
      if (magnetized !== Number(slider.value)) {
        slider.value = String(magnetized);
      }
      render(Number(slider.value));
    });

    render(Number(slider.value));
  });
});

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

  const goToSlide = (index, slides) => {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    slides[clamped].scrollIntoView({ behavior: "smooth", block: "start" });
  };

  document.addEventListener("keydown", (e) => {
    const direction = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key];
    if (!direction) return;
    e.preventDefault();
    const slides = getSlides();
    goToSlide(currentSlideIndex(slides) + direction, slides);
  });

  document.querySelectorAll(".scroll-cue").forEach((cue) => {
    cue.addEventListener("click", (e) => {
      e.preventDefault();
      const slides = getSlides();
      goToSlide(currentSlideIndex(slides) + 1, slides);
    });
  });
});

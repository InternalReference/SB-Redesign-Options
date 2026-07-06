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

  // ---------- Design option dot navigation ----------
  document.querySelectorAll(".option-dots").forEach((nav) => {
    const dots = Array.from(nav.querySelectorAll(".dot"));
    const optionSlides = Array.from(document.querySelectorAll(".option-slide.slide"));

    dots.forEach((dot, i) => {
      dot.addEventListener("click", (e) => {
        e.preventDefault();
        if (isAnimating) return;
        const slides = getSlides();
        const idx = slides.indexOf(optionSlides[i]);
        if (idx !== -1) goToSlide(idx, slides);
      });
    });

    const updateActiveDot = () => {
      const slides = getSlides();
      const currentEl = slides[currentSlideIndex(slides)];
      const activeIdx = optionSlides.indexOf(currentEl);
      dots.forEach((dot, i) => dot.classList.toggle("active", i === activeIdx));
    };

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          updateActiveDot();
          ticking = false;
        });
      },
      { passive: true }
    );

    updateActiveDot();
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

    const nearestCheckpoint = (value) => Math.round(value / stepSize) * stepSize;

    let settleFrame = null;

    const settleToNearest = () => {
      const start = Number(slider.value);
      const target = nearestCheckpoint(start);
      const distance = target - start;
      if (Math.abs(distance) < 0.5) {
        slider.value = String(target);
        render(target);
        return;
      }
      const duration = 260;
      const startTime = performance.now();
      cancelAnimationFrame(settleFrame);
      const step = (now) => {
        const t = Math.min((now - startTime) / duration, 1);
        const value = start + distance * easeInOutCubic(t);
        slider.value = String(value);
        render(value);
        if (t < 1) {
          settleFrame = requestAnimationFrame(step);
        }
      };
      settleFrame = requestAnimationFrame(step);
    };

    slider.addEventListener("input", () => {
      const magnetized = applyMagnetism(Number(slider.value));
      if (magnetized !== Number(slider.value)) {
        slider.value = String(magnetized);
      }
      render(Number(slider.value));
    });

    // Guarantees the image never rests on a mid-blend: whenever the user
    // releases the slider (mouse/touch/keyboard), it settles on whichever
    // staged image it was closest to.
    slider.addEventListener("change", settleToNearest);

    render(Number(slider.value));
  });

  // ---------- Material configurator (Congress Hall + Atrium) ----------
  // Generic: works for a Finish-only picker (Atrium) or a Finish + Seating
  // matrix (Congress Hall). Display names come from each swatch's label, and
  // an optional data-selection-prefix prepends a section name to the caption.
  document.querySelectorAll(".config-panel").forEach((panel) => {
    const slide = panel.closest(".option-slide");
    const images = Array.from(slide.querySelectorAll(".config-img"));
    const selectionLabel = panel.querySelector(".config-selection");
    const prefix = panel.dataset.selectionPrefix || "";
    const materialSwatches = Array.from(panel.querySelectorAll(".swatch--material"));
    const seatSwatches = Array.from(panel.querySelectorAll(".swatch--seat"));
    const hasSeat = seatSwatches.length > 0;

    const nameOf = (swatch) => (swatch ? swatch.querySelector(".swatch-name").textContent.trim() : "");
    const activeOr0 = (swatches) => swatches.find((s) => s.classList.contains("is-active")) || swatches[0];

    const state = {
      material: activeOr0(materialSwatches).dataset.material,
      seat: hasSeat ? activeOr0(seatSwatches).dataset.seat : null,
    };

    const findImage = (material, seat) =>
      images.find(
        (img) => img.dataset.material === material && (!hasSeat || img.dataset.seat === seat)
      );

    const update = () => {
      const target = findImage(state.material, state.seat);
      if (target) images.forEach((img) => img.classList.toggle("is-active", img === target));

      const materialSwatch = materialSwatches.find((s) => s.dataset.material === state.material);
      let text = prefix + nameOf(materialSwatch);
      if (hasSeat) {
        const seatSwatch = seatSwatches.find((s) => s.dataset.seat === state.seat);
        text += " · " + nameOf(seatSwatch) + " seating";
      }
      selectionLabel.textContent = text;

      materialSwatches.forEach((s) =>
        s.classList.toggle("is-active", s.dataset.material === state.material)
      );
      seatSwatches.forEach((s) => s.classList.toggle("is-active", s.dataset.seat === state.seat));
    };

    materialSwatches.forEach((s) =>
      s.addEventListener("click", (e) => {
        e.preventDefault();
        state.material = s.dataset.material;
        update();
      })
    );
    seatSwatches.forEach((s) =>
      s.addEventListener("click", (e) => {
        e.preventDefault();
        state.seat = s.dataset.seat;
        update();
      })
    );

    update();
  });
});

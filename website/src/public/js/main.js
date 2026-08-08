// Mobile nav toggle + sticky-nav scroll shadow. No frameworks — this is the
// entire client-side JS footprint for pages that aren't the booking flow.
(function () {
  const nav = document.getElementById("site-nav");
  const menuButton = document.getElementById("mobile-menu-button");
  const menu = document.getElementById("mobile-menu");
  const iconOpen = document.getElementById("icon-open");
  const iconClose = document.getElementById("icon-close");

  if (menuButton && menu) {
    menuButton.addEventListener("click", function () {
      const isOpen = !menu.classList.contains("hidden");
      menu.classList.toggle("hidden");
      iconOpen.classList.toggle("hidden");
      iconClose.classList.toggle("hidden");
      menuButton.setAttribute("aria-expanded", String(!isOpen));
    });
  }

  if (nav) {
    const onScroll = function () {
      if (window.scrollY > 4) {
        nav.classList.add("shadow-soft");
      } else {
        nav.classList.remove("shadow-soft");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Scroll-reveal for elements marked [data-reveal], respecting reduced motion.
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length && !prefersReducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.remove("opacity-0");
    });
  }
})();

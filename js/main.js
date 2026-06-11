/* ============================================================
   Eden & Aaron — Wedding Website
   ============================================================ */

/* Ceremony start: 1:00 pm, Sunday 18 October 2026, Sydney (AEDT, UTC+11) */
const WEDDING_DATE = new Date("2026-10-18T13:00:00+11:00");

/* ---------- Sticky nav ---------- */
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

const onScroll = () => nav.classList.toggle("nav--scrolled", window.scrollY > 24);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("nav__links--open");
  nav.classList.toggle("nav--open", open);
  navToggle.setAttribute("aria-expanded", String(open));
});

navLinks.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    navLinks.classList.remove("nav__links--open");
    nav.classList.remove("nav--open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

/* ---------- Countdown ---------- */
const cd = {
  days: document.getElementById("cdDays"),
  hours: document.getElementById("cdHours"),
  minutes: document.getElementById("cdMinutes"),
  seconds: document.getElementById("cdSeconds"),
};

function updateCountdown() {
  const diff = WEDDING_DATE - Date.now();
  if (diff <= 0) {
    cd.days.textContent = "0";
    cd.hours.textContent = "0";
    cd.minutes.textContent = "0";
    cd.seconds.textContent = "0";
    return;
  }
  const s = Math.floor(diff / 1000);
  cd.days.textContent = String(Math.floor(s / 86400));
  cd.hours.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  cd.minutes.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  cd.seconds.textContent = String(s % 60).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal--visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("reveal--visible"));
}

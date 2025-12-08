let currentPage = 0;

function openApp(index) {
  currentPage = index;
  setTranslate(pageToTranslate(currentPage), true);
}

function goHome() {
  currentPage = 0;
  setTranslate(pageToTranslate(currentPage), true);
}


function updatePage() {
  setTranslate(pageToTranslate(currentPage), true);
}

/* CLOCK */
function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
setInterval(updateClock, 1000);
updateClock();

/* SWIPE (mouse drag) */
let startX = 0;
let currentX = 0;
let isDragging = false;
let baseTranslate = 0;

const screen = document.getElementById("screen");
const pages = document.getElementById("pages");
const maxPage = 2;

function pageToTranslate(page) {
  return -page * screen.offsetWidth;
}

function setTranslate(x, animate = false) {
  pages.style.transition = animate ? "transform 0.3s ease" : "none";
  pages.style.transform = `translateX(${x}px)`;
}

/* START */
screen.addEventListener("mousedown", e => {
  e.preventDefault();
  isDragging = true;
  startX = e.clientX;
  currentX = startX;
  baseTranslate = pageToTranslate(currentPage);
});

/* MOVE (GLOBAL) */
document.addEventListener("mousemove", e => {
  if (!isDragging) return;

  currentX = e.clientX;
  let delta = currentX - startX;

  if (
    (currentPage === 0 && delta > 0) ||
    (currentPage === maxPage && delta < 0)
  ) {
    delta *= 0.35; // resistência
  }

  setTranslate(baseTranslate + delta);
});

/* END */
document.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;

  const delta = currentX - startX;
  const threshold = screen.offsetWidth * 0.25;

  if (delta < -threshold && currentPage < maxPage) {
    currentPage++;
  } else if (delta > threshold && currentPage > 0) {
    currentPage--;
  }

  setTranslate(pageToTranslate(currentPage), true);
});

screen.addEventListener("mousedown", () => console.log("down"));
document.addEventListener("mousemove", () => console.log("move"));
document.addEventListener("mouseup", () => console.log("up"));




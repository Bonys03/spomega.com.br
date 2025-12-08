const pages = document.getElementById("pages");
let currentPage = 0;

function openApp(index) {
  currentPage = index;
  updatePage();
}

function goHome() {
  currentPage = 0;
  updatePage();
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

const maxPage = 2; // home + 2 apps

function setTranslate(x, animate = false) {
  pages.style.transition = animate ? "transform 0.3s ease" : "none";
  pages.style.transform = `translateX(${x}px)`;
}

function pageToTranslate(page) {
  return -page * screen.offsetWidth;
}

/* START */
screen.addEventListener("mousedown", e => {
  isDragging = true;
  startX = e.clientX;
  baseTranslate = pageToTranslate(currentPage);
});

/* MOVE */
screen.addEventListener("mousemove", e => {
  if (!isDragging) return;

  currentX = e.clientX;
  let delta = currentX - startX;

  // resistência nas bordas
  if (
    (currentPage === 0 && delta > 0) ||
    (currentPage === maxPage && delta < 0)
  ) {
    delta *= 0.3;
  }

  setTranslate(baseTranslate + delta);
});

/* END */
screen.addEventListener("mouseup", () => {
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

/* CANCEL (caso solte fora) */
screen.addEventListener("mouseleave", () => {
  if (!isDragging) return;
  isDragging = false;
  setTranslate(pageToTranslate(currentPage), true);
});


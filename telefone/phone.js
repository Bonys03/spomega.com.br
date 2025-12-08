const screen = document.getElementById("screen");
const swipePages = document.getElementById("swipePages");

let currentScreen = 1; // 0 = status, 1 = home
let isDragging = false;
let startX = 0;
let currentX = 0;

/* CLOCK */

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  document.getElementById("clockSmall").textContent = time;
  document.getElementById("clockBig").textContent = time;
}

setInterval(updateClock, 1000);
updateClock();

/* SWIPE ENTRE STATUS E HOME */

function screenToX(idx) {
  return -idx * screen.offsetWidth;
}

function setTranslate(x, animate = false) {
  swipePages.style.transition = animate ? "transform .3s ease" : "none";
  swipePages.style.transform = `translateX(${x}px)`;
}

// start
screen.addEventListener("mousedown", e => {
  // se algum app estiver aberto, não faz swipe
  if (document.querySelector(".app-layer.active")) return;

  isDragging = true;
  startX = e.clientX;
  currentX = startX;
});

// move
document.addEventListener("mousemove", e => {
  if (!isDragging) return;

  currentX = e.clientX;
  const delta = currentX - startX;
  const base = screenToX(currentScreen);

  setTranslate(base + delta, false);
});

// end
document.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;

  const delta = currentX - startX;
  const threshold = screen.offsetWidth * 0.25;

  if (delta < -threshold && currentScreen < 1) {
    currentScreen++;
  } else if (delta > threshold && currentScreen > 0) {
    currentScreen--;
  }

  setTranslate(screenToX(currentScreen), true);
});

// inicial
setTranslate(screenToX(currentScreen), false);

/* APPS EM OVERLAY */

function openApp(name) {
  closeApp(); // fecha qualquer outro app
  const id = "app" + capitalize(name);
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("active");
  }
}

function closeApp() {
  document.querySelectorAll(".app-layer").forEach(el => {
    el.classList.remove("active");
  });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

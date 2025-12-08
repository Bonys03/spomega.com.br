/* ===== MOCK DE JOGADORES (por enquanto) ===== */

const PLAYERS = {
  "1111": {
    name: "Agente Delta",
    messages: [
      "Você foi recrutado.",
      "Não confie na autoridade."
    ]
  },
  "2222": {
    name: "Operador Sigma",
    messages: [
      "O sistema está vulnerável.",
      "Acesso restrito aos distritos."
    ]
  }
};

let currentPlayer = null;

/* ===== RELOGIOS ===== */

function updateClocks() {
  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  document.getElementById("lockClock").textContent = time;
  document.getElementById("clockSmall").textContent = time;
  document.getElementById("clockBig").textContent = time;
}

setInterval(updateClocks, 1000);
updateClocks();

/* ===== DESBLOQUEIO ===== */

function unlock() {
  const pin = document.getElementById("pinInput").value;
  const feedback = document.getElementById("lockFeedback");

  if (!PLAYERS[pin]) {
    feedback.textContent = "Senha inválida";
    return;
  }

  feedback.textContent = "Desbloqueando...";
  currentPlayer = PLAYERS[pin];

  setTimeout(() => {
    document.getElementById("lockscreen").style.display = "none";
    document.getElementById("system").classList.remove("hidden");
    loadPlayerData();
  }, 1200);
}

function loadPlayerData() {
  document.getElementById("playerName").textContent = currentPlayer.name;

  const msgBox = document.getElementById("messagesContent");
  msgBox.innerHTML = "";

  currentPlayer.messages.forEach(m => {
    const div = document.createElement("div");
    div.className = "msg incoming";
    div.textContent = m;
    msgBox.appendChild(div);
  });
}

/* ===== APPS ===== */

function openApp(name) {
  closeApp();
  document.getElementById("app" + capitalize(name)).classList.add("active");
}

function closeApp() {
  document.querySelectorAll(".app-layer").forEach(a => {
    a.classList.remove("active");
  });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
/* ===== SWIPE STATUS ⇄ HOME ===== */

const screen = document.getElementById("screen");
const swipePages = document.getElementById("swipePages");

let currentScreen = 1; // 0 = status, 1 = home
let isDragging = false;
let startX = 0;
let currentX = 0;

function screenToX(idx) {
  return -idx * screen.offsetWidth;
}

function setTranslate(x, animate = false) {
  swipePages.style.transition = animate ? "transform 0.3s ease" : "none";
  swipePages.style.transform = `translateX(${x}px)`;
}

// inicial
setTranslate(screenToX(currentScreen), false);

// start drag
screen.addEventListener("mousedown", e => {
  // se algum app estiver aberto, não permitir swipe
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
  setTranslate(screenToX(currentScreen) + delta, false);
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

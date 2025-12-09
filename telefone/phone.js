const API_URL = "https://script.google.com/macros/s/AKfycbyell6wEMmMXRB-PazRK9n7M2dW0h3Cd5gzyCT7PPQ_3IUEM32gSC80UK2VcGLO95QMtw/exec";
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

async function unlock() {
  const pin = document.getElementById("pinInput").value;
  const feedback = document.getElementById("lockFeedback");

  if (!pin) {
    feedback.textContent = "Digite a senha";
    return;
  }

  feedback.textContent = "Verificando acesso...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "phoneUnlock",
        pin
      })
    });

    const data = await res.json();

    if (!data.success) {
      feedback.textContent = "Senha inválida";
      return;
    }

    // só nome agora
    currentPlayer = {
      name: data.player.name
    };

    // guarda o PIN para o polling
    window.playerPin = pin;

    feedback.textContent = "Desbloqueando...";

    setTimeout(() => {
      document.getElementById("lockscreen").style.display = "none";
      document.getElementById("system").classList.remove("hidden");
      currentScreen = 0;
      setTranslate(screenToX(currentScreen), false);
      loadPlayerData();
    }, 1200);

  } catch (err) {
    console.error(err);
    feedback.textContent = "Erro de conexão";
  }
}

function loadPlayerData() {
  document.getElementById("playerName").textContent = currentPlayer.name;
  const msgBox = document.getElementById("messagesContent");
  msgBox.innerHTML = "";
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

let currentScreen = 0; // 0 = status, 1 = home
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
async function pollMessages() {
  if (!window.playerPin) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "phonePollMessages",
        pin: window.playerPin
      })
    });

    const data = await res.json();
    if (!data.success || !data.messages.length) return;

    const box = document.getElementById("messagesContent");

    data.messages.forEach(m => {
      const div = document.createElement("div");
      div.className = "msg incoming";
      div.textContent = m.message;
      box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;

  } catch (err) {
    console.error(err);
  }
}
setInterval(pollMessages, 4000); // a cada 4 segundos

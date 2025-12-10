const API_URL = "https://script.google.com/macros/s/AKfycbyell6wEMmMXRB-PazRK9n7M2dW0h3Cd5gzyCT7PPQ_3IUEM32gSC80UK2VcGLO95QMtw/exec";
let currentPlayer = null;
let pollingStarted = false;
let allMessages = [];          // histórico completo
let conversations = {};        // agrupado por sender
let currentChat = null;


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
      loadMessageHistory();
    }, 1200);


  } catch (err) {
    console.error(err);
    feedback.textContent = "Erro de conexão";
  }
}

function loadPlayerData() {
  document.getElementById("playerName").textContent = currentPlayer.name;
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

    data.messages.forEach(m => {

      // 🚫 IGNORA mensagens enviadas pelo jogador (echo)
      if (m.direction === "IN") {
        return;
      }

      // adiciona ao histórico
      allMessages.push(m);

      if (!conversations[m.sender]) {
        conversations[m.sender] = [];
      }
      conversations[m.sender].push(m);

      // renderiza apenas se o chat estiver aberto
      if (currentChat === m.sender) {
        appendMessage(m.sender, m.message, m.timestamp, null, m.direction);
      }
    });

    renderConversationList();

  } catch (err) {
    console.error("Erro no polling:", err);
  }
}



async function loadMessageHistory() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "phoneGetHistory",
        pin: window.playerPin
      })
    });

    const data = await res.json();
    if (!data.success) return;

    allMessages = data.messages;

    conversations = {};
    allMessages.forEach(m => {
      if (!conversations[m.sender]) conversations[m.sender] = [];
      conversations[m.sender].push(m);
    });

    renderConversationList();

    if (!pollingStarted) {
      pollingStarted = true;
      setInterval(pollMessages, 4000);
    }

  } catch (err) {
    console.error(err);
  }
}


function appendMessage(sender, text, timestamp, container, direction) {
  const box = container || document.getElementById("chatMessages");

  if (!box) return;

  const msg = document.createElement("div");
  const isOutgoing = direction === "IN";
  msg.className = `msg ${isOutgoing ? "outgoing" : "incoming"}`;

  const from = document.createElement("div");
  from.className = "msg-sender";
  from.textContent = isOutgoing ? "Você" : (sender || "Sistema");

  const content = document.createElement("div");
  content.className = "msg-text";
  content.textContent = text;

  const time = document.createElement("div");
  time.className = "msg-time";

  const date = new Date(timestamp || Date.now());
  time.textContent = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  msg.appendChild(from);
  msg.appendChild(content);
  msg.appendChild(time);
  box.appendChild(msg);

  box.scrollTop = box.scrollHeight;
}


function renderConversationList() {
  const list = document.getElementById("conversationList");
  list.innerHTML = "";

  Object.keys(conversations).forEach(sender => {
    const msgs = conversations[sender];
    const last = msgs[msgs.length - 1];

    const div = document.createElement("div");
    div.className = "conversation-item";
    div.onclick = () => openChat(sender);

    div.innerHTML = `
      <div>
        <div class="conversation-name">${sender}</div>
        <div class="conversation-preview">${last.message.slice(0, 30)}</div>
      </div>
      <div class="conversation-time">
        ${new Date(last.timestamp).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit"
        })}
      </div>
    `;

    list.appendChild(div);
  });
}

function openChat(sender) {
  currentChat = sender;

  document.getElementById("conversationList").classList.add("hidden");
  document.getElementById("chatView").classList.remove("hidden");

  document.getElementById("chatTitle").textContent = sender;

  renderChatMessages();
}



function renderChatMessages() {
  const box = document.getElementById("chatMessages");
  box.innerHTML = "";

  conversations[currentChat].forEach(m => {
    appendMessage(m.sender, m.message, m.timestamp, box, m.direction);
  });

  box.scrollTop = box.scrollHeight;
}
function closeChat() {
  currentChat = null;

  document.getElementById("chatView").classList.add("hidden");
  document.getElementById("conversationList").classList.remove("hidden");
}

async function sendReply() {
  const text = document.getElementById("replyText").value.trim();
  if (!text || !currentChat) return;

  document.getElementById("replyText").value = "";

  const msg = {
    sender: currentChat,
    message: text,
    timestamp: Date.now(),
    direction: "IN"
  };

  // render otimista + guarda no historico local
  if (!conversations[currentChat]) {
    conversations[currentChat] = [];
  }
  conversations[currentChat].push(msg);
  allMessages.push(msg);

  appendMessage(currentChat, text, msg.timestamp, document.getElementById("chatMessages"), msg.direction);
  renderConversationList();

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "phoneSendReply",
      pin: window.playerPin,
      npc: currentChat,
      message: text
    })
  });
}

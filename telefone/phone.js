// ===============================
// CONFIG
// ===============================
const API_URL = "https://script.google.com/macros/s/AKfycbyell6wEMmMXRB-PazRK9n7M2dW0h3Cd5gzyCT7PPQ_3IUEM32gSC80UK2VcGLO95QMtw/exec";
let currentPin = null;
let conversations = {};   // { npc: [ {direction, message, timestamp} ] }
let currentNPC = null;
let pollingTimer = null;

// ===============================
// CLOCKS
// ===============================
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

// ===============================
// UNLOCK PHONE
// ===============================
async function unlockPhone() {
  const pin = document.getElementById("pinInput").value.trim();
  if (!pin) return;

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "phoneUnlock",
      pin
    })
  });

  const data = await res.json();
  if (!data.success) {
    alert("PIN inválido");
    return;
  }

  currentPin = pin;

  // 🔴 IDs corretos, de acordo com o seu HTML
  const lock = document.getElementById("lockscreen");
  const system = document.getElementById("system");

  if (lock) lock.classList.add("hidden");
  if (system) system.classList.remove("hidden");

  await loadHistory();
  startPolling();
}


// ===============================
// LOAD FULL HISTORY
// ===============================
async function loadHistory() {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "phoneGetHistory",
      pin: currentPin
    })
  });

  const data = await res.json();
  if (!data.success) return;

  conversations = {};

  data.messages.forEach(m => {
    const npc = m.sender;
    if (!conversations[npc]) conversations[npc] = [];

    conversations[npc].push({
      direction: m.direction, // IN / OUT
      message: m.message,
      timestamp: m.timestamp
    });
  });

  renderNPCList();
}

// ===============================
// NPC LIST
// ===============================
function renderNPCList() {
  const list = document.getElementById("conversationList");
  list.innerHTML = "";

  Object.keys(conversations).forEach(npc => {
    const div = document.createElement("div");
    div.className = "npc-entry";
    div.textContent = npc;
    div.onclick = () => openNPCChat(npc);
    list.appendChild(div);
  });
}

function openNPCChat(npc) {
  currentNPC = npc;

  document.getElementById("conversationList").classList.add("hidden");
  document.getElementById("chatView").classList.remove("hidden");
  document.getElementById("chatTitle").textContent = npc;

  renderChatMessages();
}

function closeChat() {
  currentNPC = null;

  document.getElementById("chatView").classList.add("hidden");
  document.getElementById("conversationList").classList.remove("hidden");
}

// ===============================
// CHAT RENDER
// ===============================
function renderChatMessages() {
  const box = document.getElementById("chatMessages");
  box.innerHTML = "";

  const msgs = conversations[currentNPC] || [];

  msgs.forEach(m => {
    if (m.direction === "IN") {
      appendOutgoing("Você", m.message, m.timestamp, box);
    } else {
      appendIncoming(currentNPC, m.message, m.timestamp, box);
    }
  });

  box.scrollTop = box.scrollHeight;
}

// ===============================
// SEND REPLY
// ===============================
async function sendReply() {
  const field = document.getElementById("replyText");
  const text = field.value.trim();
  if (!text || !currentNPC) return;

  field.value = "";

  // render otimista
  conversations[currentNPC].push({
    direction: "IN",
    message: text,
    timestamp: Date.now()
  });

  renderChatMessages();

  // envia ao backend
  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "phoneSendReply",
      pin: currentPin,
      npc: currentNPC,
      message: text
    })
  });
}

// ===============================
// POLLING (ONLY OUT)
// ===============================
function startPolling() {
  if (pollingTimer) return;

  pollingTimer = setInterval(async () => {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "phonePollMessages",
        pin: currentPin
      })
    });

    const data = await res.json();
    if (!data.success || !data.messages.length) return;

    data.messages.forEach(m => {
      const npc = m.sender;
      if (!conversations[npc]) conversations[npc] = [];

      conversations[npc].push({
        direction: "OUT",
        message: m.message,
        timestamp: m.timestamp
      });

      if (currentNPC === npc) {
        renderChatMessages();
      }
    });

    renderNPCList();
  }, 3000);
}

// ===============================
// MESSAGE BUILDERS
// ===============================
function appendIncoming(sender, msg, time, box) {
  const div = document.createElement("div");
  div.className = "msg incoming";

  div.innerHTML = `
    <div class="msg-sender">${sender}</div>
    <div class="msg-text">${msg}</div>
    <div class="msg-time">${formatTime(time)}</div>
  `;

  box.appendChild(div);
}

function appendOutgoing(sender, msg, time, box) {
  const div = document.createElement("div");
  div.className = "msg outgoing";

  div.innerHTML = `
    <div class="msg-sender">${sender}</div>
    <div class="msg-text">${msg}</div>
    <div class="msg-time">${formatTime(time)}</div>
  `;

  box.appendChild(div);
}

function formatTime(t) {
  return new Date(t).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

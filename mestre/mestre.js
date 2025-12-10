const API_URL = "https://script.google.com/macros/s/AKfycbyell6wEMmMXRB-PazRK9n7M2dW0h3Cd5gzyCT7PPQ_3IUEM32gSC80UK2VcGLO95QMtw/exec";
let adminPolling = false;
let adminPollingTimer = null;
let lastAdminTimestamp = 0;

// permite enviar com Enter no campo de resposta
document.addEventListener("DOMContentLoaded", () => {
  const npcInput = document.getElementById("npcMessage");
  if (npcInput) {
    npcInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendNPCMessage();
      }
    });
  }
});


async function loadStatus() {
  const adminToken = document.getElementById("adminToken").value;

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "adminStatus",
      adminToken
    })
  });

  const data = await res.json();
  if (!data.success) {
    alert("Token inválido");
    return;
  }

  document.getElementById("dashboard").classList.remove("hidden");
  updateUI(data.state);
  loadUsers();
}

async function setStage(stage) {
  const adminToken = document.getElementById("adminToken").value;

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "adminSetStage",
      adminToken,
      stage
    })
  });

  const data = await res.json();
  updateUI(data.state);
}

async function toggle(page, enabled) {
  const adminToken = document.getElementById("adminToken").value;

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "adminToggleAccess",
      adminToken,
      page,
      enabled
    })
  });

  const data = await res.json();
  updateUI(data.state);
}

function updateUI(state) {
  document.getElementById("stage").textContent = state.stage;

  updateStatus("civil", state.civil);
  updateStatus("distritos", state.distritos);
}

function updateStatus(name, enabled) {
  const el = document.getElementById(`status-${name}`);
  if (!el) return;

  if (enabled) {
    el.textContent = "ONLINE";
    el.className = "status on";
  } else {
    el.textContent = "BLOQUEADO";
    el.className = "status off";
  }
}

async function eventToggle(event, enabled) {
  const adminToken = document.getElementById("adminToken").value;

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "adminToggleEvent",
      adminToken,
      event,
      enabled
    })
  });

  const data = await res.json();
  updateUI(data.state);
}
async function loadUsers() {
  const adminToken = document.getElementById("adminToken").value;

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "adminListUsers",
      adminToken
    })
  });

  const data = await res.json();
  if (!data.success) return;

  const tbody = document.getElementById("userList");
  tbody.innerHTML = "";

  data.users.forEach(u => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${u.user}</td>
        <td class="password-cell">${u.password}</td>
        <td>${u.role}</td>
        <td>
            <button onclick="deleteUser('${u.user}')">DELETAR</button>
        </td>
    `;


    tbody.appendChild(tr);
  });
}
async function createUser() {
  const adminToken = document.getElementById("adminToken").value;
  const user = document.getElementById("newUser").value.trim();
  const password = document.getElementById("newPass").value.trim();
  const role = document.getElementById("newRole").value;

  if (!user || !password) {
    alert("Informe usuário e senha");
    return;
  }

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "adminCreateUser",
      adminToken,
      user,
      password,
      role
    })
  });

  document.getElementById("newUser").value = "";
  document.getElementById("newPass").value = "";

  loadUsers();
}
async function deleteUser(user) {
  const adminToken = document.getElementById("adminToken").value;

  if (!confirm(`Remover usuário ${user}?`)) return;

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "adminDeleteUser",
      adminToken,
      user
    })
  });

  loadUsers();
}
async function sendMessage() {
  const adminToken = document.getElementById("adminToken").value;
  const pin = document.getElementById("msgPin").value.trim();
  const message = document.getElementById("msgText").value.trim();
  const sender = document.getElementById("msgSender").value.trim() || "Sistema";

  if (!pin || !message) {
    alert("Informe o PIN e a mensagem");
    return;
  }

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "adminSendMessage",
      adminToken,
      pin,
      sender,       // ✅ novo campo
      message
    })
  });

  document.getElementById("msgText").value = "";
}

async function loadConversations() {
  const adminToken = document.getElementById("adminToken").value;
  const pin = document.getElementById("lookupPin").value.trim();

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "adminGetConversation",
      adminToken,
      pin
    })
  });

  const data = await res.json();
  if (!data.success) {
    alert("PIN inválido ou sem mensagens");
    return;
  }
  if (Object.keys(data.conversations).length === 0) {
  alert("Esse jogador ainda não possui mensagens");
  return;
  }

  window.currentPin = pin;
  window.currentNPC = null;
  window.currentConversations = data.conversations;
  lastAdminTimestamp = getLastTimestamp(window.currentConversations);

  if (!adminPolling) {
  adminPolling = true;
  adminPollingTimer = setInterval(pollAdminMessages, 3000);
  }

  renderPlayerNPCs(data.conversations);
}

function renderPlayerNPCs(conversations) {
  const npcList = document.getElementById("npcList");
  npcList.innerHTML = "";

  window.currentConversations = conversations;

  Object.keys(conversations).forEach(npc => {
    const div = document.createElement("div");
    if (npc === "Jogador") return;
    div.className = "list-item";
    div.textContent = npc;
    div.onclick = () => openNPCChat(npc);
    npcList.appendChild(div);
  });
}

function openNPCChat(npc) {
  window.currentNPC = npc;

  document.getElementById("chatTitle").textContent = npc;

  const historyDiv = document.getElementById("chatHistory");
  historyDiv.innerHTML = "";

  const msgs = currentConversations[npc];

  msgs.forEach(m => {
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble " + (m.direction === "OUT" ? "out" : "in");
    bubble.innerHTML = `
      <strong>${m.direction === "OUT" ? npc : "Jogador"}:</strong><br>
      ${m.message}<br>
      <span style="font-size:10px; opacity:0.7;">
        ${new Date(m.timestamp).toLocaleTimeString("pt-BR")}
      </span>
    `;
    historyDiv.appendChild(bubble);
  });

  historyDiv.scrollTop = historyDiv.scrollHeight;
}

function getLastTimestamp(conversations) {
  let maxTs = 0;
  Object.values(conversations || {}).forEach(list => {
    const last = list[list.length - 1];
    if (last && Number(last.timestamp) > maxTs) {
      maxTs = Number(last.timestamp);
    }
  });
  return maxTs;
}

async function sendNPCMessage() {
  if (!window.currentNPC || !window.currentPin) return;

  const adminToken = document.getElementById("adminToken").value;
  const text = document.getElementById("npcMessage").value.trim();
  if (!text) return;

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "adminSendMessage",
      adminToken,
      pin: currentPin,
      sender: currentNPC,
      message: text
    })
  });

  // Atualiza o histórico local do painel
  window.currentConversations[currentNPC].push({
    sender: currentNPC,
    direction: "OUT",
    message: text,
    timestamp: Date.now()
  });
  lastAdminTimestamp = getLastTimestamp(currentConversations);

  document.getElementById("npcMessage").value = "";

  openNPCChat(currentNPC);
}

async function pollAdminMessages() {
  if (!window.currentPin) return;

  const adminToken = document.getElementById("adminToken").value;
  const lastTimestamp = lastAdminTimestamp;

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "adminPollMessages",
      adminToken,
      pin: currentPin,
      lastTimestamp
    })
  });

  const data = await res.json();
  if (!data.success || !data.messages.length) return;

  data.messages.forEach(m => {
    // garante estrutura
    if (!currentConversations[m.sender]) {
      currentConversations[m.sender] = [];
      renderPlayerNPCs(currentConversations);
    }

    currentConversations[m.sender].push({
      sender: "Jogador",
      direction: "IN",
      message: m.message,
      timestamp: m.timestamp
    });

    // se chat aberto, renderiza na hora
    if (currentNPC === m.sender) {
      openNPCChat(m.sender);
    }
  });

  lastAdminTimestamp = getLastTimestamp(currentConversations);
}

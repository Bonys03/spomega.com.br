const API_URL = "https://script.google.com/macros/s/AKfycbyell6wEMmMXRB-PazRK9n7M2dW0h3Cd5gzyCT7PPQ_3IUEM32gSC80UK2VcGLO95QMtw/exec";

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



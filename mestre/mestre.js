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
}

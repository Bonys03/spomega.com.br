// ===== CONFIGURAÇÃO BÁSICA =====

// troque por uma frase grande e difícil de adivinhar
const SECRET = "MUDE_PARA_UMA_FRASE_SECRETA_GRANDE_AQUI";
const ADMIN_TOKEN = "OMEGA-MASTER-KEY-999";
const SHEET_ID = "1uOl_ovZ-Ap6E6CkK_VSuKkyRocRmxz7qnhzlFmHj-J8";



// mesmos usuários que você usava no front, agora só no back
const USERS = {
  "civil.name": {
    password: "CIVIL-42",
    level: "CIVIL"
  },
  "beta.tech": {
    password: "BETA-113",
    level: "BETA"
  },
  "alpha.ops": {
    password: "ALPHA-739",
    level: "ALPHA"
  },
  "omega.dir": {
    password: "OMEGA-42",
    level: "OMEGA"
  }
};

function getUsersSheet() {
  return SpreadsheetApp
    .openById(SHEET_ID)
    .getSheetByName("users");
}

function getPhonePlayersSheet() {
  return SpreadsheetApp
    .openById(SHEET_ID)
    .getSheetByName("phone_players");
}

function getPhoneMessagesSheet() {
  return SpreadsheetApp
    .openById(SHEET_ID)
    .getSheetByName("phone_messages");
}


// quais níveis podem acessar quais páginas
const ACCESS = {
  CIVIL: ["civil", "distritos"],
  BETA: ["civil", "distritos"],
  ALPHA: ["civil", "distritos"],
  OMEGA: ["civil", "distritos"]
};

// tempo máximo de sessão (em ms) — aqui: 8h
const MAX_SESSION_AGE_MS = 8 * 60 * 60 * 1000;


// ===== ROTEADOR PRINCIPAL =====

function doPost(e) {
  let data = {};
  try {
    data = JSON.parse(e.postData.contents || "{}");
  } catch {
    return jsonResponse({ success: false, error: "JSON inválido" });
  }

  const action = data.action;

  if (action === "login") return handleLogin(data);
  if (action === "checkAccess") return handleCheckAccess(data);
  if (action === "adminStatus") return adminStatus(data);
  if (action === "adminSetStage") return adminSetStage(data);
  if (action === "adminToggleAccess") return adminToggleAccess(data);
  if (action === "adminToggleEvent") return adminToggleEvent(data);
  if (action === "adminCreateUser") return adminCreateUser(data);
  if (action === "adminListUsers") return adminListUsers(data);
  if (action === "adminDeleteUser") return adminDeleteUser(data);
  if (action === "phoneUnlock") return phoneUnlock(data);
  if (action === "adminSendMessage") return adminSendMessage(data);
  if (action === "phonePollMessages") return phonePollMessages(data);
  if (action === "phoneGetHistory") return phoneGetHistory(data);
  if (action === "phoneSendReply")     return phoneSendReply(data);
  if (action === "adminGetConversation") return adminGetConversation(data);
  if (action === "adminPollMessages") return adminPollMessages(data);


  return jsonResponse({ success: false, error: "Ação inválida" });
}

// ====== MESTRE ======

function getGameState() {
  const props = PropertiesService.getScriptProperties();
  return {
    stage: Number(props.getProperty("stage") || 1),
    civil: props.getProperty("civil") !== "false",
    distritos: props.getProperty("distritos") !== "false",

    blackout: props.getProperty("blackout") === "true",
    alarm: props.getProperty("alarm") === "true"
  };
}


function saveGameState(state) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("stage", state.stage);
  props.setProperty("civil", state.civil);
  props.setProperty("distritos", state.distritos);
  props.setProperty("blackout", state.blackout);
  props.setProperty("alarm", state.alarm);
  
}

function adminStatus(data) {
  if (!isAdmin(data.adminToken)) {
    return jsonResponse({ success: false, error: "forbidden" });
  }

  return jsonResponse({
    success: true,
    state: getGameState()
  });
}

function adminSetStage(data) {
  if (!isAdmin(data.adminToken)) {
    return jsonResponse({ success: false, error: "forbidden" });
  }

  const state = getGameState();
  state.stage = Number(data.stage);
  saveGameState(state);

  return jsonResponse({
    success: true,
    state: state
  });
}

function adminToggleAccess(data) {
  if (!isAdmin(data.adminToken)) {
    return jsonResponse({ success: false, error: "forbidden" });
  }

  const state = getGameState();
  state[data.page] = Boolean(data.enabled);
  saveGameState(state);

  return jsonResponse({
    success: true,
    state: state
  });
}

function adminToggleEvent(data) {
  if (!isAdmin(data.adminToken)) {
    return jsonResponse({ success: false });
  }

  const state = getGameState();
  state[data.event] = Boolean(data.enabled);
  saveGameState(state);

  return jsonResponse({ success: true, state });
}

function adminCreateUser(data) {
  if (!isAdmin(data.adminToken)) {
    return jsonResponse({ success: false });
  }

  const sheet = getUsersSheet();
  sheet.appendRow([data.user, data.password, data.role]);

  return jsonResponse({ success: true });
}

function adminListUsers(data) {
  if (!isAdmin(data.adminToken)) {
    return jsonResponse({ success: false });
  }

  const sheet = getUsersSheet();
  const rows = sheet.getDataRange().getValues();

  const users = rows.slice(1).map(r => ({
  user: String(r[0]).trim(),
  password: String(r[1]).trim(),
  role: String(r[2]).trim()
  }));


  return jsonResponse({ success: true, users });
}

function adminDeleteUser(data) {
  if (!isAdmin(data.adminToken)) {
    return jsonResponse({ success: false });
  }

  const sheet = getUsersSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.user) {
      sheet.deleteRow(i + 1);
      break;
    }
  }

  return jsonResponse({ success: true });
}

function phoneUnlock(data) {
  const pin = String(data.pin || "").trim();

  const sheet = getPhonePlayersSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const sheetPin = String(rows[i][0]).trim();   // col A: pin

    if (sheetPin === pin) {
      const name = String(rows[i][1]).trim();     // col B: name

      return jsonResponse({
        success: true,
        player: {
          name: name
        }
      });
    }
  }

  return jsonResponse({
    success: false,
    error: "invalid_pin"
  });
}

function adminSendMessage(data) {
  if (!isAdmin(data.adminToken)) {
    return jsonResponse({ success: false });
  }

  const pin = String(data.pin || "").trim();
  const message = String(data.message || "").trim();
  const sender = String(data.sender || "Sistema").trim();
  const direction = "OUT";

  if (!pin || !message) {
    return jsonResponse({ success: false, error: "invalid_data" });
  }

  const sheet = getPhoneMessagesSheet();
  const id = sheet.getLastRow();

  sheet.appendRow([
    id,
    pin,
    sender,
    direction,
    message,
    Date.now(),
    false
  ]);

  return jsonResponse({ success: true });
}

function phoneSendReply(data) {
  const pin = String(data.pin || "").trim();
  const npc = String(data.npc || "").trim();
  const message = String(data.message || "").trim();

  if (!pin || !npc || !message) {
    return jsonResponse({ success: false, error: "invalid_data" });
  }

  const sheet = getPhoneMessagesSheet();
  const id = sheet.getLastRow();

  sheet.appendRow([
    id,
    pin,
    npc,        // conversa com o NPC (mantÇ¸m o agrupamento)
    "IN",       // direÇ·Çåo: jogador -> NPC
    message,
    Date.now(),
    false       // ainda nÇø marcado como entregue
  ]);

  return jsonResponse({ success: true });
}

function adminGetConversation(data) {
  if (!isAdmin(data.adminToken)) return jsonResponse({ success: false });

  const pin = String(data.pin || "").trim();
  const sheet = getPhoneMessagesSheet();
  const rows = sheet.getDataRange().getValues();

  const conversations = {};

  for (let i = 1; i < rows.length; i++) {
    const rowPin = String(rows[i][1]).trim();
    if (rowPin !== pin) continue;

    const npc = rows[i][2];

    if (!conversations[npc]) conversations[npc] = [];

    conversations[npc].push({
      sender: rows[i][2],
      direction: rows[i][3],
      message: rows[i][4],
      timestamp: rows[i][5]
    });
  }

  Object.keys(conversations).forEach(npc => {
    conversations[npc].sort((a, b) => a.timestamp - b.timestamp);
  });

  return jsonResponse({
    success: true,
    conversations
  });
}

function adminPollMessages(data) {
  if (!isAdmin(data.adminToken)) return jsonResponse({ success: false });

  const pin = String(data.pin || "").trim();
  const lastTs = Number(data.lastTimestamp || 0);
  if (!pin) return jsonResponse({ success: false });

  const sheet = getPhoneMessagesSheet();
  const rows = sheet.getDataRange().getValues();

  const messages = [];

  for (let i = 1; i < rows.length; i++) {
    const rowPin = String(rows[i][1]).trim();
    if (rowPin !== pin) continue;

    const ts = Number(rows[i][5]);
    if (ts <= lastTs) continue;

    // retornamos apenas mensagens do jogador para o mestre
    if (String(rows[i][3]) !== "IN") continue;

    messages.push({
      sender: rows[i][2],
      direction: rows[i][3],
      message: rows[i][4],
      timestamp: rows[i][5]
    });
  }

  messages.sort((a, b) => a.timestamp - b.timestamp);

  return jsonResponse({
    success: true,
    messages
  });
}


function phonePollMessages(data) {
  const pin = String(data.pin || "").trim();
  if (!pin) return jsonResponse({ success: false });

  const sheet = getPhoneMessagesSheet();
  const rows = sheet.getDataRange().getValues();
  const newMessages = [];

  for (let i = 1; i < rows.length; i++) {
    if (
      String(rows[i][1]).trim() === pin &&
      rows[i][6] !== true
    ) {
      newMessages.push({
        id: rows[i][0],
        sender: rows[i][2],
        direction: rows[i][3],
        message: rows[i][4],
        timestamp: rows[i][5]
      });

      sheet.getRange(i + 1, 7).setValue(true);
    }
  }

  return jsonResponse({
    success: true,
    messages: newMessages
  });
}



function phoneGetHistory(data) {
  const pin = String(data.pin || "").trim();
  if (!pin) return jsonResponse({ success: false });

  const sheet = getPhoneMessagesSheet();
  const rows = sheet.getDataRange().getValues();
  const history = [];

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() !== pin) continue;

    history.push({
      id: rows[i][0],
      sender: rows[i][2],        // ✅ sender
      direction: rows[i][3],     // ✅ IN / OUT
      message: rows[i][4],       // ✅ message
      timestamp: rows[i][5]      // ✅ timestamp
    });

    sheet.getRange(i + 1, 7).setValue(true); // delivered
  }

  history.sort((a, b) => a.timestamp - b.timestamp);

  return jsonResponse({
    success: true,
    messages: history
  });
}




// ===== LOGIN =====

function handleLogin(data) {
  const user = String(data.user || "").trim();
  const pass = String(data.pass || "").trim();

  const sheet = getUsersSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const sheetUser = String(rows[i][0]).trim();
    const sheetPass = String(rows[i][1]).trim();
    const role = String(rows[i][2]).trim();

    if (sheetUser === user && sheetPass === pass) {
      return issueToken(user, role);
    }
  }

  return jsonResponse({
    success: false,
    message: "Credenciais inválidas"
  });
}

function issueToken(user, role) {
  const now = Date.now();
  const payload = `${user}|${role}|${now}`;

  const sig = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(payload, SECRET)
  );

  return jsonResponse({
    success: true,
    token: payload + "." + sig,
    level: role
  });
}



// ===== CHECK ACCESS =====

function handleCheckAccess(data) {
  const token = data.token || "";
  const page = data.page || "";

  const verified = verifyToken(token);
  if (!verified.ok) {
    return jsonResponse({
      success: false,
      status: "unauthenticated"
    });
  }

  const level = verified.level;
  const allowedByRole = (ACCESS[level] || []).includes(page);
  if (!allowedByRole) {
    return jsonResponse({
      success: true,
      status: "forbidden"
    });
  }

  const state = getGameState();

  if (page === "civil" && !state.civil) {
    return jsonResponse({
      success: true,
      status: "locked"
    });
  }

  if (page === "distritos" && !state.distritos) {
    return jsonResponse({
      success: true,
      status: "locked"
    });
  }

  return jsonResponse({
    success: true,
    status: "ok",
    level
  });
}



// ===== VERIFICAÇÃO DO TOKEN =====

function verifyToken(token) {
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing_token" };
  }

  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) {
    return { ok: false, reason: "invalid_format" };
  }

  const payload = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);

  const expectedSig = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(payload, SECRET)
  );

  if (signature !== expectedSig) {
    return { ok: false, reason: "bad_signature" };
  }

  const parts = payload.split("|");
  if (parts.length !== 3) {
    return { ok: false, reason: "invalid_payload" };
  }

  const user = parts[0];
  const level = parts[1];
  const issuedAt = Number(parts[2] || "0");

  if (!issuedAt || isNaN(issuedAt)) {
    return { ok: false, reason: "invalid_timestamp" };
  }

  if (Date.now() - issuedAt > MAX_SESSION_AGE_MS) {
    return { ok: false, reason: "expired" };
  }

  return {
    ok: true,
    user: user,
    level: level,
    issuedAt: issuedAt
  };
}

function isAdmin(token) {
  return token === ADMIN_TOKEN;
}



// ===== RESPOSTA JSON =====

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

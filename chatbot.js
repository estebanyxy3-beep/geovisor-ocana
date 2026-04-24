const chatbotState = {
  activeLayer: null,
  activeModule: "Inicio",
  selectedFeature: null,
  chatHistory: []
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function saveHistory() {
  sessionStorage.setItem(
    "geovisor_chat_history",
    JSON.stringify(chatbotState.chatHistory)
  );
}

function loadHistory() {
  const saved = sessionStorage.getItem("geovisor_chat_history");
  if (saved) {
    chatbotState.chatHistory = JSON.parse(saved);
  }
}

function addToHistory(role, content) {
  chatbotState.chatHistory.push({
    role,
    content,
    date: new Date().toISOString()
  });
  saveHistory();
}

function answerWithRules(userMessage) {
  const msg = normalizeText(userMessage);

  if (msg === "hola" || msg.includes("hola")) {
    return "Hola. Soy GeoBot, el asistente del GeoVisor Ocaña. Puedo ayudarte con riesgo, POT, POMCA y participación ciudadana.";
  }

  if (msg.includes("que es el geovisor") || msg.includes("que es geovisor ocana")) {
    return "El GeoVisor Ocaña es una herramienta web para consultar información territorial y temática del municipio.";
  }

  if (msg.includes("que es el pot") || msg.includes("que es un pot")) {
    return "El POT es el Plan de Ordenamiento Territorial. Sirve para definir cómo se organiza el suelo del municipio.";
  }

  if (msg.includes("como uso el mapa") || msg.includes("como funciona el mapa")) {
    return "Puedes entrar al módulo de Riesgo, activar capas, cambiar el mapa base y hacer clic en las zonas para consultar información.";
  }

  if (msg.includes("quien hizo esto") || msg.includes("quien hizo el geovisor")) {
    return "Este geovisor fue desarrollado como proyecto académico para apoyar la comprensión del territorio en Ocaña.";
  }

  if (msg.includes("modulo activo")) {
    return chatbotState.activeModule
      ? `El módulo activo es: ${chatbotState.activeModule}.`
      : "No detecto un módulo activo.";
  }

  if (msg.includes("capa activa")) {
    return chatbotState.activeLayer
      ? `La capa activa actual es: ${chatbotState.activeLayer}.`
      : "En este momento no detecto una capa activa.";
  }

  return null;
}

async function askBackend(userMessage) {
  const payload = {
    message: userMessage,
    context: {
      activeLayer: chatbotState.activeLayer,
      activeModule: chatbotState.activeModule,
      selectedFeature: chatbotState.selectedFeature,
      chatHistory: chatbotState.chatHistory.slice(-8)
    }
  };

  const response = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Error consultando el backend");
  }

  const data = await response.json();
  return data.reply || "No pude responder en este momento.";
}

function appendMessage(text, className) {
  const messages = document.getElementById("chatMessages");
  if (!messages) return;

  const div = document.createElement("div");
  div.className = className;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function renderSavedHistory() {
  const messages = document.getElementById("chatMessages");
  if (!messages) return;

  messages.innerHTML = "";

  if (!chatbotState.chatHistory.length) {
    appendMessage(
      "Hola. Soy GeoBot, el asistente del GeoVisor Ocaña. ¿En qué puedo ayudarte?",
      "bot-message"
    );
    return;
  }

  chatbotState.chatHistory.forEach((item) => {
    appendMessage(
      item.content,
      item.role === "user" ? "user-message" : "bot-message"
    );
  });
}

async function processUserMessage(text) {
  addToHistory("user", text);

  const localAnswer = answerWithRules(text);
  if (localAnswer) {
    addToHistory("assistant", localAnswer);
    return localAnswer;
  }

  try {
    const reply = await askBackend(text);
    addToHistory("assistant", reply);
    return reply;
  } catch (error) {
    console.error(error);
    const fallback =
      "No pude conectarme con el servicio del chatbot en este momento.";
    addToHistory("assistant", fallback);
    return fallback;
  }
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const text = input?.value.trim();

  if (!text) return;

  appendMessage(text, "user-message");
  input.value = "";

  appendMessage("Escribiendo...", "bot-message typing-message");

  const reply = await processUserMessage(text);

  const messages = document.getElementById("chatMessages");
  const typing = messages?.querySelector(".typing-message");
  if (typing) typing.remove();

  appendMessage(reply, "bot-message");
}

function initChatbot() {
  loadHistory();
  renderSavedHistory();

  const openBtns = document.querySelectorAll(".open-chatbot-btn");
  const closeBtn = document.getElementById("closeChatbotBtn");
  const chatWindow = document.getElementById("chatWindow");
  const sendBtn = document.getElementById("sendChatBtn");
  const input = document.getElementById("chatInput");

  openBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      chatWindow?.classList.remove("hidden");
      renderSavedHistory();
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      chatWindow?.classList.add("hidden");
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  }

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }
}

window.updateChatbotContext = function ({ activeLayer, activeModule, selectedFeature }) {
  if (activeLayer !== undefined) chatbotState.activeLayer = activeLayer;
  if (activeModule !== undefined) chatbotState.activeModule = activeModule;
  if (selectedFeature !== undefined) chatbotState.selectedFeature = selectedFeature;
};

document.addEventListener("DOMContentLoaded", initChatbot);

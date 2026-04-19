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
  sessionStorage.setItem("geovisor_chat_history", JSON.stringify(chatbotState.chatHistory));
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

function getFeatureSummary(feature) {
  if (!feature || !feature.properties) return null;

  const props = feature.properties;
  const entries = Object.entries(props).slice(0, 8);

  if (!entries.length) return null;

  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
}

function answerWithRules(userMessage) {
  const msg = normalizeText(userMessage);

  if (msg.includes("hola")) {
    return "Hola. Soy GeoBot, el asistente del GeoVisor Ocaña. Puedo ayudarte con riesgo, POT, POMCA y participación ciudadana.";
  }

  if (msg.includes("que es el geovisor") || msg.includes("que es geovisor ocana")) {
    return "El GeoVisor Ocaña es una herramienta web para consultar información territorial y ambiental del municipio.";
  }

  if (msg.includes("como uso el mapa") || msg.includes("como funciona el mapa")) {
    return "Puedes entrar al módulo de Riesgo, activar capas, cambiar el mapa base y hacer clic en las zonas para consultar información.";
  }

  if (msg.includes("quien hizo esto") || msg.includes("quien hizo el geovisor")) {
    return "Este geovisor fue desarrollado como proyecto académico para apoyar la comprensión del territorio en Ocaña.";
  }

  if (msg.includes("capa activa") || msg.includes("que capa estoy viendo")) {
    return chatbotState.activeLayer
      ? `La capa activa actual es: ${chatbotState.activeLayer}.`
      : "En este momento no detecto una capa activa.";
  }

  if (msg.includes("modulo activo")) {
    return chatbotState.activeModule
      ? `El módulo activo es: ${chatbotState.activeModule}.`
      : "No detecto un módulo activo.";
  }

  if (
    msg.includes("que significa esta zona") ||
    msg.includes("que significa este poligono") ||
    msg.includes("que estoy seleccionando")
  ) {
    const summary = getFeatureSummary(chatbotState.selectedFeature);
    return summary
      ? `La entidad seleccionada contiene esta información: ${summary}.`
      : "No detecto una entidad seleccionada en el mapa.";
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
    const fallback = "No pude conectarme con el servicio del chatbot en este momento.";
    addToHistory("assistant", fallback);
    return fallback;
  }
}

function appendMessage(text, className) {
  const messages = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = className;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  appendMessage(text, "user-message");
  input.value = "";

  appendMessage("Escribiendo...", "bot-message typing-message");

  const reply = await processUserMessage(text);

  const typing = document.querySelector(".typing-message");
  if (typing) typing.remove();

  appendMessage(reply, "bot-message");
}

function initChatbot() {
  loadHistory();

  const openBtn = document.getElementById("openChatbotBtn");
  const closeBtn = document.getElementById("closeChatbotBtn");
  const chatWindow = document.getElementById("chatWindow");
  const sendBtn = document.getElementById("sendChatBtn");
  const input = document.getElementById("chatInput");

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      chatWindow.classList.remove("hidden");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      chatWindow.classList.add("hidden");
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

  const navButtons = document.querySelectorAll(".nav-item");
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      chatbotState.activeModule = btn.textContent.trim();
    });
  });
}

window.updateChatbotContext = function ({ activeLayer, activeModule, selectedFeature }) {
  if (activeLayer !== undefined) chatbotState.activeLayer = activeLayer;
  if (activeModule !== undefined) chatbotState.activeModule = activeModule;
  if (selectedFeature !== undefined) chatbotState.selectedFeature = selectedFeature;
};

document.addEventListener("DOMContentLoaded", initChatbot);

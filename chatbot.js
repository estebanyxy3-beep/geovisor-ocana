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
    "vaoi_chat_history",
    JSON.stringify(chatbotState.chatHistory)
  );
}

function loadHistory() {
  const saved = sessionStorage.getItem("vaoi_chat_history");
  if (saved) {
    try {
      chatbotState.chatHistory = JSON.parse(saved);
    } catch (e) {
      chatbotState.chatHistory = [];
    }
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
    return "Hola. Soy GeoBot, el asistente de VAOI, Visión Ambiental, Ocaña Interactiva. Puedo ayudarte con riesgo, POT, POMCA, participación y accidentabilidad.";
  }

  if (msg.includes("que es vaoi") || msg.includes("que significa vaoi")) {
    return "VAOI significa Visión Ambiental, Ocaña Interactiva. Es una plataforma para consultar información territorial y temática del municipio.";
  }

  if (msg.includes("que es el pot") || msg.includes("que es un pot")) {
    return "El POT es el Plan de Ordenamiento Territorial. Sirve para organizar el suelo del municipio, definir usos y orientar el desarrollo territorial.";
  }

  if (msg.includes("que es el pomca")) {
    return "El POMCA es el Plan de Ordenación y Manejo de Cuencas. Sirve para orientar la planificación ambiental y el manejo de los recursos hídricos.";
  }

  if (msg.includes("accidentabilidad") || msg.includes("transito") || msg.includes("vial")) {
    return "El módulo de Accidentabilidad permitirá consultar información sobre siniestros viales, movilidad, indicadores y seguridad vial.";
  }

  if (msg.includes("como uso el mapa") || msg.includes("como funciona el mapa")) {
    return "En el módulo de Riesgo puedes activar capas, cambiar el mapa base y hacer clic sobre los polígonos para consultar información.";
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

  if (msg.includes("riesgo")) {
    return "En Mapas de Riesgo puedes consultar amenazas, exposición y riesgo para distintos fenómenos del territorio.";
  }

  if (msg.includes("participacion")) {
    return "En el módulo de Participación podrás consultar procesos comunitarios, espacios de diálogo y mecanismos de intervención ciudadana.";
  }

  if (msg.includes("buenas") || msg.includes("buen dia") || msg.includes("buenos dias")) {
    return "¡Hola! Estoy listo para ayudarte con información de VAOI.";
  }

  return "Puedo ayudarte con preguntas sobre VAOI, el módulo de Riesgo, POT, POMCA, Participación o Accidentabilidad. También puedes preguntarme cuál es el módulo o la capa activa.";
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
      "Hola. Soy GeoBot, el asistente de VAOI. ¿En qué puedo ayudarte?",
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
  const reply = answerWithRules(text);
  addToHistory("assistant", reply);
  return reply;
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  appendMessage(text, "user-message");
  input.value = "";

  appendMessage("Escribiendo...", "bot-message typing-message");

  const reply = await processUserMessage(text);

  const messages = document.getElementById("chatMessages");
  const typing = messages ? messages.querySelector(".typing-message") : null;
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
      if (chatWindow) {
        chatWindow.classList.remove("hidden");
      }
      renderSavedHistory();
    });
  });

  if (closeBtn && chatWindow) {
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
}

window.updateChatbotContext = function ({ activeLayer, activeModule, selectedFeature }) {
  if (activeLayer !== undefined) chatbotState.activeLayer = activeLayer;
  if (activeModule !== undefined) chatbotState.activeModule = activeModule;
  if (selectedFeature !== undefined) chatbotState.selectedFeature = selectedFeature;
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChatbot);
} else {
  initChatbot();
}

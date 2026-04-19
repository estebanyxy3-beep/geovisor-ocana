const chatbotState = {
  activeLayer: null,
  activeModule: null,
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

export function updateChatbotContext({ activeLayer, activeModule, selectedFeature }) {
  if (activeLayer !== undefined) chatbotState.activeLayer = activeLayer;
  if (activeModule !== undefined) chatbotState.activeModule = activeModule;
  if (selectedFeature !== undefined) chatbotState.selectedFeature = selectedFeature;
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

  const faq = {
    "hola": "Hola. Soy GeoBot, el asistente del GeoVisor Ocaña. Puedo ayudarte a entender capas, riesgos, ordenamiento territorial y participación ciudadana.",
    "que es el geovisor ocana": "El GeoVisor Ocaña es una plataforma web interactiva para consultar información territorial, ambiental y de riesgo del municipio de Ocaña.",
    "que es el geovisor": "El GeoVisor Ocaña es una plataforma web interactiva para consultar información territorial, ambiental y de riesgo del municipio de Ocaña.",
    "como uso el mapa": "Puedes activar capas, mover el mapa, hacer clic sobre zonas o puntos y consultar la información asociada en los popups.",
    "como funciona el mapa": "Puedes activar capas, mover el mapa, hacer clic sobre zonas o puntos y consultar la información asociada en los popups.",
    "quien hizo esto": "Este geovisor fue desarrollado como proyecto académico por estudiantes de Ingeniería Ambiental de la UFPSO.",
    "quien hizo el geovisor": "Este geovisor fue desarrollado como proyecto académico por estudiantes de Ingeniería Ambiental de la UFPSO."
  };

  if (faq[msg]) return faq[msg];

  if (msg.includes("capa activa") || msg.includes("que capa estoy viendo")) {
    return chatbotState.activeLayer
      ? `La capa activa actual es: ${chatbotState.activeLayer}.`
      : "En este momento no detecto una capa activa.";
  }

  if (msg.includes("modulo activo")) {
    return chatbotState.activeModule
      ? `El módulo activo es: ${chatbotState.activeModule}.`
      : "En este momento no detecto un módulo activo.";
  }

  if (
    msg.includes("que estoy seleccionando") ||
    msg.includes("que significa este punto") ||
    msg.includes("que significa este poligono") ||
    msg.includes("que significa esta zona")
  ) {
    const summary = getFeatureSummary(chatbotState.selectedFeature);
    return summary
      ? `La entidad seleccionada contiene esta información: ${summary}.`
      : "No detecto un elemento seleccionado en el mapa.";
  }

  return null;
}

export async function askChatbot(userMessage) {
  addToHistory("user", userMessage);

  const localAnswer = answerWithRules(userMessage);
  if (localAnswer) {
    addToHistory("assistant", localAnswer);
    return localAnswer;
  }

  const payload = {
    message: userMessage,
    context: {
      activeLayer: chatbotState.activeLayer,
      activeModule: chatbotState.activeModule,
      selectedFeature: chatbotState.selectedFeature,
      chatHistory: chatbotState.chatHistory.slice(-8)
    }
  };

  try {
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
    const reply = data.reply || "No pude responder en este momento.";

    addToHistory("assistant", reply);
    return reply;
  } catch (error) {
    console.error(error);
    const fallback = "No pude conectarme con el servicio del chatbot en este momento.";
    addToHistory("assistant", fallback);
    return fallback;
  }
}

loadHistory();

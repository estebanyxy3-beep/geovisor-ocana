import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./prompt.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

function summarizeSelectedFeature(selectedFeature) {
  if (!selectedFeature || !selectedFeature.properties) {
    return "Sin elemento seleccionado";
  }

  const props = selectedFeature.properties;
  const entries = Object.entries(props).slice(0, 8);

  if (!entries.length) return "Sin elemento seleccionado";

  return entries
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend del chatbot de GeoVisor Ocaña activo." });
});

app.post("/chat", async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ reply: "Mensaje inválido." });
    }

    const selectedFeatureSummary = summarizeSelectedFeature(context.selectedFeature);

    const systemPrompt = buildSystemPrompt({
      activeLayer: context.activeLayer || "Sin capa activa",
      activeModule: context.activeModule || "Sin módulo activo",
      selectedFeatureSummary
    });

    const history = Array.isArray(context.chatHistory)
      ? context.chatHistory.slice(-8)
      : [];

    const messages = history.map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content
    }));

    messages.push({
      role: "user",
      content: message
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 500,
      system: systemPrompt,
      messages
    });

    const reply =
      response.content
        ?.filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim() || "No pude generar una respuesta en este momento.";

    res.json({ reply });
  } catch (error) {
    console.error("Error en /chat:", error);
    res.status(500).json({
      reply: "No pude responder en este momento. Intenta nuevamente en un momento."
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

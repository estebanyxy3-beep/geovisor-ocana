# Revisión de código base: tareas propuestas

## 1) Tarea para corregir un error tipográfico
**Título:** Corregir typo en nombres de documentos de escasez hídrica

**Problema detectado:** En `docs/` existen archivos con `Escacez` en el nombre, cuando la forma correcta en español es `Escasez`.

**Alcance sugerido:**
- Renombrar:
  - `docs/37. Indice de Escacez Modal.pdf` → `docs/37. Indice de Escasez Modal.pdf`
  - `docs/38. Indice de Escacez Año Seco.pdf` → `docs/38. Indice de Escasez Año Seco.pdf`
- Actualizar cualquier enlace/referencia en `index.html`, `main.js` o documentación para evitar rutas rotas.

**Criterio de aceptación:** No quedan referencias a `Escacez` en el repositorio y los enlaces a ambos PDF abren correctamente.

---

## 2) Tarea para corregir una falla
**Título:** Integrar el frontend del chatbot con el backend `/chat`

**Problema detectado:** Existe backend funcional (`backend/server.js`) con endpoint `POST /chat` e integración con Anthropic, pero el frontend (`chatbot.js`) responde únicamente por reglas locales (`answerWithRules`) y no consume el endpoint; esto deja la funcionalidad del backend sin uso en producción.

**Alcance sugerido:**
- Implementar `fetch` desde `chatbot.js` hacia `/chat` (o URL configurable por entorno).
- Enviar `message` y `context` (`activeLayer`, `activeModule`, `selectedFeature`, `chatHistory`).
- Manejar fallback local si falla red/API (degradación controlada).
- Mostrar estados de error amigables al usuario.

**Criterio de aceptación:** Al enviar un mensaje desde la UI, se observa llamada real a `/chat` y respuesta del servidor en la conversación.

---

## 3) Tarea para corregir una discrepancia en comentarios/documentación
**Título:** Unificar nomenclatura del módulo de participación (singular/plural)

**Problema detectado:** Hay inconsistencia textual entre “Mecanismo de Participación” (singular en navegación) y “Mecanismos de Participación” (plural en lógica y etiquetas), lo que genera discrepancias de UX y documentación interna.

**Alcance sugerido:**
- Definir forma canónica (recomendado: “Mecanismos de Participación”).
- Actualizar textos visibles en `index.html`.
- Verificar coherencia con etiquetas de `main.js` y respuestas de `chatbot.js`.
- Ajustar README (si aplica) con el mismo término.

**Criterio de aceptación:** Toda la interfaz y documentación usan el mismo nombre del módulo.

---

## 4) Tarea para mejorar una prueba
**Título:** Crear pruebas unitarias para búsqueda semántica del home y reglas del chatbot

**Problema detectado:** No hay suite de pruebas automatizadas (no existe script `test` en `backend/package.json`) pese a tener lógica determinista importante (`runHomeSearch`, `answerWithRules`, normalización de texto).

**Alcance sugerido:**
- Añadir framework de test (Vitest o Jest).
- Extraer funciones puras desde `main.js`/`chatbot.js` a módulos testeables.
- Casos mínimos:
  - Búsqueda “inundación” debe navegar a `riesgo`.
  - Búsqueda no reconocida debe mostrar mensaje de no encontrado.
  - Preguntas “¿qué es VAOI?” y “módulo activo” deben retornar respuestas esperadas.
- Agregar `npm test` en scripts.

**Criterio de aceptación:** Pipeline local ejecuta `npm test` y cubre al menos casos críticos de navegación y respuestas del chatbot.

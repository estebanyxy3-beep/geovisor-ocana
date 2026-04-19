html, body {
  height: 100%;
  margin: 0;
}

* {
  box-sizing: border-box;
}

:root {
  --verde-ufpso: #1f6b45;
  --verde-ufpso-oscuro: #184f35;
  --gris-borde: #dbe3dd;
  --gris-suave: #f4f7f5;
  --texto: #1f2937;
  --texto-suave: #5b6470;
  --blanco: #ffffff;
  --sombra: 0 10px 30px rgba(0, 0, 0, 0.08);
  --radio: 18px;
}

body {
  font-family: Arial, sans-serif;
  background: var(--gris-suave);
  color: var(--texto);
}

.topbar {
  height: 72px;
  background: var(--blanco);
  border-bottom: 1px solid var(--gris-borde);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--verde-ufpso);
  color: white;
  display: grid;
  place-items: center;
  font-weight: bold;
  box-shadow: var(--sombra);
}

.brand-text h1 {
  font-size: 1.2rem;
  margin: 0 0 2px 0;
}

.brand-text p {
  font-size: 0.9rem;
  color: var(--texto-suave);
  margin: 0;
}

.nav-toggle {
  display: none;
  border: none;
  background: var(--verde-ufpso);
  color: white;
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
}

.layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  min-height: calc(100vh - 72px);
}

.sidebar {
  background: var(--blanco);
  border-right: 1px solid var(--gris-borde);
  padding: 18px;
}

.sidebar-inner {
  position: sticky;
  top: 90px;
}

.panel-title {
  font-size: 1rem;
  margin: 0 0 12px 0;
}

.panel-subtitle {
  color: var(--texto-suave);
  font-size: 0.92rem;
  line-height: 1.5;
  margin-bottom: 16px;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  border: 1px solid var(--gris-borde);
  background: #f9fbf9;
  color: var(--texto);
  border-radius: 14px;
  padding: 13px 14px;
  text-align: left;
  cursor: pointer;
  font-size: 0.96rem;
  transition: 0.2s ease;
}

.nav-item:hover,
.nav-item.active {
  background: var(--verde-ufpso);
  color: white;
  border-color: var(--verde-ufpso);
}

.content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.view {
  display: none;
}

.view.active {
  display: block;
}

.hero-card,
.content-card,
.chatbot-card {
  background: var(--blanco);
  border: 1px solid var(--gris-borde);
  border-radius: 22px;
  box-shadow: var(--sombra);
  padding: 24px;
}

.hero-card {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;
}

.eyebrow {
  display: inline-block;
  background: #e8f3ec;
  color: var(--verde-ufpso);
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.hero-text h2,
.content-card h2,
.chatbot-card h2 {
  margin-top: 0;
  margin-bottom: 12px;
}

.hero-text p,
.content-card p,
.chatbot-card p {
  color: var(--texto-suave);
  line-height: 1.7;
}

.hero-boxes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.mini-card {
  background: #f9fbf9;
  border: 1px solid var(--gris-borde);
  border-radius: 18px;
  padding: 16px;
}

.mini-card h3 {
  margin-top: 0;
  margin-bottom: 8px;
}

.mini-card p {
  margin: 0;
  color: var(--texto-suave);
  line-height: 1.5;
}

.risk-layout {
  display: grid;
  grid-template-columns: 290px 1fr 320px;
  gap: 18px;
  align-items: stretch;
}

.risk-sidebar,
.risk-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.risk-card,
.info-card {
  background: var(--blanco);
  border: 1px solid var(--gris-borde);
  border-radius: var(--radio);
  padding: 16px;
  box-shadow: var(--sombra);
}

.risk-card h3,
.info-card h3 {
  margin-top: 0;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 0.94rem;
  border-bottom: 1px dashed #e5ebe6;
}

.control-item:last-child {
  border-bottom: none;
}

details {
  border: 1px solid var(--gris-borde);
  border-radius: 14px;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: #f9fbf9;
}

details summary {
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 8px;
}

.clear-btn,
.chatbot-btn {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 12px 14px;
  background: var(--verde-ufpso);
  color: white;
  cursor: pointer;
  font-size: 0.95rem;
}

.clear-btn:hover,
.chatbot-btn:hover {
  background: var(--verde-ufpso-oscuro);
}

.risk-map-panel {
  position: relative;
  min-height: 640px;
}

#map {
  width: 100%;
  height: 100%;
  min-height: 640px;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: var(--sombra);
}

.legend-floating {
  position: absolute;
  left: 18px;
  bottom: 18px;
  z-index: 900;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid var(--gris-borde);
  border-radius: 14px;
  padding: 12px 14px;
  min-width: 220px;
  box-shadow: var(--sombra);
}

.legend-floating h4 {
  margin: 0 0 8px 0;
  font-size: 0.92rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 7px 0;
  font-size: 0.9rem;
}

.swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.chatbot-section {
  margin-top: 6px;
}

@media (max-width: 1200px) {
  .risk-layout {
    grid-template-columns: 280px 1fr;
  }

  .risk-info {
    grid-column: 1 / -1;
  }

  .hero-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .nav-toggle {
    display: inline-block;
  }

  .sidebar {
    display: none;
    border-right: none;
    border-bottom: 1px solid var(--gris-borde);
  }

  .sidebar.open {
    display: block;
  }

  .risk-layout {
    grid-template-columns: 1fr;
  }

  .risk-map-panel {
    min-height: 480px;
  }

  #map {
    min-height: 480px;
  }

  .hero-boxes {
    grid-template-columns: 1fr;
  }

  .legend-floating {
    left: 16px;
    right: 16px;
    min-width: auto;
  }
}

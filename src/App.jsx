import { useMemo, useState } from "react";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.jsx";
import AgronomesPage from "./pages/Agronomes/AgronomesPage.jsx";
import CertificationPage from "./pages/Certification/CertificationPage.jsx";
import DiseaseAnalysisPage from "./pages/DiseaseAnalysis/DiseaseAnalysisPage.jsx";
import MarketplacePage from "./pages/Marketplace/MarketplacePage.jsx";
import SoilAdvisorPage from "./pages/SoilAdvisor/SoilAdvisorPage.jsx";
import TicketsPage from "./pages/Tickets/TicketsPage.jsx";
import TransportPage from "./pages/Transport/TransportPage.jsx";

const modules = [
  {
    id: "ia",
    label: "Diagnostic IA",
    icon: "IA",
    category: "Santé des cultures",
    title: "Diagnostic des maladies des plantes",
    description: "Analyse Plant.id, rapport agronomique détaillé et suivi des cas incertains.",
    component: DiseaseAnalysisPage,
  },
  {
    id: "agronomes",
    label: "Agronomes",
    icon: "AG",
    category: "Accompagnement",
    title: "Mise en relation avec les ingénieurs agronomes",
    description: "Profils, filtres par expérience, zones d’intervention, contact et rendez-vous.",
    component: AgronomesPage,
  },
  {
    id: "certification",
    label: "Certification",
    icon: "CE",
    category: "Qualité",
    title: "Certification des agriculteurs",
    description: "Évaluation, niveaux de confiance, badges et suivi des demandes.",
    component: CertificationPage,
  },
  {
    id: "marche",
    label: "Marché",
    icon: "MK",
    category: "Vente",
    title: "Matching agriculteurs, clients et produits",
    description: "Catalogue, recherche, priorité fidélité et demande client.",
    component: MarketplacePage,
  },
  {
    id: "transport",
    label: "Transport",
    icon: "TR",
    category: "Logistique",
    title: "Suivi logistique",
    description: "Transporteurs, trajets, progression et estimation de livraison.",
    component: TransportPage,
  },
  {
    id: "sol",
    label: "Conseil sol",
    icon: "SO",
    category: "Planification",
    title: "Conseil intelligent de semis",
    description: "Suggestions de cultures selon le sol, la localisation et le terrain.",
    component: SoilAdvisorPage,
  },
  {
    id: "tickets",
    label: "Tickets QR",
    icon: "QR",
    category: "Traçabilité",
    title: "Tickets de livraison et notation",
    description: "QR code, réception, scan et notation après livraison.",
    component: TicketsPage,
  },
];

export default function App() {
  const [activeModuleId, setActiveModuleId] = useState("ia");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const activeModule = useMemo(
    () => modules.find((module) => module.id === activeModuleId) || modules[0],
    [activeModuleId],
  );
  const ActivePage = activeModule.component;

  if (!user) {
    return <AuthPage authMode={authMode} onModeChange={setAuthMode} onAuthenticate={setUser} />;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">
            <strong>KM</strong>
          </span>
          <div>
            <strong>KA MOLEMA</strong>
            <span>AgriTech Cameroun</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Modules KA MOLEMA">
          {modules.map((module) => (
            <button
              key={module.id}
              type="button"
              className={activeModule.id === module.id ? "active" : ""}
              onClick={() => setActiveModuleId(module.id)}
            >
              <span className="nav-icon">{module.icon}</span>
              <span>
                <strong>{module.label}</strong>
                <small>{module.category}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="avatar-badge">{user.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
        </div>
      </aside>

      <main className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{activeModule.category}</p>
            <h1>{activeModule.title}</h1>
            <p className="module-intro">{activeModule.description}</p>
          </div>
          <div className="topbar-actions">
            <span className="api-status ready">
              <small>Session</small>
              <strong>Connecté</strong>
            </span>
            <button type="button" className="secondary-action" onClick={() => setUser(null)}>
              Déconnexion
            </button>
          </div>
        </header>

        <section className="hero-strip" aria-hidden="true">
          <span>Cacao</span>
          <span>Manioc</span>
          <span>Tomate</span>
          <span>Plantain</span>
        </section>

        <ErrorBoundary>
          <ActivePage user={user} />
        </ErrorBoundary>
      </main>
    </div>
  );
}

function AuthPage({ authMode, onModeChange, onAuthenticate }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Agriculteur",
    password: "",
  });

  function submitAuth(event) {
    event.preventDefault();
    onAuthenticate({
      name: form.name || "Utilisateur KA MOLEMA",
      email: form.email,
      role: form.role,
    });
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="sidebar-brand auth-brand">
          <span className="brand-mark">
            <strong>KM</strong>
          </span>
          <div>
            <strong>KA MOLEMA</strong>
            <span>Plateforme agricole intelligente</span>
          </div>
        </div>
        <div>
          <p className="eyebrow">AgriTech Cameroun</p>
          <h1>Un seul espace pour diagnostiquer, vendre, certifier et livrer.</h1>
          <p className="module-intro">
            Connectez-vous pour accéder aux outils de santé des cultures, agronomes, marché,
            logistique, tickets QR et conseils de semis.
          </p>
        </div>
        <div className="auth-stats">
          <span>Diagnostic IA</span>
          <span>Traçabilité QR</span>
          <span>Transport suivi</span>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs">
          <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => onModeChange("login")}>
            Connexion
          </button>
          <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => onModeChange("register")}>
            Inscription
          </button>
        </div>

        <form className="stack-form" onSubmit={submitAuth}>
          {authMode === "register" && (
            <label>
              Nom complet
              <input
                required
                placeholder="Ex : Michelle N."
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
          )}
          <label>
            Adresse email
            <input
              required
              type="email"
              placeholder="vous@exemple.com"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label>
            Rôle
            <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
              <option>Agriculteur</option>
              <option>Client</option>
              <option>Ingénieur agronome</option>
              <option>Transporteur</option>
              <option>Administrateur</option>
            </select>
          </label>
          <label>
            Mot de passe
            <input
              required
              type="password"
              placeholder="Votre mot de passe"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          <button type="submit" className="primary-action wide">
            {authMode === "login" ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
      </section>
    </main>
  );
}

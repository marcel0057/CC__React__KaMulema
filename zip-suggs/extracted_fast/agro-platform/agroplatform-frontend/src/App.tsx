import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { ListeAgronomes } from './pages/ListeAgronomes'
import { ProfilAgronome } from './pages/ProfilAgronome'
import { SuiviAgriculteurs } from './pages/SuiviAgriculteurs'

// Page placeholder pour les modules des autres membres
function PageEnCours({ titre, membre }: { titre: string; membre: string }) {
  return (
    <div style={{
      maxWidth: 600, margin: '80px auto', textAlign: 'center',
      padding: '0 20px',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ fontSize: 22, fontWeight: 500, color: 'var(--agro-text-primary)', margin: '0 0 10px' }}>
        {titre}
      </h2>
      <p style={{ fontSize: 14, color: 'var(--agro-text-muted)', margin: 0 }}>
        Ce module est développé par <strong>{membre}</strong> et sera intégré prochainement.
      </p>
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const getActiveRoute = () => {
    if (location.pathname.startsWith('/agronomes')) return 'agronomes'
    if (location.pathname.startsWith('/suivi'))     return 'suivi'
    if (location.pathname.startsWith('/messages'))  return 'messages'
    if (location.pathname.startsWith('/rdv'))       return 'rdv'
    if (location.pathname.startsWith('/conseil'))   return 'conseil'
    return 'agronomes'
  }

  const handleNavigate = (route: string) => {
    const routes: Record<string, string> = {
      agronomes: '/agronomes',
      suivi:     '/suivi',
      messages:  '/messages',
      rdv:       '/rdv',
      conseil:   '/conseil',
    }
    navigate(routes[route] ?? '/agronomes')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--agro-bg-page)',
      color: 'var(--agro-text-primary)',
    }}>
      <Navbar
        activeRoute={getActiveRoute()}
        onNavigate={handleNavigate}
        userInitiales="MA"
      />
      <Routes>
        <Route path="/"                        element={<ListeAgronomes />} />
        <Route path="/agronomes"               element={<ListeAgronomes />} />
        <Route path="/agronomes/:id"           element={<ProfilAgronome />} />
        <Route path="/agronomes/:id/contacter" element={<ProfilAgronome />} />
        <Route path="/suivi"                   element={<SuiviAgriculteurs />} />
        <Route path="/messages"                element={<PageEnCours titre="Messagerie globale" membre="Joumessi" />} />
        <Route path="/rdv"                     element={<PageEnCours titre="Mes Rendez-vous" membre="Joumessi" />} />
        <Route path="/conseil"                 element={<PageEnCours titre="Conseil IA" membre="Ngongang" />} />
        <Route path="*"                        element={<ListeAgronomes />} />
      </Routes>
    </div>
  )
}
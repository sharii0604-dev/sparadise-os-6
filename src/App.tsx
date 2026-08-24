import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { RutaProtegida } from '@/components/RutaProtegida'
import { AppShell } from '@/layouts/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { AgendaPage } from '@/pages/AgendaPage'
import { ClientasPage } from '@/pages/ClientasPage'
import { FichaClientaPage } from '@/pages/FichaClientaPage'
import { PagosPage } from '@/pages/PagosPage'
import { TratamientosPage } from '@/pages/TratamientosPage'
import { MarketingPage } from '@/pages/MarketingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CentroInteligenciaPage } from '@/pages/CentroInteligenciaPage'
import { ConfiguracionPage } from '@/pages/ConfiguracionPage'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <RutaProtegida>
                <AppShell />
              </RutaProtegida>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="clientas" element={<ClientasPage />} />
            <Route path="clientas/:id" element={<FichaClientaPage />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="pagos" element={<PagosPage />} />
            <Route path="tratamientos" element={<TratamientosPage />} />
            <Route path="marketing" element={<MarketingPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inteligencia" element={<CentroInteligenciaPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { Layout } from "@/components/layout/Layout"

// Pages
import Dashboard from "@/pages/Dashboard"
import CRM from "@/pages/CRM"
import Clients from "@/pages/Clients"
import ClientDetail from "@/pages/ClientDetail"
import Planner from "@/pages/Planner"
import Orders from "@/pages/Orders"
import OrderDetail from "@/pages/OrderDetail"
import IncomePage from "@/pages/IncomePage"
import ExpensesPage from "@/pages/ExpensesPage"
import Calculator from "@/pages/Calculator"
import Employees from "@/pages/Employees"
import AdminPanel from "@/pages/AdminPanel"
import AuthPage from "@/pages/AuthPage"
import { Toaster } from "sonner"

import { CurrencyProvider } from "@/contexts/CurrencyContext"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { Navigate } from "react-router-dom"

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { role, isLoading } = useAuth()
  if (isLoading) return null
  if (role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="agency-manager-theme">
      <AuthProvider>
        <CurrencyProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/clients" element={<RequireAdmin><Clients /></RequireAdmin>} />
                <Route path="/clients/:id" element={<RequireAdmin><ClientDetail /></RequireAdmin>} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:orderId" element={<OrderDetail />} />
                <Route path="/income" element={<RequireAdmin><IncomePage /></RequireAdmin>} />
                <Route path="/expenses" element={<RequireAdmin><ExpensesPage /></RequireAdmin>} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/employees" element={<RequireAdmin><Employees /></RequireAdmin>} />
                <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster theme="dark" position="bottom-right" className="glass border-white/10" />
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

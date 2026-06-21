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
import { Toaster } from "sonner"

import { CurrencyProvider } from "@/contexts/CurrencyContext"
import { AuthProvider } from "@/contexts/AuthContext"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="agency-manager-theme">
      <AuthProvider>
        <CurrencyProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:orderId" element={<OrderDetail />} />
                <Route path="/income" element={<IncomePage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/admin" element={<AdminPanel />} />
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

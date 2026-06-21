import { Outlet, Navigate } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

export function Layout() {
  const { session, role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (role === 'pending') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <div className="w-full max-w-md p-8 rounded-2xl glass border border-white/10 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold">Ожидание подтверждения</h2>
          <p className="text-muted-foreground">
            Ваш аккаунт успешно создан, но пока не активирован. 
            Пожалуйста, подождите, пока Администратор выдаст вам права доступа.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Decorative background orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] -z-10" />

        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

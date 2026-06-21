import { NavLink } from "react-router-dom"
import { 
  LayoutDashboard, 
  Briefcase, 
  DollarSign, 
  PieChart, 
  Calculator, 
  Users, 
  Settings,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "react-i18next"

const navItemsKeys = [
  { key: "dashboard", path: "/", icon: LayoutDashboard, adminOnly: false },
  { key: "crm", path: "/crm", icon: Users, adminOnly: false },
  { key: "planner", path: "/planner", icon: FileText, adminOnly: false },
  { key: "orders", path: "/orders", icon: Briefcase, adminOnly: false },
  { key: "income", path: "/income", icon: DollarSign, adminOnly: true },
  { key: "expenses", path: "/expenses", icon: PieChart, adminOnly: true },
  { key: "calculator", path: "/calculator", icon: Calculator, adminOnly: false },
  { key: "employees", path: "/employees", icon: Users, adminOnly: true },
  { key: "admin", path: "/admin", icon: Settings, adminOnly: true },
]

export function Sidebar() {
  const { role } = useAuth()
  const { t } = useTranslation()

  return (
    <aside className="hidden md:flex w-64 flex-col glass border-r border-white/10 shrink-0 relative z-10">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          Agency Manager
        </h1>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItemsKeys.filter(item => !(item.adminOnly && role === 'employee')).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/20 text-primary shadow-lg shadow-primary/10 border border-primary/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                )
              }
            >
              <Icon className="w-5 h-5" />
              {t(`nav.${item.key}`)}
            </NavLink>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/30">
            AM
          </div>
          <div>
            <p className="text-sm font-medium">Текущий юзер</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

import { Menu, Moon, Sun, Shield, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, setTheme } = useTheme()
  const { role, setRole } = useAuth()
  const { t, i18n } = useTranslation()

  return (
    <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="w-5 h-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-9 px-2 text-xs font-medium hover:bg-white/5">
              <Globe className="w-4 h-4 text-muted-foreground" />
              {i18n.language.toUpperCase()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass border-white/10">
            <DropdownMenuItem onClick={() => i18n.changeLanguage("ru")} className="cursor-pointer">
              Русский (RU)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => i18n.changeLanguage("uz")} className="cursor-pointer">
              O'zbekcha (UZ)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 glass h-9 border-white/10 text-xs font-medium">
              <Shield className={`w-4 h-4 ${role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`} />
              {t('header.role')}: {role === 'admin' ? t('header.admin') : t('header.employee')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass border-white/10">
            <DropdownMenuItem onClick={() => setRole("admin")} className="cursor-pointer">
              {t('header.role_admin')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRole("employee")} className="cursor-pointer">
              {t('header.role_employee')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-white/5"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  )
}

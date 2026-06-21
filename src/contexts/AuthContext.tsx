import React, { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Session, User } from "@supabase/supabase-js"
import { toast } from "sonner"

export type Role = "admin" | "employee" | "pending" | "guest"

interface AuthContextType {
  role: Role
  session: Session | null
  user: User | null
  employeeData: any | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [employeeData, setEmployeeData] = useState<any | null>(null)
  const [role, setRole] = useState<Role>("guest")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Получаем текущую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user || null)
      if (session?.user) {
        fetchEmployeeProfile(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Слушаем изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user || null)
      if (session?.user) {
        fetchEmployeeProfile(session.user.id)
      } else {
        setRole("guest")
        setEmployeeData(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchEmployeeProfile = async (userId: string) => {
    try {
      // Ищем привязанного сотрудника
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setEmployeeData(data)
        if (data.status === 'pending') {
          setRole('pending')
        } else {
          setRole(data.role as Role || 'employee')
        }
      } else {
        // Если пользователь есть в auth, но еще нет в employees (возможно задержка триггера)
        // Подождем 2 секунды и попробуем еще раз
        setTimeout(async () => {
          const { data: retryData } = await supabase.from('employees').select('*').eq('user_id', userId).single()
          if (retryData) {
            setEmployeeData(retryData)
            setRole(retryData.status === 'pending' ? 'pending' : (retryData.role as Role || 'employee'))
          } else {
            setRole('pending') // fallback
          }
          setIsLoading(false)
        }, 2000)
        return
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setRole("guest")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("Вы вышли из системы")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <AuthContext.Provider value={{ role, session, user, employeeData, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

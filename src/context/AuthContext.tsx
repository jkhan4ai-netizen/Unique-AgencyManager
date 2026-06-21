import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Временная заглушка (Mock): сразу авторизуем как Admin
    const mockUser = {
      id: 'mock-admin-id',
      app_metadata: {},
      user_metadata: { role: 'admin', full_name: 'Admin Users' },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User

    setUser(mockUser)
    setSession({ user: mockUser } as Session)
    setLoading(false)

    // TODO: Для реального Supabase раскомментировать:
    /*
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
    */
  }, [])

  const isAdmin = user?.user_metadata?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

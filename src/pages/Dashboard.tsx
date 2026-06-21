import { PageHeader } from "@/components/ui/PageHeader"
import { StatCard } from "@/components/ui/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Banknote, ShoppingCart, Users, Activity, Loader2 } from "lucide-react"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from "recharts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useCurrency } from "@/contexts/CurrencyContext"

const mockRevenueData = [
  { name: "Янв", total: 12000000 },
  { name: "Фев", total: 18000000 },
  { name: "Мар", total: 15000000 },
  { name: "Апр", total: 25000000 },
  { name: "Май", total: 32000000 },
  { name: "Июн", total: 45000000 },
]

export default function Dashboard() {
  const { format, convert, mainCurrency } = useCurrency()

  const { data: incomeTotal = 0, isLoading: isIncomeLoading } = useQuery({
    queryKey: ['dashboard', 'incomeTotal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, currency')
        .eq('type', 'income')
      if (error) throw error
      // sum up
      return data.reduce((sum, item) => sum + convert(item.amount, item.currency as any, mainCurrency), 0)
    }
  })

  const { data: activeOrdersCount = 0, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['dashboard', 'activeOrders'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'completed')
      if (error) throw error
      return count || 0
    }
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Дашборд" 
        description="Обзор ключевых показателей агентства."
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Общая выручка" 
          value={isIncomeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : format(incomeTotal, mainCurrency)} 
          icon={<Banknote className="w-4 h-4 text-primary" />}
        />
        <StatCard 
          title="Активные заказы" 
          value={isOrdersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : activeOrdersCount} 
          icon={<ShoppingCart className="w-4 h-4 text-primary" />}
        />
        <StatCard 
          title="Сотрудники" 
          value="15" 
          icon={<Users className="w-4 h-4 text-primary" />}
        />
        <StatCard 
          title="Эффективность" 
          value="94%" 
          icon={<Activity className="w-4 h-4 text-primary" />}
          trend={{ value: 1.2, label: "к прошлому месяцу", isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mt-6">
        <Card className="col-span-1 lg:col-span-5 glass border-white/10 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardHeader>
            <CardTitle>Динамика выручки</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRevenueData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2 glass border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle>Активность</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                Нет недавних действий
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

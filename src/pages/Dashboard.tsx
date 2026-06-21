import { PageHeader } from "@/components/ui/PageHeader"
import { StatCard } from "@/components/ui/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Banknote, ShoppingCart, Users, Activity, Loader2, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"
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

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

export default function Dashboard() {
  const { format, convert, mainCurrency } = useCurrency()

  const { data = { finances: { income: 0, expense: 0 }, chartData: [] }, isLoading: isFinancesLoading } = useQuery({
    queryKey: ['dashboard', 'finances_and_chart'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, currency, type, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: true })
      
      if (error) throw error

      let income = 0;
      let expense = 0;
      
      const monthlyDataMap: Record<string, { name: string, income: number, expense: number, rawMonth: number, year: number }> = {};

      data.forEach(item => {
        const converted = convert(item.amount, item.currency as any, mainCurrency);
        const date = new Date(item.created_at);
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month}`;

        if (!monthlyDataMap[key]) {
          monthlyDataMap[key] = {
            name: `${MONTHS[month]} ${year}`,
            income: 0,
            expense: 0,
            rawMonth: month,
            year: year
          }
        }

        if (item.type === 'income') {
          income += converted;
          monthlyDataMap[key].income += converted;
        } else if (item.type === 'expense') {
          expense += converted;
          monthlyDataMap[key].expense += converted;
        }
      });

      const chartData = Object.values(monthlyDataMap).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.rawMonth - b.rawMonth;
      });

      // Если данных нет, добавим текущий месяц с нулями для красивого графика
      if (chartData.length === 0) {
        const d = new Date();
        chartData.push({ name: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, income: 0, expense: 0, rawMonth: d.getMonth(), year: d.getFullYear() })
      }

      return { 
        finances: { income, expense },
        chartData
      };
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

  const netBalance = data.finances.income - data.finances.expense;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Дашборд" 
        description="Обзор ключевых финансовых показателей."
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Чистый баланс" 
          value={isFinancesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : format(netBalance, mainCurrency)} 
          icon={<Wallet className="w-4 h-4 text-primary" />}
          className={netBalance >= 0 ? "border-emerald-500/20" : "border-destructive/20"}
          valueClassName={netBalance >= 0 ? "text-emerald-500" : "text-destructive"}
        />
        <StatCard 
          title="Общий Доход" 
          value={isFinancesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : format(data.finances.income, mainCurrency)} 
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />}
          className="border-emerald-500/10"
        />
        <StatCard 
          title="Общий Расход" 
          value={isFinancesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : format(data.finances.expense, mainCurrency)} 
          icon={<ArrowDownRight className="w-4 h-4 text-destructive" />}
          className="border-destructive/10"
        />
        <StatCard 
          title="Активные заказы" 
          value={isOrdersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : activeOrdersCount} 
          icon={<ShoppingCart className="w-4 h-4 text-primary" />}
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
              <AreaChart data={data.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
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
                  dataKey="income" 
                  name="Доход"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  name="Расход"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
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

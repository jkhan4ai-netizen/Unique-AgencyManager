import { useParams, useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatCard } from "@/components/ui/StatCard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Phone, Mail, FileText, ShoppingCart, Banknote } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useQuery } from "@tanstack/react-query"
import { useCurrency } from "@/contexts/CurrencyContext"

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { format, convert, mainCurrency } = useCurrency()

  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
      if (error) throw error
      return data
    }
  })

  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['client_orders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  if (isClientLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Клиент не найден</h2>
        <Button onClick={() => navigate('/clients')}>Вернуться к списку</Button>
      </div>
    )
  }

  // Calculate stats
  const totalOrders = orders.length
  const completedOrders = orders.filter((o: any) => o.status === 'completed').length
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + convert(o.cost || 0, o.currency as any, mainCurrency), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')} className="rounded-full bg-white/5 hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">{client.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-lg border-b border-white/10 pb-2">Контактная информация</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="w-4 h-4 text-primary" />
              <span>{client.phone || "Не указан"}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="w-4 h-4 text-primary" />
              <span>{client.email || "Не указан"}</span>
            </div>
            {client.notes && (
              <div className="flex items-start gap-3 text-muted-foreground pt-2">
                <FileText className="w-4 h-4 text-primary mt-1 shrink-0" />
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground/50 pt-4">
              Добавлен: {new Date(client.created_at).toLocaleDateString("ru-RU")}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 h-fit">
          <StatCard 
            title="Всего заказов" 
            value={totalOrders} 
            icon={<ShoppingCart className="w-4 h-4 text-primary" />}
          />
          <StatCard 
            title="Успешно завершено" 
            value={completedOrders} 
            icon={<FileText className="w-4 h-4 text-emerald-500" />}
            className="border-emerald-500/20"
          />
          <StatCard 
            title="Общая сумма" 
            value={format(totalRevenue, mainCurrency)} 
            icon={<Banknote className="w-4 h-4 text-primary" />}
          />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">История заказов</h3>
        <div className="rounded-xl border border-white/10 glass overflow-hidden shadow-xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead>Название</TableHead>
                <TableHead>Услуга</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="text-right">Стоимость</TableHead>
                <TableHead className="text-center">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isOrdersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    У клиента еще нет заказов
                  </TableCell>
                </TableRow>
              ) : orders.map((order: any) => (
                <TableRow 
                  key={order.id} 
                  className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <TableCell className="font-medium text-foreground">{order.title}</TableCell>
                  <TableCell className="text-muted-foreground">{order.service_type || "Не указан"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {format(order.cost || 0, order.currency as any)}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={order.status as any} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

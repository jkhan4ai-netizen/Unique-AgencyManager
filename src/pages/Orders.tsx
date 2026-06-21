import { PageHeader } from "@/components/ui/PageHeader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useCurrency } from "@/contexts/CurrencyContext"
import { OrderFormDialog } from "@/components/OrderFormDialog"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function Orders() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { format } = useCurrency()
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      // Подтягиваем имя исполнителя (executor) через связи
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          executor:employees!orders_executor_id_fkey(full_name),
          finder:employees!orders_finder_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates, createIncome }: { id: string, updates: any, createIncome?: boolean }) => {
      // 1. Update order
      const { error } = await supabase.from('orders').update(updates).eq('id', id)
      if (error) throw error

      if (createIncome) {
        const order = orders.find((o: any) => o.id === id)
        if (order) {
          const debt = Math.max(0, order.cost - (order.prepayment || 0))
          if (debt > 0) {
            const { error: incErr } = await supabase.from('transactions').insert([{
              type: 'income',
              source: `Остаток по заказу: ${order.title}`,
              amount: debt,
              currency: order.currency,
              status: 'completed',
              category: 'Проекты'
            }])
            if (incErr) throw incErr
          }
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (variables.createIncome) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        toast.success("Статус изменен, доход автоматически записан!")
      } else {
        toast.success("Заказ обновлен!")
      }
    },
    onError: (err: any) => {
      toast.error(`Ошибка обновления: ${err.message}`)
    }
  })

  const handleStatusChange = (orderId: string, newStatus: string, currentStatus: string) => {
    // If changing to 'completed' from something else, create income
    const createIncome = newStatus === 'completed' && currentStatus !== 'completed'
    updateOrderMutation.mutate({ id: orderId, updates: { status: newStatus }, createIncome })
  }

  const handleNotesChange = (orderId: string, notes: string) => {
    updateOrderMutation.mutate({ id: orderId, updates: { notes } })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Заказы" 
        description="Управление всеми проектами и сделками агентства."
        action={
          <Button onClick={() => setIsNewOrderOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Создать заказ
          </Button>
        }
      />
      
      <div className="rounded-xl border border-white/10 glass overflow-x-auto shadow-xl pb-4">
        <Table className="min-w-max">
          <TableHeader className="bg-primary/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-[100px]">Создан</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Исполнитель</TableHead>
              <TableHead className="w-[200px]">Заметки</TableHead>
              <TableHead className="text-right">Стоимость</TableHead>
              <TableHead className="text-center w-[160px]">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Нет заказов. Создайте первый заказ!
                </TableCell>
              </TableRow>
            ) : orders.map((order: any) => (
              <TableRow 
                key={order.id}
                className="border-white/5 hover:bg-white/5 transition-colors"
              >
                <TableCell className="font-medium text-muted-foreground cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                  {new Date(order.created_at).toLocaleDateString("ru-RU")}
                </TableCell>
                <TableCell className="font-medium text-foreground cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                  {order.title}
                </TableCell>
                <TableCell className="text-muted-foreground cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                  {order.client_name}
                </TableCell>
                <TableCell className="text-muted-foreground cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                  {order.executor ? order.executor.full_name : <span className="opacity-50">Не назначен</span>}
                </TableCell>
                <TableCell>
                  <Input 
                    defaultValue={order.notes || ""}
                    placeholder="Добавить заметку..."
                    className="h-8 text-xs glass border-white/10 w-full min-w-[150px]"
                    onBlur={(e) => {
                      if (e.target.value !== (order.notes || "")) {
                        handleNotesChange(order.id, e.target.value)
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-right font-medium text-primary cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                  {format(order.cost, order.currency as any)}
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <Select 
                    value={order.status} 
                    onValueChange={(val) => handleStatusChange(order.id, val, order.status)}
                  >
                    <SelectTrigger className={`h-8 text-xs w-[140px] ml-auto border-white/10 ${
                      order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                      order.status === 'completed_unpaid' ? 'bg-orange-500/20 text-orange-500' :
                      order.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                      order.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="pending">Ожидает</SelectItem>
                      <SelectItem value="in_progress">В процессе</SelectItem>
                      <SelectItem value="completed_unpaid">Завершён (Не оплачен)</SelectItem>
                      <SelectItem value="completed">Завершён (Оплачен)</SelectItem>
                      <SelectItem value="cancelled">Отменён</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OrderFormDialog 
        open={isNewOrderOpen} 
        onOpenChange={setIsNewOrderOpen} 
      />
    </div>
  )
}

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId?: string
}

export function OrderFormDialog({ open, onOpenChange, orderId }: OrderFormDialogProps) {
  const queryClient = useQueryClient()
  
  const [title, setTitle] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientId, setClientId] = useState<string | null>(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [cost, setCost] = useState<number>(0)
  const [prepayment, setPrepayment] = useState<number>(0)
  const [currency, setCurrency] = useState("UZS")
  const [serviceType, setServiceType] = useState("")
  const [deadline, setDeadline] = useState("")
  const [notes, setNotes] = useState("")
  
  const [executorId, setExecutorId] = useState("none")
  const [finderId, setFinderId] = useState("none")
  const [executorAmount, setExecutorAmount] = useState<number>(0)
  const [finderAmount, setFinderAmount] = useState<number>(0)
  const [companyPercentage, setCompanyPercentage] = useState<number>(15)
  const [finderPercentage, setFinderPercentage] = useState<number>(10)
  const [samePerson, setSamePerson] = useState(false)

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name').eq('status', 'active')
      if (error) throw error
      return data
    }
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('id, name').order('name')
      if (error) throw error
      return data
    }
  })

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientName.toLowerCase()))

  const { data: orderData, isLoading: isOrderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single()
      if (error) throw error
      return data
    },
    enabled: !!orderId && open
  })

  useEffect(() => {
    if (orderData && open) {
      setTitle(orderData.title || "")
      setClientName(orderData.client_name || "")
      setClientId(orderData.client_id || null)
      setCost(orderData.cost || 0)
      setPrepayment(orderData.prepayment || 0)
      setCurrency(orderData.currency || "UZS")
      setServiceType(orderData.service_type || "")
      setDeadline(orderData.deadline || "")
      setNotes(orderData.notes || "")
      setExecutorId(orderData.executor_id || "none")
      setFinderId(orderData.finder_id || "none")
      setExecutorAmount(orderData.executor_amount || 0)
      setFinderAmount(orderData.finder_amount || 0)
      setSamePerson(orderData.executor_id === orderData.finder_id && orderData.executor_id !== null)
      
      if (orderData.cost && orderData.cost > 0) {
        if (orderData.finder_amount && orderData.finder_amount > 0) {
          setFinderPercentage(Math.round((orderData.finder_amount / orderData.cost) * 100))
        }
        if (orderData.executor_amount && orderData.executor_amount > 0) {
          const compAmt = orderData.cost - (orderData.executor_amount || 0) - (orderData.finder_amount || 0)
          setCompanyPercentage(Math.round((compAmt / orderData.cost) * 100))
        }
      }
    } else if (!orderId && open) {
      setTitle("")
      setClientName("")
      setClientId(null)
      setCost(0)
      setPrepayment(0)
      setCurrency("UZS")
      setServiceType("")
      setDeadline("")
      setNotes("")
      setExecutorId("none")
      setFinderId("none")
      setExecutorAmount(0)
      setFinderAmount(0)
      setCompanyPercentage(15)
      setFinderPercentage(10)
      setSamePerson(false)
    }
  }, [orderData, open, orderId])

  useEffect(() => {
    // Авторасчет долей при изменении стоимости или процентов
    if (open) {
      const fAmount = (samePerson || finderId === "none") ? 0 : Math.round(cost * (finderPercentage / 100))
      const compAmount = Math.round(cost * (companyPercentage / 100))
      const eAmount = executorId !== "none" ? Math.max(0, cost - fAmount - compAmount) : 0
      
      setFinderAmount(fAmount)
      setExecutorAmount(eAmount)
    }
  }, [cost, companyPercentage, finderPercentage, samePerson, finderId, executorId, open])

  useEffect(() => {
    if (samePerson && executorId !== "none") {
      setFinderId(executorId)
    }
  }, [samePerson, executorId])

  const saveOrderMutation = useMutation({
    mutationFn: async (orderPayload: any) => {
      let finalClientId = orderPayload.client_id;
      
      // Auto-create client if not exists
      if (!finalClientId && orderPayload.client_name) {
        // Double check if client exists
        const existing = clients.find(c => c.name.toLowerCase() === orderPayload.client_name.toLowerCase())
        if (existing) {
          finalClientId = existing.id
        } else {
          const { data: newClient, error: clientErr } = await supabase
            .from('clients')
            .insert([{ name: orderPayload.client_name }])
            .select()
            .single()
          if (clientErr) throw clientErr
          finalClientId = newClient.id
        }
      }

      const payloadToSave = { ...orderPayload, client_id: finalClientId }

      if (orderId) {
        const { data, error } = await supabase.from('orders').update(payloadToSave).eq('id', orderId).select()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase.from('orders').insert([{ ...payloadToSave, status: 'pending' }]).select()
        if (error) throw error
        
        const newOrder = data[0]
        if (newOrder.prepayment && newOrder.prepayment > 0) {
          await supabase.from('transactions').insert([{
            type: 'income',
            source: `Предоплата по заказу: ${newOrder.title}`,
            amount: newOrder.prepayment,
            currency: newOrder.currency,
            status: 'completed',
            category: 'Проекты'
          }])
        }
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['order_detail', orderId] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client_orders'] })
      toast.success(orderId ? "Заказ обновлен!" : "Заказ успешно создан!")
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast.error(`Ошибка: ${err.message}`)
    }
  })

  const handleSubmit = () => {
    if (!title || !clientName) {
      toast.error("Заполните обязательные поля (Название и Клиент)")
      return
    }

    saveOrderMutation.mutate({
      title,
      client_name: clientName,
      service_type: serviceType,
      cost: cost || 0,
      prepayment: prepayment || 0,
      currency,
      deadline: deadline || null,
      notes: notes || null,
      client_id: clientId,
      executor_id: executorId !== "none" ? executorId : null,
      finder_id: finderId !== "none" ? finderId : null,
      executor_amount: executorAmount || 0,
      finder_amount: finderAmount || 0
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{orderId ? "Редактировать заказ" : "Новый заказ"}</DialogTitle>
          <DialogDescription>
            Заполните основные данные о заказе.
          </DialogDescription>
        </DialogHeader>
        
        {isOrderLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Название заказа *</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Разработка логотипа" 
                className="glass border-white/10" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 relative">
                <label className="text-sm font-medium">Клиент *</label>
                <Input 
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value)
                    setClientId(null) // Reset ID if user types something new
                    setShowClientDropdown(true)
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  placeholder="Имя или компания" 
                  className="glass border-white/10" 
                />
                {showClientDropdown && filteredClients.length > 0 && (
                  <div className="absolute top-[70px] left-0 w-full z-50 glass border border-white/10 rounded-md shadow-xl max-h-[150px] overflow-y-auto">
                    {filteredClients.map(c => (
                      <div 
                        key={c.id} 
                        className="px-3 py-2 text-sm hover:bg-white/10 cursor-pointer"
                        onClick={() => {
                          setClientName(c.name)
                          setClientId(c.id)
                          setShowClientDropdown(false)
                        }}
                      >
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Тип услуг</label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="glass border-white/10">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    <SelectItem value="smm">SMM</SelectItem>
                    <SelectItem value="seo">SEO</SelectItem>
                    <SelectItem value="dev">Web Разработка</SelectItem>
                    <SelectItem value="design">Дизайн</SelectItem>
                    <SelectItem value="target">Таргетинг</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Общая стоимость</label>
                <div className="flex">
                  <FormattedNumberInput 
                    value={cost} 
                    onChange={setCost} 
                    placeholder="0" 
                    className="glass border-white/10 rounded-r-none border-r-0" 
                  />
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-[85px] glass border-white/10 rounded-l-none border-l-0 px-2">
                      <SelectValue placeholder="Валюта" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="UZS">UZS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="RUB">RUB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Предоплата</label>
                <FormattedNumberInput 
                  value={prepayment} 
                  onChange={setPrepayment} 
                  placeholder="0" 
                  className="glass border-white/10" 
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Дедлайн</label>
              <Input 
                type="date" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="glass border-white/10" 
              />
            </div>

            <div className="border-t border-white/10 pt-4 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Заметки / Комментарий</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Любые подробности о заказе..." 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 glass border-white/10" 
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="samePerson"
                    checked={samePerson}
                    onChange={(e) => setSamePerson(e.target.checked)}
                    className="rounded border-white/10 bg-white/5 accent-primary w-4 h-4"
                  />
                  <label htmlFor="samePerson" className="text-sm font-medium cursor-pointer">
                    Сам нашел - сам сделал
                  </label>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <label className="text-muted-foreground">Доля компании (%)</label>
                    <Input 
                      type="number" 
                      min="0" max="100" 
                      value={companyPercentage} 
                      onChange={e => setCompanyPercentage(Number(e.target.value))}
                      className="w-16 h-8 text-center glass border-white/10 p-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-muted-foreground">Доля Finder (%)</label>
                    <Input 
                      type="number" 
                      min="0" max="100" 
                      value={finderPercentage} 
                      onChange={e => setFinderPercentage(Number(e.target.value))}
                      className="w-16 h-8 text-center glass border-white/10 p-1"
                      disabled={samePerson || finderId === "none"}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Исполнитель</label>
                  <Select value={executorId} onValueChange={setExecutorId}>
                    <SelectTrigger className="glass border-white/10">
                      <SelectValue placeholder="Не назначен" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="none">Не назначен</SelectItem>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground mt-1">
                    К выплате: <span className="text-emerald-500 font-medium">{executorAmount.toLocaleString("en-US")} {currency}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Привлекатель (Finder)</label>
                  <Select value={finderId} onValueChange={setFinderId} disabled={samePerson}>
                    <SelectTrigger className="glass border-white/10">
                      <SelectValue placeholder="Не назначен" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="none">Не назначен</SelectItem>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground mt-1">
                    К выплате: <span className="text-emerald-500 font-medium">{finderAmount.toLocaleString("en-US")} {currency}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={saveOrderMutation.isPending || isOrderLoading}>
            {saveOrderMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {orderId ? "Сохранить" : "Создать заказ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

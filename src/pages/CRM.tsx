import { useState } from "react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"

const columnsConfig = [
  { id: "new", title: "Новые лиды", color: "border-blue-500" },
  { id: "negotiation", title: "В переговорах", color: "border-yellow-500" },
  { id: "won", title: "Сделка (Успех)", color: "border-emerald-500" },
  { id: "lost", title: "Отказ", color: "border-red-500" }
]

export default function CRM() {
  const queryClient = useQueryClient()
  const { format } = useCurrency()
  const [open, setOpen] = useState(false)
  
  // Form State
  const [clientName, setClientName] = useState("")
  const [expectedSum, setExpectedSum] = useState<number>(0)
  const [serviceType, setServiceType] = useState("")

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const addLeadMutation = useMutation({
    mutationFn: async (newLead: any) => {
      const { data, error } = await supabase
        .from('leads')
        .insert([newLead])
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success("Лид успешно добавлен!")
      setOpen(false)
      setClientName("")
      setExpectedSum(0)
      setServiceType("")
    },
    onError: (err: any) => {
      toast.error(`Ошибка: ${err.message}`)
    }
  })

  const handleAdd = () => {
    if (!clientName) {
      toast.error("Имя клиента обязательно")
      return
    }
    addLeadMutation.mutate({
      client_name: clientName,
      expected_sum: expectedSum || 0,
      service_type: serviceType || "Не указан",
      stage: 'new'
    })
  }

  // Group leads by stage
  const getLeadsByStage = (stage: string) => {
    return leads.filter((l: any) => l.stage === stage)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <PageHeader 
        title="CRM (Клиенты)" 
        description="Воронка продаж и управление лидами."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                Новый лид
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-white/10">
              <DialogHeader>
                <DialogTitle>Новый потенциальный клиент</DialogTitle>
                <DialogDescription>
                  Добавьте лид в начальный этап воронки.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Имя клиента / Компания *</label>
                  <Input 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Например: ООО Вектор" 
                    className="glass border-white/10" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Интересующая услуга</label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger className="glass border-white/10">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="SMM">SMM</SelectItem>
                      <SelectItem value="SEO">SEO</SelectItem>
                      <SelectItem value="Web Dev">Web Разработка</SelectItem>
                      <SelectItem value="Design">Дизайн</SelectItem>
                      <SelectItem value="Target">Таргетинг</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Ожидаемая сумма (UZS)</label>
                  <FormattedNumberInput 
                    value={expectedSum}
                    onChange={setExpectedSum}
                    className="glass border-white/10" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
                <Button onClick={handleAdd} disabled={addLeadMutation.isPending}>
                  {addLeadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Добавить лид
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full">
            {columnsConfig.map(col => {
              const colItems = getLeadsByStage(col.id)
              return (
                <div key={col.id} className="w-[300px] flex flex-col gap-4">
                  <div className={`flex items-center justify-between p-3 rounded-lg glass border-t-4 ${col.color} border-l-white/5 border-r-white/5 border-b-white/5`}>
                    <h3 className="font-semibold">{col.title}</h3>
                    <Badge variant="secondary" className="bg-white/10">{colItems.length}</Badge>
                  </div>

                  <div className="flex flex-col gap-3 flex-1 min-h-[200px] p-2 rounded-xl bg-black/10 border border-white/5">
                    {colItems.map((item: any) => (
                      <Card key={item.id} className="glass border-white/10 shadow-lg cursor-pointer hover:border-white/20 transition-all">
                        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-medium truncate pr-2" title={item.client_name}>
                            {item.client_name}
                          </CardTitle>
                          <Button variant="ghost" size="icon" className="w-6 h-6 -mr-2 text-muted-foreground flex-shrink-0">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-3 pt-2">
                          <p className="text-xs font-bold text-emerald-400 mb-2">
                            {format(item.expected_sum || 0, "UZS")}
                          </p>
                          {item.service_type && (
                            <Badge variant="outline" className="text-[10px] py-0 h-5 border-white/10 bg-white/5">
                              {item.service_type}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

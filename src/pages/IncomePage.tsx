import { useState } from "react"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatCard } from "@/components/ui/StatCard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { DollarSign, ArrowUpRight, Plus, Loader2 } from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export default function IncomePage() {
  const { convert, format, mainCurrency } = useCurrency()
  const queryClient = useQueryClient()
  
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState("")
  const [amount, setAmount] = useState<number>(0)
  const [currency, setCurrency] = useState("UZS")

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', 'income'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'income')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const addIncomeMutation = useMutation({
    mutationFn: async (newInc: any) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert([newInc])
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'income'] })
      toast.success("Доход успешно добавлен!")
      setOpen(false)
      setSource("")
      setAmount(0)
    },
    onError: (err: any) => {
      toast.error(`Ошибка: ${err.message}`)
    }
  })

  const handleAdd = () => {
    addIncomeMutation.mutate({
      type: 'income',
      source: source || "Новый доход",
      amount: amount || 0,
      currency: "UZS",
      status: "completed"
    })
  }

  // Calculate total in main currency
  const totalIncome = transactions.reduce((sum, item) => sum + convert(item.amount, item.currency as any, mainCurrency), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Доходы" 
        description="Управление всеми входящими платежами и выручкой."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="w-4 h-4" />
                Добавить доход
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Новый доход</DialogTitle>
                <DialogDescription>
                  Введите данные о поступлении средств.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Источник</label>
                  <Input 
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    placeholder="Например: Предоплата за сайт" 
                    className="glass border-white/10" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Сумма</label>
                  <div className="flex">
                    <FormattedNumberInput 
                      value={amount}
                      onChange={setAmount}
                      className="glass border-white/10 rounded-r-none border-r-0" 
                    />
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="w-[85px] glass border-white/10 rounded-l-none border-l-0 px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-white/10">
                        <SelectItem value="UZS">UZS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="RUB">RUB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
                <Button 
                  onClick={handleAdd} 
                  disabled={addIncomeMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {addIncomeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          title="Общая сумма (за все время)" 
          value={format(totalIncome, mainCurrency)} 
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
          className="border-emerald-500/20"
        />
      </div>

      <div className="rounded-xl border border-white/10 glass overflow-hidden shadow-xl mt-6">
        <Table>
          <TableHeader className="bg-emerald-500/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Дата</TableHead>
              <TableHead>Источник</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead className="text-center">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Нет данных
                </TableCell>
              </TableRow>
            ) : transactions.map((item) => (
              <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                <TableCell className="text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("ru-RU")}
                </TableCell>
                <TableCell className="font-medium text-foreground">{item.source}</TableCell>
                <TableCell className="text-right font-medium text-emerald-500">
                  +{format(item.amount, item.currency as any)}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={item.status as any} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

import { useState } from "react"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatCard } from "@/components/ui/StatCard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { PieChart, Plus, Loader2 } from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export default function ExpensesPage() {
  const { convert, format, mainCurrency } = useCurrency()
  const queryClient = useQueryClient()
  
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState("")
  const [amount, setAmount] = useState<number>(0)
  const [currency, setCurrency] = useState("UZS")

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', 'expense'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'expense')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const addExpenseMutation = useMutation({
    mutationFn: async (newExp: any) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert([newExp])
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'expense'] })
      toast.success("Расход успешно добавлен!")
      setOpen(false)
      setSource("")
      setAmount(0)
    },
    onError: (err: any) => {
      toast.error(`Ошибка: ${err.message}`)
    }
  })

  const handleAdd = () => {
    addExpenseMutation.mutate({
      type: 'expense',
      source: source || "Новый расход",
      amount: amount || 0,
      currency: "UZS",
      category: "Общее",
      status: "completed"
    })
  }

  const totalExpense = transactions.reduce((sum, item) => sum + convert(item.amount, item.currency as any, mainCurrency), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Расходы" 
        description="Управление тратами, зарплатами и операционными расходами."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2 shadow-lg shadow-destructive/20">
                <Plus className="w-4 h-4" />
                Добавить расход
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-destructive">Новый расход</DialogTitle>
                <DialogDescription>
                  Внесите информацию о новой трате.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Статья расхода</label>
                  <Input 
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    placeholder="Например: Покупка канцелярии" 
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
                <Button onClick={handleAdd} variant="destructive" disabled={addExpenseMutation.isPending}>
                  {addExpenseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
          value={format(totalExpense, mainCurrency)} 
          icon={<PieChart className="w-4 h-4 text-destructive" />}
          className="border-destructive/20"
        />
      </div>

      <div className="rounded-xl border border-white/10 glass overflow-hidden shadow-xl mt-6">
        <Table>
          <TableHeader className="bg-destructive/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Дата</TableHead>
              <TableHead>Статья</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead className="text-center">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Нет данных
                </TableCell>
              </TableRow>
            ) : transactions.map((item) => (
              <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                <TableCell className="text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("ru-RU")}
                </TableCell>
                <TableCell className="font-medium text-foreground">{item.source}</TableCell>
                <TableCell className="text-muted-foreground">{item.category}</TableCell>
                <TableCell className="text-right font-medium text-destructive">
                  -{format(item.amount, item.currency as any)}
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

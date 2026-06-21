import { useState } from "react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, DollarSign } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"

export default function Employees() {
  const queryClient = useQueryClient()
  const { convert, format, mainCurrency } = useCurrency()
  
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("employee")

  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [selectedEmpId, setSelectedEmpId] = useState("")
  const [advanceAmount, setAdvanceAmount] = useState<number>(0)
  const [advanceCurrency, setAdvanceCurrency] = useState("UZS")

  const [editOpen, setEditOpen] = useState(false)
  const [editEmp, setEditEmp] = useState<any>(null)

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['orders_for_employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('status', 'completed')
      if (error) throw error
      return data
    }
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions_for_employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions').select('*').not('employee_id', 'is', null)
      if (error) throw error
      return data
    }
  })

  const getEmployeeStats = (empId: string) => {
    const earned = orders.reduce((sum, o) => {
      let e = 0;
      if (o.executor_id === empId) e += convert(o.executor_amount || 0, o.currency as any, mainCurrency)
      if (o.finder_id === empId) e += convert(o.finder_amount || 0, o.currency as any, mainCurrency)
      return sum + e
    }, 0)

    const paid = transactions.filter(t => t.employee_id === empId).reduce((sum, t) => sum + convert(t.amount, t.currency as any, mainCurrency), 0)

    return { earned, paid, balance: earned - paid }
  }

  const addEmployeeMutation = useMutation({
    mutationFn: async (newEmp: any) => {
      const { data, error } = await supabase
        .from('employees')
        .insert([newEmp])
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success("Сотрудник добавлен!")
      setOpen(false)
      setFullName("")
      setRole("employee")
    },
    onError: (err: any) => {
      toast.error(`Ошибка: ${err.message}`)
    }
  })

  const updateEmployeeMutation = useMutation({
    mutationFn: async (updatedEmp: any) => {
      const { error } = await supabase.from('employees').update(updatedEmp).eq('id', editEmp.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success("Данные сотрудника обновлены!")
      setEditOpen(false)
    },
    onError: (err: any) => {
      toast.error(`Ошибка обновления: ${err.message}`)
    }
  })

  const issueAdvanceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('transactions').insert([{
        type: 'expense',
        category: 'Зарплаты и Авансы',
        source: `Выплата сотруднику`,
        amount: advanceAmount,
        currency: advanceCurrency,
        employee_id: selectedEmpId,
        status: 'completed'
      }])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions_for_employees'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success("Выплата успешно сохранена!")
      setAdvanceOpen(false)
      setAdvanceAmount(0)
    },
    onError: (err: any) => {
      toast.error(`Ошибка выплаты: ${err.message}`)
    }
  })

  const handleAdd = () => {
    if (!fullName) {
      toast.error("Введите имя сотрудника")
      return
    }
    addEmployeeMutation.mutate({
      full_name: fullName,
      role,
      status: 'active'
    })
  }

  const handleIssueAdvance = () => {
    if (!advanceAmount) {
      toast.error("Введите сумму")
      return
    }
    issueAdvanceMutation.mutate()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Сотрудники и Зарплаты" 
        description="Управление командой, балансами и выплатами."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                Пригласить
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-white/10">
              <DialogHeader>
                <DialogTitle>Новый сотрудник</DialogTitle>
                <DialogDescription>
                  Добавьте сотрудника в вашу организацию.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Полное имя</label>
                  <Input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Например: Иван Иванов" 
                    className="glass border-white/10" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Роль</label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="glass border-white/10">
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="admin">Администратор</SelectItem>
                      <SelectItem value="employee">Сотрудник</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
                <Button onClick={handleAdd} disabled={addEmployeeMutation.isPending}>
                  {addEmployeeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="rounded-xl border border-white/10 glass overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Сотрудник</TableHead>
              <TableHead className="text-center">Статус</TableHead>
              <TableHead className="text-right">Заработано</TableHead>
              <TableHead className="text-right">Выплачено</TableHead>
              <TableHead className="text-right">Баланс</TableHead>
              <TableHead className="text-center w-[180px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Пока нет добавленных сотрудников.
                </TableCell>
              </TableRow>
            ) : employees.map((emp) => {
              const stats = getEmployeeStats(emp.id)
              return (
                <TableRow key={emp.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground">{emp.full_name}</div>
                    <div className="text-xs text-muted-foreground capitalize mt-1">{emp.role}</div>
                    {emp.email && <div className="text-xs text-muted-foreground">{emp.email}</div>}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={emp.status === 'pending' ? 'review' : 'completed'} />
                    {emp.status === 'pending' && <div className="text-[10px] text-yellow-500 mt-1">Ожидает</div>}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-500">
                    {format(stats.earned, mainCurrency)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-muted-foreground">
                    {format(stats.paid, mainCurrency)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={stats.balance > 0 ? "text-destructive" : ""}>
                      {format(stats.balance, mainCurrency)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="glass text-xs w-full"
                        onClick={() => {
                          setSelectedEmpId(emp.id)
                          setAdvanceOpen(true)
                        }}
                      >
                        <DollarSign className="w-3 h-3 mr-1" />
                        Выплатить
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs w-full text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                        onClick={() => {
                          setEditEmp(emp)
                          setEditOpen(true)
                        }}
                      >
                        Настройки
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-white/10">
          <DialogHeader>
            <DialogTitle>Оформление выплаты</DialogTitle>
            <DialogDescription>
              Сумма будет списана из общих доходов компании (как расход).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Сумма к выдаче</label>
              <div className="flex">
                <FormattedNumberInput 
                  value={advanceAmount} 
                  onChange={setAdvanceAmount} 
                  placeholder="0" 
                  className="glass border-white/10 rounded-r-none border-r-0" 
                />
                <Select value={advanceCurrency} onValueChange={setAdvanceCurrency}>
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
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setAdvanceOpen(false)}>Отмена</Button>
            <Button onClick={handleIssueAdvance} disabled={issueAdvanceMutation.isPending}>
              {issueAdvanceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Подтвердить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-white/10">
          <DialogHeader>
            <DialogTitle>Настройки сотрудника</DialogTitle>
            <DialogDescription>
              Измените статус или роль пользователя.
            </DialogDescription>
          </DialogHeader>
          {editEmp && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Роль</label>
                <Select value={editEmp.role} onValueChange={(v) => setEditEmp({...editEmp, role: v})}>
                  <SelectTrigger className="glass border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    <SelectItem value="admin">Администратор (Полный доступ)</SelectItem>
                    <SelectItem value="employee">Сотрудник (Ограниченный доступ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Статус аккаунта</label>
                <Select value={editEmp.status} onValueChange={(v) => setEditEmp({...editEmp, status: v})}>
                  <SelectTrigger className="glass border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    <SelectItem value="active">Активный (Имеет доступ)</SelectItem>
                    <SelectItem value="pending">Ожидает (Доступ закрыт)</SelectItem>
                    <SelectItem value="blocked">Заблокирован (Доступ закрыт)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Отмена</Button>
            <Button 
              onClick={() => updateEmployeeMutation.mutate({ role: editEmp.role, status: editEmp.status })} 
              disabled={updateEmployeeMutation.isPending}
            >
              {updateEmployeeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}

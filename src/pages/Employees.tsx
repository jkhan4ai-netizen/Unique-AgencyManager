import { useState } from "react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function Employees() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("employee")

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Сотрудники" 
        description="Управление командой и ролями."
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
              <TableHead>Имя</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Дата добавления</TableHead>
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
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Пока нет добавленных сотрудников.
                </TableCell>
              </TableRow>
            ) : employees.map((emp) => (
              <TableRow key={emp.id} className="border-white/5 hover:bg-white/5 transition-colors">
                <TableCell className="font-medium text-foreground">{emp.full_name}</TableCell>
                <TableCell className="text-muted-foreground capitalize">{emp.role}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(emp.created_at).toLocaleDateString("ru-RU")}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={emp.status as any} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

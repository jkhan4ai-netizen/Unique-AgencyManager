import { useState } from "react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Plus, Loader2, ChevronRight, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

export default function Clients() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [telegram, setTelegram] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const addClientMutation = useMutation({
    mutationFn: async (newClient: any) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([newClient])
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success("Клиент успешно добавлен!")
      setOpen(false)
      setName("")
      setPhone("")
      setTelegram("")
      setEmail("")
      setNotes("")
    },
    onError: (err: any) => {
      toast.error(`Ошибка: ${err.message}`)
    }
  })

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Имя клиента обязательно")
      return
    }
    addClientMutation.mutate({ name, phone, telegram, email, notes })
  }

  const filteredClients = clients.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.telegram && c.telegram.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Клиенты" 
        description="База данных всех клиентов и история взаимодействия."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                Новый клиент
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-white/10">
              <DialogHeader>
                <DialogTitle>Добавить клиента</DialogTitle>
                <DialogDescription>
                  Заполните контактные данные нового клиента.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Имя / Компания *</label>
                  <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например: ООО Вектор" 
                    className="glass border-white/10" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Телефон</label>
                  <Input 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67" 
                    className="glass border-white/10" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Telegram (юзернейм или ссылка)</label>
                  <Input 
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="@username" 
                    className="glass border-white/10" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Email (по желанию)</label>
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mail@example.com" 
                    className="glass border-white/10" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Заметки</label>
                  <Input 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Дополнительная информация..." 
                    className="glass border-white/10" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
                <Button onClick={handleAdd} disabled={addClientMutation.isPending}>
                  {addClientMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по имени, телефону или telegram..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 glass border-white/10"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 glass overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Имя / Компания</TableHead>
              <TableHead>Контакты</TableHead>
              <TableHead>Дата добавления</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Клиенты не найдены
                </TableCell>
              </TableRow>
            ) : filteredClients.map((client) => (
              <TableRow 
                key={client.id} 
                className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <User className="w-4 h-4" />
                    </div>
                    {client.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {client.phone && <div>{client.phone}</div>}
                  {client.telegram && (
                    <div>
                      <span className="text-[#0088cc]">Tg: </span>
                      <a 
                        href={client.telegram.startsWith('http') ? client.telegram : `https://t.me/${client.telegram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {client.telegram}
                      </a>
                    </div>
                  )}
                  {client.email && <div>{client.email}</div>}
                  {!client.phone && !client.telegram && !client.email && <span className="opacity-50">Нет контактов</span>}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(client.created_at).toLocaleDateString("ru-RU")}
                </TableCell>
                <TableCell>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

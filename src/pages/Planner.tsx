import { useState } from "react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, GripVertical, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

const columnsConfig = [
  { id: "todo", title: "Задачи", color: "border-blue-500" },
  { id: "shooting", title: "Съемки", color: "border-purple-500" },
  { id: "editing", title: "Монтаж", color: "border-yellow-500" },
  { id: "review", title: "Правки / Проверка", color: "border-orange-500" },
  { id: "done", title: "Готово", color: "border-emerald-500" }
]

export default function Planner() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  
  // Form State
  const [title, setTitle] = useState("")
  const [orderId, setOrderId] = useState("none")
  const [executorId, setExecutorId] = useState("none")

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, order:orders(title), executor:employees(full_name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['orders_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('id, title').not('status', 'in', '("completed","completed_unpaid","cancelled")')
      if (error) throw error
      return data
    }
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name').eq('status', 'active')
      if (error) throw error
      return data
    }
  })

  const addTaskMutation = useMutation({
    mutationFn: async (newTask: any) => {
      const { data, error } = await supabase.from('tasks').insert([newTask]).select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success("Задача добавлена!")
      setOpen(false)
      setTitle("")
      setOrderId("none")
      setExecutorId("none")
    },
    onError: (err: any) => {
      toast.error(`Ошибка: ${err.message}`)
    }
  })

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string, stage: string }) => {
      const { error } = await supabase.from('tasks').update({ stage }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData(['tasks'])
      queryClient.setQueryData(['tasks'], (old: any) => {
        return old?.map((t: any) => t.id === id ? { ...t, stage } : t)
      })
      return { previousTasks }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks)
      toast.error("Не удалось переместить задачу")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const handleAdd = () => {
    if (!title) {
      toast.error("Введите название задачи")
      return
    }
    addTaskMutation.mutate({
      title,
      stage: 'todo',
      order_id: orderId !== "none" ? orderId : null,
      executor_id: executorId !== "none" ? executorId : null
    })
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, source, destination } = result

    if (source.droppableId !== destination.droppableId) {
      updateStageMutation.mutate({ id: draggableId, stage: destination.droppableId })
    }
  }

  const getTasksByStage = (stage: string) => {
    return tasks.filter((t: any) => t.stage === stage)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <PageHeader 
        title="Планировщик задач" 
        description="Управление этапами производства и задачами команды."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                Новая задача
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-white/10">
              <DialogHeader>
                <DialogTitle>Новая задача</DialogTitle>
                <DialogDescription>
                  Создайте задачу и назначьте её сотруднику.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Название задачи *</label>
                  <Input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Отснять интервью" 
                    className="glass border-white/10" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Привязка к заказу</label>
                  <Select value={orderId} onValueChange={setOrderId}>
                    <SelectTrigger className="glass border-white/10">
                      <SelectValue placeholder="Свободная задача" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="none">Свободная задача</SelectItem>
                      {orders.map((o: any) => (
                        <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
                <Button onClick={handleAdd} disabled={addTaskMutation.isPending}>
                  {addTaskMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Добавить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isTasksLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 min-w-max h-full">
              {columnsConfig.map(col => {
                const colTasks = getTasksByStage(col.id)
                return (
                  <div key={col.id} className="w-[300px] flex flex-col gap-4">
                    <div className={`flex items-center justify-between p-3 rounded-lg glass border-t-4 ${col.color} border-l-white/5 border-r-white/5 border-b-white/5`}>
                      <h3 className="font-semibold">{col.title}</h3>
                      <Badge variant="secondary" className="bg-white/10">{colTasks.length}</Badge>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div 
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex flex-col gap-3 flex-1 min-h-[200px] p-2 rounded-xl transition-colors ${
                            snapshot.isDraggingOver ? 'bg-primary/5 border border-primary/20' : 'bg-black/10 border border-white/5'
                          }`}
                        >
                          {colTasks.map((task: any, index: number) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <Card 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={provided.draggableProps.style as any}
                                  className={`glass shadow-lg border-white/10 ${snapshot.isDragging ? 'shadow-primary/20 border-primary/30 ring-2 ring-primary/20' : ''}`}
                                >
                                  <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between gap-2">
                                    <div className="space-y-1">
                                      <CardTitle className="text-sm font-medium leading-tight">
                                        {task.title}
                                      </CardTitle>
                                      {task.order && (
                                        <div className="text-[10px] text-primary/80 font-medium">
                                          🏷 {task.order.title}
                                        </div>
                                      )}
                                    </div>
                                    <div {...provided.dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-3 pt-2 flex items-center justify-between">
                                    {task.executor ? (
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md">
                                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                                          {task.executor.full_name.charAt(0)}
                                        </div>
                                        {task.executor.full_name}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-muted-foreground opacity-50">Нет исполнителя</div>
                                    )}
                                    {col.id === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        </div>
      )}
    </div>
  )
}

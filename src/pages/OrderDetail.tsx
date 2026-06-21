import { useParams, useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, FileText, Upload, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { StatCard } from "@/components/ui/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useState, useRef } from "react"
import { OrderFormDialog } from "@/components/OrderFormDialog"
import { toast } from "sonner"

export default function OrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { format, convert, mainCurrency } = useCurrency()
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    if (!orderId) return;
    try {
      setIsUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `${orderId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('order_attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('order_attachments')
        .getPublicUrl(filePath)

      const newAttachment = {
        name: file.name,
        url: publicUrlData.publicUrl,
        size: file.size,
        path: filePath
      }

      // We need current order data to get existing attachments
      const { data: currentOrder } = await supabase.from('orders').select('attachments').eq('id', orderId).single()
      const currentAttachments = currentOrder?.attachments || []
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ attachments: [...currentAttachments, newAttachment] })
        .eq('id', orderId)

      if (updateError) throw updateError

      queryClient.invalidateQueries({ queryKey: ['order_detail', orderId] })
      toast.success("Файл загружен")
    } catch (error: any) {
      toast.error(`Ошибка загрузки: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFiles = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    for (const file of fileArray) {
      await uploadFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const { data: order, isLoading: isOrderLoading } = useQuery({
    queryKey: ['order_detail', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          executor:employees!orders_executor_id_fkey(full_name),
          finder:employees!orders_finder_id_fkey(full_name)
        `)
        .eq('id', orderId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!orderId
  })

  // Считаем сколько оплачено по этому заказу из таблицы transactions (если статус completed, мы создавали транзакцию с названием заказа)
  const { data: paidAmount = 0 } = useQuery({
    queryKey: ['order_paid', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, currency')
        .eq('type', 'income')
        .eq('order_id', orderId)
      if (error) throw error
      return data.reduce((sum, t) => sum + convert(t.amount, t.currency as any, order?.currency as any || mainCurrency), 0)
    },
    enabled: !!orderId
  })

  if (isOrderLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        Заказ не найден
        <Button variant="link" onClick={() => navigate("/orders")}>Вернуться назад</Button>
      </div>
    )
  }

  const prepayment = order.prepayment || 0
  const debt = Math.max(0, order.cost - prepayment)
  const remainingBalance = Math.max(0, order.cost - paidAmount)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")} className="hover:bg-secondary/50">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-sm font-medium text-muted-foreground">Назад к заказам</div>
      </div>

      <PageHeader 
        title={order.title} 
        description={`Заказ #${order.id.split('-')[0]} • Клиент: ${order.client_name}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} className="text-sm px-3 py-1" />
            <Button variant="outline" className="gap-2 glass shadow-sm" onClick={() => setIsEditOpen(true)}>
              <Edit className="w-4 h-4" />
              Редактировать
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Общая стоимость" 
          value={format(order.cost, order.currency)} 
        />
        <StatCard 
          title="Предоплата" 
          value={format(prepayment, order.currency)} 
          className="border-emerald-500/20"
        />
        <StatCard 
          title={debt > 0 ? "Долг клиента" : "Долг"} 
          value={format(debt, order.currency)} 
          className={debt > 0 ? "border-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] text-destructive" : ""}
        />
        <StatCard 
          title="Фактически оплачено" 
          value={format(paidAmount, order.currency)} 
          className="border-primary/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass overflow-hidden border-white/10 shadow-xl">
            <CardHeader className="bg-secondary/20 pb-4">
              <CardTitle className="text-lg">Детали заказа</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    Дедлайн
                  </p>
                  <p className="font-semibold text-base">{order.deadline ? new Date(order.deadline).toLocaleDateString("ru-RU") : "Не указан"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    Исполнитель
                  </p>
                  <div className="flex items-center gap-2">
                    {order.executor ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                          {order.executor.full_name.substring(0,2).toUpperCase()}
                        </div>
                        <span className="font-semibold">{order.executor.full_name}</span>
                      </>
                    ) : (
                      <span className="opacity-50">Не назначен</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    Finder
                  </p>
                  <div className="flex items-center gap-2">
                    {order.finder ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-bold">
                          {order.finder.full_name.substring(0,2).toUpperCase()}
                        </div>
                        <span className="font-semibold">{order.finder.full_name}</span>
                      </>
                    ) : (
                      <span className="opacity-50">Не назначен</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-muted-foreground mb-3 font-medium">Комментарий / Заметки</p>
                <div className="bg-background/40 p-4 rounded-xl leading-relaxed border border-white/5 text-foreground/90 whitespace-pre-wrap min-h-[100px]">
                  {order.notes || "Нет заметок..."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass border-white/10 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Файлы</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                <Upload className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-3">
                {(order.attachments || []).map((file: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-white/5 hover:border-primary/30 transition-colors cursor-pointer group" onClick={() => window.open(file.url, '_blank')}>
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ))}
                
                <div 
                  className={`flex flex-col items-center gap-2 p-3 py-6 rounded-xl border border-dashed transition-all cursor-pointer justify-center text-muted-foreground
                    ${isDragging ? 'border-primary bg-primary/10 text-primary scale-[1.02]' : 'border-white/10 hover:border-primary/30 hover:bg-primary/5 hover:text-primary'}
                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFiles(e.dataTransfer.files)
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    onChange={handleFileSelect} 
                  />
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <Upload className={`w-5 h-5 ${isDragging ? 'animate-bounce' : ''}`} />
                  )}
                  <span className="text-xs font-medium text-center px-4">
                    {isUploading ? 'Загрузка...' : isDragging ? 'Отпустите файлы здесь...' : 'Нажмите или перетащите файлы сюда'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <OrderFormDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        orderId={order.id} 
      />
    </div>
  )
}

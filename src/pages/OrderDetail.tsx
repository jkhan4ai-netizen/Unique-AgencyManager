import { useParams, useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, FileText, Upload } from "lucide-react"
import { StatusBadge, OrderStatus } from "@/components/ui/StatusBadge"
import { StatCard } from "@/components/ui/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function OrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()

  // Временные данные для демонстрации
  const order = {
    id: orderId,
    name: "Redesign Website",
    client_name: "Acme Corp",
    status: "new" as OrderStatus,
    cost: 5000000,
    paid_amount: 1000000,
    remaining_balance: 4000000,
    deadline: "2026-07-01",
    executor_name: "John Doe",
    finder_name: "Alice Smith",
    comments: "Клиент просил использовать корпоративные цвета (синий и белый). Обязательно сделать адаптив под мобильные устройства."
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")} className="hover:bg-secondary/50">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-sm font-medium text-muted-foreground">Назад к заказам</div>
      </div>

      <PageHeader 
        title={order.name} 
        description={`Заказ #${order.id} • Клиент: ${order.client_name}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} className="text-sm px-3 py-1" />
            <Button variant="outline" className="gap-2 glass shadow-sm">
              <Edit className="w-4 h-4" />
              Редактировать
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Общая стоимость" 
          value={`${order.cost.toLocaleString()} UZS`} 
        />
        <StatCard 
          title="Оплачено" 
          value={`${order.paid_amount.toLocaleString()} UZS`} 
          className="border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
        />
        <StatCard 
          title="Остаток" 
          value={`${order.remaining_balance.toLocaleString()} UZS`} 
          className="border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
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
                  <p className="font-semibold text-base">{order.deadline}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    Исполнитель
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                      {order.executor_name.substring(0,2).toUpperCase()}
                    </div>
                    <span className="font-semibold">{order.executor_name}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    Finder
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-bold">
                      {order.finder_name.substring(0,2).toUpperCase()}
                    </div>
                    <span className="font-semibold">{order.finder_name}</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-muted-foreground mb-3 font-medium">Комментарий к заказу</p>
                <div className="bg-background/40 p-4 rounded-xl leading-relaxed border border-white/5 text-foreground/90">
                  {order.comments}
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
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-white/5 hover:border-primary/30 transition-colors cursor-pointer group">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">tz_website.pdf</p>
                    <p className="text-xs text-muted-foreground">2.4 MB</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer justify-center text-muted-foreground hover:text-primary py-6">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-5 h-5" />
                    <span className="text-xs font-medium">Загрузить файл</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type OrderStatus = "new" | "pending" | "in_progress" | "awaiting_client" | "completed_unpaid" | "completed" | "paid" | "cancelled" | string

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "Новый", className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
  pending: { label: "Ожидает", className: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" },
  in_progress: { label: "В работе", className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
  awaiting_client: { label: "Ждем клиента", className: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" },
  completed_unpaid: { label: "Завершен (Не оплачен)", className: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" },
  completed: { label: "Завершен (Оплачен)", className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
  paid: { label: "Оплачен", className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
  cancelled: { label: "Отменен", className: "bg-destructive/10 text-destructive hover:bg-destructive/20" },
}

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const config = statusConfig[status] || { label: status, className: "bg-secondary text-secondary-foreground" }
  
  return (
    <Badge className={cn("font-medium shadow-none border-none", config.className, className)} variant="outline">
      {config.label}
    </Badge>
  )
}

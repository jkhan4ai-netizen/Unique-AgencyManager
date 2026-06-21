import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type OrderStatus = "new" | "in_progress" | "awaiting_client" | "completed" | "paid"

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: "Новый", className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
  in_progress: { label: "В работе", className: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" },
  awaiting_client: { label: "Ждем клиента", className: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" },
  completed: { label: "Завершен", className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
  paid: { label: "Оплачен", className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
}

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const config = statusConfig[status] || { label: status, className: "bg-secondary text-secondary-foreground" }
  
  return (
    <Badge className={cn("font-medium shadow-none border-none", config.className, className)} variant="outline">
      {config.label}
    </Badge>
  )
}

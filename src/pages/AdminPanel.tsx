import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useCurrency, Currency } from "@/contexts/CurrencyContext"
import { toast } from "sonner"

export default function AdminPanel() {
  const { 
    mainCurrency, 
    setMainCurrency,
    rates, 
    isManualRates, 
    setIsManualRates, 
    setManualRate 
  } = useCurrency()

  const handleSave = () => {
    toast.success("Настройки успешно сохранены!")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Админ-панель" 
        description="Глобальные настройки системы и валют."
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle>Глобальные настройки системы</CardTitle>
            <CardDescription>
              Выберите основную валюту для отображения графиков и статистики на всем сайте.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Главная валюта системы</label>
              <Select value={mainCurrency} onValueChange={(val) => setMainCurrency(val as Currency)}>
                <SelectTrigger className="glass border-white/10">
                  <SelectValue placeholder="Выберите валюту" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  <SelectItem value="UZS">UZS (Узбекский сум)</SelectItem>
                  <SelectItem value="USD">USD (Доллар США)</SelectItem>
                  <SelectItem value="RUB">RUB (Российский рубль)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle>Настройки валют</CardTitle>
            <CardDescription>
              Управление курсами валют (ЦБ РУз или ручные настройки)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <input 
                type="checkbox" 
                id="manualRates"
                checked={isManualRates}
                onChange={(e) => setIsManualRates(e.target.checked)}
                className="rounded border-white/10 bg-white/5 accent-primary w-4 h-4"
              />
              <label htmlFor="manualRates" className="text-sm font-medium cursor-pointer">
                Использовать ручные курсы (Отключить автообновление ЦБ)
              </label>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Курс USD к UZS</label>
                <Input 
                  type="number" 
                  value={rates.USD}
                  onChange={(e) => setManualRate("USD", Number(e.target.value))}
                  disabled={!isManualRates}
                  className="glass border-white/10"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Курс RUB к UZS</label>
                <Input 
                  type="number" 
                  value={rates.RUB}
                  onChange={(e) => setManualRate("RUB", Number(e.target.value))}
                  disabled={!isManualRates}
                  className="glass border-white/10"
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full mt-4">
              Сохранить настройки
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

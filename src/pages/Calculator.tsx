import { useState } from "react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calculator as CalcIcon } from "lucide-react"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"

export default function Calculator() {
  const [total, setTotal] = useState<number>(1000000)
  const [finderPct, setFinderPct] = useState<number>(10)
  const [companyPct, setCompanyPct] = useState<number>(20)
  const [unlockLimits, setUnlockLimits] = useState<boolean>(false)

  // Исполнитель всегда получает остаток
  const executorPct = 100 - (finderPct + companyPct)

  const handleFinderChange = (newVal: number) => {
    // Если галочка НЕ стоит, лимит 5-10
    if (!unlockLimits) {
      if (newVal < 5) newVal = 5
      if (newVal > 10) newVal = 10
    }
    
    // В любом случае Исполнитель не может уйти в минус
    if (newVal + companyPct > 100) {
      newVal = 100 - companyPct
    }
    setFinderPct(newVal)
  }

  const handleCompanyChange = (newVal: number) => {
    // Компания всегда ограничена от 5 до 20%
    if (newVal < 5) newVal = 5
    if (newVal > 20) newVal = 20

    // Проверка, чтобы Исполнитель не ушел в минус (хотя 20% + 100% маловероятно, но для страховки)
    if (newVal + finderPct > 100) {
      newVal = 100 - finderPct
    }
    setCompanyPct(newVal)
  }

  const finderShare = (total * finderPct) / 100
  const companyShare = (total * companyPct) / 100
  const executorShare = (total * executorPct) / 100

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Калькулятор" 
        description="Быстрый расчет долей распределения бюджета (Сумма всегда 100%)."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalcIcon className="w-5 h-5 text-primary" />
              Ввод данных
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Общая сумма заказа</label>
              <FormattedNumberInput 
                value={total} 
                onChange={(val) => setTotal(val)}
                className="glass border-white/10 font-medium text-lg h-12"
              />
            </div>
            
            <div className="pt-4 space-y-6 border-t border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  id="unlock"
                  checked={unlockLimits}
                  onChange={(e) => setUnlockLimits(e.target.checked)}
                  className="rounded border-white/10 bg-white/5 accent-primary w-4 h-4"
                />
                <label htmlFor="unlock" className="text-sm font-medium cursor-pointer">
                  Снять ограничения Привлекателя (Шаблон)
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-purple-400">Привлекатель (Finder)</span>
                  <span>{finderPct}%</span>
                </div>
                <Input 
                  type="range" min="0" max="100" 
                  value={finderPct} 
                  onChange={(e) => handleFinderChange(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                {!unlockLimits && <p className="text-xs text-muted-foreground text-right">Лимит: 5-10%</p>}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-blue-400">Компания</span>
                  <span>{companyPct}%</span>
                </div>
                <Input 
                  type="range" min="0" max="100" 
                  value={companyPct} 
                  onChange={(e) => handleCompanyChange(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <p className="text-xs text-muted-foreground text-right">Лимит: 5-20%</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium opacity-75">
                  <span className="text-emerald-400">Исполнитель (Остаток)</span>
                  <span>{executorPct}%</span>
                </div>
                <Input 
                  type="range" min="0" max="100" 
                  value={executorPct} 
                  disabled
                  className="w-full accent-emerald-500 cursor-not-allowed opacity-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/10 shadow-xl">
          <CardHeader className="bg-secondary/20 pb-4">
            <CardTitle>Результат распределения</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="font-medium text-purple-400">Доля Привлекателя</div>
                <div className="text-xl font-bold">{finderShare.toLocaleString()}</div>
              </div>
              
              <div className="flex justify-between items-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="font-medium text-blue-400">Доля Компании</div>
                <div className="text-xl font-bold">{companyShare.toLocaleString()}</div>
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="font-medium text-emerald-400">Доля Исполнителя</div>
                <div className="text-xl font-bold">{executorShare.toLocaleString()}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-lg">
              <span className="text-muted-foreground font-medium">Сумма процентов</span>
              <span className={`font-bold ${finderPct + companyPct + executorPct === 100 ? 'text-emerald-500' : 'text-destructive'}`}>
                {finderPct + companyPct + executorPct}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import React, { createContext, useContext, useState, useEffect } from "react"
import { toast } from "sonner"

export type Currency = "UZS" | "USD" | "RUB"

interface CurrencyRates {
  USD: number
  RUB: number
  UZS: number
}

interface CurrencyContextType {
  mainCurrency: Currency
  setMainCurrency: (c: Currency) => void
  rates: CurrencyRates
  isManualRates: boolean
  setIsManualRates: (b: boolean) => void
  setManualRate: (currency: "USD" | "RUB", rate: number) => void
  convert: (amount: number, from: Currency, to?: Currency) => number
  format: (amount: number, currency?: Currency) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [mainCurrency, setMainCurrency] = useState<Currency>("UZS")
  const [rates, setRates] = useState<CurrencyRates>({ USD: 12600, RUB: 135, UZS: 1 })
  const [isManualRates, setIsManualRates] = useState(false)
  const [manualRates, setManualRates] = useState({ USD: 12600, RUB: 135 })

  useEffect(() => {
    if (isManualRates) {
      setRates({ ...manualRates, UZS: 1 })
      return
    }

    const fetchRates = async () => {
      try {
        const response = await fetch("https://cbu.uz/ru/arkhiv-kursov-valyut/json/")
        const data = await response.json()
        const usdData = data.find((d: any) => d.Ccy === "USD")
        const rubData = data.find((d: any) => d.Ccy === "RUB")
        
        if (usdData && rubData) {
          setRates({
            USD: parseFloat(usdData.Rate),
            RUB: parseFloat(rubData.Rate),
            UZS: 1
          })
          toast.success("Курсы валют обновлены (ЦБ РУз)", { id: "currency-update" })
        }
      } catch (error) {
        toast.error("Не удалось загрузить курсы ЦБ. Используются последние сохраненные.")
      }
    }
    fetchRates()
  }, [isManualRates, manualRates])

  const setManualRate = (currency: "USD" | "RUB", rate: number) => {
    setManualRates(prev => ({ ...prev, [currency]: rate }))
  }

  const convert = (amount: number, from: Currency, to: Currency = mainCurrency) => {
    if (from === to) return amount
    // Convert to UZS
    const inUzs = from === "UZS" ? amount : amount * rates[from as keyof CurrencyRates]
    // Convert UZS to target
    const result = to === "UZS" ? inUzs : inUzs / rates[to as keyof CurrencyRates]
    // Округление: убираем копейки/центы для простоты
    return Math.round(result)
  }

  const format = (amount: number, currency: Currency = mainCurrency) => {
    return `${amount.toLocaleString("en-US")} ${currency}`
  }

  return (
    <CurrencyContext.Provider value={{
      mainCurrency, setMainCurrency, rates, isManualRates, setIsManualRates, setManualRate, convert, format
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider")
  return context
}

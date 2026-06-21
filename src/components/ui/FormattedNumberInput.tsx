import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface FormattedNumberInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: number
  onChange?: (value: number) => void
}

export function FormattedNumberInput({ value, onChange, className, ...props }: FormattedNumberInputProps) {
  const [displayValue, setDisplayValue] = useState<string>("")

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(value.toLocaleString("en-US"))
    } else {
      setDisplayValue("")
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    
    if (rawValue === "") {
      setDisplayValue("")
      onChange?.(0)
      return
    }

    const numValue = parseInt(rawValue, 10)
    if (!isNaN(numValue)) {
      setDisplayValue(numValue.toLocaleString("en-US"))
      onChange?.(numValue)
    }
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={className}
    />
  )
}

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl px-3 py-2 text-sm",
        "bg-card text-foreground placeholder:text-muted-foreground",
        "border-2 transition-all duration-200 outline-none",
        "border-[var(--input-border)]",
        "shadow-[0px_0px_0px_0px_transparent]",
        "focus-visible:border-primary focus-visible:shadow-[4px_4px_0px_0px_var(--primary)]",
        "disabled:pointer-events-none disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Input }

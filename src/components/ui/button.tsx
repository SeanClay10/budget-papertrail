import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base — shared across all variants
  [
    "inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-full border-2 border-border",
    "font-heading font-bold text-sm whitespace-nowrap",
    "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
    "select-none outline-none",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[5px_5px_0px_0px_var(--border)]",
          "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[7px_7px_0px_0px_var(--border)]",
          "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0px_0px_var(--border)]",
        ].join(" "),
        outline: [
          "bg-transparent text-foreground",
          "shadow-none",
          "hover:bg-[var(--tertiary)] hover:text-[var(--tertiary-foreground)]",
          "active:scale-95",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground border-border",
          "shadow-[5px_5px_0px_0px_var(--border)]",
          "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[7px_7px_0px_0px_var(--border)]",
          "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0px_0px_var(--border)]",
        ].join(" "),
        destructive: [
          "bg-destructive text-white border-border",
          "shadow-[5px_5px_0px_0px_var(--border)]",
          "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[7px_7px_0px_0px_var(--border)] hover:bg-destructive/90",
          "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0px_0px_var(--border)]",
        ].join(" "),
        ghost: [
          "bg-transparent text-foreground border-transparent shadow-none",
          "hover:bg-muted hover:text-foreground",
          "active:scale-95",
        ].join(" "),
        link: "border-transparent shadow-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8  px-4 py-1.5 text-xs",
        lg:      "h-12 px-6 py-2.5 text-base",
        icon:    "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

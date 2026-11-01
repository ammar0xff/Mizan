import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-[4px] border border-border/80 bg-muted/60 px-1.5 font-mono text-[10px] font-semibold text-muted-foreground shadow-[0_1px_0_0_rgba(0,0,0,0.08)] select-none dark:border-white/10 dark:bg-muted/40 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }

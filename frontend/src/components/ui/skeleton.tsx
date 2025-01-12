import { cn } from "@/lib/utils"

// skeleton component for loading states
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-dark-grey", className)}
      {...props}
    />
  )
}

export { Skeleton }

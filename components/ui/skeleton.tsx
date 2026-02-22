import { cn } from "@/lib/utils"

/**
 * Componente Skeleton para estados de carregamento
 * 
 * Exibe um placeholder animado enquanto o conteúdo está sendo carregado,
 * melhorando a percepção do usuário durante operações assíncronas.
 * 
 * @example
 * ```tsx
 * // Skeleton básico
 * <Skeleton className="h-4 w-full" />
 * 
 * // Skeleton circular (para avatares)
 * <Skeleton className="h-12 w-12 rounded-full" />
 * ```
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }

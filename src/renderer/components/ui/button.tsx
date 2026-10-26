// shadcn/ui (radix-nova, shadcn 4.21.4), owned code (ADR 0016, 0027, 0028): `cn` from @lib/cn,
// radius caps in rem instead of px (ADR 0026), a `success` variant (ADR 0028), a `discord` variant (sign-in), muted text
// on `outline` and `ghost`, as the launcher's buttons had (navbar), and `xl` / `icon-xl` sizes (home action bar).
// Disabled: a not-allowed cursor instead of `pointer-events-none`, hover colours on enabled buttons only.
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@lib/cn'
import { Slot } from 'radix-ui'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground not-disabled:hover:bg-primary/80',
        outline:
          'border-border text-muted-foreground not-disabled:hover:bg-muted not-disabled:hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:not-disabled:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground not-disabled:hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'text-muted-foreground not-disabled:hover:bg-muted not-disabled:hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:not-disabled:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive not-disabled:hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:not-disabled:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        // Launcher: the positive twin of `destructive` (accept a request, ADR 0028)
        success:
          'bg-success/10 text-success not-disabled:hover:bg-success/20 focus-visible:border-success/40 focus-visible:ring-success/20 dark:bg-success/20 dark:not-disabled:hover:bg-success/30 dark:focus-visible:ring-success/40',
        // Launcher: Discord's colours, for signing in through Discord
        discord: 'bg-discord text-white not-disabled:hover:bg-discord/85',
        link: 'text-primary underline-offset-4 not-disabled:hover:underline'
      },
      size: {
        default:
          'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),0.625rem)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),0.75rem)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),0.625rem)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7 rounded-[min(var(--radius-md),0.75rem)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
        // Launcher: the home action bar's main action and its companion icon button
        xl: "h-16 gap-3 rounded-xl px-8 text-xl font-bold tracking-wider uppercase [&_svg:not([class*='size-'])]:size-5",
        'icon-xl': "size-14 rounded-xl [&_svg:not([class*='size-'])]:size-6"
      }
    },
    // Launcher: the home action bar's main action glows in the accent colour
    compoundVariants: [{ variant: 'default', size: 'xl', className: 'ring-4 ring-primary/12' }],
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

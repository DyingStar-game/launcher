// shadcn/ui (radix-nova, shadcn 4.21.4), owned code (ADR 0016): `cn` from @lib/cn, portalled
// content marked `app-no-drag` for the frameless window; `aria-label` names the thumbs (role
// slider); launcher look: dark rail, no fill, gold thumb (the volume slider it replaced).
import * as React from 'react'
import { cn } from '@lib/cn'
import { Slider as SliderPrimitive } from 'radix-ui'

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  'aria-label': ariaLabel,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-border data-horizontal:h-[0.35rem] data-horizontal:w-full data-vertical:h-full data-vertical:w-[0.35rem]"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-transparent select-none data-horizontal:h-full data-vertical:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={ariaLabel}
          className="relative block size-[0.85rem] shrink-0 cursor-pointer rounded-full border border-[color-mix(in_srgb,var(--color-ds-accent)_60%,black)] bg-[var(--color-ds-accent)] transition-[box-shadow] select-none after:absolute after:-inset-2 focus-visible:outline-hidden focus-visible:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-ds-accent)_35%,transparent)] disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }

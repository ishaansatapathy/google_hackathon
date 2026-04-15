import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CLIP_BTN } from '@/lib/targo'

type TargoButtonProps = Omit<React.ComponentProps<typeof Button>, 'variant'> & {
  look?: 'brand' | 'white' | 'outlineLight'
}

export function TargoButton({
  className,
  look = 'brand',
  style,
  ...props
}: TargoButtonProps) {
  const lookClass =
    look === 'brand'
      ? '!bg-[#EE3F2C] !text-white hover:!bg-[#EE3F2C]/90'
      : look === 'white'
        ? '!bg-white !text-black hover:!bg-white/90'
        : '!border !border-white/25 !bg-transparent !text-white hover:!bg-white/10'

  return (
    <Button
      variant="default"
      className={cn(
        '!rounded-none border-0 px-6 py-3 text-xs font-semibold uppercase tracking-wide shadow-none',
        lookClass,
        className
      )}
      style={{ clipPath: CLIP_BTN, ...style }}
      {...props}
    />
  )
}

export { CLIP_BTN }

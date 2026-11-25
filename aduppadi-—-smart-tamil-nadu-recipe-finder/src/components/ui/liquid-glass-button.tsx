import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.ts';

const buttonVariants = cva(
  'inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E2E2E] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-[#2E2E2E] text-[#E6E4D7] hover:bg-[#1E1E1E]',
        destructive: 'bg-[#DC2626] text-white hover:bg-[#DC2626]/90',
        cool: 'bg-linear-to-t border border-b-2 border-zinc-950/40 from-[#2E2E2E] to-[#2E2E2E]/85 shadow-md shadow-black/15 ring-1 ring-inset ring-white/25 transition-[filter] duration-200 hover:brightness-110 active:brightness-90 text-[#E6E4D7]',
        outline: 'border border-[#D2CBBB] bg-[#E9E4D8] hover:bg-[#E6E4D7] text-[#1E1E1E]',
        secondary: 'bg-[#D8D2C4] text-[#1E1E1E] hover:bg-[#CFC8B8]',
        ghost: 'hover:bg-[#E6E4D7] text-[#1E1E1E]',
        link: 'text-[#2E2E2E] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-10 rounded-lg px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

const liquidbuttonVariants = cva(
  "inline-flex items-center justify-center cursor-pointer gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#2E2E2E] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          'bg-[#F4EFE4]/65 backdrop-blur-md text-[#1E1E1E] hover:bg-[#F4EFE4]/85 hover:scale-[1.02] active:scale-[0.99]',
        dark:
          'bg-[#1E1E1E]/65 backdrop-blur-md text-[#F4EFE4] hover:bg-[#1E1E1E]/85 hover:scale-[1.02] active:scale-[0.99]',
        destructive:
          'bg-[#DC2626]/90 backdrop-blur-md text-white hover:bg-[#DC2626] hover:scale-[1.02]',
        outline:
          'border border-[#D2CBBB] bg-[#E9E4D8]/65 backdrop-blur-md text-[#1E1E1E] hover:bg-[#F4EFE4]/85',
        secondary:
          'bg-[#D8D2C4]/75 backdrop-blur-md text-[#1E1E1E] hover:bg-[#D8D2C4]',
        ghost:
          'bg-transparent backdrop-blur-sm text-[#1E1E1E] hover:bg-[#F4EFE4]/50',
        link: 'text-[#1E1E1E] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 text-xs has-[>svg]:px-3.5',
        sm: 'h-8 text-xs gap-1.5 px-3.5 has-[>svg]:px-3',
        lg: 'h-10 px-6 text-sm has-[>svg]:px-5',
        xl: 'h-12 px-8 text-sm has-[>svg]:px-6',
        xxl: 'h-14 px-10 text-base has-[>svg]:px-8',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function GlassFilter({ filterId }: { filterId: string }) {
  return (
    <svg className="hidden" aria-hidden="true">
      <defs>
        <filter
          id={filterId}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof liquidbuttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';
  const rawId = React.useId();
  const filterId = `container-glass-${rawId.replace(/:/g, '')}`;

  return (
    <Comp
      data-slot="button"
      className={cn('relative overflow-hidden', liquidbuttonVariants({ variant, size, className }))}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-0 h-full w-full rounded-full shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.65),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.55),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.55),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.45),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.05),0_0_12px_rgba(255,255,255,0.2)] transition-all"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-full"
        style={{ backdropFilter: `blur(10px) url("#${filterId}")` }}
      />
      <span className="pointer-events-none relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
      <GlassFilter filterId={filterId} />
    </Comp>
  );
}

export { Button, buttonVariants, liquidbuttonVariants, LiquidButton };

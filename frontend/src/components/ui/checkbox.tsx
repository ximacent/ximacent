import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean;
  /** Visual "some but not all" state — e.g. a header select-all checkbox. */
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * A native <input type="checkbox"> under the hood — this project has no
 * @radix-ui/react-checkbox dependency, so this stays dependency-free while
 * matching the visual language of the other form controls.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, indeterminate, onCheckedChange, disabled, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = Boolean(indeterminate) && !checked;
      }
    }, [indeterminate, checked]);

    return (
      <span
        className={cn(
          "relative inline-flex h-4 w-4 flex-shrink-0 items-center justify-center",
          className
        )}
      >
        <input
          ref={innerRef}
          type="checkbox"
          role="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded border border-input bg-secondary/50 transition-colors checked:border-champagne checked:bg-champagne indeterminate:border-champagne indeterminate:bg-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        <Check className="pointer-events-none absolute h-3 w-3 scale-0 text-primary-foreground opacity-0 transition-transform peer-checked:scale-100 peer-checked:opacity-100" />
        <Minus className="pointer-events-none absolute h-3 w-3 scale-0 text-primary-foreground opacity-0 transition-transform peer-indeterminate:scale-100 peer-indeterminate:opacity-100 peer-checked:scale-0 peer-checked:opacity-0" />
      </span>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

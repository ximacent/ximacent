"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASSWORD_REQUIREMENTS } from "@/lib/validation/user";

export function PasswordStrengthMeter({ password }: { password: string }) {
  return (
    <ul className="grid gap-1 sm:grid-cols-2">
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const met = requirement.test(password);
        return (
          <li
            key={requirement.id}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              met ? "text-gold" : "text-stone"
            )}
          >
            {met ? (
              <Check className="h-3 w-3 flex-shrink-0" />
            ) : (
              <Circle className="h-3 w-3 flex-shrink-0" />
            )}
            {requirement.label}
          </li>
        );
      })}
    </ul>
  );
}

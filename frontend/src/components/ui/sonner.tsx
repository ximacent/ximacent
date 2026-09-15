"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group z-[100]"
      toastOptions={{
        classNames: {
          toast:
            "group toast w-[calc(100vw-2rem)] max-w-sm group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-elevated sm:w-auto",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-secondary group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-champagne/40",
          error: "group-[.toaster]:border-rose/50",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };

"use client";

import type React from "react";

import { cn } from "~/lib/utils";

/**
 * A form label component that should be associated with a form control.
 * Use the `htmlFor` prop to associate with an input by id, or wrap the input inside the label.
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: <false positive>
    <label
      className={cn(
        "flex select-none items-center gap-2 font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        className
      )}
      data-slot="label"
      {...props}
    />
  );
}

export { Label };

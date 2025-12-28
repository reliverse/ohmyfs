// Color variant mappings using CSS tokens from global.css
// These ensure all classes use theme-aware tokens

export type ColorVariant = "purple" | "blue" | "green" | "orange" | "yellow";

export const colorVariants = {
  icon: {
    purple: "text-primary",
    blue: "text-primary",
    green: "text-chart-1",
    orange: "text-chart-4",
    yellow: "text-chart-3",
  },
  bg: {
    purple: "bg-primary/20",
    blue: "bg-primary/20",
    green: "bg-chart-1/20",
    orange: "bg-chart-4/20",
    yellow: "bg-chart-3/20",
  },
  text: {
    purple: "text-primary",
    blue: "text-primary",
    green: "text-chart-1",
    orange: "text-chart-4",
    yellow: "text-chart-3",
  },
  border: {
    purple: "border-primary/30",
    blue: "border-primary/30",
    green: "border-chart-1/30",
    orange: "border-chart-4/30",
    yellow: "border-chart-3/30",
  },
  badge: {
    purple: "bg-primary/20 text-primary border-primary/30",
    blue: "bg-primary/20 text-primary border-primary/30",
    green: "bg-chart-1/20 text-chart-1 border-chart-1/30",
    orange: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    yellow: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  },
} as const;

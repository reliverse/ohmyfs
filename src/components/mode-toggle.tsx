import { Moon, Sun } from "lucide-react";
import { useTheme } from "~/components/theme-provider";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface ModeToggleProps {
  variant?: "icon" | "button";
}

export function ModeToggle({ variant = "icon" }: ModeToggleProps) {
  const { theme, setTheme } = useTheme();

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
      default:
        return "Light";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className={variant === "icon" ? "relative" : ""}
            size={variant === "icon" ? "icon" : "default"}
            variant="outline"
          >
            {variant === "icon" ? (
              <>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </>
            ) : (
              <span className="flex items-center gap-2">
                {(() => {
                  if (theme === "light") {
                    return <Sun className="h-4 w-4" />;
                  }
                  if (theme === "dark") {
                    return <Moon className="h-4 w-4" />;
                  }
                  return (
                    <div className="h-4 w-4 rounded-full border-2 border-current" />
                  );
                })()}
                {getThemeLabel()}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

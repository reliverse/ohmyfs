import { toast as sonnerToast } from "sonner";

interface ToastProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  return {
    toast: ({
      title,
      description,
      action,
      ...props
    }: ToastProps & Record<string, unknown>) => {
      if (action) {
        sonnerToast(title || description || "", {
          description: title ? description : undefined,
          action: {
            label: action.label,
            onClick: action.onClick,
          },
          ...props,
        });
      } else {
        sonnerToast(title || description || "", {
          description: title ? description : undefined,
          ...props,
        });
      }
    },
  };
}

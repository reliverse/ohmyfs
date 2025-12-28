export interface Task {
  id: string;
  title: string;
  description: string;
  category: "main" | "side" | "daily" | "weekly";
  status: "available" | "in-progress" | "completed";
  progress: number;
  maxProgress: number;
  rewards: {
    completionPoints: number;
    bonusStorage: number;
    badges?: string[];
  };
}

export interface Mod {
  id: string;
  name: string;
  description: string;
  category: "graphics" | "gameplay" | "ui" | "audio" | "other";
  version: string;
  author: string;
  installed: boolean;
  enabled: boolean;
}

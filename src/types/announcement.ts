export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "update" | "event" | "maintenance" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  publishedAt: string;
  read: boolean;
}

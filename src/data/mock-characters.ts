import type { UserProfile } from "~/types/profile";

export const mockUserProfiles: UserProfile[] = [
  {
    id: "profile-1",
    name: "Marcus_Johnson",
    tier: 3,
    usageTime: "127h 32m",
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    stats: {
      filesUploaded: 156,
      filesDownloaded: 89,
      storageUsed: 45_000,
    },
    theme: "dark",
    age: 28,
    bio: "Software developer specializing in backend systems.",
    preferences: {
      defaultView: "grid",
      homeDirectory: "/home/marcus",
      notifications: true,
    },
    description:
      "Marcus has been using ohmyfs for over 5 years. He manages large datasets for his development projects and appreciates the robust file organization features.",
  },
  {
    id: "profile-2",
    name: "Sophia_Martinez",
    tier: 2,
    usageTime: "89h 15m",
    lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    stats: {
      filesUploaded: 67,
      filesDownloaded: 45,
      storageUsed: 28_000,
    },
    theme: "light",
    age: 24,
    bio: "Digital marketing specialist and content creator.",
    preferences: {
      defaultView: "list",
      homeDirectory: "/home/sophia",
      notifications: false,
    },
    description:
      "Sophia uses ohmyfs to organize her media assets and collaborate with her creative team. The sharing features have been invaluable for her workflow.",
  },
  {
    id: "profile-3",
    name: "Alex_Rivera",
    tier: 1,
    usageTime: "34h 22m",
    lastActive: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    stats: {
      filesUploaded: 23,
      filesDownloaded: 31,
      storageUsed: 12_000,
    },
    theme: "auto",
    age: 22,
    bio: "College student studying computer science.",
    preferences: {
      defaultView: "grid",
      homeDirectory: "/home/alex",
      notifications: true,
    },
    description:
      "Alex discovered ohmyfs through a class project and has been using it ever since. He appreciates the intuitive interface and powerful search capabilities.",
  },
  {
    id: "profile-4",
    name: "Dr_Emily_Chen",
    tier: 3,
    usageTime: "156h 48m",
    lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    stats: {
      filesUploaded: 234,
      filesDownloaded: 156,
      storageUsed: 67_000,
    },
    theme: "light",
    age: 32,
    bio: "Research scientist in bioinformatics.",
    preferences: {
      defaultView: "list",
      homeDirectory: "/home/emily",
      notifications: true,
    },
    description:
      "Dr. Chen manages extensive research datasets and collaborates with international teams. ohmyfs helps her maintain organized archives of her scientific work.",
  },
];

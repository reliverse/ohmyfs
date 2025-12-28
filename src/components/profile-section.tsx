import type { LucideIcon } from "lucide-react";
import {
  Award,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Trophy,
  User,
} from "lucide-react";
import { memo, useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Skeleton } from "~/components/ui/skeleton";
import { type ColorVariant, colorVariants } from "~/utils/color-variants";

interface Stat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: ColorVariant;
}

interface Achievement {
  name: string;
  description: string;
  date: string;
  rarity: "Common" | "Rare" | "Epic";
}

interface ProfileSectionProps {
  isLoading?: boolean;
}

function ProfileSection({ isLoading = false }: ProfileSectionProps) {
  const profile = useMemo(
    () => ({
      username: "User",
      level: 42,
      experience: 75,
      usageTime: "127h 32m",
      joinDate: "2026-01-01",
      milestones: 23,
      status: "Premium",
    }),
    []
  );

  const stats: Stat[] = useMemo(
    () => [
      {
        label: "Tier",
        value: profile.level,
        icon: Star,
        color: "purple",
      },
      {
        label: "Milestones",
        value: profile.milestones,
        icon: Trophy,
        color: "yellow",
      },
      {
        label: "Usage Time",
        value: profile.usageTime,
        icon: Clock,
        color: "blue",
      },
      {
        label: "Status",
        value: profile.status,
        icon: Award,
        color: "green",
      },
    ],
    [profile]
  );

  const recentAchievements: Achievement[] = useMemo(
    () => [
      {
        name: "Getting Started",
        description: "Complete the file system tutorial",
        date: "2026-01-15",
        rarity: "Common",
      },
      {
        name: "File Sharer",
        description: "Share 10 files",
        date: "2026-01-14",
        rarity: "Rare",
      },
      {
        name: "Power User",
        description: "Perform 100 file operations",
        date: "2026-01-12",
        rarity: "Epic",
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <Skeleton className="mb-2 h-9 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-2xl" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-32" />
                <div className="flex gap-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
                <Skeleton className="mb-1 h-7 w-16" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="mb-4 h-6 w-48" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  className="flex items-start gap-4 rounded-xl bg-card p-4"
                  key={i}
                >
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="mb-2 font-bold text-3xl">Profile</h2>
        <p className="text-muted-foreground">Your progress and achievements</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary">
              <User className="text-primary-foreground" size={48} />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 font-bold text-2xl">{profile.username}</h3>
              <div className="mb-4 flex items-center gap-3">
                <Badge variant="secondary">Tier {profile.level}</Badge>
                <Badge variant="outline">{profile.status}</Badge>
              </div>
              <div className="space-y-2">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Storage Usage</span>
                  <span className="font-medium text-foreground">
                    {profile.experience}%
                  </span>
                </div>
                <Progress className="h-2" value={profile.experience} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              className="transition-all hover:border-border/80 hover:bg-card/80"
              key={stat.label}
            >
              <CardContent className="p-6">
                <div
                  className={`h-10 w-10 rounded-xl ${colorVariants.bg[stat.color]} mb-3 flex items-center justify-center`}
                >
                  <Icon className={colorVariants.icon[stat.color]} size={20} />
                </div>
                <div className="mb-1 font-bold text-2xl">{stat.value}</div>
                <div className="text-muted-foreground text-sm">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-xl">
            <Trophy className="text-chart-3" size={20} />
            Recent Milestones
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {recentAchievements.map((achievement, _index) => {
              let badgeVariant:
                | "default"
                | "secondary"
                | "destructive"
                | "outline" = "outline";
              if (achievement.rarity === "Common") {
                badgeVariant = "secondary";
              } else if (achievement.rarity === "Rare") {
                badgeVariant = "default";
              } else if (achievement.rarity === "Epic") {
                badgeVariant = "destructive";
              }

              return (
                <div
                  className="flex items-start gap-4 rounded-xl bg-card p-4 transition-colors hover:bg-card/80"
                  key={achievement.name}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-chart-3/30 bg-chart-3/20">
                    <Award className="text-chart-3" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="font-semibold">{achievement.name}</h4>
                      <Badge className="text-xs" variant={badgeVariant}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <p className="mb-1 text-muted-foreground text-sm">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Calendar size={12} />
                      {new Date(achievement.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-xl">
            <TrendingUp className="text-primary" size={20} />
            Activity
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-card p-3">
              <span className="text-muted-foreground text-sm">
                Member since
              </span>
              <span className="font-medium text-sm">
                {new Date(profile.joinDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-card p-3">
              <span className="text-muted-foreground text-sm">
                Total operations
              </span>
              <span className="font-medium text-sm">156</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-card p-3">
              <span className="text-muted-foreground text-sm">
                Favorite activity
              </span>
              <span className="font-medium text-sm">File Management</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(ProfileSection);

import { Calendar, ChevronRight, Tag } from "lucide-react";
import { memo } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
}

interface ChangelogItem {
  version: string;
  changes: string;
}

// Static news data for ohmyfs
const NEWS_ITEMS: NewsItem[] = [
  {
    id: "1",
    title: "Declarative Filesystem Engine Released",
    excerpt:
      "Define your filesystem structures as code and apply them safely with our new declarative engine. Preview changes before execution and enjoy rollback support.",
    category: "feature",
    date: "2024-12-28",
  },
  {
    id: "2",
    title: "Performance Improvements",
    excerpt:
      "Major performance enhancements with virtual scrolling for large directories and improved file operations speed.",
    category: "improvement",
    date: "2024-12-25",
  },
  {
    id: "3",
    title: "Archive Management",
    excerpt:
      "Full ZIP archive support with compression, extraction, and preview capabilities built-in.",
    category: "feature",
    date: "2024-12-20",
  },
];

const CHANGELOG_ITEMS: ChangelogItem[] = [
  {
    version: "v0.1.0",
    changes:
      "Initial release with core file management features, search, compression, and batch operations",
  },
];

interface NewsSectionProps {
  isLoading?: boolean;
}

function NewsSection({ isLoading = false }: NewsSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-9 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-5" />
                </div>
                <Skeleton className="mb-2 h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-8">
          <CardContent className="p-6">
            <Skeleton className="mb-4 h-6 w-48" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  className="flex items-start gap-3 rounded-xl bg-card p-3"
                  key={i}
                >
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const news: NewsItem[] = NEWS_ITEMS;

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-2 font-bold text-3xl">Latest Updates</h2>
          <p className="text-muted-foreground">
            Stay informed about new features and events
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <Card
            aria-label={`${item.title} - ${item.category}`}
            className="group cursor-pointer transition-all duration-300 hover:border-border/80 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            key={item.id}
          >
            <CardContent className="p-6">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{item.category}</Badge>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar size={14} />
                    <time>
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                </div>
                <ChevronRight
                  className="text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-foreground"
                  size={20}
                />
              </div>

              <h3 className="mb-2 font-semibold text-xl transition-colors group-hover:text-primary">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.excerpt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Changelog Section */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-xl">
            <Tag className="text-primary" size={20} />
            Recent Changelog
          </h3>
          <div className="space-y-3">
            {CHANGELOG_ITEMS.map((log) => (
              <div
                className="flex items-start gap-3 rounded-xl bg-card p-3"
                key={log.version}
              >
                <span className="rounded-md bg-primary/20 px-2 py-1 font-mono text-primary text-xs">
                  {log.version}
                </span>
                <p className="flex-1 text-foreground text-sm">{log.changes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(NewsSection);

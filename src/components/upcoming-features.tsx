import { memo, useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { ColorVariant } from "~/utils/color-variants";

function UpcomingFeatures() {
  const features = useMemo(
    () => [
      {
        title: "AI Marketplace",
        status: "Coming Soon",
        color: "purple" as ColorVariant,
      },
      {
        title: "Mod Support",
        status: "In Development",
        color: "blue" as ColorVariant,
      },
      {
        title: "Voice AI NPCs",
        status: "Planned",
        color: "green" as ColorVariant,
      },
    ],
    []
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm uppercase tracking-wider">
          Roadmap
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {features.map((feature) => (
            <div
              className="flex items-center justify-between rounded-xl bg-card p-3 transition-colors hover:bg-card/80"
              key={feature.title}
            >
              <span className="font-medium text-sm">{feature.title}</span>
              <Badge className="text-xs" variant="secondary">
                {feature.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(UpcomingFeatures);

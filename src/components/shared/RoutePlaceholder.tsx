import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';

interface RoutePlaceholderProps {
  title: string;
  route: string;
  purpose: string;
  frReference?: string;
  breadcrumbs?: string[];
}

export function RoutePlaceholder({
  title,
  route,
  purpose,
  frReference,
  breadcrumbs,
}: RoutePlaceholderProps) {
  return (
    <>
      <PageHeader
        title={title}
        description="Placeholder page — full experience will be implemented in later phases."
        breadcrumbs={breadcrumbs}
      />
      <Card className="max-w-2xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Route stub</CardTitle>
            <Badge variant="secondary">Phase 2</Badge>
          </div>
          <CardDescription>{purpose}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Path:</span> <code>{route}</code>
          </p>
          {frReference && (
            <p>
              <span className="font-medium text-foreground">Requirement:</span> {frReference}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

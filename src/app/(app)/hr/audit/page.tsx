'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Filter } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLogRow {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string | null;
  details: Record<string, unknown>;
}

export default function HrAuditPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const response = await fetch('/api/hr/audit-logs');
        if (response.ok) {
          const data = (await response.json()) as { logs: AuditLogRow[] };
          if (!cancelled) setLogs(data.logs);
        } else if (!cancelled) {
          setLoadError(true);
        }
      } catch {
        // A network failure would otherwise escape the effect as an unhandled
        // rejection and the empty state would misread as "no events".
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const actions = useMemo(
    () => [...new Set(logs.map((l) => l.action))].sort(),
    [logs],
  );

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (agentFilter !== 'all' && log.entityId !== agentFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          log.action,
          log.entityType,
          log.entityId ?? '',
          JSON.stringify(log.details),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [logs, actionFilter, agentFilter, search]);

  const exportCsv = useCallback(() => {
    window.open('/api/hr/audit-logs/export', '_blank');
  }, []);

  return (
    <>
      <PageHeader
        title="Audit & governance log"
        description="Org-scoped agent invocations, recommendation actions, and governance blocks — for HR decision context."
        breadcrumbs={['HR', 'Audit Log']}
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        }
      />

      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4" />
              Filters
            </CardTitle>
            <CardDescription>Filter by action type, agent, or free-text search</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Select
              value={actionFilter}
              onValueChange={(value) => setActionFilter(value ?? 'all')}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={agentFilter}
              onValueChange={(value) => setAgentFilter(value ?? 'all')}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {logs
                  .filter((l) => l.entityType === 'agent' && l.entityId)
                  .map((l) => l.entityId!)
                  .filter((id, i, arr) => arr.indexOf(id) === i)
                  .map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm sm:max-w-xs"
              placeholder="Search details…"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Events ({filtered.length})</CardTitle>
            <CardDescription>
              Includes blocked agent invocations and recommendation accept/dismiss actions
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading audit events…</p>
            ) : loadError ? (
              <p role="alert" className="text-sm text-destructive">
                Could not load audit events. Refresh the page to try again.
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit events match your filters.</p>
            ) : (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Time</th>
                    <th className="pb-3 pr-4 font-medium">Action</th>
                    <th className="pb-3 pr-4 font-medium">Entity</th>
                    <th className="pb-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 align-top">
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            log.action.includes('blocked') ? 'destructive' : 'secondary'
                          }
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-medium">{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-muted-foreground"> · {log.entityId}</span>
                        )}
                      </td>
                      <td className="py-3 max-w-md truncate text-muted-foreground">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

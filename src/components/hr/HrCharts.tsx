'use client';

import { Component, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CHART_COLORS = ['#1E4D8C', '#0D9488', '#3B82F6', '#6366F1', '#14B8A6'];

interface ChartFallbackProps {
  title: string;
  description?: string;
  rows: Array<{ label: string; value: string | number }>;
}

function ChartFallback({ title, description, rows }: ChartFallbackProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

class ChartErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface HrBarChartPanelProps {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number }>;
  valueSuffix?: string;
}

export function HrBarChartPanel({
  title,
  description,
  data,
  valueSuffix = '',
}: HrBarChartPanelProps) {
  const fallback = (
    <ChartFallback
      title={title}
      description={description}
      rows={data.map((d) => ({ label: d.name, value: `${d.value}${valueSuffix}` }))}
    />
  );

  return (
    <ChartErrorBoundary fallback={fallback}>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${String(value ?? '')}${valueSuffix}`, 'Value']}
                contentStyle={{ borderRadius: 8 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </ChartErrorBoundary>
  );
}

interface HrLineChartPanelProps {
  title: string;
  description?: string;
  data: Array<{ date: string; score: number }>;
}

export function HrLineChartPanel({ title, description, data }: HrLineChartPanelProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
  }));

  const fallback = (
    <ChartFallback
      title={title}
      description={description}
      rows={formatted.map((d) => ({ label: d.label, value: d.score }))}
    />
  );

  return (
    <ChartErrorBoundary fallback={fallback}>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#1E4D8C"
                strokeWidth={2}
                dot={{ fill: '#0D9488', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </ChartErrorBoundary>
  );
}

interface HrFunnelChartPanelProps {
  title: string;
  description?: string;
  stages: Array<{ stage: string; count: number }>;
}

export function HrFunnelChartPanel({ title, description, stages }: HrFunnelChartPanelProps) {
  const data = stages.map((s) => ({ name: s.stage, value: s.count }));

  return (
    <HrBarChartPanel
      title={title}
      description={description}
      data={data}
    />
  );
}

"use client";

import * as React from "react";
import { Tooltip, TooltipProps } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  { label: string; color?: string }
>;

interface ChartContextValue {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used inside ChartContainer");
  return ctx;
}

interface ChartContainerProps {
  config: ChartConfig;
  children: React.ReactElement;
  className?: string;
  style?: React.CSSProperties;
}

export function ChartContainer({ config, children, className, style }: ChartContainerProps) {
  const cssVars = Object.entries(config).reduce<Record<string, string>>((acc, [key, val]) => {
    if (val.color) acc[`--color-${key}`] = val.color;
    return acc;
  }, {});

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("w-full", className)} style={{ ...(cssVars as React.CSSProperties), ...style }}>
        {children}
      </div>
    </ChartContext.Provider>
  );
}

interface TooltipContentProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number | string; color?: string; dataKey?: string }>;
  label?: string;
  labelFormatter?: (label: string) => string;
  formatter?: (value: number | string, name: string) => string;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
}: TooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  const displayLabel = labelFormatter ? labelFormatter(String(label ?? "")) : label;

  return (
    <div className="rounded-lg border border-border bg-background p-2 shadow-md text-xs">
      {displayLabel && <p className="mb-1 font-medium text-foreground">{displayLabel}</p>}
      {payload.map((item) => {
        const key = item.dataKey ?? item.name;
        const cfg = config[key];
        const color = item.color ?? cfg?.color ?? "var(--color-primary)";
        const displayName = cfg?.label ?? item.name;
        const displayValue = formatter ? formatter(item.value, item.name) : item.value;
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{displayName}</span>
            <span className="ml-auto font-medium text-foreground tabular-nums">{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ChartTooltip(props: any) {
  return <Tooltip {...props} />;
}

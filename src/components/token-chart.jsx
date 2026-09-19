import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] shadow-md">
      <p className="font-medium tabular-nums text-foreground">± {p.token.toLocaleString('id-ID')} token</p>
      <p className="text-muted-foreground">
        {new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
      </p>
    </div>
  )
}

export default function TokenChart({ days, todayStart }) {
  const data = days.map((d) => ({ date: d.date, token: d.tokens }))
  return (
    <div className="h-36 w-full text-primary">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 2, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="tokenFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} />
          <XAxis
            dataKey="date"
            interval={2}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'currentColor', fillOpacity: 0.55 }}
            tickFormatter={(v) => new Date(v).toLocaleDateString('id-ID', { day: 'numeric' })}
          />
          <YAxis
            width={40}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'currentColor', fillOpacity: 0.55 }}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
          />
          <Tooltip content={<ChartTip />} cursor={{ stroke: 'currentColor', strokeOpacity: 0.25 }} />
          <ReferenceLine x={todayStart} stroke="currentColor" strokeOpacity={0.4} strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="token"
            stroke="currentColor"
            strokeWidth={1.5}
            fill="url(#tokenFill)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

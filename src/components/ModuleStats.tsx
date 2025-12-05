
import React from "react";
import {
PieChart,
Pie,
Cell,
ResponsiveContainer,
Tooltip,
Legend,
BarChart,
Bar,
XAxis,
YAxis,
CartesianGrid,
} from "recharts";

const COLORS = [
"\#8884d8",
"\#82ca9d",
"\#ffc658",
"\#ff8042",
"\#0088fe",
"\#00c49f",
];

interface ModuleStatsProps {
data: any[];
type: "pie" | "bar";
dataKey: string;
nameKey: string;
title: string;
totalLabel?: string;
valueFormatter?: (value: number) => string;
}

export const ModuleStats: React.FC<ModuleStatsProps> = ({
data,
type,
dataKey,
nameKey,
title,
totalLabel = "Total",
valueFormatter = (val) => `$${val.toLocaleString()}`,
}) => {
if (!data || data.length === 0) return null;

const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

return (
<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
<div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
{title}
</h3>
<span className="text-sm font-bold text-gray-900">
{totalLabel}: {valueFormatter(total)}
</span>
</div>
<div className="h-64 w-full">
<ResponsiveContainer width="100%" height="100%">
{type === "pie" ? (
<PieChart>
<Pie
data={data}
cx="50%"
cy="50%"
innerRadius={60}
outerRadius={80}
paddingAngle={5}
dataKey={dataKey}
nameKey={nameKey}
>
{data.map((_, index) => (
<Cell
key={`cell-${index}`}
fill={COLORS[index % COLORS.length]}
/>
))}
</Pie>
<Tooltip
formatter={(value: number) => valueFormatter(value)}
contentStyle={{
backgroundColor: "rgba(255, 255, 255, 0.95)",
borderRadius: "8px",
border: "1px solid \#e5e7eb",
boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
}}
/>
<Legend verticalAlign="bottom" height={36} />
</PieChart>
) : (
<BarChart data={data}>
<CartesianGrid strokeDasharray="3 3" vertical={false} />
<XAxis dataKey={nameKey} hide />
<YAxis
tickFormatter={(val) =>
val >= 1000 ? `${val / 1000}k` : val
}
/>
<Tooltip
formatter={(value: number) => valueFormatter(value)}
cursor={{ fill: "transparent" }}
contentStyle={{
backgroundColor: "rgba(255, 255, 255, 0.95)",
borderRadius: "8px",
border: "1px solid \#e5e7eb",
boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
}}
/>
<Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
{data.map((_, index) => (
<Cell
key={`cell-${index}`}
fill={COLORS[index % COLORS.length]}
/>
))}
</Bar>
<Legend />
</BarChart>
)}
</ResponsiveContainer>
</div>
</div>
);
};


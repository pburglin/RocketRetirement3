import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  calculateAge,
  runProjection,
  SimulationResult,
} from "../utils/calculations";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Settings, TrendingUp } from "lucide-react";

export const RetirementGoalsPage: React.FC = () => {
  const { user } = useAuth();

  // Local State for assumptions that aren't necessarily persisted or are just defaults
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [inflationRate, setInflationRate] = useState(3);
  const [annualRetirementSpending, setAnnualRetirementSpending] =
    useState(60000);
  const [data, setData] = useState<SimulationResult[]>([]);

  useEffect(() => {
    if (user) {
      // Default spending could be current expenses * 12
      const currentAnnualExpenses =
        (user.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0) * 12;
      if (annualRetirementSpending === 60000 && currentAnnualExpenses > 0) {
        setAnnualRetirementSpending(currentAnnualExpenses);
      }

      const results = runProjection(
        user,
        retirementAge,
        lifeExpectancy,
        inflationRate,
        annualRetirementSpending,
      );
      setData(results);
    }
  }, [
    user,
    retirementAge,
    lifeExpectancy,
    inflationRate,
    annualRetirementSpending,
  ]);

  const leftMargin = useMemo(() => {
    if (data.length === 0) return 0;
    const maxValue = Math.max(...data.map((d) => d.netWorth));
    // Approximate format: $XXX,XXXk
    const formattedValue = `$${Math.round(maxValue / 1000).toLocaleString()}k`;
    // Approx 8px per character, minus default YAxis width (~60px), with buffer
    const estimatedWidth = formattedValue.length * 8;
    return Math.max(0, estimatedWidth - 35); // Increase margin if text exceeds typical width
  }, [data]);

  if (!user) return null;

  const currentAge = calculateAge(user.dob || "");

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Retirement Goals & Projection
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="text-gray-500" />
            <h2 className="text-xl font-semibold">Assumptions</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Retirement Age
            </label>
            <input
              type="range"
              min={currentAge + 1}
              max={80}
              value={retirementAge}
              onChange={(e) => setRetirementAge(Number(e.target.value))}
              className="w-full mt-2"
            />
            <div className="text-right font-bold text-blue-600">
              {retirementAge} years old
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Life Expectancy
            </label>
            <input
              type="number"
              value={lifeExpectancy}
              onChange={(e) => setLifeExpectancy(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Inflation Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Annual Retirement Spending (Today's Dollars)
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                value={annualRetirementSpending}
                onChange={(e) =>
                  setAnnualRetirementSpending(Number(e.target.value))
                }
                className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
            </div>
          </div>
        </div>

        {/* Chart Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-blue-600" />
            <h2 className="text-xl font-semibold">Net Worth Projection</h2>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: leftMargin, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorNetWorth"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorInvestments"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="age"
                  label={{
                    value: "Age",
                    position: "insideBottomRight",
                    offset: -5,
                  }}
                />
                <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value: number) => [
                    `$${Math.round(value).toLocaleString()}`,
                    "",
                  ]}
                  labelFormatter={(label) => `Age ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorNetWorth)"
                  name="Total Net Worth"
                />
                <Area
                  type="monotone"
                  dataKey="investments"
                  stroke="#82ca9d"
                  fillOpacity={1}
                  fill="url(#colorInvestments)"
                  name="Investments Only"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>
              <strong>Note:</strong> The "Investments Only" line represents your
              liquid(ish) portfolio. The gap between Net Worth and Investments
              represents fixed assets (Home, Cars) minus liabilities. The drop
              after age {retirementAge} reflects withdrawals to fund your
              lifestyle.
            </p>
          </div>
        </div>
      </div>

      {/* Insights / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Projected Net Worth at Retirement"
          value={data.find((d) => d.age === retirementAge)?.netWorth || 0}
        />
        <StatCard
          title="Portfolio at Age 85"
          value={data.find((d) => d.age === 85)?.investments || 0}
          isDanger={(data.find((d) => d.age === 85)?.investments || 0) <= 0}
        />
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
            Analysis
          </h3>
          <p className="mt-2 text-sm text-gray-700">
            {(data.find((d) => d.age === lifeExpectancy)?.investments || 0) > 0
              ? "🎉 You are projected to have a surplus at end of life expectancy. Your plan looks solid."
              : "⚠️ You are projected to run out of liquid funds before your life expectancy. Consider increasing savings or reducing expenses."}
          </p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  isDanger = false,
}: {
  title: string;
  value: number;
  isDanger?: boolean;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
      {title}
    </h3>
    <p
      className={`mt-2 text-3xl font-bold ${isDanger ? "text-red-600" : "text-gray-900"}`}
    >
      ${Math.round(value).toLocaleString()}
    </p>
  </div>
);

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { calculateAge, SimulationResult } from "../utils/calculations";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw, Play } from "lucide-react";

export const SimulationDashboard: React.FC = () => {
  const { user } = useAuth();

  // Simulation Parameters
  const [iterations, setIterations] = useState(50); // Default low for browser performance, can go up to 1000
  const [volatility, setVolatility] = useState(15); // Standard deviation %
  const [meanReturn, setMeanReturn] = useState(7); // %
  const [simulations, setSimulations] = useState<SimulationResult[][]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Base assumptions (grab from user or defaults)
  const currentAge = user ? calculateAge(user.dob || "") : 30;
  const retirementAge = 65;
  const lifeExpectancy = 90;

  const handleRun = async () => {
    if (!user) return;
    setIsRunning(true);

    // Allow UI to update before heavy calc
    setTimeout(() => {
      const newSims: SimulationResult[][] = [];

      for (let i = 0; i < iterations; i++) {
        // For each year, we need to randomize the return rate based on volatility
        // We need a modified runProjection that accepts a randomizer function or pre-generated rates

        // Simplified Monte Carlo: We will modify the runProjection logic slightly to handle year-by-year volatility
        // For this implementation, we will reimplement a basic loop here to apply the randomness

        const run: SimulationResult[] = [];
        let age = currentAge;
        let invest =
          user.investmentAccounts?.reduce((sum, a) => sum + a.balance, 0) || 0;
        // Simplified: we'll treat the whole portfolio as one bucket for MC
        const { surplus } = {
          surplus:
            (user.incomeSources?.reduce((s, i) => s + i.amount, 0) || 0) -
            (user.expenses?.reduce((s, e) => s + e.amount, 0) || 0),
        };
        let annualSurplus = surplus * 12;
        const spending = 60000; // Hardcoded baseline for now, or derived
        const infl = 3; // 3% inflation

        run.push({
          age,
          netWorth: invest,
          investments: invest,
          assets: 0,
          isRetured: false,
        });

        while (age < lifeExpectancy) {
          age++;
          // Random Return: Box-Muller transform for normal distribution
          const u1 = Math.random();
          const u2 = Math.random();
          const z =
            Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const annualReturn = meanReturn / 100 + z * (volatility / 100);

          // Apply return
          invest = invest * (1 + annualReturn);

          if (age < retirementAge) {
            invest += annualSurplus;
            annualSurplus *= 1 + infl / 100;
          } else {
            // Withdraw
            // Adjust spending for inflation since start
            const yearsSinceStart = age - currentAge;
            const inflatedSpending =
              spending * Math.pow(1 + infl / 100, yearsSinceStart);
            invest -= inflatedSpending;
          }

          // Don't go below zero for visualization sanity (or show debt)
          // if (invest < 0) invest = 0;

          run.push({
            age,
            netWorth: invest, // Simplified to just investments for MC
            investments: invest,
            assets: 0,
            isRetured: age >= retirementAge,
          });
        }
        newSims.push(run);
      }

      setSimulations(newSims);
      setIsRunning(false);
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Monte Carlo Simulation
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-6 items-end mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Iterations
            </label>
            <select
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="mt-1 block w-32 rounded-md border-gray-300 border p-2"
            >
              <option value="10">10 (Fast)</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="500">500 (Slow)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mean Return (%)
            </label>
            <input
              type="number"
              value={meanReturn}
              onChange={(e) => setMeanReturn(Number(e.target.value))}
              className="mt-1 block w-32 rounded-md border-gray-300 border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Volatility (+/- %)
            </label>
            <input
              type="number"
              value={volatility}
              onChange={(e) => setVolatility(Number(e.target.value))}
              className="mt-1 block w-32 rounded-md border-gray-300 border p-2"
            />
          </div>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="animate-spin h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Simulation
          </button>
        </div>

        <div className="h-[500px] w-full">
          {simulations.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="age"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  label={{ value: "Age", position: "insideBottomRight" }}
                  allowDuplicatedCategory={false}
                />
                <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  labelFormatter={(v) => `Age ${v}`}
                  formatter={(v: number) => [
                    `$${Math.round(v).toLocaleString()}`,
                    "Portfolio",
                  ]}
                />
                {simulations.map((s, i) => (
                  <Line
                    key={i}
                    data={s}
                    type="monotone"
                    dataKey="investments"
                    stroke="#8884d8"
                    strokeWidth={1}
                    dot={false}
                    opacity={0.3}
                  />
                ))}
                {/* Add average line? */}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
              <p className="text-gray-500">
                Press "Run Simulation" to see possible futures.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

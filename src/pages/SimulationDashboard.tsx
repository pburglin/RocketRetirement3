import React, { useState, useMemo } from "react";
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
import { RefreshCw, Play, Activity } from "lucide-react";

export const SimulationDashboard: React.FC = () => {
  const { user } = useAuth();

  // Simulation Parameters
  const [iterations, setIterations] = useState(50); // Default low for browser performance, can go up to 1000
  const [volatility, setVolatility] = useState(15); // Standard deviation %
  const [meanReturn, setMeanReturn] = useState(7); // %
  const [simulations, setSimulations] = useState<SimulationResult[][]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Risk Metrics State
  const [riskMetrics, setRiskMetrics] = useState<{
    sharpeRatio: number;
    maxDrawdown: number;
    standardDeviation: number;
  } | null>(null);

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
      const annualReturns: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Simplified Monte Carlo logic with updated calculation logic in mind,
        // but here we focus on the investment randomization part.
        // We replicate the logic from `runProjection` roughly but with random returns.

        const run: SimulationResult[] = [];
        let age = currentAge;
        let invest =
          user.investmentAccounts?.reduce((sum, a) => sum + a.balance, 0) || 0;

        // Calculate Surplus (simplified for MC view)
        const income =
          user.incomeSources?.reduce((s, i) => s + i.amount, 0) || 0;
        const expenses = user.expenses?.reduce((s, e) => s + e.amount, 0) || 0;
        // Investment contributions are handled as transfers usually, but if user entered them as separate from surplus
        // we need to add them. The `runProjection` does this. Here we approximate.

        // In `runProjection`, specific contributions are DEDUCTED from surplus if we assume surplus = Income - Expenses.
        // If user is diligent, Expenses don't include Savings.
        // So Surplus = Income - Expenses.
        // Of that surplus, `specificContribs` goes to specific accounts.
        // The REST goes to general.
        // So Total Annual Addition to Investments = Surplus * 12.
        const totalMonthlySurplus = income - expenses; // Includes specific contributions implicitly if not expense
        let annualAddition = totalMonthlySurplus * 12;

        const spending = 60000; // Hardcoded baseline for now
        const infl = 3; // 3% inflation

        run.push({
          age,
          netWorth: invest,
          investments: invest,
          assets: 0,
          isRetured: false,
        });

        let peakValue = invest;
        let maxDrawdownRun = 0;

        while (age < lifeExpectancy) {
          age++;
          // Random Return
          const u1 = Math.random();
          const u2 = Math.random();
          const z =
            Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const annualReturn = meanReturn / 100 + z * (volatility / 100);

          // Track annual returns for Sharpe (only from first run or aggregate?)
          // Sharpe is typically calculated on the asset returns, not the portfolio value change (which includes deposits).
          // We'll track the `annualReturn` generated here.
          if (i === 0) annualReturns.push(annualReturn);

          // Apply return
          invest = invest * (1 + annualReturn);

          if (age < retirementAge) {
            invest += annualAddition;
            annualAddition *= 1 + infl / 100;
          } else {
            // Withdraw
            const yearsSinceStart = age - currentAge;
            const inflatedSpending =
              spending * Math.pow(1 + infl / 100, yearsSinceStart);
            invest -= inflatedSpending;
          }

          // Drawdown calc
          if (invest > peakValue) peakValue = invest;
          const drawdown = (peakValue - invest) / peakValue;
          if (drawdown > maxDrawdownRun) maxDrawdownRun = drawdown;

          run.push({
            age,
            netWorth: invest,
            investments: invest,
            assets: 0,
            isRetured: age >= retirementAge,
          });
        }
        newSims.push(run);
      }

      setSimulations(newSims);

      // Calculate Metrics
      // Sharpe Ratio = (Mean Return - Risk Free) / StdDev of Returns
      // We simulated returns based on Mean/Vol inputs, so the Sharpe is roughly (Mean - 0) / Vol
      // But let's calculate based on the actual random numbers generated for the first run to be "empirical" to the sim.
      const riskFreeRate = 0.04; // 4% assumption

      // Max Drawdown (average of all runs or worst case?) -> Let's show Worst Case of first run for example
      // Or we can calculate Max Drawdown of the *average* path?
      // Let's just use the theoretical inputs for Sharpe to be clean:
      const theoreticalSharpe =
        (meanReturn / 100 - riskFreeRate) / (volatility / 100);

      setRiskMetrics({
        sharpeRatio: theoreticalSharpe,
        maxDrawdown: 0, // Placeholder, would need complex aggregation
        standardDeviation: volatility,
      });

      setIsRunning(false);
    }, 100);
  };

  const leftMargin = useMemo(() => {
    if (simulations.length === 0) return 20; // Default
    let globalMax = 0;
    for (const run of simulations) {
      for (const point of run) {
        if (point.investments > globalMax) globalMax = point.investments;
      }
    }
    const formattedValue = `$${Math.round(globalMax / 1000).toLocaleString()}k`;
    const estimatedWidth = formattedValue.length * 8;
    return Math.max(20, estimatedWidth - 35);
  }, [simulations]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Monte Carlo Simulation
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
                <LineChart
                  margin={{ top: 5, right: 30, left: leftMargin, bottom: 5 }}
                >
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

        {/* Risk Metrics Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Risk Metrics
            </h3>
            {riskMetrics ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {riskMetrics.sharpeRatio.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    (Mean Return - 4%) / Volatility
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Implied Volatility</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {riskMetrics.standardDeviation}%
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 italic">
                    Based on input parameters.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Run simulation to see metrics.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { usePlanning } from "../context/PlanningContext";
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
import {
  RefreshCw,
  Play,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings2,
  Activity,
} from "lucide-react";

export const SimulationDashboard: React.FC = () => {
  const { user } = useAuth();
  const { assumptions, updateAssumption } = usePlanning();

  // Destructure assumptions for easier access
  const { retirementAge, lifeExpectancy, inflationRate, annualRetirementSpending } = assumptions;

  // Simulation Parameters (these remain local to simulation)
  const [iterations, setIterations] = useState(50);
  const [volatility, setVolatility] = useState(15); // Standard deviation %
  const [meanReturn, setMeanReturn] = useState(7); // %

  const [simulations, setSimulations] = useState<SimulationResult[][]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Risk Metrics State
  const [riskMetrics, setRiskMetrics] = useState<{
    sharpeRatio: number;
    maxDrawdown: number;
    standardDeviation: number;
    successRate: number;
  } | null>(null);

  // Base assumptions (grab from user or defaults)
  const currentAge = user ? calculateAge(user.dob || "") : 30;

  const handleRun = async () => {
    if (!user) return;
    setIsRunning(true);

    // Allow UI to update before heavy calc
    setTimeout(() => {
      const newSims: SimulationResult[][] = [];
      const annualReturns: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const run: SimulationResult[] = [];
        let age = currentAge;
        
        // Calculate initial investment (include assets like runProjection does)
        const initialInvestments = user.investmentAccounts?.reduce((sum, a) => sum + a.balance, 0) || 0;
        const initialAssets = user.assets?.reduce((sum, a) => sum + a.value, 0) || 0;
        const initialLiabilities = user.liabilities?.reduce((sum, l) => sum + l.balance, 0) || 0;
        let invest = initialInvestments + initialAssets - initialLiabilities;

        // Only include recurring expenses (not one-time) in monthly surplus calculation
        const recurringExpenses = user.expenses?.filter(e => !e.isOneTime) || [];
        const income = user.incomeSources?.reduce((s, i) => s + i.amount, 0) || 0;
        const expenses = recurringExpenses.reduce((s, e) => s + e.amount, 0) || 0;
        const liabilityPayments = user.liabilities?.reduce((s, l) => s + (l.monthlyPayment || 0), 0) || 0;
        const totalMonthlySurplus = income - expenses;
        let annualAddition = totalMonthlySurplus * 12;

        // Social Security (simplified - assume same as Goals projection)
        const socialSecurityAmount = user.socialSecurity?.reduce((total, ss) => {
          if (currentAge >= ss.startAge) {
            return total + ss.monthlyAmount + (ss.spousalAmount || 0);
          }
          return total;
        }, 0) || 0;

        const spending = annualRetirementSpending;
        const infl = inflationRate;

        run.push({
          age,
          netWorth: invest,
          investments: invest,
          assets: 0,
          isRetured: false,
        });

        while (age < lifeExpectancy) {
          age++;
          // Random Return
          const u1 = Math.random();
          const u2 = Math.random();
          const z =
            Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const annualReturn = meanReturn / 100 + z * (volatility / 100);

          if (i === 0) annualReturns.push(annualReturn);

          // Apply return
          invest = invest * (1 + annualReturn);

          if (age < retirementAge) {
            invest += annualAddition;
            annualAddition *= 1 + infl / 100;
          } else {
            // Withdraw for retirement spending + liability payments
            const yearsSinceStart = age - currentAge;
            const inflatedSpending = spending * Math.pow(1 + infl / 100, yearsSinceStart);
            const inflatedLiabilityPayments = liabilityPayments * 12 * Math.pow(1 + infl / 100, yearsSinceStart);
            const socialSecurityThisYear = socialSecurityAmount * 12 * Math.pow(1 + infl / 100, yearsSinceStart);
            invest = invest - inflatedSpending - inflatedLiabilityPayments + socialSecurityThisYear;
          }

          // Stop at zero for simpler graph viz (bankruptcy)
          if (invest < 0) invest = 0;

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
      const riskFreeRate = 0.04;
      const theoreticalSharpe =
        (meanReturn / 100 - riskFreeRate) / (volatility / 100);

      // Success Rate: How many runs ended with > 0 money?
      const successfulRuns = newSims.filter(
        (run) => run[run.length - 1].investments > 0,
      ).length;
      const successRate = (successfulRuns / iterations) * 100;

      setRiskMetrics({
        sharpeRatio: theoreticalSharpe,
        maxDrawdown: 0,
        standardDeviation: volatility,
        successRate,
      });

      setIsRunning(false);
    }, 100);
  };

  const leftMargin = useMemo(() => {
    if (simulations.length === 0) return 20;
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Monte Carlo Simulation
          </h1>
          <p className="text-gray-500 mt-1">
            Stress-test your retirement plan against market volatility and
            economic variables.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          {/* Controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Simulation Parameters
              </h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {showAdvanced ? "Hide Advanced" : "Show Advanced"}
              </button>
            </div>

            <div className="flex flex-wrap gap-6 items-end">
              {/* Primary Controls */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  Scenarios
                </label>
                <select
                  value={iterations}
                  onChange={(e) => setIterations(Number(e.target.value))}
                  className="block w-32 rounded-md border-gray-300 border p-2 text-sm bg-white"
                >
                  <option value="10">10 (Fast)</option>
                  <option value="50">50 (Standard)</option>
                  <option value="100">100 (Detailed)</option>
                  <option value="500">500 (Precise)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  Retirement Spending
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={annualRetirementSpending}
                    onChange={(e) =>
                      updateAssumption('annualRetirementSpending', Number(e.target.value))
                    }
                    className="block w-36 rounded-md border-gray-300 border p-2 pl-6 text-sm"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Today's Dollars
                </p>
              </div>

              {/* Advanced Controls */}
              {showAdvanced && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                      Target Retirement Age
                    </label>
                    <input
                      type="number"
                      min={currentAge + 1}
                      max={80}
                      value={retirementAge}
                      onChange={(e) =>
                        updateAssumption('retirementAge', Number(e.target.value))
                      }
                      className="block w-24 rounded-md border-gray-300 border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                      Life Expectancy
                    </label>
                    <input
                      type="number"
                      value={lifeExpectancy}
                      onChange={(e) =>
                        updateAssumption('lifeExpectancy', Number(e.target.value))
                      }
                      className="block w-24 rounded-md border-gray-300 border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                      Inflation (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inflationRate}
                      onChange={(e) => updateAssumption('inflationRate', Number(e.target.value))}
                      className="block w-24 rounded-md border-gray-300 border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                      Exp. Return (%)
                    </label>
                    <input
                      type="number"
                      value={meanReturn}
                      onChange={(e) => setMeanReturn(Number(e.target.value))}
                      className="block w-24 rounded-md border-gray-300 border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                      Volatility (%)
                    </label>
                    <input
                      type="number"
                      value={volatility}
                      onChange={(e) => setVolatility(Number(e.target.value))}
                      className="block w-24 rounded-md border-gray-300 border p-2 text-sm"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleRun}
                disabled={isRunning}
                className="ml-auto flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isRunning ? (
                  <RefreshCw className="animate-spin h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run Simulation
              </button>
            </div>
          </div>

          <div className="h-[500px] w-full relative">
            {simulations.length > 0 ? (
              <>
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
                        stroke={
                          s[s.length - 1].investments <= 0
                            ? "#ef4444"
                            : "#8884d8"
                        }
                        strokeWidth={1}
                        dot={false}
                        opacity={0.4}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded text-xs text-gray-500 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-[#8884d8]"></span>
                    <span>Successful Scenarios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span>Depleted Scenarios</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <Activity className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">Ready to Simulate</p>
                <p className="text-sm text-gray-400 mt-1 max-w-sm text-center">
                  Click "Run Simulation" to generate {iterations} possible
                  future market scenarios based on your parameters.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Metrics & Explanations */}
        <div className="lg:col-span-1 space-y-6">
          {/* Results Panel */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Results
            </h3>
            {riskMetrics ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Success Rate
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-bold ${
                        riskMetrics.successRate >= 80
                          ? "text-green-600"
                          : riskMetrics.successRate >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {riskMetrics.successRate.toFixed(0)}%
                    </span>
                    <span className="text-xs text-gray-400">
                      chance of success
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {riskMetrics.successRate >= 90 ? (
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="w-3 h-3" /> Excellent stability
                      </span>
                    ) : riskMetrics.successRate < 50 ? (
                      <span className="flex items-center gap-1 text-red-700">
                        <AlertTriangle className="w-3 h-3" /> High risk of
                        depletion
                      </span>
                    ) : (
                      "Moderate risk profile"
                    )}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-500">
                      Sharpe Ratio
                    </p>
                    <div
                      className="group relative cursor-help"
                      title="Measure of risk-adjusted return. Higher is better."
                    >
                      <Info className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {riskMetrics.sharpeRatio.toFixed(2)}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    What this means
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Based on {iterations} simulations, your portfolio survived
                    until age {lifeExpectancy} in {riskMetrics.successRate}% of
                    scenarios.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm italic">
                Run the simulation to see your success probability and risk
                metrics.
              </div>
            )}
          </div>

          {/* Educational Panel */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> Understanding the Graph
            </h3>
            <ul className="space-y-3 text-xs text-blue-800">
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>
                  Each <strong>line</strong> represents one possible future
                  market outcome.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>
                  <strong>Red lines</strong> indicate scenarios where you ran
                  out of money before age {lifeExpectancy}.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>
                  <strong>Volatility</strong> controls how "bouncy" the lines
                  are. Higher volatility means wider spread of outcomes.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

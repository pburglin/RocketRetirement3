import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  calculateNetWorth,
  calculateMonthlyCashFlow,
} from "../utils/calculations";
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  CreditCard,
  Landmark,
  TrendingUp,
  Wallet,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  Users,
  Calendar,
} from "lucide-react";
import { SocialSecurity, Expense } from "../services/storage";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Calculations
  const netWorth = calculateNetWorth(user);
  const { income, expenses, surplus } = calculateMonthlyCashFlow(user);

  const totalAssetsValue =
    (user.assets?.reduce((sum, a) => sum + a.value, 0) || 0) +
    (user.investmentAccounts?.reduce((sum, i) => sum + i.balance, 0) || 0);

  const totalLiabilitiesValue =
    user.liabilities?.reduce((sum, l) => sum + l.balance, 0) || 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Financial Dashboard
        </h1>
        <Link
          to="/profile"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Manage Profile
        </Link>
      </div>

      {/* Financial Snapshot */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Financial Snapshot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="Total Assets"
            value={totalAssetsValue}
            icon={<Landmark className="text-blue-600 w-6 h-6" />}
            subtext="Investments + Fixed Assets"
          />
          <SummaryCard
            title="Total Liabilities"
            value={totalLiabilitiesValue}
            icon={<TrendingUp className="text-orange-600 w-6 h-6" />}
            isNegative
          />
          <SummaryCard
            title="Net Worth"
            value={netWorth}
            icon={<Activity className="text-purple-600 w-6 h-6" />}
            highlight
          />
        </div>
      </div>

      {/* Monthly Cash Flow */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Monthly Cash Flow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="Monthly Income"
            value={income}
            icon={<ArrowUpCircle className="text-green-600 w-6 h-6" />}
            monthly
          />
          <SummaryCard
            title="Monthly Expenses"
            value={expenses}
            icon={<ArrowDownCircle className="text-red-600 w-6 h-6" />}
            subtext="Includes Liability Payments"
            monthly
            isNegative
          />
          <SummaryCard
            title={surplus >= 0 ? "Monthly Surplus" : "Monthly Deficit"}
            value={surplus}
            icon={<Wallet className="text-indigo-600 w-6 h-6" />}
            monthly
            highlight={surplus > 0}
            isNegative={surplus < 0}
          />
        </div>
      </div>

      {/* Quick Navigation Links - Reordered */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <QuickLink
            to="/income"
            label="Income"
            icon={<DollarSign className="text-green-600" />}
          />
          <QuickLink
            to="/investments"
            label="Investments"
            icon={<Wallet className="text-purple-600" />}
          />
          <QuickLink
            to="/assets"
            label="Assets"
            icon={<Landmark className="text-blue-600" />}
          />
          <QuickLink
            to="/expenses"
            label="Expenses"
            icon={<CreditCard className="text-red-600" />}
          />
          <QuickLink
            to="/liabilities"
            label="Liabilities"
            icon={<TrendingUp className="text-orange-600" />}
          />
          <QuickLink
            to="/social-security"
            label="Social Security"
            icon={<Users className="text-indigo-600" />}
          />
        </div>
      </div>

      {/* Categories List - Reordered */}
      <div className="space-y-4">
        {/* 1. Income Sources */}
        <CollapsibleSection
          title="Income Sources"
          count={user.incomeSources?.length || 0}
          total={
            user.incomeSources?.reduce((sum, item) => sum + item.amount, 0) || 0
          }
          path="/income"
          isMonthly
        >
          <SimpleList
            items={user.incomeSources}
            valueKey="amount"
            labelKey="name"
            isMonthly
          />
        </CollapsibleSection>

        {/* 2. Investments */}
        <CollapsibleSection
          title="Investments"
          count={user.investmentAccounts?.length || 0}
          total={
            user.investmentAccounts?.reduce(
              (sum, item) => sum + item.balance,
              0,
            ) || 0
          }
          path="/investments"
        >
          <SimpleList
            items={user.investmentAccounts}
            valueKey="balance"
            labelKey="name"
          />
        </CollapsibleSection>

        {/* 3. Assets */}
        <CollapsibleSection
          title="Assets"
          count={user.assets?.length || 0}
          total={user.assets?.reduce((sum, item) => sum + item.value, 0) || 0}
          path="/assets"
        >
          <SimpleList items={user.assets} valueKey="value" labelKey="name" />
        </CollapsibleSection>

        {/* 4. Expenses */}
        <CollapsibleSection
          title="Expenses"
          count={(user.expenses?.filter(e => !e.isOneTime)?.length || 0)}
          total={
            (user.expenses?.filter(e => !e.isOneTime)?.reduce((sum, item) => sum + item.amount, 0) || 0)
          }
          path="/expenses"
          isMonthly
          isNegative
        >
          <SimpleList
            items={user.expenses?.filter(e => !e.isOneTime)}
            valueKey="amount"
            labelKey="name"
            isMonthly
            isNegative
          />
        </CollapsibleSection>

        {/* 4b. One-Time Future Expenses */}
        {user.expenses?.some(e => e.isOneTime) && (
          <CollapsibleSection
            title="One-Time Future Expenses"
            count={user.expenses?.filter(e => e.isOneTime)?.length || 0}
            total={
              (user.expenses?.filter(e => e.isOneTime)?.reduce((sum, item) => sum + item.amount, 0) || 0)
            }
            path="/expenses"
            isNegative
          >
            <OneTimeExpenseList items={user.expenses?.filter(e => e.isOneTime)} />
          </CollapsibleSection>
        )}

        {/* 5. Liabilities */}
        <CollapsibleSection
          title="Liabilities"
          count={user.liabilities?.length || 0}
          total={
            user.liabilities?.reduce((sum, item) => sum + item.balance, 0) || 0
          }
          path="/liabilities"
          isNegative
        >
          <SimpleList
            items={user.liabilities}
            valueKey="balance"
            labelKey="name"
            isNegative
          />
        </CollapsibleSection>

        {/* 6. Social Security */}
        <CollapsibleSection
          title="Social Security"
          count={user.socialSecurity?.length || 0}
          total={
            user.socialSecurity?.reduce(
              (sum, item) => sum + item.monthlyAmount + (item.spousalAmount || 0),
              0,
            ) || 0
          }
          path="/social-security"
        >
          <SocialSecurityList items={user.socialSecurity} />
        </CollapsibleSection>
      </div>
    </div>
  );
};

const SocialSecurityList = ({ items }: { items: SocialSecurity[] | undefined }) => {
  const [showAll, setShowAll] = useState(false);
  const limit = 3;

  if (!items) return null;

  // Sort items by total benefit amount (primary + spousal)
  const sorted = [...items].sort((a, b) => 
    (b.monthlyAmount + (b.spousalAmount || 0)) - (a.monthlyAmount + (a.spousalAmount || 0))
  );
  const displayItems = showAll ? sorted : sorted.slice(0, limit);
  const hasMore = sorted.length > limit;

  return (
    <>
      <ul className="space-y-2">
        {displayItems.map((item, idx) => {
          const totalAmount = item.monthlyAmount + (item.spousalAmount || 0);
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(totalAmount);

          return (
            <li
              key={idx}
              className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0"
            >
              <div className="flex flex-col">
                <span className="text-gray-700 capitalize">
                  {item.person === "self" ? "Your Benefits" : "Spouse Benefits"}
                  {item.hasSpouse && item.person === "self" && item.spousalAmount && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                      + Spousal
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12} />
                    Age {item.startAge}
                  </span>
                  <span className="text-xs text-gray-400">
                    ${item.monthlyAmount.toLocaleString()}/mo base
                  </span>
                  {item.spousalAmount && (
                    <span className="text-xs text-gray-400">
                      +${item.spousalAmount.toLocaleString()}/mo spousal
                    </span>
                  )}
                </div>
                {item.notes && (
                  <span className="text-xs text-gray-400 truncate max-w-[250px] mt-1">
                    {item.notes}
                  </span>
                )}
              </div>
              <span className="font-medium text-green-600 whitespace-nowrap">
                {formatted}/mo
              </span>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          {showAll ? (
            <>
              Show Less <ChevronUp size={12} />
            </>
          ) : (
            <>
              Show {sorted.length - limit} More <ChevronDown size={12} />
            </>
          )}
        </button>
      )}
    </>
  );
};

const SummaryCard = ({
  title,
  value,
  icon,
  monthly = false,
  isNegative = false,
  highlight = false,
  subtext,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  monthly?: boolean;
  isNegative?: boolean;
  highlight?: boolean;
  subtext?: string;
}) => {
  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm border ${highlight ? "border-blue-200 ring-1 ring-blue-100" : "border-gray-200"}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
        <div className="p-2 bg-gray-50 rounded-full">{icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`text-2xl font-bold ${isNegative ? "text-red-600" : "text-gray-900"}`}
        >
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(value)}
        </span>
        {monthly && <span className="text-sm text-gray-500">/mo</span>}
      </div>
      {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
    </div>
  );
};

const QuickLink = ({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) => (
  <Link
    to={to}
    className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow hover:bg-gray-50"
  >
    <div className="mb-2 p-2 bg-gray-50 rounded-full">{icon}</div>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </Link>
);

const CollapsibleSection = ({
  title,
  count,
  total,
  children,
  path,
  isMonthly = false,
  isNegative = false,
}: {
  title: string;
  count: number;
  total: number;
  children: React.ReactNode;
  path: string;
  isMonthly?: boolean;
  isNegative?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(total);

  const totalClass = isNegative ? "text-red-600" : "text-gray-900";

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden`}
    >
      <div
        className="w-full px-6 py-4 flex justify-between items-center bg-white cursor-pointer hover:bg-gray-50 transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className={`text-sm ${totalClass} font-medium`}>
            {formattedTotal}
            {isMonthly ? "/mo" : ""}
          </span>
          <span className="text-xs text-gray-400">
            ({count} item{count !== 1 ? "s" : ""})
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={path}
            className="text-sm text-blue-600 hover:underline px-2 py-1 rounded hover:bg-blue-50"
            onClick={(e) => e.stopPropagation()}
          >
            Manage
          </Link>
          {isOpen ? (
            <ChevronUp className="text-gray-400" />
          ) : (
            <ChevronDown className="text-gray-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="px-6 pb-4 pt-0 border-t border-gray-100 animate-fadeIn">
          <div className="mt-4">
            {count === 0 ? (
              <p className="text-sm text-gray-400 italic">No items yet.</p>
            ) : (
              children
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SimpleList = ({
  items,
  valueKey,
  labelKey,
  isMonthly,
  isNegative,
  limit = 5,
}: {
  items: any[] | undefined;
  valueKey: string;
  labelKey: string;
  isMonthly?: boolean;
  isNegative?: boolean;
  limit?: number;
}) => {
  const [showAll, setShowAll] = useState(false);

  if (!items) return null;

  // Sort items by value descending
  const sorted = [...items].sort((a, b) => b[valueKey] - a[valueKey]);
  const displayItems = showAll ? sorted : sorted.slice(0, limit);
  const hasMore = sorted.length > limit;

  return (
    <>
      <ul className="space-y-2">
        {displayItems.map((item, idx) => {
          const val = item[valueKey];
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(val);

          return (
            <li
              key={idx}
              className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0"
            >
              <div className="flex flex-col">
                <span className="text-gray-700 truncate mr-4">
                  {item[labelKey]}
                </span>
                {item.details && (
                  <span className="text-xs text-gray-400 truncate max-w-[200px]">
                    {item.details}
                  </span>
                )}
              </div>
              <span
                className={`font-medium whitespace-nowrap ${isNegative ? "text-red-600" : "text-gray-900"}`}
              >
                {formatted}
                {isMonthly ? "/mo" : ""}
              </span>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          {showAll ? (
            <>
              Show Less <ChevronUp size={12} />
            </>
          ) : (
            <>
              Show {sorted.length - limit} More <ChevronDown size={12} />
            </>
          )}
        </button>
      )}
    </>
  );
};

// Component to display one-time future expenses
const OneTimeExpenseList = ({ items }: { items: Expense[] | undefined }) => {
  const [showAll, setShowAll] = useState(false);
  const limit = 3;

  if (!items || items.length === 0) return null;

  // Sort by scheduled date
  const sorted = [...items].sort((a, b) => {
    if (!a.scheduledDate) return 1;
    if (!b.scheduledDate) return -1;
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  });
  const displayItems = showAll ? sorted : sorted.slice(0, limit);
  const hasMore = sorted.length > limit;

  return (
    <>
      <ul className="space-y-2">
        {displayItems.map((item) => {
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(item.amount);

          return (
            <li
              key={item.id}
              className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0"
            >
              <div className="flex flex-col">
                <span className="text-gray-700 truncate mr-4">
                  {item.name}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">
                    One-time
                  </span>
                  {item.scheduledDate && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(item.scheduledDate).toLocaleDateString()}
                    </span>
                  )}
                  {item.isCompleted && (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">
                      ✓ Completed
                    </span>
                  )}
                </div>
                {item.details && (
                  <span className="text-xs text-gray-400 truncate max-w-[200px] mt-1">
                    {item.details}
                  </span>
                )}
              </div>
              <span className="font-medium text-amber-600 whitespace-nowrap">
                {formatted}
              </span>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          {showAll ? (
            <>
              Show Less <ChevronUp size={12} />
            </>
          ) : (
            <>
              Show {sorted.length - limit} More <ChevronDown size={12} />
            </>
          )}
        </button>
      )}
    </>
  );
};

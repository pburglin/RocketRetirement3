import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  CreditCard,
  Landmark,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { UserProfile } from "../services/storage";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

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

      {/* Summary Cards Row (keeping the quick links) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <QuickLink
          to="/income"
          label="Income"
          icon={<DollarSign className="text-green-600" />}
        />
        <QuickLink
          to="/expenses"
          label="Expenses"
          icon={<CreditCard className="text-red-600" />}
        />
        <QuickLink
          to="/assets"
          label="Assets"
          icon={<Landmark className="text-blue-600" />}
        />
        <QuickLink
          to="/liabilities"
          label="Liabilities"
          icon={<TrendingUp className="text-orange-600" />}
        />
        <QuickLink
          to="/investments"
          label="Investments"
          icon={<Wallet className="text-purple-600" />}
        />
      </div>

      <div className="space-y-4">
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

        <CollapsibleSection
          title="Assets"
          count={user.assets?.length || 0}
          total={user.assets?.reduce((sum, item) => sum + item.value, 0) || 0}
          path="/assets"
        >
          <SimpleList items={user.assets} valueKey="value" labelKey="name" />
        </CollapsibleSection>

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

        <CollapsibleSection
          title="Expenses"
          count={user.expenses?.length || 0}
          total={
            user.expenses?.reduce((sum, item) => sum + item.amount, 0) || 0
          }
          path="/expenses"
          isMonthly
          isNegative
        >
          <SimpleList
            items={user.expenses}
            valueKey="amount"
            labelKey="name"
            isMonthly
            isNegative
          />
        </CollapsibleSection>
      </div>
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

  // Format number: $1,234 (no cents)
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(total);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="w-full px-6 py-4 flex justify-between items-center bg-white cursor-pointer hover:bg-gray-50 transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">
            {count} item{count !== 1 ? "s" : ""}, total {formattedTotal}
            {isMonthly ? "/mo" : ""}
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
}: {
  items: any[] | undefined;
  valueKey: string;
  labelKey: string;
  isMonthly?: boolean;
  isNegative?: boolean;
}) => {
  if (!items) return null;

  // Sort items by value descending
  const sorted = [...items].sort((a, b) => b[valueKey] - a[valueKey]);

  return (
    <ul className="space-y-2">
      {sorted.map((item, idx) => {
        const val = item[valueKey];
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(val);

        return (
          <li key={idx} className="flex justify-between items-center text-sm">
            <span className="text-gray-700">{item[labelKey]}</span>
            <span
              className={`font-medium ${isNegative ? "text-red-600" : "text-gray-900"}`}
            >
              {formatted}
              {isMonthly ? "/mo" : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

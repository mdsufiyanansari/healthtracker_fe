
import React from "react";
import {
  Footprints,
  MapPin,
  Flame,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const iconMap = {
  steps: Footprints,
  distance: MapPin,
  calories: Flame,
  duration: Clock,
};

const iconStyles = {
  steps: "bg-emerald-100 text-emerald-700",
  distance: "bg-blue-100 text-blue-700",
  calories: "bg-orange-100 text-orange-700",
  duration: "bg-violet-100 text-violet-700",
};

const StatCard = ({
  title = "Total Steps",
  value = "0",
  unit = "",
  icon = "steps",
  change,
  trend = "up",
  description = "Compared to last week",
}) => {
  const Icon = iconMap[icon] || Footprints;
  const isPositive = trend === "up";
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            iconStyles[icon] || iconStyles.steps
          }`}
        >
          <Icon size={23} strokeWidth={2} />
        </div>

        {change !== undefined && change !== null && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isPositive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            <TrendIcon size={14} />
            {change}
          </span>
        )}
      </div>

      {/* Statistics */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-500">
          {title}
        </p>

        <h3 className="flex flex-wrap items-baseline gap-1.5 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          <span>{value}</span>

          {unit && (
            <span className="text-sm font-medium text-gray-500">
              {unit}
            </span>
          )}
        </h3>

        <p className="mt-3 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
};

export default StatCard;

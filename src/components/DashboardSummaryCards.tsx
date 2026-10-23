import React from "react";
import { Users, CalendarCheck, CalendarDays, BookmarkCheck } from "lucide-react";

interface StatsProps {
  stats: {
    totalBookings: number;
    totalPassengers: number;
    activeBookings: number;
    totalWeeklyActiveDays: number;
  };
  isLoading?: boolean;
}

export function DashboardSummaryCards({ stats, isLoading }: StatsProps) {
  const cards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      description: "Recorded transportation bookings",
      icon: BookmarkCheck,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      title: "Total Passengers",
      value: stats.totalPassengers,
      description: "Cumulative travellers served",
      icon: Users,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Active Bookings",
      value: stats.activeBookings,
      description: "Bookings with active schedules",
      icon: CalendarCheck,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    },
    {
      title: "Weekly Active Days",
      value: stats.totalWeeklyActiveDays,
      description: "Total run days scheduled / week",
      icon: CalendarDays,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg border ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {isLoading ? (
                  <span className="inline-block w-12 h-8 bg-slate-200 animate-pulse rounded" />
                ) : (
                  card.value.toLocaleString()
                )}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}

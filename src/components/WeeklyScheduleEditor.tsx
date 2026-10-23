"use client";

import React, { useState } from "react";
import { DAYS_LIST, ScheduleDayData } from "@/lib/validations";
import { Copy, Check, Sparkles } from "lucide-react";

interface ScheduleEditorProps {
  schedules: ScheduleDayData[];
  onChange: (updated: ScheduleDayData[]) => void;
  errors?: Record<string, string>;
}

export function WeeklyScheduleEditor({ schedules, onChange, errors }: ScheduleEditorProps) {
  // Same Timings shortcut state
  const [useSameTimings, setUseSameTimings] = useState(false);
  const [shortcutPickup, setShortcutPickup] = useState("08:00");
  const [shortcutDropoff, setShortcutDropoff] = useState("17:00");
  const [selectedShortcutDays, setSelectedShortcutDays] = useState<string[]>([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ]);
  const [copiedDaySuccess, setCopiedDaySuccess] = useState(false);

  const handleToggleStatus = (dayKey: string) => {
    const next: ScheduleDayData[] = schedules.map((s) => {
      if (s.dayOfWeek === dayKey) {
        const nextStatus: "ACTIVE" | "OFF" = s.status === "ACTIVE" ? "OFF" : "ACTIVE";
        return {
          ...s,
          status: nextStatus,
          // If turning active and no time set, give defaults
          pickupTime: nextStatus === "ACTIVE" ? s.pickupTime || "08:00" : null,
          dropoffTime: nextStatus === "ACTIVE" ? s.dropoffTime || "17:00" : null,
        };
      }
      return s;
    });
    onChange(next);
  };

  const handleTimeChange = (
    dayKey: string,
    field: "pickupTime" | "dropoffTime",
    value: string
  ) => {
    const next = schedules.map((s) => {
      if (s.dayOfWeek === dayKey) {
        return {
          ...s,
          [field]: value,
        };
      }
      return s;
    });
    onChange(next);
  };

  const applyShortcutTimings = () => {
    const next = schedules.map((s) => {
      if (selectedShortcutDays.includes(s.dayOfWeek)) {
        return {
          ...s,
          status: "ACTIVE" as const,
          pickupTime: shortcutPickup,
          dropoffTime: shortcutDropoff,
        };
      }
      return s;
    });
    onChange(next);
  };

  const copyMondayToWeekdays = () => {
    const monday = schedules.find((s) => s.dayOfWeek === "MONDAY");
    if (!monday || monday.status !== "ACTIVE") {
      alert("Monday is currently set to OFF. Set Monday to ACTIVE with valid timings first.");
      return;
    }

    const weekdays = ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    const next = schedules.map((s) => {
      if (weekdays.includes(s.dayOfWeek)) {
        return {
          ...s,
          status: "ACTIVE" as const,
          pickupTime: monday.pickupTime,
          dropoffTime: monday.dropoffTime,
        };
      }
      return s;
    });

    onChange(next);
    setCopiedDaySuccess(true);
    setTimeout(() => setCopiedDaySuccess(false), 2500);
  };

  const toggleDaySelectionInShortcut = (dayKey: string) => {
    if (selectedShortcutDays.includes(dayKey)) {
      setSelectedShortcutDays(selectedShortcutDays.filter((d) => d !== dayKey));
    } else {
      setSelectedShortcutDays([...selectedShortcutDays, dayKey]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useSameTimings}
            onChange={(e) => setUseSameTimings(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-2.5 text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            Use Same Timings Shortcut
          </span>
        </label>

        <button
          type="button"
          onClick={copyMondayToWeekdays}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors shadow-2xs self-start sm:self-auto"
          title="Duplicate Monday's timing to Tuesday-Friday"
        >
          {copiedDaySuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied Mon timings!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              Copy Monday&apos;s Schedule
            </>
          )}
        </button>
      </div>

      {/* Shortcut configuration panel */}
      {useSameTimings && (
        <div className="p-3.5 sm:p-4 bg-blue-50/70 border border-blue-200/80 rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Bulk Timings Configuration
            </span>
            <span className="text-[11px] text-blue-700">
              Select target days and apply default hours
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Default Pickup Time
              </label>
              <input
                type="time"
                value={shortcutPickup}
                onChange={(e) => setShortcutPickup(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Default Drop-off Time
              </label>
              <input
                type="time"
                value={shortcutDropoff}
                onChange={(e) => setShortcutDropoff(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Apply to Days:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_LIST.map((d) => {
                const isSelected = selectedShortcutDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDaySelectionInShortcut(d.key)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-blue-200/60">
            <p className="text-[11px] text-slate-600">
              Sets selected days to <strong>ACTIVE</strong> with the above timings.
            </p>
            <button
              type="button"
              onClick={applyShortcutTimings}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors shadow-xs text-center"
            >
              Apply to Selected Days
            </button>
          </div>
        </div>
      )}

      {/* 7 Days Schedule Cards / Rows */}
      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200 bg-white">
        {/* Desktop Header */}
        <div className="hidden sm:grid bg-slate-100/80 px-4 py-2.5 grid-cols-12 text-xs font-semibold text-slate-700">
          <div className="col-span-3">Day</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-3.5 pl-2">Pickup Time</div>
          <div className="col-span-3.5 pl-2">Drop-off Time</div>
        </div>

        {schedules.map((daySchedule, idx) => {
          const dayMeta = DAYS_LIST.find((d) => d.key === daySchedule.dayOfWeek) || {
            label: daySchedule.dayOfWeek,
            short: daySchedule.dayOfWeek,
          };
          const isActive = daySchedule.status === "ACTIVE";
          const err = errors?.[`schedules.${idx}.pickupTime`];

          return (
            <div
              key={daySchedule.dayOfWeek}
              className={`p-3 transition-colors ${
                isActive ? "bg-white" : "bg-slate-50/70"
              }`}
            >
              {/* Mobile Card Layout for Day */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">{dayMeta.label}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(daySchedule.dayOfWeek)}
                    className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-slate-100 text-slate-500 border-slate-300"
                    }`}
                  >
                    {isActive ? "ACTIVE" : "OFF"}
                  </button>
                </div>

                {isActive ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">
                        Pickup Time
                      </label>
                      <input
                        type="time"
                        value={daySchedule.pickupTime || ""}
                        onChange={(e) =>
                          handleTimeChange(daySchedule.dayOfWeek, "pickupTime", e.target.value)
                        }
                        className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">
                        Drop-off Time
                      </label>
                      <input
                        type="time"
                        value={daySchedule.dropoffTime || ""}
                        onChange={(e) =>
                          handleTimeChange(daySchedule.dayOfWeek, "dropoffTime", e.target.value)
                        }
                        className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">No scheduled timings (Off Day)</div>
                )}
              </div>

              {/* Tablet & Desktop Row */}
              <div className="hidden sm:grid grid-cols-12 items-center gap-2">
                <div className="col-span-3">
                  <span className="font-semibold text-sm text-slate-800">{dayMeta.label}</span>
                </div>

                <div className="col-span-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(daySchedule.dayOfWeek)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {isActive ? "ACTIVE" : "OFF"}
                  </button>
                </div>

                <div className="col-span-3.5 pl-2">
                  {isActive ? (
                    <input
                      type="time"
                      value={daySchedule.pickupTime || ""}
                      onChange={(e) =>
                        handleTimeChange(daySchedule.dayOfWeek, "pickupTime", e.target.value)
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">No service</span>
                  )}
                </div>

                <div className="col-span-3.5 pl-2">
                  {isActive ? (
                    <input
                      type="time"
                      value={daySchedule.dropoffTime || ""}
                      onChange={(e) =>
                        handleTimeChange(daySchedule.dayOfWeek, "dropoffTime", e.target.value)
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">No service</span>
                  )}
                </div>
              </div>

              {err && (
                <div className="text-xs text-rose-600 font-medium pt-1">
                  {err}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

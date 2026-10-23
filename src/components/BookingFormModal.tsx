"use client";

import React, { useState, useEffect } from "react";
import {
  BookingFormData,
  BookingFormSchema,
  DEFAULT_WEEKLY_SCHEDULE,
  ScheduleDayData,
} from "@/lib/validations";
import { WeeklyScheduleEditor } from "./WeeklyScheduleEditor";
import { Users, MapPin, DollarSign, FileText, AlertCircle, CheckCircle2, X, User, Phone } from "lucide-react";

interface BookingFormProps {
  initialData?: {
    id?: string;
    passengerName?: string;
    phoneNumber?: string;
    passengerCount: number;
    pickupLocation: string;
    dropoffLocation: string;
    budget: number;
    notes?: string | null;
    schedules: ScheduleDayData[];
  } | null;
  onSubmit: (data: BookingFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  isOpen: boolean;
}

export function BookingFormModal({
  initialData,
  onSubmit,
  onCancel,
  isOpen,
}: BookingFormProps) {
  const isEditing = !!initialData?.id;

  const [passengerName, setPassengerName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [dropoffLocation, setDropoffLocation] = useState<string>("");
  const [budget, setBudget] = useState<number | string>("");
  const [notes, setNotes] = useState<string>("");
  const [schedules, setSchedules] = useState<ScheduleDayData[]>(DEFAULT_WEEKLY_SCHEDULE);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setPassengerName(initialData.passengerName || "");
      setPhoneNumber(initialData.phoneNumber || "");
      setPassengerCount(initialData.passengerCount || 1);
      setPickupLocation(initialData.pickupLocation || "");
      setDropoffLocation(initialData.dropoffLocation || "");
      setBudget(initialData.budget ?? "");
      setNotes(initialData.notes || "");
      if (initialData.schedules && initialData.schedules.length === 7) {
        setSchedules(initialData.schedules);
      } else {
        setSchedules(DEFAULT_WEEKLY_SCHEDULE);
      }
    } else {
      setPassengerName("");
      setPhoneNumber("");
      setPassengerCount(1);
      setPickupLocation("");
      setDropoffLocation("");
      setBudget("");
      setNotes("");
      setSchedules(DEFAULT_WEEKLY_SCHEDULE);
    }
    setFormError(null);
    setFieldErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const payload: BookingFormData = {
      passengerName: passengerName.trim(),
      phoneNumber: phoneNumber.trim(),
      passengerCount: Number(passengerCount),
      pickupLocation: pickupLocation.trim(),
      dropoffLocation: dropoffLocation.trim(),
      budget: budget === "" ? 0 : Number(budget),
      notes: notes.trim() ? notes.trim() : null,
      schedules,
    };

    const parseResult = BookingFormSchema.safeParse(payload);
    if (!parseResult.success) {
      const errMap: Record<string, string> = {};
      parseResult.error.issues.forEach((err) => {
        const path = err.path.map(String).join(".");
        errMap[path] = err.message;
      });
      setFieldErrors(errMap);
      setFormError("Please fix the validation errors below.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await onSubmit(parseResult.data);
      if (!res.success) {
        setFormError(res.error || "Failed to save booking. Please try again.");
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? "Edit Booking & Schedule" : "Add Transportation Booking"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter passenger details, contact info, and configure weekly pickup/drop-off schedules.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>{formError}</div>
            </div>
          )}

          {/* Section A: Booking Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                A
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Passenger & Booking Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Passenger / Contact Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Passenger / Contact Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Usman"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                {fieldErrors.passengerName && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.passengerName}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +92 300 1234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                {fieldErrors.phoneNumber && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.phoneNumber}</p>
                )}
              </div>

              {/* Passenger count */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Total Passenger Count <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Total people traveling in this booking group
                </p>
                {fieldErrors.passengerCount && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.passengerCount}</p>
                )}
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                  Budget (PKR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                    ₨
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="e.g. 15000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full text-sm pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Allocated transportation budget in Pakistani Rupees
                </p>
                {fieldErrors.budget && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.budget}</p>
                )}
              </div>

              {/* Pickup location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Pickup Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gulberg III, Lahore"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                {fieldErrors.pickupLocation && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.pickupLocation}</p>
                )}
              </div>

              {/* Drop-off location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  Drop-off Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. I-8 Markaz, Islamabad"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                {fieldErrors.dropoffLocation && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.dropoffLocation}</p>
                )}
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Optional Notes / Special Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Luggage assistance needed, air-conditioned vehicle preferred..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section B: Weekly Schedule */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                B
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Weekly Schedule (Mon - Sun)
              </h3>
            </div>
            <WeeklyScheduleEditor
              schedules={schedules}
              onChange={setSchedules}
              errors={fieldErrors}
            />
          </div>

          {/* Section C: Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEditing ? "Update Booking" : "Save Booking"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

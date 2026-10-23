"use client";

import React, { useState } from "react";
import { formatPKR, formatTime12h } from "@/lib/utils";
import { DAYS_LIST, ScheduleDayData } from "@/lib/validations";
import {
  Users,
  Calendar,
  Edit2,
  Trash2,
  Eye,
  X,
  FileSpreadsheet,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";

export interface BookingRecordType {
  id: string;
  passengerName: string;
  phoneNumber: string;
  passengerCount: number;
  pickupLocation: string;
  dropoffLocation: string;
  budget: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  schedules: Array<ScheduleDayData & { id?: string }>;
}

interface BookingTableProps {
  bookings: BookingRecordType[];
  isLoading: boolean;
  onEdit: (booking: BookingRecordType) => void;
  onDelete: (id: string) => Promise<void>;
}

export function BookingRecordsTable({
  bookings,
  isLoading,
  onEdit,
  onDelete,
}: BookingTableProps) {
  const [detailsRecord, setDetailsRecord] = useState<BookingRecordType | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteAction = async () => {
    if (!deleteConfirmId) return;
    try {
      setIsDeleting(true);
      await onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-5 sm:p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse flex items-center justify-between py-2 border-b border-slate-100">
            <div className="space-y-2 w-1/3">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-1/5"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Booking Records Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          No records match your query, or no bookings have been entered yet. Click &quot;Add Booking&quot; to create a new transportation group.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card Layout (Visible on screens < md) */}
      <div className="grid grid-cols-1 gap-3.5 md:hidden">
        {bookings.map((booking) => {
          const activeDays = booking.schedules.filter((s) => s.status === "ACTIVE");
          const activeCount = activeDays.length;

          return (
            <div
              key={booking.id}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
            >
              {/* Header: Passenger Name, Group Size, and Budget */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                    <User className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{booking.passengerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <a href={`tel:${booking.phoneNumber}`} className="hover:text-blue-600">
                      {booking.phoneNumber}
                    </a>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600 whitespace-nowrap">
                    {formatPKR(booking.budget)}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5">
                    <Users className="w-3 h-3 text-slate-400" />
                    {booking.passengerCount} {booking.passengerCount === 1 ? "person" : "people"}
                  </span>
                </div>
              </div>

              {/* Pickup & Drop-off route */}
              <div className="space-y-1.5 text-xs bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pickup</span>
                    <span className="text-slate-800 font-medium truncate block">{booking.pickupLocation}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1"></span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Drop-off</span>
                    <span className="text-slate-800 font-medium truncate block">{booking.dropoffLocation}</span>
                  </div>
                </div>
              </div>

              {/* Schedule badges */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    activeCount > 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  <Calendar className="w-2.5 h-2.5" />
                  {activeCount} / 7 days
                </span>

                <div className="flex flex-wrap gap-1 justify-end">
                  {DAYS_LIST.map((d) => {
                    const sched = booking.schedules.find((s) => s.dayOfWeek === d.key);
                    const isActive = sched?.status === "ACTIVE";
                    return (
                      <span
                        key={d.key}
                        className={`text-[9px] font-medium px-1 py-0.5 rounded ${
                          isActive
                            ? "bg-blue-100 text-blue-800 font-bold"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {d.short}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons in Mobile Card */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] text-slate-400 font-mono">
                  #{booking.id.slice(0, 8)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDetailsRecord(booking)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md font-medium text-xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(booking)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md font-medium text-xs border border-amber-200 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(booking.id)}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop & Tablet Table (Hidden on mobile < md) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Passenger / Contact</th>
                <th className="py-3 px-3">Group Size</th>
                <th className="py-3 px-3">Pickup & Drop-off</th>
                <th className="py-3 px-3">Budget</th>
                <th className="py-3 px-3">Active Days</th>
                <th className="py-3 px-3">Schedule Summary</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => {
                const activeDays = booking.schedules.filter((s) => s.status === "ACTIVE");
                const activeCount = activeDays.length;

                return (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Passenger & Contact */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          <span>{booking.passengerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a
                            href={`tel:${booking.phoneNumber}`}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {booking.phoneNumber}
                          </a>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          #{booking.id.slice(0, 8)}
                        </span>
                      </div>
                    </td>

                    {/* Passenger count */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Users className="w-3 h-3 text-slate-500" />
                        {booking.passengerCount} {booking.passengerCount === 1 ? "person" : "people"}
                      </span>
                    </td>

                    {/* Locations */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-1 max-w-xs">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="truncate" title={booking.pickupLocation}>
                            {booking.pickupLocation}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 truncate text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                          <span className="truncate" title={booking.dropoffLocation}>
                            {booking.dropoffLocation}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="py-3.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {formatPKR(booking.budget)}
                    </td>

                    {/* Active Days */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          activeCount > 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {activeCount} / 7 days
                      </span>
                    </td>

                    {/* Schedule Summary badges */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {DAYS_LIST.map((d) => {
                          const sched = booking.schedules.find((s) => s.dayOfWeek === d.key);
                          const isActive = sched?.status === "ACTIVE";
                          return (
                            <span
                              key={d.key}
                              title={
                                isActive
                                  ? `${d.label}: ${sched?.pickupTime} - ${sched?.dropoffTime}`
                                  : `${d.label}: OFF`
                              }
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                isActive
                                  ? "bg-blue-100 text-blue-800 font-bold"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {d.short}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Created date */}
                    <td className="py-3.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(booking.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailsRecord(booking)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(booking)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="Edit Booking"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(booking.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details View Modal */}
      {detailsRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setDetailsRecord(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Booking Details & Schedule
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">ID: {detailsRecord.id}</p>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Passenger / Contact</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {detailsRecord.passengerName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone Number</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {detailsRecord.phoneNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Passenger Count</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {detailsRecord.passengerCount} Persons
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Budget</span>
                  <span className="font-bold text-blue-600 text-sm">
                    {formatPKR(detailsRecord.budget)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pickup Location</span>
                  <span className="font-medium text-slate-800">
                    {detailsRecord.pickupLocation}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Drop-off Location</span>
                  <span className="font-medium text-slate-800">
                    {detailsRecord.dropoffLocation}
                  </span>
                </div>
              </div>

              {detailsRecord.notes && (
                <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-lg">
                  <span className="text-[11px] font-bold text-amber-800 block mb-0.5">
                    Notes / Remarks
                  </span>
                  <p className="text-slate-700">{detailsRecord.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-800 mb-2 uppercase text-[11px] tracking-wider">
                  Weekly Timings
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {DAYS_LIST.map((d) => {
                    const sched = detailsRecord.schedules.find((s) => s.dayOfWeek === d.key);
                    const isActive = sched?.status === "ACTIVE";
                    return (
                      <div
                        key={d.key}
                        className={`p-2.5 flex items-center justify-between text-xs ${
                          isActive ? "bg-white" : "bg-slate-50"
                        }`}
                      >
                        <span className="font-semibold text-slate-700 w-20 sm:w-24">{d.label}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isActive ? "ACTIVE" : "OFF"}
                        </span>
                        <div className="text-right w-40 sm:w-44">
                          {isActive ? (
                            <span className="text-slate-700 font-mono text-xs">
                              {formatTime12h(sched?.pickupTime)} - {formatTime12h(sched?.dropoffTime)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No timings</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailsRecord(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Delete Booking?</h3>
            <p className="text-xs text-slate-500 mb-4">
              This action cannot be undone. All 7-day schedule records associated with this booking will be deleted permanently from PostgreSQL.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

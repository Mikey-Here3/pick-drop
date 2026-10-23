"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getBookings,
  getDashboardStats,
  createBooking,
  updateBooking,
  deleteBooking,
  checkAuthStatus,
  loginAdmin,
  logoutAdmin,
} from "@/actions/bookings";
import { DashboardSummaryCards } from "@/components/DashboardSummaryCards";
import { BookingRecordsTable, BookingRecordType } from "@/components/BookingRecordsTable";
import { BookingFormModal } from "@/components/BookingFormModal";
import { AdminLoginModal } from "@/components/AdminLoginModal";
import { BookingFormData } from "@/lib/validations";
import {
  Plus,
  Download,
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Car,
  Database,
  Lock,
  LogOut,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalPassengers: 0,
    activeBookings: 0,
    totalWeeklyActiveDays: 0,
  });
  const [bookings, setBookings] = useState<BookingRecordType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BookingRecordType | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);

  // Notification toast state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadData = useCallback(async (query = searchQuery) => {
    setIsLoading(true);
    setDbError(null);
    try {
      // Check auth status
      const authRes = await checkAuthStatus();
      setIsAuthenticated(authRes.authenticated);
      setRequiresPassword(authRes.requiresPassword);

      // Fetch stats & records concurrently
      const [statsRes, bookingsRes] = await Promise.all([
        getDashboardStats(),
        getBookings(query),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      if (bookingsRes.success) {
        setBookings(bookingsRes.bookings as unknown as BookingRecordType[]);
      } else {
        setDbError(bookingsRes.error || "Failed to load database records.");
      }
    } catch (err: unknown) {
      setDbError(
        err instanceof Error
          ? err.message
          : "Database connection failed. Please ensure your Neon connection string is active in .env"
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Search Input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(searchQuery);
  };

  // CSV Export action
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const url = searchQuery
        ? `/api/export?query=${encodeURIComponent(searchQuery)}`
        : "/api/export";
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          setIsLoginOpen(true);
          throw new Error("Admin login required to export data.");
        }
        throw new Error("Failed to generate CSV export file.");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `passenger-bookings-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast("success", "CSV export downloaded successfully!");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "CSV export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // Form submission (Create / Update)
  const handleFormSubmit = async (formData: BookingFormData) => {
    if (editingRecord) {
      const res = await updateBooking(editingRecord.id, formData);
      if (res.success) {
        setIsFormOpen(false);
        setEditingRecord(null);
        showToast("success", "Booking record and schedule updated successfully!");
        await loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    } else {
      const res = await createBooking(formData);
      if (res.success) {
        setIsFormOpen(false);
        showToast("success", "New transportation booking created successfully!");
        await loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    }
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    const res = await deleteBooking(id);
    if (res.success) {
      showToast("success", "Booking record deleted from database.");
      await loadData();
    } else {
      showToast("error", res.error || "Failed to delete booking.");
    }
  };

  // Authentication Handlers
  const handleLogin = async (password: string) => {
    const res = await loginAdmin(password);
    if (res.success) {
      setIsLoginOpen(false);
      setIsAuthenticated(true);
      showToast("success", "Admin authentication successful.");
      await loadData();
      return { success: true };
    }
    return res;
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    showToast("success", "Signed out of admin session.");
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Passenger Management
                </h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Admin Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage bookings, routes, and weekly schedules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
            </button>

            {/* Add Booking Button */}
            <button
              type="button"
              onClick={() => {
                if (requiresPassword && !isAuthenticated) {
                  setIsLoginOpen(true);
                } else {
                  setEditingRecord(null);
                  setIsFormOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-sm shadow-blue-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Booking</span>
            </button>

            {/* Auth toggle */}
            {requiresPassword && (
              <div className="ml-2 pl-3 border-l border-slate-700">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLoginOpen(true)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Admin Sign In"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Toast Notification Banner */}
        {toast && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-md animate-in slide-in-from-top-3 duration-200 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Database Warning Banner if not connected or error */}
        {dbError && (
          <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-3 text-amber-900 shadow-xs">
            <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold">Neon PostgreSQL Connection Notice</h4>
              <p className="mt-1 text-amber-800 leading-relaxed">
                {dbError}. Please ensure your <code>DATABASE_URL</code> and <code>DIRECT_URL</code> connection strings are configured in your <code>.env</code> file.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Summary Cards */}
        <section aria-label="Dashboard Metrics">
          <DashboardSummaryCards stats={stats} isLoading={isLoading} />
        </section>

        {/* Filter & Search Bar */}
        <section className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by Booking ID, Pickup location, Drop-off, or Notes..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full text-xs pl-9 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    loadData("");
                  }}
                  className="absolute right-12 top-2.5 text-xs text-slate-400 hover:text-slate-600 px-1"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1.5 px-2.5 py-1 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => loadData(searchQuery)}
                disabled={isLoading}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                title="Refresh Records"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Booking Records Table Section */}
        <section aria-label="Booking Records">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Transportation Bookings ({bookings.length})
            </h2>
            {searchQuery && (
              <span className="text-xs text-slate-500">
                Filtered by &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          <BookingRecordsTable
            bookings={bookings}
            isLoading={isLoading}
            onEdit={(record) => {
              setEditingRecord(record);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        </section>
      </main>

      {/* Booking Form Modal (Add / Edit) */}
      <BookingFormModal
        isOpen={isFormOpen}
        initialData={editingRecord}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingRecord(null);
        }}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginOpen}
        onLogin={handleLogin}
        onCancel={() => setIsLoginOpen(false)}
      />
    </div>
  );
}

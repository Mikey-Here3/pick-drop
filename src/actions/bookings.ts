"use server";

import { prisma } from "@/lib/prisma";
import { BookingFormSchema, type BookingFormData } from "@/lib/validations";
import { requireAuth, setAdminSession, clearAdminSession, isAuthenticated } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function checkAuthStatus() {
  const authed = await isAuthenticated();
  const requiresPassword = !!process.env.ADMIN_PASSWORD;
  return { authenticated: authed, requiresPassword };
}

export async function loginAdmin(password: string) {
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  if (password === expected) {
    await setAdminSession();
    return { success: true };
  }
  return { success: false, error: "Invalid admin password" };
}

export async function logoutAdmin() {
  await clearAdminSession();
  return { success: true };
}

export async function getDashboardStats() {
  try {
    const totalBookings = await prisma.booking.count();
    const aggregatePassengers = await prisma.booking.aggregate({
      _sum: {
        passengerCount: true,
      },
    });

    // Count bookings with at least one ACTIVE weekday
    const activeBookingsCount = await prisma.booking.count({
      where: {
        schedules: {
          some: {
            status: "ACTIVE",
          },
        },
      },
    });

    // Total weekly active days across all bookings
    const totalWeeklyActiveDays = await prisma.weeklySchedule.count({
      where: {
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      stats: {
        totalBookings,
        totalPassengers: aggregatePassengers._sum.passengerCount || 0,
        activeBookings: activeBookingsCount,
        totalWeeklyActiveDays,
      },
    };
  } catch (err: unknown) {
    console.error("Error calculating dashboard stats:", err);
    return {
      success: false,
      error: "Unable to calculate dashboard metrics. Verify database connection.",
      stats: {
        totalBookings: 0,
        totalPassengers: 0,
        activeBookings: 0,
        totalWeeklyActiveDays: 0,
      },
    };
  }
}

export async function getBookings(query?: string) {
  try {
    const trimmed = query?.trim();
    const whereClause = trimmed
      ? {
          OR: [
            { id: { contains: trimmed, mode: "insensitive" as const } },
            { passengerName: { contains: trimmed, mode: "insensitive" as const } },
            { phoneNumber: { contains: trimmed, mode: "insensitive" as const } },
            { pickupLocation: { contains: trimmed, mode: "insensitive" as const } },
            { dropoffLocation: { contains: trimmed, mode: "insensitive" as const } },
            { notes: { contains: trimmed, mode: "insensitive" as const } },
          ],
        }
      : {};

    const records = await prisma.booking.findMany({
      where: whereClause,
      include: {
        schedules: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert decimal to number for serializability across Server Actions
    const serialized = records.map((r) => ({
      ...r,
      budget: Number(r.budget),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      schedules: r.schedules.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    }));

    return { success: true, bookings: serialized };
  } catch (err: unknown) {
    console.error("Error fetching bookings:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load bookings from database.",
      bookings: [],
    };
  }
}

export async function createBooking(rawInput: BookingFormData) {
  try {
    await requireAuth();
    const validated = BookingFormSchema.parse(rawInput);

    // Save in transaction atomically
    const newBooking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          passengerName: validated.passengerName.trim(),
          phoneNumber: validated.phoneNumber.trim(),
          passengerCount: validated.passengerCount,
          pickupLocation: validated.pickupLocation.trim(),
          dropoffLocation: validated.dropoffLocation.trim(),
          budget: validated.budget,
          notes: validated.notes?.trim() || null,
          schedules: {
            create: validated.schedules.map((s) => ({
              dayOfWeek: s.dayOfWeek,
              status: s.status,
              pickupTime: s.status === "ACTIVE" ? s.pickupTime : null,
              dropoffTime: s.status === "ACTIVE" ? s.dropoffTime : null,
            })),
          },
        },
        include: {
          schedules: true,
        },
      });
      return created;
    });

    revalidatePath("/");
    return { success: true, bookingId: newBooking.id };
  } catch (err: unknown) {
    console.error("Create booking error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save booking. Please check database connectivity.",
    };
  }
}

export async function updateBooking(bookingId: string, rawInput: BookingFormData) {
  try {
    await requireAuth();
    const validated = BookingFormSchema.parse(rawInput);

    await prisma.$transaction(async (tx) => {
      // Check existence
      const existing = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!existing) {
        throw new Error(`Booking record '${bookingId}' not found.`);
      }

      // Update main booking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          passengerName: validated.passengerName.trim(),
          phoneNumber: validated.phoneNumber.trim(),
          passengerCount: validated.passengerCount,
          pickupLocation: validated.pickupLocation.trim(),
          dropoffLocation: validated.dropoffLocation.trim(),
          budget: validated.budget,
          notes: validated.notes?.trim() || null,
        },
      });

      // Upsert all 7 schedules atomically
      for (const schedule of validated.schedules) {
        await tx.weeklySchedule.upsert({
          where: {
            bookingId_dayOfWeek: {
              bookingId,
              dayOfWeek: schedule.dayOfWeek,
            },
          },
          update: {
            status: schedule.status,
            pickupTime: schedule.status === "ACTIVE" ? schedule.pickupTime : null,
            dropoffTime: schedule.status === "ACTIVE" ? schedule.dropoffTime : null,
          },
          create: {
            bookingId,
            dayOfWeek: schedule.dayOfWeek,
            status: schedule.status,
            pickupTime: schedule.status === "ACTIVE" ? schedule.pickupTime : null,
            dropoffTime: schedule.status === "ACTIVE" ? schedule.dropoffTime : null,
          },
        });
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    console.error("Update booking error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update booking.",
    };
  }
}

export async function deleteBooking(bookingId: string) {
  try {
    await requireAuth();
    await prisma.booking.delete({
      where: { id: bookingId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    console.error("Delete booking error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete booking.",
    };
  }
}

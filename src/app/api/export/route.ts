import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// Helper to escape CSV values & sanitize formulas to prevent CSV injection (OWASP guideline)
function sanitizeCSV(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // If string starts with =, +, -, @, tab, or carriage return, prepend single quote to mitigate Excel formula execution
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes by doubling them
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  try {
    const isAuthed = await isAuthenticated();
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();

    const whereClause = query
      ? {
          OR: [
            { id: { contains: query, mode: "insensitive" as const } },
            { passengerName: { contains: query, mode: "insensitive" as const } },
            { phoneNumber: { contains: query, mode: "insensitive" as const } },
            { pickupLocation: { contains: query, mode: "insensitive" as const } },
            { dropoffLocation: { contains: query, mode: "insensitive" as const } },
            { notes: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const records = await prisma.booking.findMany({
      where: whereClause,
      include: {
        schedules: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const daysOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

    const headers = [
      "Booking ID",
      "Passenger Name",
      "Phone Number",
      "Passenger Count",
      "Pickup Location",
      "Dropoff Location",
      "Budget (PKR)",
      "Monday Status",
      "Monday Pickup",
      "Monday Dropoff",
      "Tuesday Status",
      "Tuesday Pickup",
      "Tuesday Dropoff",
      "Wednesday Status",
      "Wednesday Pickup",
      "Wednesday Dropoff",
      "Thursday Status",
      "Thursday Pickup",
      "Thursday Dropoff",
      "Friday Status",
      "Friday Pickup",
      "Friday Dropoff",
      "Saturday Status",
      "Saturday Pickup",
      "Saturday Dropoff",
      "Sunday Status",
      "Sunday Pickup",
      "Sunday Dropoff",
      "Notes",
      "Created At",
      "Updated At",
    ];

    const rows = records.map((b) => {
      const scheduleMap = new Map(b.schedules.map((s) => [s.dayOfWeek, s]));

      const dayCells: string[] = [];
      for (const day of daysOrder) {
        const item = scheduleMap.get(day as any);
        dayCells.push(
          sanitizeCSV(item?.status || "OFF"),
          sanitizeCSV(item?.status === "ACTIVE" ? item?.pickupTime || "" : ""),
          sanitizeCSV(item?.status === "ACTIVE" ? item?.dropoffTime || "" : "")
        );
      }

      return [
        sanitizeCSV(b.id),
        sanitizeCSV(b.passengerName),
        sanitizeCSV(b.phoneNumber),
        sanitizeCSV(b.passengerCount),
        sanitizeCSV(b.pickupLocation),
        sanitizeCSV(b.dropoffLocation),
        sanitizeCSV(Number(b.budget)),
        ...dayCells,
        sanitizeCSV(b.notes || ""),
        sanitizeCSV(b.createdAt.toISOString()),
        sanitizeCSV(b.updatedAt.toISOString()),
      ].join(",");
    });

    // Add UTF-8 BOM so Excel opens Urdu/Arabic/special chars and standard headers cleanly
    const csvContent = "\uFEFF" + [headers.map(sanitizeCSV).join(","), ...rows].join("\r\n");

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `passenger-bookings-export-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: unknown) {
    console.error("CSV Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate CSV export from PostgreSQL." },
      { status: 500 }
    );
  }
}

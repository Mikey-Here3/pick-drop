import { z } from "zod";

export const DayOfWeekEnum = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

export const ScheduleStatusEnum = z.enum(["ACTIVE", "OFF"]);

export const ScheduleDaySchema = z.object({
  dayOfWeek: DayOfWeekEnum,
  status: ScheduleStatusEnum,
  pickupTime: z.string().nullable().optional(),
  dropoffTime: z.string().nullable().optional(),
}).refine(
  (data) => {
    if (data.status === "ACTIVE") {
      return (
        typeof data.pickupTime === "string" &&
        data.pickupTime.trim().length > 0 &&
        typeof data.dropoffTime === "string" &&
        data.dropoffTime.trim().length > 0
      );
    }
    return true;
  },
  {
    message: "Both pickup time and drop-off time are required when day is Active.",
    path: ["pickupTime"],
  }
);

export const BookingFormSchema = z.object({
  passengerName: z
    .string()
    .min(2, "Passenger / Contact name is required (min 2 characters)")
    .max(100, "Name too long"),
  phoneNumber: z
    .string()
    .min(7, "Valid phone number is required (min 7 digits)")
    .max(30, "Phone number too long"),
  passengerCount: z.coerce
    .number()
    .int("Passenger count must be an integer")
    .positive("Passenger count must be at least 1 person"),
  pickupLocation: z
    .string()
    .min(2, "Pickup location is required (min 2 characters)")
    .max(200, "Pickup location too long"),
  dropoffLocation: z
    .string()
    .min(2, "Drop-off location is required (min 2 characters)")
    .max(200, "Drop-off location too long"),
  budget: z.coerce
    .number()
    .min(0, "Budget must be a non-negative value"),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional().nullable(),
  schedules: z.array(ScheduleDaySchema).length(7, "All 7 weekdays must be provided"),
});

export type BookingFormData = z.infer<typeof BookingFormSchema>;
export type ScheduleDayData = z.infer<typeof ScheduleDaySchema>;

export const DAYS_LIST: Array<{ key: z.infer<typeof DayOfWeekEnum>; label: string; short: string }> = [
  { key: "MONDAY", label: "Monday", short: "Mon" },
  { key: "TUESDAY", label: "Tuesday", short: "Tue" },
  { key: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { key: "THURSDAY", label: "Thursday", short: "Thu" },
  { key: "FRIDAY", label: "Friday", short: "Fri" },
  { key: "SATURDAY", label: "Saturday", short: "Sat" },
  { key: "SUNDAY", label: "Sunday", short: "Sun" },
];

export const DEFAULT_WEEKLY_SCHEDULE: ScheduleDayData[] = DAYS_LIST.map((d) => ({
  dayOfWeek: d.key,
  status: (["SATURDAY", "SUNDAY"].includes(d.key) ? "OFF" : "ACTIVE") as "ACTIVE" | "OFF",
  pickupTime: ["SATURDAY", "SUNDAY"].includes(d.key) ? null : "08:00",
  dropoffTime: ["SATURDAY", "SUNDAY"].includes(d.key) ? null : "17:00",
}));

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";

/**
 * Appointments Availability API for AI Virtual Agent
 * 
 * Query Parameters:
 * - date: Date to check availability (ISO format, YYYY-MM-DD)
 * - timeZone: Timezone for the date (default: UTC)
 * - duration: Duration in minutes (default: 60)
 * - eventType?: string (filter by event type)
 * 
 * Examples:
 * - /api/appointments/availability?date=2024-01-15&duration=30
 * - /api/appointments/availability?date=2024-01-15&timeZone=America/New_York&duration=60
 */

interface AvailabilityFilters {
  date: string;
  timeZone?: string;
  duration?: number;
  eventType?: string;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse query parameters
    const filters: AvailabilityFilters = {
      date: url.searchParams.get("date") || "",
      timeZone: url.searchParams.get("timeZone") || "UTC",
      duration: parseInt(url.searchParams.get("duration") || "60"),
      eventType: url.searchParams.get("eventType") || undefined,
    };

    if (!filters.date) {
      return new Response(
        JSON.stringify({ error: "Date parameter is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📅 [APPOINTMENTS-AVAILABILITY] Checking availability for:`, filters);

    // Generate available time slots for the given date
    const availableSlots = await generateAvailableSlots(filters);

    return new Response(
      JSON.stringify({
        date: filters.date,
        timeZone: filters.timeZone,
        duration: filters.duration,
        availableSlots,
        totalSlots: availableSlots.length,
        filters: {
          eventType: filters.eventType,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [APPOINTMENTS-AVAILABILITY] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Generate available time slots for a given date
async function generateAvailableSlots(filters: AvailabilityFilters): Promise<string[]> {
  const slots: string[] = [];
  
  // Business hours (9 AM to 5 PM)
  const startHour = 9;
  const endHour = 17;
  
  // Generate time slots every 30 minutes
  const slotInterval = 30;
  
  // Create date object for the requested date
  const targetDate = new Date(filters.date);
  if (isNaN(targetDate.getTime())) {
    throw new Error("Invalid date format");
  }
  
  // Generate slots for the day
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotInterval) {
      const slotTime = new Date(targetDate);
      slotTime.setHours(hour, minute, 0, 0);
      
      // Check if this slot is available
      const isAvailable = await isSlotAvailable(slotTime, filters.duration);
      
      if (isAvailable) {
        slots.push(slotTime.toISOString());
      }
    }
  }
  
  return slots;
}

// Check if a specific time slot is available
async function isSlotAvailable(slotTime: Date, duration: number): Promise<boolean> {
  try {
    // This would typically check against existing appointments
    // For now, we'll simulate availability by excluding weekends and some random slots
    
    const dayOfWeek = slotTime.getDay();
    
    // Exclude weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Exclude lunch time (12:00 PM - 1:00 PM)
    const hour = slotTime.getHours();
    if (hour === 12) {
      return false;
    }
    
    // Simulate some random unavailability (20% chance)
    const random = Math.random();
    if (random < 0.2) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking slot availability:", error);
    return false;
  }
}

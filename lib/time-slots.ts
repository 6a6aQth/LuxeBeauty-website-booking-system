export const timeSlots = {
  monday_thursday: [
    "08:30",
    "10:00",
    "11:30",
    "13:30",
    "15:00",
  ],
  friday: [
    "08:30",
    "10:00",
    "11:30",
    "13:30",
  ],
  saturday: [
    "10:00",
    "11:30",
    "13:30",
  ],
};

export function getSlotsForDate(date: Date): string[] {
  const dayOfWeek = date.getDay(); // Sunday = 0, Monday = 1, etc.

  if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Monday to Thursday
    return timeSlots.monday_thursday;
  }
  if (dayOfWeek === 5) { // Friday
    return timeSlots.friday;
  }
  if (dayOfWeek === 6) { // Saturday
    return timeSlots.saturday;
  }
  return []; // Sunday or invalid date
}

export function formatTime(time: string): string {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12; // convert 0 to 12
    return `${h12}:${minute} ${suffix}`;
} 
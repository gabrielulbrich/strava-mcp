/**
 * Pure utility functions for running-related calculations.
 * No external dependencies — easy to test in isolation.
 */

/**
 * Converts a speed in meters per second to a human-readable pace string (min/km).
 */
export function formatPace(mps: number | undefined): string {
    if (!mps || mps <= 0) return 'N/A';
    const minutesPerKm = 1000 / (mps * 60);
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

/**
 * Returns the next Monday relative to a given base date.
 * Defaults the time to 07:00 AM.
 */
export function getNextMonday(baseDate = new Date()): Date {
    const result = new Date(baseDate);
    const day = result.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysUntilNextMonday = day === 0 ? 1 : 8 - day;
    result.setDate(result.getDate() + daysUntilNextMonday);
    result.setHours(7, 0, 0, 0);
    return result;
}

/**
 * Generates an array of ISO date strings (YYYY-MM-DD) for a 7-day week
 * starting from the provided Monday.
 */
export function getWeekDates(startMonday: Date): string[] {
    return Array.from({ length: 7 }, (_, i): string => {
        const d = new Date(startMonday);
        d.setDate(startMonday.getDate() + i);
        return d.toISOString().split('T')[0]!;
    });
}

/**
 * Utility functions for date and days of week calculations
 * BE bitmask format: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64
 * (According to BE controller comment and /dayflags endpoint)
 */

/**
 * Convert JavaScript Date.getDay() (0=Sunday, 1=Monday, ..., 6=Saturday) to BE bitmask
 * @param dayOfWeek - JavaScript day of week (0-6, where 0=Sunday)
 * @returns BE bitmask value (Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64)
 */
export function getDayBitmask(dayOfWeek: number): number {
  // JavaScript: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // BE bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64
  const mapping: { [key: number]: number } = {
    0: 1,  // Sunday
    1: 2,  // Monday
    2: 4,  // Tuesday
    3: 8,  // Wednesday
    4: 16, // Thursday
    5: 32, // Friday
    6: 64, // Saturday
  };
  return mapping[dayOfWeek] || 0;
}

/**
 * Check if a date matches a daysOfWeek bitmask
 * @param date - The date to check
 * @param daysOfWeek - BE bitmask (Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64)
 * @returns true if the date's day of week is included in the bitmask
 */
export function isDayInBitmask(date: Date, daysOfWeek: number): boolean {
  const dayBit = getDayBitmask(date.getDay());
  return (daysOfWeek & dayBit) !== 0;
}

/**
 * Format daysOfWeek bitmask to readable string
 * @param daysOfWeek - BE bitmask (Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64)
 * @returns Comma-separated string of day names (e.g., "Sun, Mon, Wed")
 */
export function formatDaysOfWeek(daysOfWeek: number): string {
  // BE bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64
  const mapping = [
    { bit: 1, label: 'Sun' },
    { bit: 2, label: 'Mon' },
    { bit: 4, label: 'Tue' },
    { bit: 8, label: 'Wed' },
    { bit: 16, label: 'Thu' },
    { bit: 32, label: 'Fri' },
    { bit: 64, label: 'Sat' }
  ];
  return mapping
    .filter(d => (daysOfWeek & d.bit) !== 0)
    .map(d => d.label)
    .join(', ');
}

/**
 * Get all day bits from a daysOfWeek bitmask
 * @param daysOfWeek - BE bitmask (Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64)
 * @returns Array of day bits that are set
 */
export function getDayBits(daysOfWeek: number): number[] {
  const bits = [1, 2, 4, 8, 16, 32, 64];
  return bits.filter(bit => (daysOfWeek & bit) !== 0);
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface SanitizeDateRangeOptions {
  minDate?: string;
  maxDate?: string;
}

export interface SanitizeDateRangeResult {
  range: DateRange;
  error: string | null;
}

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const isValidDateString = (value: string): boolean => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const todayString = (): string => formatDate(new Date());


export function adjustEndDateForInclusive(endDate: string): string {
  if (!endDate || !isValidDateString(endDate)) {
    return endDate;
  }
  
  const date = new Date(endDate);
  date.setDate(date.getDate() + 1);
  return formatDate(date);
}

/**
 * Sanitize and validate date range inputs to ensure they stay within bounds and maintain start <= end.
 */
export function sanitizeDateRange(
  currentRange: DateRange,
  field: 'startDate' | 'endDate',
  rawValue: string,
  options: SanitizeDateRangeOptions = {}
): SanitizeDateRangeResult {
  const messages: string[] = [];

  if (!rawValue || !isValidDateString(rawValue)) {
    messages.push('Please choose a valid date.');
    return { range: currentRange, error: messages.join(' ') };
  }

  const maxDate = options.maxDate && isValidDateString(options.maxDate) ? options.maxDate : todayString();
  const minDate = options.minDate && isValidDateString(options.minDate) ? options.minDate : undefined;

  let sanitizedValue = rawValue;

  if (sanitizedValue > maxDate) {
    sanitizedValue = maxDate;
    messages.push('Dates cannot be in the future. Adjusted to today.');
  }

  if (minDate && sanitizedValue < minDate) {
    sanitizedValue = minDate;
    messages.push(`Dates cannot be earlier than ${minDate}. Adjusted to minimum allowed date.`);
  }

  let nextStart = currentRange.startDate;
  let nextEnd = currentRange.endDate;

  if (field === 'startDate') {
    nextStart = sanitizedValue;
    if (nextEnd < nextStart) {
      nextEnd = nextStart;
      messages.push('Start date cannot be after end date. End date adjusted to match.');
    }
  } else {
    nextEnd = sanitizedValue;
    if (nextEnd < nextStart) {
      nextStart = nextEnd;
      messages.push('End date cannot be before start date. Start date adjusted to match.');
    }
  }

  return {
    range: { startDate: nextStart, endDate: nextEnd },
    error: messages.length ? messages.join(' ') : null,
  };
}


import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { CURRENCY, DATE_FORMATS } from './constants';

/**
 * Format a number as Kenyan Shillings currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: CURRENCY.CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, DATE_FORMATS.DISPLAY_DATE);
}

/**
 * Format a datetime string to a readable format
 */
export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, DATE_FORMATS.DISPLAY_DATETIME);
}

/**
 * Format a time string to a readable format
 */
export function formatTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, DATE_FORMATS.DISPLAY_TIME);
}

/**
 * Format a date as a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format weight in kilograms
 */
export function formatWeight(weightKg: number): string {
  if (weightKg >= 1000) {
    return `${(weightKg / 1000).toFixed(2)} tonnes`;
  }
  return `${weightKg.toFixed(0)} kg`;
}

/**
 * Format distance in kilometers
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

/**
 * Format duration in minutes to human-readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Format phone number to display format
 * Converts 0712345678 to +254 712 345 678
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any spaces or special characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 254
  let formatted = cleaned.startsWith('0') ? '254' + cleaned.slice(1) : cleaned;
  
  // Add spacing: +254 712 345 678
  if (formatted.startsWith('254') && formatted.length === 12) {
    return `+${formatted.slice(0, 3)} ${formatted.slice(3, 6)} ${formatted.slice(6, 9)} ${formatted.slice(9)}`;
  }
  
  return phone; // Return original if format doesn't match
}

/**
 * Format vehicle registration number
 * Converts "kbz123a" to "KBZ 123A"
 */
export function formatRegistrationNumber(regNo: string): string {
  const cleaned = regNo.replace(/\s/g, '').toUpperCase();
  
  // Kenya format: KXX 123X
  if (cleaned.length >= 6) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  
  return cleaned;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format job number for display
 */
export function formatJobNumber(jobNumber: string): string {
  // SL20240101-0001 -> SL-20240101-0001
  if (jobNumber.startsWith('SL')) {
    return `${jobNumber.slice(0, 2)}-${jobNumber.slice(2)}`;
  }
  return jobNumber;
}

/**
 * Format rating with stars
 */
export function formatRating(rating: number): string {
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  return `${stars} (${rating.toFixed(1)})`;
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitle(text: string): string {
  return text
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
}
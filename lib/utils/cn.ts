import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Handles conflicts intelligently (e.g., if you have both 'p-4' and 'p-2', keeps the last one)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
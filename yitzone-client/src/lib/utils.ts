import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Masks the first 5 digits of an 8-digit student code for public LED leaderboards.
 * Example: maskStudentCode("22110345", "Nguyễn Minh Khôi") -> "Nguyễn Minh Khôi ·...345"
 */
export function maskStudentCode(studentCode: string, fullName?: string): string {
  const digits = studentCode.replace(/\D/g, "");
  const last3 = digits.slice(-3).padStart(3, "0");
  const masked = `...${last3}`;
  return fullName?.trim() ? `${fullName.trim()} · ${masked}` : masked;
}


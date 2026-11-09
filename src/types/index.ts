export interface BirthdayContact {
  rowIndex: number; // 1-based row index in Google Sheets (Row 1 is header)
  id: string; // e.g., 'people/c12345'
  firstName: string;
  lastName: string;
  fullName: string;
  birthDate: string; // 'YYYY-MM-DD' or '--MM-DD'
  email: string;
  gift: boolean;
  giftDone: boolean;
  note: string; // Markdown notes
  // Computed fields
  daysUntil: number;
  turningAge: number | null;
  isMilestone: boolean;
  hasYear: boolean;
  formattedDate: string;
}

export type FilterType = 'all' | 'gift_needed' | 'milestone' | 'missing_year';

export interface UserProfile {
  email: string;
  name?: string;
  picture?: string;
}

export interface SheetConfig {
  id: string;
  name: string;
}

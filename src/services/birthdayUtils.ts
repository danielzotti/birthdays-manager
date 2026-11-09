import { BirthdayContact, FilterType } from '../types';

export const MILESTONE_AGES = [10, 18, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export interface BirthdayCalculation {
  daysUntil: number;
  turningAge: number | null;
  isMilestone: boolean;
  hasYear: boolean;
  formattedDate: string;
  cleanDate: string;
}

/**
 * Calculates days until next birthday and turning age.
 * Handles 'YYYY-MM-DD' and '--MM-DD', as well as Feb 29 leap day birthdays.
 */
export function calculateBirthdayInfo(rawDateStr: string, referenceDate: Date = new Date()): BirthdayCalculation {
  let cleanDate = String(rawDateStr || '').trim();
  if (cleanDate.startsWith("'")) {
    cleanDate = cleanDate.substring(1);
  }

  const hasYear = cleanDate.length > 0 && !cleanDate.startsWith('--');
  let birthYear: number | null = null;
  let birthMonth = 1;
  let birthDay = 1;

  if (hasYear) {
    const parts = cleanDate.split('-');
    birthYear = parseInt(parts[0], 10);
    birthMonth = parseInt(parts[1], 10);
    birthDay = parseInt(parts[2], 10);
  } else {
    const parts = cleanDate.replace('--', '').split('-');
    birthMonth = parseInt(parts[0], 10);
    birthDay = parseInt(parts[1], 10);
  }

  const currentYear = referenceDate.getFullYear();
  const todayZero = new Date(currentYear, referenceDate.getMonth(), referenceDate.getDate());

  // Determine target date for a given year, accommodating Feb 29 on non-leap years
  function getCandidateDate(targetYear: number): Date {
    let day = birthDay;
    if (birthMonth === 2 && birthDay === 29 && !isLeapYear(targetYear)) {
      day = 28;
    }
    return new Date(targetYear, birthMonth - 1, day);
  }

  let nextBday = getCandidateDate(currentYear);
  if (nextBday.getTime() < todayZero.getTime()) {
    nextBday = getCandidateDate(currentYear + 1);
  }

  const diffTime = nextBday.getTime() - todayZero.getTime();
  const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const turningAge = hasYear && birthYear ? nextBday.getFullYear() - birthYear : null;
  const isMilestone = turningAge !== null && MILESTONE_AGES.includes(turningAge);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const formattedDate = `${monthNames[birthMonth - 1]} ${birthDay}`;

  return {
    daysUntil,
    turningAge,
    isMilestone,
    hasYear,
    formattedDate,
    cleanDate
  };
}

/**
 * Parses raw spreadsheet row into a typed BirthdayContact.
 * Spreadsheet columns:
 * A: id, B: first_name, C: last_name, D: birth_date, E: email, F: gift, G: gift_done, H: note
 */
export function parseSpreadsheetRow(row: unknown[], rowIndex: number): BirthdayContact | null {
  const id = String(row[0] || '').trim();
  const firstName = String(row[1] || '').trim();
  const lastName = String(row[2] || '').trim();
  const birthDate = String(row[3] || '').trim();
  const email = String(row[4] || '').trim();
  
  // Cell values can be booleans or string "TRUE"/"FALSE"
  const gift = row[5] === true || String(row[5]).toUpperCase() === 'TRUE';
  const giftDone = row[6] === true || String(row[6]).toUpperCase() === 'TRUE';
  const note = String(row[7] || '').trim();

  // If there is no ID and no birthDate, skip empty row
  if (!id && !birthDate) {
    return null;
  }

  const calc = calculateBirthdayInfo(birthDate);
  const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Name';

  return {
    rowIndex,
    id,
    firstName,
    lastName,
    fullName,
    birthDate: calc.cleanDate,
    email,
    gift,
    giftDone,
    note,
    daysUntil: calc.daysUntil,
    turningAge: calc.turningAge,
    isMilestone: calc.isMilestone,
    hasYear: calc.hasYear,
    formattedDate: calc.formattedDate
  };
}

/**
 * Filter and sort contacts based on search query, filter tab, and upcoming birthday sort.
 */
export function filterAndSortContacts(
  contacts: BirthdayContact[],
  searchQuery: string,
  filter: FilterType
): BirthdayContact[] {
  const query = searchQuery.toLowerCase().trim();

  return contacts
    .filter((c) => {
      // 1. Search filter (name, email, notes)
      if (query) {
        const matchesName = c.fullName.toLowerCase().includes(query);
        const matchesEmail = c.email.toLowerCase().includes(query);
        const matchesNote = c.note.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesNote) {
          return false;
        }
      }

      // 2. Tab filter
      switch (filter) {
        case 'gift_needed':
          return c.gift && !c.giftDone;
        case 'milestone':
          return c.isMilestone;
        case 'missing_year':
          return !c.hasYear;
        case 'all':
        default:
          return true;
      }
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

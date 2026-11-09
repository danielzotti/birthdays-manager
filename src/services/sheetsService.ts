import { BirthdayContact } from '../types';
import { parseSpreadsheetRow } from './birthdayUtils';

const SHEET_NAME = 'Birthdays';

/**
 * Fetches all birthday contacts from the 'Birthdays' sheet.
 */
export async function fetchBirthdayContacts(spreadsheetId: string): Promise<BirthdayContact[]> {
  if (!window.gapi?.client?.sheets) {
    throw new Error('Google Sheets API client not initialized.');
  }

  const range = `${SHEET_NAME}!A1:H`;
  const response = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });

  const rawRows = response.result.values;
  if (!rawRows || rawRows.length <= 1) {
    return [];
  }

  // Row 1 is header (index 0), data starts at row 2 (index 1)
  const contacts: BirthdayContact[] = [];
  for (let i = 1; i < rawRows.length; i++) {
    const contact = parseSpreadsheetRow(rawRows[i], i + 1);
    if (contact) {
      contacts.push(contact);
    }
  }

  return contacts;
}

/**
 * Updates the 'gift' boolean in Column F for a specific row.
 */
export async function updateGift(
  spreadsheetId: string,
  rowIndex: number,
  gift: boolean
): Promise<void> {
  if (!window.gapi?.client?.sheets) {
    throw new Error('Google Sheets API client not initialized.');
  }

  const range = `${SHEET_NAME}!F${rowIndex}`;
  await window.gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[gift]]
    }
  });
}

/**
 * Updates the 'gift_done' boolean in Column G for a specific row.
 */
export async function updateGiftDone(
  spreadsheetId: string,
  rowIndex: number,
  giftDone: boolean
): Promise<void> {
  if (!window.gapi?.client?.sheets) {
    throw new Error('Google Sheets API client not initialized.');
  }

  const range = `${SHEET_NAME}!G${rowIndex}`;
  await window.gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[giftDone]]
    }
  });
}

/**
 * Updates the Markdown 'note' in Column H for a specific row.
 */
export async function updateNote(
  spreadsheetId: string,
  rowIndex: number,
  note: string
): Promise<void> {
  if (!window.gapi?.client?.sheets) {
    throw new Error('Google Sheets API client not initialized.');
  }

  const range = `${SHEET_NAME}!H${rowIndex}`;
  await window.gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[note]]
    }
  });
}

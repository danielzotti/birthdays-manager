import { SheetConfig } from '../types';

export const SHEET_ID_KEY = 'birthday_manager_sheet_id';
export const SHEET_NAME_KEY = 'birthday_manager_sheet_name';

let pickerLoaded = false;

/**
 * Loads the Google Picker library through gapi.load('picker').
 */
export function loadPickerLibrary(): Promise<void> {
  if (pickerLoaded && window.google?.picker) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    if (!window.gapi) {
      reject(new Error('Google API client (gapi) script is not available.'));
      return;
    }

    window.gapi.load('picker', () => {
      pickerLoaded = true;
      resolve();
    });
  });
}

/**
 * Retrieves the currently saved spreadsheet configuration from localStorage.
 */
export function getSavedSheetConfig(): SheetConfig | null {
  const id = localStorage.getItem(SHEET_ID_KEY);
  const name = localStorage.getItem(SHEET_NAME_KEY) || 'Birthday Database';
  if (!id) return null;
  return { id, name };
}

/**
 * Saves selected spreadsheet configuration to localStorage.
 */
export function saveSheetConfig(id: string, name: string): void {
  localStorage.setItem(SHEET_ID_KEY, id);
  localStorage.setItem(SHEET_NAME_KEY, name);
}

/**
 * Clears saved spreadsheet configuration from localStorage.
 */
export function clearSheetConfig(): void {
  localStorage.removeItem(SHEET_ID_KEY);
  localStorage.removeItem(SHEET_NAME_KEY);
}

/**
 * Opens Google Picker modal filtered to Google Spreadsheets.
 */
export async function openSpreadsheetPicker(
  apiKey: string,
  accessToken: string,
  onPicked: (config: SheetConfig) => void,
  onCancel?: () => void
): Promise<void> {
  await loadPickerLibrary();

  if (!window.google?.picker) {
    throw new Error('Google Picker is not available.');
  }

  const view = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS);
  view.setMimeTypes('application/vnd.google-apps.spreadsheet');

  const picker = new window.google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(accessToken)
    .setDeveloperKey(apiKey)
    .setTitle('Select your Birthday Database Spreadsheet')
    .setCallback((data: google.picker.ResponseObject) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs?.[0];
        if (doc) {
          const config: SheetConfig = {
            id: doc.id,
            name: doc.name || 'Birthday Database'
          };
          saveSheetConfig(config.id, config.name);
          onPicked(config);
        }
      } else if (data.action === window.google.picker.Action.CANCEL) {
        if (onCancel) onCancel();
      }
    })
    .build();

  picker.setVisible(true);
}

import { UserProfile } from '../types';

export const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

const TOKEN_STORAGE_KEY = 'birthday_manager_access_token';
const TOKEN_EXPIRY_KEY = 'birthday_manager_token_expiry';
const USER_STORAGE_KEY = 'birthday_manager_user_profile';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let currentAccessToken: string | null = null;
let gapiInitialized = false;

export function getCurrentAccessToken(): string | null {
  return currentAccessToken || getStoredAccessToken();
}

export function getStoredAccessToken(): string | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiry) {
    return null;
  }
  const expiryTime = parseInt(expiry, 10);
  if (Date.now() >= expiryTime) {
    clearStoredAuth();
    return null;
  }
  return token;
}

export function getStoredUser(): UserProfile | null {
  const user = localStorage.getItem(USER_STORAGE_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user) as UserProfile;
  } catch {
    return null;
  }
}

export function clearStoredAuth(): void {
  currentAccessToken = null;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  if (window.gapi?.client) {
    window.gapi.client.setToken(null);
  }
}

/**
 * Initializes the Google API client library with API key and Sheets discovery doc.
 */
export async function initializeGapi(apiKey: string): Promise<void> {
  if (gapiInitialized && window.gapi?.client?.sheets) {
    return;
  }

  return new Promise((resolve, reject) => {
    if (!window.gapi) {
      reject(new Error('Google API Client (gapi) script not loaded yet.'));
      return;
    }

    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
        });
        gapiInitialized = true;

        const storedToken = getStoredAccessToken();
        if (storedToken) {
          currentAccessToken = storedToken;
          window.gapi.client.setToken({ access_token: storedToken });
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Initializes the Google Identity Services (GIS) Token Client.
 */
export function initializeGisTokenClient(
  clientId: string,
  onTokenReceived: (token: string) => void,
  onError?: (err: unknown) => void
): google.accounts.oauth2.TokenClient {
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services (google.accounts.oauth2) script not loaded yet.');
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: OAUTH_SCOPES,
    callback: (response: google.accounts.oauth2.TokenResponse) => {
      if (response.error) {
        if (onError) onError(response);
        return;
      }
      currentAccessToken = response.access_token;
      const expiresInSec = response.expires_in || 3500;
      const expiryTimestamp = Date.now() + (expiresInSec - 60) * 1000;

      localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());

      if (window.gapi?.client) {
        window.gapi.client.setToken({ access_token: response.access_token });
      }

      onTokenReceived(response.access_token);
    },
    error_callback: (err) => {
      if (onError) onError(err);
    }
  });

  return tokenClient;
}

/**
 * Requests a new access token via Google Identity Services popup.
 */
export function requestLogin(promptOption?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized. Call initializeGisTokenClient first.'));
      return;
    }

    // Set temporary handlers
    const checkInterval = setInterval(() => {
      const token = getStoredAccessToken();
      if (token) {
        clearInterval(checkInterval);
        resolve(token);
      }
    }, 200);

    // Timeout after 90 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Login request timed out.'));
    }, 90000);

    try {
      tokenClient.requestAccessToken({ prompt: promptOption || '' });
    } catch (e) {
      clearInterval(checkInterval);
      clearTimeout(timeout);
      reject(e);
    }
  });
}

/**
 * Fetches user profile from Google UserInfo endpoint using the access token.
 */
export async function fetchUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user profile.');
  }
  const data = await res.json();
  const profile: UserProfile = {
    email: data.email || '',
    name: data.name || '',
    picture: data.picture || ''
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

/**
 * Logs out the user and clears tokens and cache.
 */
export function logout(onDone?: () => void): void {
  const token = getStoredAccessToken();
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token, () => {
      clearStoredAuth();
      if (onDone) onDone();
    });
  } else {
    clearStoredAuth();
    if (onDone) onDone();
  }
}

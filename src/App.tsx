import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BirthdayContact, FilterType, SheetConfig, UserProfile } from './types';
import { Header } from './components/Header';
import { Highlights } from './components/Highlights';
import { ContactList } from './components/ContactList';
import { NoteModal } from './components/NoteModal';
import { OnboardingPicker } from './components/OnboardingPicker';
import { LoginScreen } from './components/LoginScreen';
import {
  getStoredAccessToken,
  getStoredUser,
  initializeGapi,
  initializeGisTokenClient,
  requestLogin,
  fetchUserProfile,
  logout
} from './services/googleAuth';
import {
  getSavedSheetConfig,
  saveSheetConfig,
  clearSheetConfig,
  openSpreadsheetPicker
} from './services/googlePicker';
import {
  fetchBirthdayContacts,
  updateGift,
  updateGiftDone,
  updateNote
} from './services/sheetsService';
import { filterAndSortContacts } from './services/birthdayUtils';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // Config credentials from ENV or local storage fallback
  const [clientId, setClientId] = useState<string>(
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      localStorage.getItem('birthday_manager_manual_client_id') ||
      ''
  );
  const [apiKey, setApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_API_KEY ||
      localStorage.getItem('birthday_manager_manual_api_key') ||
      ''
  );

  // App State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig | null>(null);
  const [contacts, setContacts] = useState<BirthdayContact[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedNoteContact, setSelectedNoteContact] = useState<BirthdayContact | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [pendingRowUpdates, setPendingRowUpdates] = useState<Set<number>>(new Set());

  // Loading & error states
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Auth & GAPI
  useEffect(() => {
    const initApp = async () => {
      const storedToken = getStoredAccessToken();
      const storedUser = getStoredUser();
      const savedSheet = getSavedSheetConfig();

      if (savedSheet) {
        setSheetConfig(savedSheet);
      }

      if (storedToken) {
        setIsAuthenticated(true);
        if (storedUser) {
          setUserProfile(storedUser);
        } else {
          try {
            const profile = await fetchUserProfile(storedToken);
            setUserProfile(profile);
          } catch (e) {
            console.warn('Could not fetch user profile with stored token:', e);
          }
        }

        if (apiKey) {
          try {
            await initializeGapi(apiKey);
            if (savedSheet) {
              await loadContacts(savedSheet.id);
            }
          } catch (err) {
            console.error('Failed to initialize GAPI on mount:', err);
          }
        }
      }
    };

    initApp();
  }, [apiKey]);

  // Load contacts from Google Sheets
  const loadContacts = useCallback(async (spreadsheetId: string) => {
    try {
      setIsDataLoading(true);
      setErrorMessage(null);
      const data = await fetchBirthdayContacts(spreadsheetId);
      setContacts(data);
    } catch (err: unknown) {
      console.error('Error fetching contacts:', err);
      const errorStr = String(err);
      if (errorStr.includes('Unable to parse range: Birthdays') || errorStr.includes('Birthdays')) {
        setErrorMessage(
          'Could not find the "Birthdays" sheet in this spreadsheet. Please ensure the Google Apps Script syncContactsNightly() has been run, or rename your sheet tab to "Birthdays".'
        );
      } else {
        setErrorMessage(
          'Failed to load contacts from Google Sheets. Please check your permissions or try refreshing.'
        );
      }
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Handle Login
  const handleLogin = async () => {
    if (!clientId || !apiKey) {
      alert('Google OAuth Client ID and API Key must be configured.');
      return;
    }

    try {
      setIsAuthLoading(true);
      setErrorMessage(null);

      await initializeGapi(apiKey);

      initializeGisTokenClient(
        clientId,
        async (token) => {
          setIsAuthenticated(true);
          try {
            const profile = await fetchUserProfile(token);
            setUserProfile(profile);
          } catch (pErr) {
            console.warn('Could not fetch user profile:', pErr);
          }

          const currentSheet = sheetConfig || getSavedSheetConfig();
          if (currentSheet) {
            await loadContacts(currentSheet.id);
          }
          setIsAuthLoading(false);
        },
        (error) => {
          console.error('GIS token error:', error);
          setErrorMessage('Google Authentication was cancelled or failed.');
          setIsAuthLoading(false);
        }
      );

      await requestLogin();
    } catch (err) {
      console.error('Login initiation failed:', err);
      setErrorMessage('Could not initiate Google sign in. Please try again.');
      setIsAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    logout(() => {
      setIsAuthenticated(false);
      setUserProfile(null);
      setContacts([]);
    });
  };

  // Handle Manual Credentials Update (when .env not provided)
  const handleUpdateManualCredentials = (newClientId: string, newApiKey: string) => {
    localStorage.setItem('birthday_manager_manual_client_id', newClientId);
    localStorage.setItem('birthday_manager_manual_api_key', newApiKey);
    setClientId(newClientId);
    setApiKey(newApiKey);
  };

  // Handle Google Picker
  const handleOpenPicker = async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setErrorMessage('Session expired. Please log in again.');
      setIsAuthenticated(false);
      return;
    }

    try {
      setIsPickerLoading(true);
      await openSpreadsheetPicker(
        apiKey,
        token,
        async (newConfig) => {
          setSheetConfig(newConfig);
          await loadContacts(newConfig.id);
          setIsPickerLoading(false);
        },
        () => {
          setIsPickerLoading(false);
        }
      );
    } catch (err) {
      console.error('Failed to open Google Picker:', err);
      alert('Failed to launch Google Picker. Make sure Google Picker API is enabled in Google Cloud Console.');
      setIsPickerLoading(false);
    }
  };

  // Handle Direct Sheet Select (from URL/ID input)
  const handleDirectSelect = async (newConfig: SheetConfig) => {
    saveSheetConfig(newConfig.id, newConfig.name);
    setSheetConfig(newConfig);
    await loadContacts(newConfig.id);
  };

  // Change or Reset Sheet
  const handleChangeSheet = () => {
    clearSheetConfig();
    setSheetConfig(null);
    setContacts([]);
    handleOpenPicker();
  };

  // Optimistic Toggle: Gift Needed
  const handleToggleGift = async (contact: BirthdayContact, nextValue: boolean) => {
    if (!sheetConfig) return;

    // Optimistic UI update
    setContacts((prev) =>
      prev.map((c) => (c.rowIndex === contact.rowIndex ? { ...c, gift: nextValue } : c))
    );

    setPendingRowUpdates((prev) => new Set(prev).add(contact.rowIndex));

    try {
      await updateGift(sheetConfig.id, contact.rowIndex, nextValue);
    } catch (err) {
      console.error('Failed to update gift status:', err);
      // Rollback
      setContacts((prev) =>
        prev.map((c) => (c.rowIndex === contact.rowIndex ? { ...c, gift: !nextValue } : c))
      );
      alert('Failed to update gift setting in Google Sheets. Please check permissions.');
    } finally {
      setPendingRowUpdates((prev) => {
        const next = new Set(prev);
        next.delete(contact.rowIndex);
        return next;
      });
    }
  };

  // Optimistic Toggle: Gift Done
  const handleToggleGiftDone = async (contact: BirthdayContact, nextValue: boolean) => {
    if (!sheetConfig) return;

    // Optimistic UI update
    setContacts((prev) =>
      prev.map((c) => (c.rowIndex === contact.rowIndex ? { ...c, giftDone: nextValue } : c))
    );

    setPendingRowUpdates((prev) => new Set(prev).add(contact.rowIndex));

    try {
      await updateGiftDone(sheetConfig.id, contact.rowIndex, nextValue);
    } catch (err) {
      console.error('Failed to update gift_done status:', err);
      // Rollback
      setContacts((prev) =>
        prev.map((c) => (c.rowIndex === contact.rowIndex ? { ...c, giftDone: !nextValue } : c))
      );
      alert('Failed to update gift status in Google Sheets.');
    } finally {
      setPendingRowUpdates((prev) => {
        const next = new Set(prev);
        next.delete(contact.rowIndex);
        return next;
      });
    }
  };

  // Handle Note Save
  const handleSaveNote = async (contact: BirthdayContact, newNote: string) => {
    if (!sheetConfig) return;

    // Optimistic UI update
    setContacts((prev) =>
      prev.map((c) => (c.rowIndex === contact.rowIndex ? { ...c, note: newNote } : c))
    );

    await updateNote(sheetConfig.id, contact.rowIndex, newNote);
  };

  // Open Note Modal
  const handleOpenNote = (contact: BirthdayContact) => {
    setSelectedNoteContact(contact);
    setIsNoteModalOpen(true);
  };

  // Filtered and Sorted Contacts
  const filteredContacts = useMemo(() => {
    return filterAndSortContacts(contacts, searchQuery, activeFilter);
  }, [contacts, searchQuery, activeFilter]);

  // If user is not authenticated, render Login Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        isLoading={isAuthLoading}
        hasEnvCredentials={Boolean(clientId && apiKey)}
        onUpdateManualCredentials={handleUpdateManualCredentials}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header */}
      <Header
        sheetConfig={sheetConfig}
        userProfile={userProfile}
        onRefresh={() => sheetConfig && loadContacts(sheetConfig.id)}
        isRefreshing={isDataLoading}
        onChangeSheet={handleChangeSheet}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start justify-between gap-3 text-red-800 text-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Attention</p>
                <p className="text-red-700 text-xs mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-500 hover:text-red-800 font-semibold px-2 py-1 rounded-md hover:bg-red-100 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* If no sheet is selected yet, render Onboarding Picker */}
        {!sheetConfig ? (
          <OnboardingPicker
            onOpenPicker={handleOpenPicker}
            onDirectSelect={handleDirectSelect}
            isPickerLoading={isPickerLoading}
          />
        ) : isDataLoading && contacts.length === 0 ? (
          /* Initial loading state */
          <div className="py-24 text-center">
            <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-base">Loading contacts...</h3>
            <p className="text-slate-500 text-xs mt-1">
              Fetching rows from the "{sheetConfig.name}" Google Spreadsheet
            </p>
          </div>
        ) : (
          /* Dashboard Content */
          <>
            {/* Top Highlights: Today, Urgent Gifts, Next 10 Days */}
            <Highlights
              contacts={contacts}
              onToggleGiftDone={handleToggleGiftDone}
              onOpenNote={handleOpenNote}
              pendingRowUpdates={pendingRowUpdates}
            />

            {/* Full Contact List & Filters */}
            <ContactList
              contacts={contacts}
              filteredContacts={filteredContacts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onToggleGift={handleToggleGift}
              onToggleGiftDone={handleToggleGiftDone}
              onOpenNote={handleOpenNote}
              pendingRowUpdates={pendingRowUpdates}
            />
          </>
        )}

      </main>

      {/* Markdown Note Editor Modal */}
      <NoteModal
        contact={selectedNoteContact}
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSaveNote={handleSaveNote}
      />

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200/80 bg-white/50 text-center text-xs text-slate-400">
        <p className="flex items-center justify-center gap-1.5">
          <span>Birthday Manager by Daniel</span>
        </p>
      </footer>

    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { SheetConfig, UserProfile } from '../types';
import { Cake, FileSpreadsheet, RefreshCw, LogOut, FolderSync } from 'lucide-react';

interface HeaderProps {
  sheetConfig: SheetConfig | null;
  userProfile: UserProfile | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onChangeSheet: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sheetConfig,
  userProfile,
  onRefresh,
  isRefreshing,
  onChangeSheet,
  onLogout
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [userProfile?.picture]);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <h1 className="hidden sm:block font-bold text-lg text-slate-900 tracking-tight leading-none flex items-center gap-2">
                Birthday Manager
              </h1>
            </div>
          </div>


          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
             {sheetConfig && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${sheetConfig.id}/edit`}
                target="_blank"
                rel="noreferrer"
                title="Open in Google Sheets"
                className="text-slate-400 hover:text-indigo-600 transition-colors ml-1 p-0.5 rounded hover:bg-slate-200/50 flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs text-slate-600 max-w-sm truncate"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="hidden lg:block truncate font-medium text-slate-700" title={sheetConfig.name}>
                  {sheetConfig.name}
                </span>
              </a>
          )}
            {sheetConfig && (
              <>
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  title="Reload contacts from Google Sheets"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
                  <span className="hidden md:inline">Refresh</span>
                </button>

                <button
                  onClick={onChangeSheet}
                  title="Change connected spreadsheet"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all"
                >
                  <FolderSync className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden md:inline">Change File</span>
                </button>
              </>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center pl-2 ml-1 border-l border-slate-200 gap-2">
              {userProfile?.picture && !imgError ? (
                <img
                  src={userProfile.picture}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  alt={userProfile.name || userProfile.email}
                  className="w-7 h-7 rounded-full border border-slate-200 shadow-inner"
                  title={userProfile.email}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-xs"
                  title={userProfile?.email || 'Logged In'}
                >
                  {userProfile?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}

              <button
                onClick={onLogout}
                title="Log out of Google Account"
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

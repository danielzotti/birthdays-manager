import React, { useState } from 'react';
import { FileSpreadsheet, ArrowRight, ShieldCheck, Sparkles, FolderOpen, HelpCircle } from 'lucide-react';
import { SheetConfig } from '../types';

interface OnboardingPickerProps {
  onOpenPicker: () => void;
  onDirectSelect: (config: SheetConfig) => void;
  isPickerLoading: boolean;
}

export const OnboardingPicker: React.FC<OnboardingPickerProps> = ({
  onOpenPicker,
  onDirectSelect,
  isPickerLoading
}) => {
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualInput.trim();
    if (!trimmed) return;

    // Extract ID if full Google Sheets URL was pasted
    let extractedId = trimmed;
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }

    onDirectSelect({
      id: extractedId,
      name: 'Birthday Database'
    });
  };

  return (
    <div className="max-w-2xl mx-auto my-12 px-4">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-8 sm:p-10 text-center">
        
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <FileSpreadsheet className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Connect your Birthday Database
        </h2>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
          Select the Google Spreadsheet managed by the Birthday Manager Google Apps Script backend.
        </p>

        {/* Primary Action Button */}
        <div className="mt-8">
          <button
            onClick={onOpenPicker}
            disabled={isPickerLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            <span>{isPickerLoading ? 'Opening Google Picker...' : 'Select Google Spreadsheet'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Manual URL / ID alternative toggle */}
        <div className="mt-6">
          {!showManual ? (
            <button
              onClick={() => setShowManual(true)}
              className="text-xs text-slate-400 hover:text-indigo-600 transition underline underline-offset-4"
            >
              Or enter Spreadsheet ID / URL directly
            </button>
          ) : (
            <form onSubmit={handleManualSubmit} className="mt-4 max-w-md mx-auto flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste Spreadsheet ID or full Google Sheets URL..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition"
              >
                Connect
              </button>
            </form>
          )}
        </div>

        {/* Features / Onboarding Explanations */}
        <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Automated Sync</span>
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Google Apps Script imports Google Contacts with birthdays nightly at 03:00.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Milestones & Gifts</span>
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Track 10, 18, 20, 30... milestones and manage gift purchases with automatic annual reset.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>Markdown Notes</span>
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Store gift wishlists and notes in Markdown synced straight into column H of your sheet.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

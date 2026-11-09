import React, { useState, useEffect } from 'react';
import { BirthdayContact } from '../types';
import ReactMarkdown from 'react-markdown';
import { X, Save, Edit3, Eye, Bold, List, CheckSquare, Sparkles } from 'lucide-react';

interface NoteModalProps {
  contact: BirthdayContact | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (contact: BirthdayContact, note: string) => Promise<void>;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  contact,
  isOpen,
  onClose,
  onSaveNote
}) => {
  const [noteContent, setNoteContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (contact) {
      setNoteContent(contact.note || '');
      setActiveTab('write');
      setSaveSuccess(false);
    }
  }, [contact]);

  if (!isOpen || !contact) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSaveNote(contact, noteContent);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Failed to save note:', err);
      alert('Failed to save note to Google Sheets. Please check your connection or permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  const insertSnippet = (snippet: string) => {
    setNoteContent((prev) => prev + snippet);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Gift Ideas & Notes</span>
              <span className="text-xs font-normal text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                Markdown
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              For <strong className="text-slate-800">{contact.fullName}</strong> • Birthday: {contact.formattedDate}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher & quick markdown tools */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          
          {/* Write / Preview Tab Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('write')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'write'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Quick Toolbar (only in editor mode) */}
          {activeTab === 'write' && (
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <button
                type="button"
                onClick={() => insertSnippet('**bold**')}
                title="Add bold text"
                className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-md transition"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\n- Item 1\n- Item 2')}
                title="Add bullet list"
                className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-md transition"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\n- [ ] Gift idea:\n- [ ] Already bought')}
                title="Add checklist"
                className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-md transition"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\n### Gift Ideas\n')}
                title="Add header"
                className="px-2 py-1 hover:bg-slate-100 hover:text-slate-800 rounded-md transition font-bold"
              >
                H3
              </button>
            </div>
          )}

        </div>

        {/* Modal Body */}
        <div className="p-6">
          {activeTab === 'write' ? (
            <div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write gift ideas, wishlist items, sizes, favorite hobbies, or birthday memories in Markdown...
Example:
- [ ] Wireless headphones
- [ ] Coffee grinder
Size: L, prefers dark colors"
                rows={10}
                className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-mono text-slate-800 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-y"
              />
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Supports standard Markdown: **bold**, *italics*, bullet points, checkboxes `- [ ] `, and links.
              </p>
            </div>
          ) : (
            <div className="min-h-[220px] max-h-[360px] overflow-y-auto p-4 bg-slate-50/70 border border-slate-200 rounded-2xl prose prose-sm prose-slate max-w-none">
              {noteContent.trim() ? (
                <ReactMarkdown>{noteContent}</ReactMarkdown>
              ) : (
                <p className="text-slate-400 italic text-center py-8">
                  No note written yet. Switch to the Editor tab to type something!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Row {contact.rowIndex} in Google Sheets (Col H)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition ${
                saveSuccess
                  ? 'bg-emerald-600'
                  : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
              }`}
            >
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Note'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

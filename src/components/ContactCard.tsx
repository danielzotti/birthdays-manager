import React from 'react';
import { BirthdayContact } from '../types';
import { Gift, CheckCircle2, Circle, FileText, AlertTriangle, ExternalLink, Mail } from 'lucide-react';

interface ContactCardProps {
  contact: BirthdayContact;
  onToggleGift: (contact: BirthdayContact, nextValue: boolean) => void;
  onToggleGiftDone: (contact: BirthdayContact, nextValue: boolean) => void;
  onOpenNote: (contact: BirthdayContact) => void;
  isUpdating: boolean;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onToggleGift,
  onToggleGiftDone,
  onOpenNote,
  isUpdating
}) => {
  // Days until text styling
  let daysBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let daysText = `in ${contact.daysUntil} days`;

  if (contact.daysUntil === 0) {
    daysBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse';
    daysText = 'Today! 🎉';
  } else if (contact.daysUntil === 1) {
    daysBadgeClass = 'bg-indigo-100 text-indigo-900 border-indigo-200 font-semibold';
    daysText = 'Tomorrow';
  } else if (contact.daysUntil <= 14) {
    daysBadgeClass = 'bg-blue-50 text-blue-800 border-blue-200 font-medium';
    daysText = `in ${contact.daysUntil} days`;
  }

  return (
    <div className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-sm hover:shadow-md ${
      contact.daysUntil === 0
        ? 'border-amber-300 ring-2 ring-amber-200/50 bg-gradient-to-r from-amber-50/40 to-white'
        : 'border-slate-200/80 hover:border-indigo-200'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Contact Info & Badges */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-base tracking-tight truncate">
              {contact.fullName}
            </h3>

            {/* Days until badge */}
            <span className={`text-xs px-2.5 py-0.5 rounded-full border shadow-2xs ${daysBadgeClass}`}>
              {daysText}
            </span>

            {/* Milestone Badge */}
            {contact.isMilestone && (
              <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-amber-950 border border-amber-400 shadow-sm">
                🌟 {contact.turningAge} Years!
              </span>
            )}

            {/* Missing Year Warning Badge */}
            {!contact.hasYear && (
              <a
                href="https://contacts.google.com/"
                target="_blank"
                rel="noreferrer"
                title="Click to add birth year in Google Contacts"
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition"
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Missing Year
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="font-medium text-slate-600">
              📅 {contact.formattedDate}
              {contact.hasYear ? ` (${contact.birthDate})` : ''}
            </span>

            {contact.turningAge && (
              <span>• Turning <strong className="text-slate-700">{contact.turningAge}</strong></span>
            )}

            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition"
              >
                <Mail className="w-3 h-3" />
                <span className="truncate max-w-[180px]">{contact.email}</span>
              </a>
            )}
          </div>

          {/* Note preview if any */}
          {contact.note && (
            <div
              onClick={() => onOpenNote(contact)}
              className="cursor-pointer group flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/70 hover:border-indigo-200 rounded-lg px-2.5 py-1.5 mt-2 transition max-w-xl"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0 mt-0.5" />
              <p className="line-clamp-1 italic text-slate-600 group-hover:text-indigo-900">
                {contact.note}
              </p>
            </div>
          )}
        </div>

        {/* Right: Actions (Gift Toggles & Note Button) */}
        <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-wrap justify-between sm:justify-end">
          
          {/* Toggle: Gift Needed */}
          <button
            onClick={() => onToggleGift(contact, !contact.gift)}
            disabled={isUpdating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              contact.gift
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title={contact.gift ? 'Gift is marked as needed' : 'Mark that a gift is needed'}
          >
            <Gift className={`w-3.5 h-3.5 ${contact.gift ? 'text-rose-500' : 'text-slate-400'}`} />
            <span>{contact.gift ? 'Gift Needed' : 'No Gift'}</span>
          </button>

          {/* Toggle: Gift Done (only visible/active if gift is needed) */}
          {contact.gift && (
            <button
              onClick={() => onToggleGiftDone(contact, !contact.giftDone)}
              disabled={isUpdating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                contact.giftDone
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title={contact.giftDone ? 'Gift already bought' : 'Mark gift as bought'}
            >
              {contact.giftDone ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Purchased</span>
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pending</span>
                </>
              )}
            </button>
          )}

          {/* Note Modal Trigger Button */}
          <button
            onClick={() => onOpenNote(contact)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs hover:border-slate-300 transition"
            title="Open markdown notes & gift ideas"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Notes</span>
            {contact.note && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5"></span>
            )}
          </button>

        </div>

      </div>
    </div>
  );
};

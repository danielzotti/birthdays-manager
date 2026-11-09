import React from 'react';
import { BirthdayContact } from '../types';
import { Gift, Calendar, Sparkles, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface HighlightsProps {
  contacts: BirthdayContact[];
  onToggleGiftDone: (contact: BirthdayContact, nextValue: boolean) => void;
  onOpenNote: (contact: BirthdayContact) => void;
  pendingRowUpdates: Set<number>;
}

export const Highlights: React.FC<HighlightsProps> = ({
  contacts,
  onToggleGiftDone,
  onOpenNote,
  pendingRowUpdates
}) => {
  // 1. Birthdays today
  const todayBirthdays = contacts.filter((c) => c.daysUntil === 0);

  // 2. Urgent gifts to buy: gift is needed, gift not done yet, birthday in next 14 days (0 to 14)
  const urgentGifts = contacts
    .filter((c) => c.gift && !c.giftDone && c.daysUntil >= 0 && c.daysUntil <= 14)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // 3. Upcoming birthdays in next 10 days (1 to 10)
  const upcomingNext10Days = contacts
    .filter((c) => c.daysUntil >= 1 && c.daysUntil <= 10)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      
      {/* 1. TODAY'S BIRTHDAYS */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between lg:col-span-2 xl:col-span-1">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-200">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="font-bold text-slate-800 text-base">Birthdays Today</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
              {todayBirthdays.length}
            </span>
          </div>

          {todayBirthdays.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-sm">
              <p>No birthdays today.</p>
              <p className="text-xs text-slate-400 mt-1">Enjoy a quiet celebration day!</p>
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              {todayBirthdays.map((contact) => {
                const isUpdating = pendingRowUpdates.has(contact.rowIndex);
                return (
                  <div
                    key={contact.id || contact.rowIndex}
                    className="bg-white/90 backdrop-blur-sm border border-amber-200/90 rounded-xl p-3.5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{contact.fullName}</span>
                          {contact.isMilestone && (
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm flex items-center gap-1">
                              🌟 {contact.turningAge} Years!
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {contact.turningAge ? `Turning ${contact.turningAge} today` : 'Birthday today'}
                        </p>
                      </div>

                      <button
                        onClick={() => onOpenNote(contact)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition"
                      >
                        Notes
                      </button>
                    </div>

                    {/* Gift status pill if gift enabled */}
                    {contact.gift && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5 text-rose-500" />
                          Gift Status:
                        </span>
                        <button
                          onClick={() => onToggleGiftDone(contact, !contact.giftDone)}
                          disabled={isUpdating}
                          className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition ${
                            contact.giftDone
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {contact.giftDone ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Purchased
                            </>
                          ) : (
                            <>
                              <Circle className="w-3 h-3 text-rose-500" />
                              Pending!
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. URGENT GIFTS (Next 14 Days) */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-500 text-white shadow-md shadow-rose-200">
                <Gift className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-bold text-slate-800 text-base">Gifts to Buy</h2>
                <p className="text-[11px] text-rose-600 font-medium">Urgent — Next 14 days</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full border border-rose-200">
              {urgentGifts.length}
            </span>
          </div>

          {urgentGifts.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-sm">
              <p>All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No pending gifts due in the next 14 days.</p>
            </div>
          ) : (
            <div className="space-y-2.5 mt-3 max-h-[300px] overflow-y-auto pr-1">
              {urgentGifts.map((contact) => {
                const isUpdating = pendingRowUpdates.has(contact.rowIndex);
                const dayLabel = contact.daysUntil === 0 ? 'Today!' : `in ${contact.daysUntil}d`;
                return (
                  <div
                    key={contact.id || contact.rowIndex}
                    className="bg-white/95 border border-rose-200/90 rounded-xl p-3 shadow-sm hover:shadow transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-slate-900 text-sm truncate">
                            {contact.fullName}
                          </span>
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            {dayLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onToggleGiftDone(contact, true)}
                          disabled={isUpdating}
                          title="Mark gift as bought"
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Bought</span>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        {contact.note && (
                          <p className="text-xs text-slate-500 truncate mt-0.5 italic truncate">
                            💡 {contact.note}...
                          </p>
                        )}
                      </div>
                      <button
                          onClick={() => onOpenNote(contact)}
                          title="Open note / gift ideas"
                          className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded-lg transition"
                        >
                          Notes
                        </button>
                      </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. NEXT 10 DAYS */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-bold text-slate-800 text-base">Next 10 Days</h2>
                <p className="text-[11px] text-indigo-600 font-medium">Upcoming celebrations</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
              {upcomingNext10Days.length}
            </span>
          </div>

          {upcomingNext10Days.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-sm">
              <p>No birthdays in the next 10 days.</p>
              <p className="text-xs text-slate-400 mt-1">Check the full list below for later dates.</p>
            </div>
          ) : (
            <div className="space-y-2 mt-3 max-h-[300px] overflow-y-auto pr-1">
              {upcomingNext10Days.map((contact) => (
                <div
                  key={contact.id || contact.rowIndex}
                  className="bg-white/95 border border-indigo-100 rounded-xl p-2.5 shadow-sm hover:border-indigo-300 transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-800 text-sm truncate">
                        {contact.fullName}
                      </span>
                      {contact.isMilestone && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-amber-950">
                          🌟 {contact.turningAge}
                        </span>
                      )}
                      {!contact.hasYear && (
                        <span
                          title="Birth year missing in Google Contacts"
                          className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5"
                        >
                          <AlertCircle className="w-2.5 h-2.5" />
                          No Year
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {contact.formattedDate} {contact.turningAge ? `• Turning ${contact.turningAge}` : ''}
                    </p>
                  </div>

                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                    in {contact.daysUntil}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

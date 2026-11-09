import React from 'react';
import { BirthdayContact, FilterType } from '../types';
import { ContactCard } from './ContactCard';
import { Search, Filter, Gift, Sparkles, AlertTriangle, Users } from 'lucide-react';

interface ContactListProps {
  contacts: BirthdayContact[];
  filteredContacts: BirthdayContact[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onToggleGift: (contact: BirthdayContact, nextValue: boolean) => void;
  onToggleGiftDone: (contact: BirthdayContact, nextValue: boolean) => void;
  onOpenNote: (contact: BirthdayContact) => void;
  pendingRowUpdates: Set<number>;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  filteredContacts,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onToggleGift,
  onToggleGiftDone,
  onOpenNote,
  pendingRowUpdates
}) => {
  // Counts for filter pills
  const totalCount = contacts.length;
  const giftsNeededCount = contacts.filter((c) => c.gift && !c.giftDone).length;
  const milestoneCount = contacts.filter((c) => c.isMilestone).length;
  const missingYearCount = contacts.filter((c) => !c.hasYear).length;

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, notes, or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200/60 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            )}
          </div>

          {/* Result summary */}
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-800">{filteredContacts.length}</span> of {totalCount} contacts
          </div>

        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0 mr-1 hidden sm:flex">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>

          {/* All */}
          <button
            onClick={() => onFilterChange('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition shrink-0 ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeFilter === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {totalCount}
            </span>
          </button>

          {/* Gifts Needed */}
          <button
            onClick={() => onFilterChange('gift_needed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition shrink-0 ${
              activeFilter === 'gift_needed'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Gifts to Buy</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeFilter === 'gift_needed' ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {giftsNeededCount}
            </span>
          </button>

          {/* Milestones */}
          <button
            onClick={() => onFilterChange('milestone')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition shrink-0 ${
              activeFilter === 'milestone'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Milestones This Year</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeFilter === 'milestone' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {milestoneCount}
            </span>
          </button>

          {/* Missing Birth Year */}
          <button
            onClick={() => onFilterChange('missing_year')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition shrink-0 ${
              activeFilter === 'missing_year'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Missing Birth Year</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeFilter === 'missing_year' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {missingYearCount}
            </span>
          </button>

        </div>

      </div>

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-800 text-base mb-1">No contacts found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No contacts matched "${searchQuery}". Try a different keyword.`
              : 'There are no contacts matching the selected filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id || contact.rowIndex}
              contact={contact}
              onToggleGift={onToggleGift}
              onToggleGiftDone={onToggleGiftDone}
              onOpenNote={onOpenNote}
              isUpdating={pendingRowUpdates.has(contact.rowIndex)}
            />
          ))}
        </div>
      )}

    </div>
  );
};

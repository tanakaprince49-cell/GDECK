import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  User as UserIcon,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { ContactPerson } from '../types/workspace';
import { listContacts, createContact } from '../services/workspace';
import { Plus, X, UserPlus, CheckCircle2 } from 'lucide-react';
import { GoogleContactsIcon } from './GoogleIcons';

interface ContactsViewProps {
  token: string;
  onComposeEmail?: (email: string) => void;
  onBackToOverview?: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  token,
  onComposeEmail,
  onBackToOverview,
}) => {
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Contact modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [givenName, setGivenName] = useState<string>('');
  const [familyName, setFamilyName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [isCreatingContact, setIsCreatingContact] = useState<boolean>(false);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!givenName.trim()) return;
    setIsCreatingContact(true);
    setError(null);
    try {
      const newContact = await createContact(token, {
        givenName: givenName.trim(),
        familyName: familyName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
      });
      setSuccessMsg(`Contact "${givenName} ${familyName}".trim() created successfully!`);
      setShowAddModal(false);
      setGivenName('');
      setFamilyName('');
      setContactEmail('');
      setContactPhone('');
      loadContacts();
    } catch (err: any) {
      setError(err.message || 'Failed to create contact');
    } finally {
      setIsCreatingContact(false);
    }
  };

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listContacts(token, 50);
      setContacts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [token]);

  const filteredContacts = contacts.filter((c) => {
    const name = c.names?.[0]?.displayName || '';
    const email = c.emailAddresses?.[0]?.value || '';
    const phone = c.phoneNumbers?.[0]?.value || '';
    const q = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q)
    );
  });

  return (
    <div id="contacts-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="contacts-back-to-overview-btn"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-sky-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-sky-500/10 border border-sky-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleContactsIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Contacts</h2>
            <p className="text-sm text-slate-500">Address book, team directory, and quick email shortcuts</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
          {searchQuery && (
            <button
              id="contacts-back-to-all-btn"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-sky-700 hover:text-sky-900 bg-sky-50/80 hover:bg-sky-100/80 rounded-xl font-semibold transition-colors cursor-pointer border border-sky-200/60"
              title="Clear search and show all contacts"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all</span>
            </button>
          )}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="contacts-search-input"
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3.5 py-2 text-sm bg-white/70 backdrop-blur-md border border-white/90 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 w-48 sm:w-60 shadow-2xs"
            />
          </div>
          <a
            href="https://contacts.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-600 hover:text-sky-600 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Open Google Contacts web"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={loadContacts}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Refresh contacts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50/80 backdrop-blur-md border border-red-200/80 text-red-700 rounded-2xl text-sm flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Contacts Cards Grid */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] p-6">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-sky-500" />
            <p className="text-sm font-medium">Loading your Google Contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 stroke-1 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No contacts found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? 'Try a different search query' : 'Your Google Contacts list is empty'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => {
              const displayName = contact.names?.[0]?.displayName || 'Unnamed Contact';
              const email = contact.emailAddresses?.[0]?.value;
              const phone = contact.phoneNumbers?.[0]?.value;
              const photoUrl = contact.photos?.[0]?.url;

              return (
                <div
                  key={contact.resourceName}
                  className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col justify-between bg-slate-50/30"
                >
                  <div className="flex items-start gap-3">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                        {displayName[0] || <UserIcon className="w-5 h-5" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {displayName}
                      </h4>
                      {email && (
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{email}</span>
                        </p>
                      )}
                      {phone && (
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {email && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => {
                          if (onComposeEmail) {
                            onComposeEmail(email);
                          } else {
                            window.location.href = `mailto:${email}`;
                          }
                        }}
                        className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5" /> Email
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateContact}
            className="w-full max-w-sm bg-white rounded-3xl shadow-[0_4px_24px_rgba(60,64,67,0.25)] border border-[#dadce0] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#f1f3f4] pb-3">
              <h3 className="text-sm font-bold text-[#1f1f1f] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#1a73e8]" /> Add New Contact
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#5f6368] hover:text-[#1f1f1f] p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">First Name *</label>
                <input
                  type="text"
                  placeholder="First name"
                  value={givenName}
                  onChange={(e) => setGivenName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2 text-xs bg-[#f0f4f9] border border-transparent focus:border-[#1a73e8] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#f0f4f9] border border-transparent focus:border-[#1a73e8] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#f0f4f9] border border-transparent focus:border-[#1a73e8] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#f0f4f9] border border-transparent focus:border-[#1a73e8] rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f1f3f4]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5f6368] hover:bg-slate-100 rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!givenName.trim() || isCreatingContact}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full disabled:opacity-50"
              >
                {isCreatingContact ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

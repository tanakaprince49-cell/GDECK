import React from 'react';
import { X, Bell, Volume2, VolumeX, Smartphone, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, requestDesktopPermission } = useNotifications();
  const [permissionState, setPermissionState] = React.useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  if (!isOpen) return null;

  const handleToggleDesktopPush = async () => {
    if (!settings.enableDesktopPush) {
      const granted = await requestDesktopPermission();
      setPermissionState(granted ? 'granted' : 'denied');
    } else {
      updateSettings({ enableDesktopPush: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#dadce0] shadow-2xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f4]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#e8f0fe] text-[#1a73e8]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1f1f1f]">Notification Preferences</h3>
              <p className="text-xs text-[#5f6368]">Control alerts for Workspace events</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5f6368] hover:text-[#1f1f1f] rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Desktop Push Permission Box */}
          <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-[#1a73e8]" />
                <div>
                  <h4 className="text-xs font-bold text-[#1f1f1f]">Browser Desktop Push Alerts</h4>
                  <p className="text-[11px] text-[#5f6368]">
                    Native OS popups while G-Deck is open (needed for Pro renewal push alerts)
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleDesktopPush}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  settings.enableDesktopPush ? 'bg-[#1a73e8]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableDesktopPush ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {permissionState === 'denied' && (
              <p className="text-[11px] text-[#d93025] flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Browser blocked push permissions. Enable in URL bar settings.
              </p>
            )}
          </div>

          {/* Sound Notification Toggle */}
          <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {settings.enableSound ? (
                <Volume2 className="w-5 h-5 text-[#188038]" />
              ) : (
                <VolumeX className="w-5 h-5 text-[#5f6368]" />
              )}
              <div>
                <h4 className="text-xs font-bold text-[#1f1f1f]">Audio Chime</h4>
                <p className="text-[11px] text-[#5f6368]">Play pleasant tone on new incoming alert</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ enableSound: !settings.enableSound })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                settings.enableSound ? 'bg-[#188038]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableSound ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Alert Categories Toggles */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">
              Alert Categories
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <label className="p-3 rounded-xl border border-[#dadce0] bg-white flex items-center justify-between cursor-pointer hover:bg-[#f0f4f9] transition-colors">
                <span className="text-xs font-semibold text-[#1f1f1f]">Gmail Emails</span>
                <input
                  type="checkbox"
                  checked={settings.notifyGmail}
                  onChange={(e) => updateSettings({ notifyGmail: e.target.checked })}
                  className="rounded border-slate-300 text-[#1a73e8] focus:ring-[#1a73e8]"
                />
              </label>

              <label className="p-3 rounded-xl border border-[#dadce0] bg-white flex items-center justify-between cursor-pointer hover:bg-[#f0f4f9] transition-colors">
                <span className="text-xs font-semibold text-[#1f1f1f]">Calendar Events</span>
                <input
                  type="checkbox"
                  checked={settings.notifyCalendar}
                  onChange={(e) => updateSettings({ notifyCalendar: e.target.checked })}
                  className="rounded border-slate-300 text-[#1a73e8] focus:ring-[#1a73e8]"
                />
              </label>

              <label className="p-3 rounded-xl border border-[#dadce0] bg-white flex items-center justify-between cursor-pointer hover:bg-[#f0f4f9] transition-colors">
                <span className="text-xs font-semibold text-[#1f1f1f]">Drive Shares</span>
                <input
                  type="checkbox"
                  checked={settings.notifyDrive}
                  onChange={(e) => updateSettings({ notifyDrive: e.target.checked })}
                  className="rounded border-slate-300 text-[#1a73e8] focus:ring-[#1a73e8]"
                />
              </label>

              <label className="p-3 rounded-xl border border-[#dadce0] bg-white flex items-center justify-between cursor-pointer hover:bg-[#f0f4f9] transition-colors">
                <span className="text-xs font-semibold text-[#1f1f1f]">Tasks Deadlines</span>
                <input
                  type="checkbox"
                  checked={settings.notifyTasks}
                  onChange={(e) => updateSettings({ notifyTasks: e.target.checked })}
                  className="rounded border-slate-300 text-[#1a73e8] focus:ring-[#1a73e8]"
                />
              </label>

              <label className="p-3 rounded-xl border border-[#dadce0] bg-white flex items-center justify-between cursor-pointer hover:bg-[#f0f4f9] transition-colors col-span-2">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-semibold text-[#1f1f1f] block">Pro renewal reminders</span>
                  <span className="text-[10px] text-[#5f6368] block leading-snug">
                    Daily alert for the last 3 days before your Pro period ends
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyBilling !== false}
                  onChange={(e) => updateSettings({ notifyBilling: e.target.checked })}
                  className="rounded border-slate-300 text-[#7e22ce] focus:ring-[#7e22ce] shrink-0"
                />
              </label>
            </div>
          </div>

          {/* Polling Frequency */}
          <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#1a73e8]" />
              <h4 className="text-xs font-bold text-[#1f1f1f]">Auto-Sync Refresh Interval</h4>
            </div>
            <select
              value={settings.pollingIntervalSeconds}
              onChange={(e) => updateSettings({ pollingIntervalSeconds: Number(e.target.value) })}
              className="w-full text-xs p-2.5 rounded-xl border border-[#dadce0] bg-white text-[#1f1f1f] focus:outline-none focus:border-[#1a73e8]"
            >
              <option value={15}>Every 15 seconds (High Frequency)</option>
              <option value={30}>Every 30 seconds (Recommended)</option>
              <option value={60}>Every 1 minute</option>
              <option value={300}>Every 5 minutes</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full shadow-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

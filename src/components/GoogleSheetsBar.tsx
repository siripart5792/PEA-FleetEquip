import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Settings,
  X,
  UploadCloud,
  DownloadCloud,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Code2 } from 'lucide-react';
import { UserRole } from '../types/fleet';

interface GoogleSheetsBarProps {
  user: User | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  webAppUrl: string | null;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  role?: UserRole;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
  onManualSync: () => void;
  onPushToSheets: () => void;
  onSetCustomSheetId: (id: string) => void;
  onOpenAppsScriptModal: () => void;
}

export const GoogleSheetsBar: React.FC<GoogleSheetsBarProps> = ({
  user,
  spreadsheetId,
  spreadsheetUrl,
  webAppUrl,
  isSyncing,
  lastSyncTime,
  syncError,
  role = 'user',
  onLoginGoogle,
  onLogoutGoogle,
  onManualSync,
  onPushToSheets,
  onSetCustomSheetId,
  onOpenAppsScriptModal,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [inputError, setInputError] = useState('');

  const handleSaveCustomId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) {
      setInputError('กรุณากรอก Google Sheet ID หรือ ลิงก์ URL');
      return;
    }
    onSetCustomSheetId(customInput.trim());
    setCustomInput('');
    setInputError('');
    setModalOpen(false);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-purple-950 text-white text-xs px-4 sm:px-6 py-2 border-b border-emerald-800/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Left: Connection State */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Google Sheets Database:</span>
            </div>

            {user ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium text-[11px] border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Google Sheets ({user.displayName || user.email})</span>
                </span>

                {lastSyncTime && (
                  <span className="text-slate-400 text-[11px] font-mono">
                    ซิงค์ล่าสุด {lastSyncTime}
                  </span>
                )}

                {syncError && (
                  <span className="text-rose-300 text-[11px] inline-flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    <span>{syncError}</span>
                  </span>
                )}
              </div>
            ) : webAppUrl ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium text-[11px] border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>เชื่อมต่อ Web App API แล้ว</span>
                </span>

                {lastSyncTime && (
                  <span className="text-slate-400 text-[11px] font-mono">
                    ซิงค์ล่าสุด {lastSyncTime}
                  </span>
                )}

                {syncError && (
                  <span className="text-rose-300 text-[11px] inline-flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    <span>{syncError}</span>
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-300 text-[11px]">
                เชื่อมโยงกับ Google Sheets เพื่อบันทึกข้อมูลรถ อุปกรณ์ สาขา กฟภ. และประวัติตรวจแบบเรียลไทม์
              </span>
            )}
          </div>

          {/* Right: Actions (Visible only for Administrator) */}
          {role === 'admin' && (
            <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
              {/* Apps Script Code / Web App Config Button */}
              <button
                onClick={onOpenAppsScriptModal}
                className="px-2.5 py-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 hover:text-white rounded-lg transition-all flex items-center gap-1.5 border border-purple-700/60 cursor-pointer font-medium text-[11px]"
                title="ดูโค้ด API Google Apps Script และตั้งค่า Web App URL"
              >
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                <span>โค้ด API &amp; Web App</span>
              </button>

              {/* Sync Now button when either user or webAppUrl is available */}
              {(user || webAppUrl) && (
                <button
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-600 active:scale-95 text-white rounded-lg transition-all flex items-center gap-1.5 font-medium cursor-pointer disabled:opacity-50 text-[11px] shadow-xs"
                  title="ดึงข้อมูลล่าสุดจาก Google Sheets ตอนนี้"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ทันที'}</span>
                </button>
              )}

              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-300 rounded-lg transition-all flex items-center gap-1 border border-slate-700 cursor-pointer text-[11px]"
                  title="เปิดสเปรดชีตนี้ใน Google Sheets บนแท็บใหม่"
                >
                  <span>เปิดสเปรดชีต</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {(user || webAppUrl) && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="การตั้งค่าการเชื่อมต่อ Google Sheets"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}

              {user ? (
                <button
                  onClick={onLogoutGoogle}
                  className="p-1 text-slate-300 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="ออกจากระบบ Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={onLoginGoogle}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-medium transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 text-[11px] border border-slate-700"
                  title="เข้าสู่ระบบด้วยบัญชี Google เพื่อควบคุมสเปรดชีตโดยตรง"
                >
                  {/* Official Google 'G' icon */}
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>OAuth Login</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  ตั้งค่า Google Sheets (PEA FleetEquip)
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Account info or Web App status */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">การเชื่อมต่อ:</span>
                  <span className="font-semibold text-slate-800">
                    {user
                      ? `บัญชี Google (${user.displayName || user.email})`
                      : webAppUrl
                      ? 'Google Apps Script Web App API (Active)'
                      : 'ยังไม่ได้เชื่อมต่อ'}
                  </span>
                </div>
                {user ? (
                  <button
                    onClick={() => {
                      onLogoutGoogle();
                      setModalOpen(false);
                    }}
                    className="px-2.5 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 font-medium cursor-pointer"
                  >
                    ออกจากระบบ
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      onOpenAppsScriptModal();
                    }}
                    className="px-2.5 py-1 text-[11px] text-purple-700 hover:bg-purple-50 rounded-lg border border-purple-200 font-medium cursor-pointer"
                  >
                    ตั้งค่า Web App
                  </button>
                )}
              </div>

              {/* Spreadsheet ID / Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Sheet ID ปัจจุบัน:
                </label>
                <div className="p-2.5 bg-slate-100 rounded-lg font-mono text-[11px] text-slate-700 break-all select-all border border-slate-200">
                  {spreadsheetId || 'กำลังค้นหา / สร้างสเปรดชีตอัตโนมัติ'}
                </div>
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium mt-1 text-xs"
                  >
                    <span>คลิกเพื่อเปิดใน Google Sheets ↗</span>
                  </a>
                )}
              </div>

              {/* Custom sheet ID input */}
              <form onSubmit={handleSaveCustomId} className="pt-2 border-t border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  ต้องการเปลี่ยนไปใช้ Google Sheet อื่น:
                </label>
                <p className="text-[11px] text-slate-500">
                  วางลิงก์ URL หรือ Spreadsheet ID ของคุณ (ระบบจะสร้าง/เชื่อมต่อ 5 แผ่นงาน Admin, Branches, Equipment, Vehicles, Inspections)
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-medium text-xs hover:bg-slate-800 cursor-pointer"
                  >
                    บันทึก
                  </button>
                </div>
                {inputError && <p className="text-rose-600 text-[11px]">{inputError}</p>}
              </form>

              {/* Push local data up to Sheets */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สำรองข้อมูลทั้งหมดขึ้น Google Sheets:
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  ส่งข้อมูลรถยนต์ อุปกรณ์ประจำรถ สาขาการไฟฟ้า และประวัติการตรวจทั้งหมดที่อยู่ในเครื่องนี้ขึ้นไปยัง Google Sheets
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onPushToSheets();
                    setModalOpen(false);
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>ส่งข้อมูลปัจจุบันขึ้น Google Sheets (Force Push)</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

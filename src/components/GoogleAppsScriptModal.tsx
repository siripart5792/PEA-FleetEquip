import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  ExternalLink,
  X,
  FileSpreadsheet,
  HelpCircle,
  Sparkles,
  Link,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/googleAppsScriptCode';

interface GoogleAppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string | null;
  onSaveWebAppUrl: (url: string) => void;
}

export const GoogleAppsScriptModal: React.FC<GoogleAppsScriptModalProps> = ({
  isOpen,
  onClose,
  webAppUrl,
  onSaveWebAppUrl,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState(webAppUrl || '');
  const [showFullCode, setShowFullCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = GOOGLE_APPS_SCRIPT_CODE;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleDownloadScript = () => {
    const blob = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Code.gs';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWebAppUrl(urlInput.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-purple-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-700 flex items-center justify-center text-white shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>โค้ด API สำหรับใส่ใน Google Sheets (Google Apps Script)</span>
                <span className="text-[11px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Apps Script Web App
                </span>
              </h3>
              <p className="text-xs text-slate-600">
                นำโค้ดนี้ไปวางใน Google Sheets เพื่อเปิดใช้งาน API ดึงและบันทึกข้อมูลรถยนต์ อุปกรณ์ และประวัติตรวจเช็ค
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs">
          {/* Quick Action Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h4 className="font-bold text-sm flex items-center gap-1.5 text-purple-200">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>คัดลอกโค้ดสคริปต์ไปติดตั้งใน Google Sheets</span>
              </h4>
              <p className="text-purple-100 text-xs mt-0.5">
                มีฟังก์ชันครบ: ดึงข้อมูลอัตโนมัติ (GET), บันทึกตรวจเช็ค/รถ (POST), และเมนู &quot;⚡ PEA FleetEquip&quot; ในสเปรดชีต
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyCode}
                className={`px-3.5 py-2 font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white hover:bg-purple-50 text-purple-900 active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>คัดลอกโค้ดแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-purple-700" />
                    <span>คัดลอกโค้ดทั้งหมด (Copy)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadScript}
                className="px-3 py-2 bg-purple-800/80 hover:bg-purple-800 text-white rounded-xl transition-colors flex items-center gap-1 cursor-pointer border border-purple-700 text-xs"
                title="ดาวน์โหลดไฟล์ Code.gs"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">โหลดไฟล์ .gs</span>
              </button>
            </div>
          </div>

          {/* 5-Step Visual Setup Instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 text-purple-900">
              <FileSpreadsheet className="w-4 h-4 text-purple-700" />
              <span>วิธีติดตั้งสคริปต์ลงใน Google Sheets (ทำเพียงครั้งเดียว):</span>
            </h4>

            <ol className="space-y-2.5 list-decimal list-inside text-slate-700">
              <li className="p-2.5 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900">เปิด Google Sheets:</strong> ไปที่แท็บเมนูด้านบน คลิก{' '}
                <span className="font-semibold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  ส่วนขยาย (Extensions)
                </span>{' '}
                ➔{' '}
                <span className="font-semibold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  Apps Script
                </span>
              </li>

              <li className="p-2.5 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900">วางโค้ดสคริปต์:</strong> ในหน้าจอ Apps Script จะมีไฟล์{' '}
                <code className="text-purple-700 font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">Code.gs</code>{' '}
                ให้ลบโค้ดเดิมออกทั้งหมด แล้วคลิกปุ่ม <strong>&quot;คัดลอกโค้ดทั้งหมด&quot;</strong> จากด้านบนมาวางลงไป จากนั้นกด{' '}
                <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border">
                  Ctrl + S
                </span>{' '}
                (หรือคลิกไอคอนบันทึก 💾)
              </li>

              <li className="p-2.5 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900">ทำให้ใช้งานได้ (Deploy เป็น Web App):</strong> คลิกปุ่มสีน้ำเงินด้านขวาบน{' '}
                <span className="font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  การทำให้ใช้งานได้ (Deploy)
                </span>{' '}
                ➔{' '}
                <span className="font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  การทำให้ใช้งานได้รายการใหม่ (New deployment)
                </span>
              </li>

              <li className="p-2.5 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900">ตั้งค่าสิทธิ์การเข้าถึง (สำคัญมาก):</strong>
                <ul className="list-disc list-inside mt-1.5 pl-4 space-y-1 text-slate-600 text-[11px]">
                  <li>คลิกไอคอนรูปฟันเฟือง ⚙️ ด้านซ้าย เลือก <strong>เว็บแอป (Web app)</strong></li>
                  <li>ดำเนินการในฐานะ (Execute as): <strong>ฉัน (อีเมลของคุณ)</strong></li>
                  <li>
                    ผู้มีสิทธิ์เข้าถึง (Who has access):{' '}
                    <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                      ทุกคน (Anyone)
                    </strong>{' '}
                    <em>(เพื่อให้ระบบสามารถซิงค์ข้อมูลกับแผ่นงานได้ทันทีโดยไม่ต้องถามรหัสผ่านทุกครั้ง)</em>
                  </li>
                </ul>
              </li>

              <li className="p-2.5 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900">คัดลอก URL เว็บแอป:</strong> คลิกปุ่ม{' '}
                <strong>ทำให้ใช้งานได้ (Deploy)</strong> ➔ กดอนุมัติสิทธิ์ (Authorize access) แล้วคัดลอก{' '}
                <strong>URL ของเว็บแอป (Web App URL)</strong> ที่ลงท้ายด้วย <code className="font-mono text-purple-700">/exec</code> นำมาวางในช่องด้านล่างนี้
              </li>
            </ol>
          </div>

          {/* Web App URL Linker Box */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-emerald-700" />
              <h4 className="font-bold text-sm text-emerald-950">
                เชื่อมต่อผ่าน Web App URL (ทางเลือกสำหรับใช้งานร่วมกันทั้งสาขา):
              </h4>
            </div>
            <p className="text-[11px] text-emerald-800">
              หากนำ URL ของเว็บแอปที่ได้จาก Google Apps Script มาวางที่นี่ ระบบจะสามารถอ่านและบันทึกข้อมูลเข้า Google Sheets ของคุณได้โดยตรง
            </p>

            <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 text-xs px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              >
                บันทึก Web App URL
              </button>
            </form>

            {saveSuccess && (
              <p className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>บันทึก Web App URL เรียบร้อยแล้ว! ระบบจะใช้ API นี้ในการรับส่งข้อมูล</span>
              </p>
            )}
          </div>

          {/* Code Viewer Accordion */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-slate-200">
            <div
              onClick={() => setShowFullCode(!showFullCode)}
              className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-750 select-none"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span className="font-mono font-semibold text-xs text-white">Code.gs (Apps Script Source Code)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{showFullCode ? 'ย่อโค้ด' : 'แสดงโค้ดทั้งหมด (คลิกเพื่อดู)'}</span>
                {showFullCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            <div className={`p-4 font-mono text-[11px] overflow-x-auto ${showFullCode ? 'max-h-[500px]' : 'max-h-48'}`}>
              <pre className="text-emerald-400 leading-relaxed">{GOOGLE_APPS_SCRIPT_CODE}</pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>สคริปต์นี้สร้างขึ้นเฉพาะสำหรับโครงสร้าง 5 แผ่นงานของ PEA FleetEquip</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

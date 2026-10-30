import React, { useState } from 'react';
import { Copy, Check, MessageSquare, ExternalLink, Settings2, Car, AlertCircle, X, Building2 } from 'lucide-react';
import { Vehicle, InspectionRecord, PeaBranch } from '../types/fleet';
import { generateLinePendingAlertMessage, createLineShareUrl, LineMessageOptions } from '../utils/lineMessage';
import { getTodayStatusCounts } from '../utils/storage';
import { MultiBranchSelect } from './MultiBranchSelect';

interface LineReminderModalProps {
  vehicles: Vehicle[];
  records: InspectionRecord[];
  branches: PeaBranch[];
  isOpen: boolean;
  onClose: () => void;
  onCopySuccess: () => void;
}

export const LineReminderModal: React.FC<LineReminderModalProps> = ({
  vehicles,
  records,
  branches,
  isOpen,
  onClose,
  onCopySuccess,
}) => {
  if (!isOpen) return null;

  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [options, setOptions] = useState<LineMessageOptions>({
    includeBranch: true,
    includeDepartment: true,
    includeAppUrl: true,
    customNote: 'กรุณาตรวจเช็คอุปกรณ์ก่อนเริ่มนำรถออกปฏิบัติงานทุกครั้ง',
  });

  const [copied, setCopied] = useState(false);

  const selectedBranches = branches.filter((b) => selectedBranchIds.includes(b.id));
  const branchNames = selectedBranches.map((b) => b.name);

  const { totalActive, inspectedCount, pendingCount, pendingVehicles } = getTodayStatusCounts(
    vehicles,
    records,
    selectedBranchIds
  );

  const messageText = generateLinePendingAlertMessage(vehicles, records, {
    ...options,
    branchFilter: selectedBranchIds,
    branchNames: branchNames.length > 0 ? branchNames : undefined,
  });

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(messageText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = messageText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      onCopySuccess();
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const lineShareUrl = createLineShareUrl(messageText);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                แจ้งเตือนรถที่ยังไม่ได้ตรวจเช็คผ่าน LINE (PEA)
              </h3>
              <p className="text-xs text-slate-600">
                สร้างข้อความสรุปรถที่ค้างตรวจประจำวันเพื่อส่งเข้ากลุ่ม LINE การไฟฟ้า
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Branch Target Selector */}
          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5">
            <label className="block text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-700" />
              <span>เลือกกลุ่มเป้าหมายสาขาการไฟฟ้า (เลือกได้หลายสาขา):</span>
            </label>
            <MultiBranchSelect
              branches={branches}
              selectedBranchIds={selectedBranchIds}
              onChange={setSelectedBranchIds}
            />
          </div>

          {/* Status Metric summary */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">รถพร้อมใช้งาน</span>
              <span className="text-lg font-bold text-slate-800 font-mono tabular-nums">{totalActive}</span>
              <span className="text-[10px] text-slate-400 ml-1">คัน</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-emerald-600 block">ตรวจแล้ววันนี้</span>
              <span className="text-lg font-bold text-emerald-700 font-mono tabular-nums">{inspectedCount}</span>
              <span className="text-[10px] text-emerald-600 ml-1">คัน</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-rose-600 block">ยังไม่ได้ตรวจ</span>
              <span className="text-lg font-bold text-rose-600 font-mono tabular-nums">{pendingCount}</span>
              <span className="text-[10px] text-rose-500 ml-1">คัน</span>
            </div>
          </div>

          {/* Pending Vehicle Pills/Summary */}
          {pendingCount > 0 ? (
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>รายชื่อรถ {pendingCount} คันที่ยังไม่ได้รับการตรวจ:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pendingVehicles.map((v) => (
                  <span
                    key={v.id}
                    className="text-xs font-mono font-medium bg-white text-rose-900 border border-rose-200 px-2 py-1 rounded-md shadow-2xs flex items-center gap-1.5"
                  >
                    <Car className="w-3.5 h-3.5 text-rose-500" />
                    <span>{v.plateNumber}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-sans">{v.custodian}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-sm font-bold text-emerald-800">
                🎉 วันนี้รถทุกคันได้รับการตรวจเช็คอุปกรณ์ครบถ้วนแล้ว 100%!
              </span>
              <p className="text-xs text-emerald-600 mt-1">
                คุณยังสามารถคัดลอกข้อความสรุปความพร้อมใช้งานส่งรายงานในกลุ่ม LINE ได้ตามปกติ
              </p>
            </div>
          )}

          {/* Message Settings */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span>ปรับแต่งรูปแบบข้อความแจ้งเตือน:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={options.includeBranch}
                  onChange={(e) => setOptions({ ...options, includeBranch: e.target.checked })}
                  className="rounded text-purple-700 focus:ring-purple-500"
                />
                <span className="text-slate-700">แสดงสาขา กฟภ.</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={options.includeDepartment}
                  onChange={(e) => setOptions({ ...options, includeDepartment: e.target.checked })}
                  className="rounded text-purple-700 focus:ring-purple-500"
                />
                <span className="text-slate-700">แสดงแผนก/กอง</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={options.includeAppUrl}
                  onChange={(e) => setOptions({ ...options, includeAppUrl: e.target.checked })}
                  className="rounded text-purple-700 focus:ring-purple-500"
                />
                <span className="text-slate-700">แนบลิงก์ระบบ</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                ข้อความเตือน / หมายเหตุท้ายประกาศ:
              </label>
              <input
                type="text"
                value={options.customNote || ''}
                onChange={(e) => setOptions({ ...options, customNote: e.target.value })}
                placeholder="เช่น กรุณาตรวจก่อน 08:30 น. ก่อนนำรถออกปฏิบัติงาน"
                className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* LINE Message Preview Bubble */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">
                ตัวอย่างข้อความที่จะส่ง (LINE Chat Preview):
              </span>
              <span className="text-[11px] text-slate-400">
                {messageText.length} ตัวอักษร
              </span>
            </div>
            <div className="relative bg-[#06C755]/10 border border-[#06C755]/30 rounded-xl p-4">
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  LINE Format
                </span>
              </div>
              <pre className="font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto pr-2 select-all">
                {messageText}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={lineShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            <span>ส่งข้อความเข้า LINE ทันที</span>
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handleCopy}
              className={`w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>คัดลอกข้อความสำเร็จแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอกข้อความแจ้งเตือน LINE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

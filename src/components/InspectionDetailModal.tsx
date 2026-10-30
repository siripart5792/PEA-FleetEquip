import React from 'react';
import { X, CheckCircle, AlertTriangle, Printer, Calendar, Clock, User, Gauge, Shield, Wrench, FileText, Cpu, Package } from 'lucide-react';
import { InspectionRecord, EquipmentCategory } from '../types/fleet';
import { formatThaiDate } from '../utils/lineMessage';

interface InspectionDetailModalProps {
  record: InspectionRecord | null;
  onClose: () => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'safety':
        return <Shield className="w-3.5 h-3.5 text-emerald-600" />;
      case 'emergency':
        return <Wrench className="w-3.5 h-3.5 text-amber-600" />;
      case 'documents':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'electronics':
        return <Cpu className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Package className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const passCount = record.items.filter((i) => i.status === 'pass').length;
  const issueCount = record.items.filter((i) => i.status === 'damaged' || i.status === 'missing').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden print:max-h-none print:shadow-none print:border-none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:bg-transparent">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold tracking-tight text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-300">
              {record.plateNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  รายงานผลการตรวจอุปกรณ์ประจำรถ
                </h3>
                <span className="text-[11px] font-semibold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                  {record.peaBranchName || 'การไฟฟ้าส่วนภูมิภาค'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {record.province} · {record.vehicleBrand} · {record.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              title="พิมพ์รายงาน"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <span className="text-slate-500 block">วันที่ตรวจ:</span>
                <span className="font-semibold text-slate-800">{formatThaiDate(record.inspectionDate)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <span className="text-slate-500 block">เวลาที่ตรวจ:</span>
                <span className="font-semibold text-slate-800 font-mono tabular-nums">{record.inspectionTime} น.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <span className="text-slate-500 block">ผู้ตรวจ:</span>
                <span className="font-semibold text-slate-800">{record.inspectorName}</span>
                <span className="text-[10px] text-slate-400 block">{record.inspectorRole}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Gauge className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <span className="text-slate-500 block">เลขไมล์:</span>
                <span className="font-semibold text-slate-800 font-mono tabular-nums">
                  {record.odometerReading.toLocaleString()} กม.
                </span>
              </div>
            </div>
          </div>

          {/* Overall Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              record.overallResult === 'pass'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {record.overallResult === 'pass' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <span className="text-sm font-bold">
                  {record.overallResult === 'pass'
                    ? 'ผ่านการตรวจเช็คเรียบร้อย (พร้อมใช้งานสมบูรณ์)'
                    : 'พบอุปกรณ์ชำรุด / ไม่ครบถ้วน (ต้องแก้ไขหรือเบิกเปลี่ยน)'}
                </span>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="font-semibold text-emerald-700">{passCount} ผ่าน</span>
              {issueCount > 0 && <span className="font-semibold text-rose-700 ml-2">{issueCount} มีปัญหา</span>}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between">
              <span>รายการอุปกรณ์ ({record.items.length})</span>
              <span>สถานะการตรวจ</span>
            </div>

            <div className="divide-y divide-slate-100">
              {record.items.map((item, idx) => (
                <div key={idx} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="mt-0.5">{getCategoryIcon(item.category)}</span>
                    <div>
                      <span className="font-medium text-slate-900">{item.equipmentName}</span>
                      {item.issueDescription && (
                        <p className="text-[11px] text-rose-600 mt-0.5">
                          ⚠️ หมายเหตุ: {item.issueDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {item.status === 'pass' && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                        พร้อมใช้งาน
                      </span>
                    )}
                    {item.status === 'damaged' && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                        ชำรุด / แจ้งซ่อม
                      </span>
                    )}
                    {item.status === 'missing' && (
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md">
                        สูญหาย / ไม่พบ
                      </span>
                    )}
                    {item.status === 'na' && (
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        N/A
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes if any */}
          {record.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-700 block mb-1">
                หมายเหตุเพิ่มเติม:
              </span>
              <p className="text-xs text-slate-600">{record.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

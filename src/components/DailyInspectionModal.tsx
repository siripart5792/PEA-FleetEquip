import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, HelpCircle, Shield, Wrench, FileText, Cpu, Package, Check, Calendar, Clock, RotateCw } from 'lucide-react';
import { Vehicle, MasterEquipment, InspectionRecord, InspectionCheckItem, EquipmentItemStatus, EquipmentCategory } from '../types/fleet';
import { getTodayDateString } from '../data/initialData';
import { getThailandNowTimeString, formatThaiDate, normalizeToThailandDate, normalizeToThailandTime } from '../utils/thaiDate';

interface DailyInspectionModalProps {
  vehicle: Vehicle | null;
  masterEquipment: MasterEquipment[];
  onClose: () => void;
  onSave: (record: InspectionRecord, updatedMileage: number) => void;
}

export const DailyInspectionModal: React.FC<DailyInspectionModalProps> = ({
  vehicle,
  masterEquipment,
  onClose,
  onSave,
}) => {
  if (!vehicle) return null;

  // Filter master equipment to only those assigned to this vehicle
  const assignedList = masterEquipment.filter((eq) =>
    vehicle.assignedEquipmentIds.includes(eq.id)
  );

  const [inspectorName, setInspectorName] = useState(() => {
    return localStorage.getItem('fleet_equip_last_inspector') || '';
  });
  const [inspectorRole, setInspectorRole] = useState('พนักงานขับรถ');
  const [odometerReading, setOdometerReading] = useState(vehicle.currentMileage || 0);
  const [inspectionDate, setInspectionDate] = useState(() => getTodayDateString());
  const [inspectionTime, setInspectionTime] = useState(() => getThailandNowTimeString());
  const [notes, setNotes] = useState('');

  // Initialise check items state
  const [checkItems, setCheckItems] = useState<InspectionCheckItem[]>(() => {
    return assignedList.map((eq) => ({
      equipmentId: eq.id,
      equipmentName: eq.name,
      category: eq.category,
      status: 'pass',
      issueDescription: '',
    }));
  });

  // Re-sync if vehicle changes or modal opens
  useEffect(() => {
    if (vehicle) {
      setOdometerReading(vehicle.currentMileage || 0);
      setInspectionDate(getTodayDateString());
      setInspectionTime(getThailandNowTimeString());
      setCheckItems(
        assignedList.map((eq) => ({
          equipmentId: eq.id,
          equipmentName: eq.name,
          category: eq.category,
          status: 'pass',
          issueDescription: '',
        }))
      );
    }
  }, [vehicle]);

  const handleStatusChange = (equipmentId: string, status: EquipmentItemStatus) => {
    setCheckItems((prev) =>
      prev.map((item) =>
        item.equipmentId === equipmentId
          ? { ...item, status, issueDescription: status === 'pass' || status === 'na' ? '' : item.issueDescription }
          : item
      )
    );
  };

  const handleIssueDescChange = (equipmentId: string, issueDescription: string) => {
    setCheckItems((prev) =>
      prev.map((item) =>
        item.equipmentId === equipmentId ? { ...item, issueDescription } : item
      )
    );
  };

  const handleMarkAllPass = () => {
    setCheckItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: 'pass',
        issueDescription: '',
      }))
    );
  };

  // Check if any item has issues
  const hasIssues = checkItems.some(
    (item) => item.status === 'damaged' || item.status === 'missing'
  );

  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'safety':
        return <Shield className="w-4 h-4 text-emerald-600" />;
      case 'emergency':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'documents':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'electronics':
        return <Cpu className="w-4 h-4 text-purple-600" />;
      default:
        return <Package className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryTitle = (category: EquipmentCategory) => {
    switch (category) {
      case 'safety':
        return 'อุปกรณ์ความปลอดภัย';
      case 'emergency':
        return 'เครื่องมือฉุกเฉินและซ่อมแซม';
      case 'documents':
        return 'เอกสารประจำรถและบัตรน้ำมัน';
      case 'electronics':
        return 'อุปกรณ์ไฟฟ้าและสื่อสาร';
      default:
        return 'อุปกรณ์ทั่วไป';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectorName.trim()) {
      alert('กรุณาระบุชื่อผู้ตรวจเช็ค');
      return;
    }

    try {
      localStorage.setItem('fleet_equip_last_inspector', inspectorName.trim());
    } catch {
      // ignore
    }

    const newRecord: InspectionRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      province: vehicle.province,
      vehicleBrand: vehicle.brand,
      vehicleType: vehicle.type,
      peaBranchId: vehicle.peaBranchId,
      peaBranchName: vehicle.peaBranchName,
      department: vehicle.department,
      inspectionDate: normalizeToThailandDate(inspectionDate),
      inspectionTime: normalizeToThailandTime(inspectionTime),
      inspectorName: inspectorName.trim(),
      inspectorRole: inspectorRole.trim(),
      odometerReading: Number(odometerReading) || vehicle.currentMileage,
      items: checkItems,
      overallResult: hasIssues ? 'issue' : 'pass',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onSave(newRecord, Number(odometerReading) || vehicle.currentMileage);
  };

  // Group items by category for cleaner overview
  const categories: EquipmentCategory[] = ['safety', 'emergency', 'documents', 'electronics', 'general'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-purple-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold tracking-tight text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-300 shadow-2xs">
                {vehicle.plateNumber}
              </span>
              <span className="text-sm text-slate-600 font-medium">{vehicle.province}</span>
              <span className="text-xs font-semibold text-purple-900 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-md">
                {vehicle.peaBranchName || 'การไฟฟ้าส่วนภูมิภาค'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {vehicle.brand} · {vehicle.department} · ผู้รับผิดชอบ: {vehicle.custodian}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Section: Inspector, Mileage & Date/Time */}
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อผู้ตรวจเช็ค <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="ระบุชื่อ-นามสกุล"
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ตำแหน่ง / หน้าที่
                </label>
                <input
                  type="text"
                  value={inspectorRole}
                  onChange={(e) => setInspectorRole(e.target.value)}
                  placeholder="เช่น พนักงานขับรถ"
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลขไมล์ปัจจุบัน (กม.)
                </label>
                <input
                  type="number"
                  value={odometerReading}
                  onChange={(e) => setOdometerReading(Number(e.target.value))}
                  min={vehicle.currentMileage}
                  className="w-full text-sm font-mono tabular-nums px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Date and Time Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/70">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>วันที่ตรวจเช็ค</span>
                  </label>
                  <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {formatThaiDate(inspectionDate)}
                  </span>
                </div>
                <input
                  type="date"
                  required
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full text-sm font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>เวลาที่ตรวจเช็ค (เวลาไทย GMT+7)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setInspectionTime(getThailandNowTimeString())}
                    className="text-[11px] text-purple-700 hover:text-purple-900 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                    title="ตั้งค่าเป็นเวลาปัจจุบันตามประเทศไทย"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>เวลานี้ ({getThailandNowTimeString()} น.)</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    required
                    value={inspectionTime}
                    onChange={(e) => setInspectionTime(e.target.value)}
                    className="flex-1 text-sm font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                    น.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                รายการอุปกรณ์ประจำรถ ({checkItems.length} รายการ)
              </h3>
              <p className="text-xs text-slate-500">
                ตรวจเช็คความพร้อมใช้งานของอุปกรณ์ที่ผูกกับรถคันนี้
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllPass}
              className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>เลือก &quot;พร้อมใช้งาน&quot; ทั้งหมด</span>
            </button>
          </div>

          {/* Checklist Items Grouped by Category */}
          {categories.map((cat) => {
            const itemsInCat = checkItems.filter((i) => i.category === cat);
            if (itemsInCat.length === 0) return null;

            return (
              <div key={cat} className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pb-1 border-b border-slate-200">
                  {getCategoryIcon(cat)}
                  <span>{getCategoryTitle(cat)}</span>
                  <span className="text-slate-400 font-mono text-[11px]">({itemsInCat.length})</span>
                </div>

                <div className="space-y-2">
                  {itemsInCat.map((item) => {
                    const master = assignedList.find((m) => m.id === item.equipmentId);
                    const isIssue = item.status === 'damaged' || item.status === 'missing';

                    return (
                      <div
                        key={item.equipmentId}
                        className={`p-3 rounded-xl border transition-colors ${
                          item.status === 'pass'
                            ? 'bg-white border-slate-200'
                            : item.status === 'damaged'
                            ? 'bg-amber-50/70 border-amber-300'
                            : item.status === 'missing'
                            ? 'bg-rose-50/70 border-rose-300'
                            : 'bg-slate-50 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">
                                {item.equipmentName}
                              </span>
                              {master?.isRequiredDefault && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  อุปกรณ์จำเป็น
                                </span>
                              )}
                            </div>
                            {master?.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {master.description}
                              </p>
                            )}
                          </div>

                          {/* Status Options */}
                          <div className="flex items-center gap-1 shrink-0 p-1 bg-slate-100 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.equipmentId, 'pass')}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                                item.status === 'pass'
                                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                              }`}
                            >
                              พร้อมใช้งาน
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.equipmentId, 'damaged')}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                                item.status === 'damaged'
                                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                                  : 'text-slate-600 hover:text-amber-800 hover:bg-white/60'
                              }`}
                            >
                              ชำรุด
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.equipmentId, 'missing')}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                                item.status === 'missing'
                                  ? 'bg-rose-600 text-white shadow-xs font-semibold'
                                  : 'text-slate-600 hover:text-rose-800 hover:bg-white/60'
                              }`}
                            >
                              สูญหาย
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.equipmentId, 'na')}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                item.status === 'na'
                                  ? 'bg-slate-500 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                              title="ไม่มีหรือไม่จำเป็นต้องใช้ในรุ่นนี้"
                            >
                              N/A
                            </button>
                          </div>
                        </div>

                        {/* Issue note input if damaged or missing */}
                        {isIssue && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200/60">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              ระบุรายละเอียดความเสียหาย / จุดที่ต้องซ่อมบำรุง หรือสาเหตุที่สูญหาย:
                            </label>
                            <input
                              type="text"
                              value={item.issueDescription || ''}
                              onChange={(e) => handleIssueDescChange(item.equipmentId, e.target.value)}
                              placeholder="เช่น เกจ์วัดแรงดันตก, หน้าจอแตก, อุปกรณ์ไม่ได้อยู่ในช่องเก็บ"
                              className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุเพิ่มเติมหรือข้อเสนอแนะ
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุข้อสังเกตเพิ่มเติม เช่น มีกำหนดนำรถเข้าศูนย์บริการสัปดาห์หน้า"
              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Result Alert Preview */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              hasIssues
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {hasIssues ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {hasIssues
                    ? 'ผลการตรวจ: พบรายการอุปกรณ์ชำรุดหรือสูญหาย'
                    : 'ผลการตรวจ: อุปกรณ์ประจำรถครบถ้วน พร้อมใช้งาน 100%'}
                </p>
                <p className="text-xs text-slate-600">
                  {hasIssues
                    ? 'ระบบจะบันทึกข้อบกพร่องและแสดงเครื่องหมายเตือนในรายงาน'
                    : 'สามารถนำรถออกปฏิบัติงานได้อย่างปลอดภัย'}
                </p>
              </div>
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              บันทึกผลการตรวจเช็ค
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

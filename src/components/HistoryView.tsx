import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Car, 
  Building2, 
  Trash2, 
  AlertCircle, 
  Clock, 
  BarChart3, 
  Layers, 
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';
import { InspectionRecord, Vehicle, PeaBranch, UserRole } from '../types/fleet';
import { formatThaiDate, formatThaiTime, normalizeToThailandDate, normalizeToThailandTime } from '../utils/thaiDate';
import { getTodayDateString, getOffsetDateString } from '../data/initialData';
import { MultiBranchSelect } from './MultiBranchSelect';

interface HistoryViewProps {
  records: InspectionRecord[];
  vehicles: Vehicle[];
  branches: PeaBranch[];
  role?: UserRole;
  onSelectRecord: (record: InspectionRecord) => void;
  onDeleteRecord?: (id: string) => void;
  onStartInspection?: (vehicle: Vehicle) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  vehicles,
  branches,
  role = 'user',
  onSelectRecord,
  onDeleteRecord,
  onStartInspection,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // 1. กำหนดค่าเริ่มต้นช่วงเวลาเป็น 'today' (วันนี้) ตามความต้องการ
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [resultFilter, setResultFilter] = useState<'all' | 'pass' | 'issue'>('all');

  // Sub-tab: 'summary' (สรุปการตรวจรายคัน) หรือ 'records' (รายการบันทึกประวัติ)
  const [activeTab, setActiveTab] = useState<'summary' | 'records'>('summary');
  // ฟิลเตอร์เฉพาะในหน้าสรุปรายคัน: 'all' | 'uninspected' | 'inspected' | 'issues'
  const [summaryStatusFilter, setSummaryStatusFilter] = useState<'all' | 'uninspected' | 'inspected' | 'issues'>('all');

  const todayStr = getTodayDateString();
  const yesterdayStr = getOffsetDateString(-1);
  const sevenDaysAgoStr = getOffsetDateString(-7);
  const thirtyDaysAgoStr = getOffsetDateString(-30);

  // Helper ตรวจสอบว่าวันที่บันทึกอยู่ในช่วงเวลาที่เลือกหรือไม่
  const isRecordInDateRange = (recDate: string) => {
    if (dateRangeFilter === 'today') {
      return recDate === todayStr;
    } else if (dateRangeFilter === 'yesterday') {
      return recDate === yesterdayStr;
    } else if (dateRangeFilter === 'week') {
      return recDate >= sevenDaysAgoStr && recDate <= todayStr;
    } else if (dateRangeFilter === 'month') {
      return recDate >= thirtyDaysAgoStr && recDate <= todayStr;
    } else if (dateRangeFilter === 'custom' || startDate || endDate) {
      if (startDate && recDate < startDate) return false;
      if (endDate && recDate > endDate) return false;
      return true;
    }
    return true; // 'all'
  };

  // ข้อความแสดงชื่อช่วงเวลาปัจจุบัน
  const getPeriodLabel = () => {
    if (dateRangeFilter === 'today') return `วันนี้ (${formatThaiDate(todayStr)})`;
    if (dateRangeFilter === 'yesterday') return `เมื่อวาน (${formatThaiDate(yesterdayStr)})`;
    if (dateRangeFilter === 'week') return `7 วันล่าสุด (${formatThaiDate(sevenDaysAgoStr)} - ${formatThaiDate(todayStr)})`;
    if (dateRangeFilter === 'month') return `30 วันล่าสุด (${formatThaiDate(thirtyDaysAgoStr)} - ${formatThaiDate(todayStr)})`;
    if (startDate && endDate) return `${formatThaiDate(startDate)} - ${formatThaiDate(endDate)}`;
    if (startDate) return `ตั้งแต่ ${formatThaiDate(startDate)}`;
    if (endDate) return `ถึงวันที่ ${formatThaiDate(endDate)}`;
    return 'ประวัติทั้งหมดทุกช่วงเวลา';
  };

  // กรองรายการบันทึกทั้งหมดตามเงื่อนไข (Search, Branch, Vehicle, Result, Date)
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.vehicleBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.peaBranchName && rec.peaBranchName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesVehicle = selectedVehicleId === 'all' || rec.vehicleId === selectedVehicleId;

    const matchesBranch =
      selectedBranchIds.length === 0 ||
      (rec.peaBranchId && selectedBranchIds.includes(rec.peaBranchId)) ||
      selectedBranchIds.includes(vehicles.find((v) => v.id === rec.vehicleId)?.peaBranchId || '');

    const matchesResult = resultFilter === 'all' || rec.overallResult === resultFilter;

    const recDate = normalizeToThailandDate(rec.inspectionDate);
    const matchesDate = isRecordInDateRange(recDate);

    return matchesSearch && matchesVehicle && matchesBranch && matchesResult && matchesDate;
  });

  // เรียงลำดับรายการบันทึกล่าสุดก่อน
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const dateA = normalizeToThailandDate(a.inspectionDate);
    const dateB = normalizeToThailandDate(b.inspectionDate);
    const timeA = normalizeToThailandTime(a.inspectionTime);
    const timeB = normalizeToThailandTime(b.inspectionTime);
    const compA = `${dateA}T${timeA}_${a.createdAt || a.id}`;
    const compB = `${dateB}T${timeB}_${b.createdAt || b.id}`;
    return compB.localeCompare(compA);
  });

  // กรองรถยนต์ที่เข้าข่ายการรายงาน (Active vehicles ตามสาขา/คำค้นหา)
  const scopedVehicles = vehicles.filter((v) => {
    if (v.status !== 'active') return false;

    const matchesBranch =
      selectedBranchIds.length === 0 || selectedBranchIds.includes(v.peaBranchId);

    const matchesVehicle = selectedVehicleId === 'all' || v.id === selectedVehicleId;

    const matchesSearch =
      !searchTerm ||
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.peaBranchName && v.peaBranchName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesBranch && matchesVehicle && matchesSearch;
  });

  // คำนวณสรุปรายคัน: ตรวจกี่วัน, ตรวจกี่ครั้ง, ตรวจล่าสุดเมื่อไหร่, ผ่านหรือไม่
  const vehicleSummaries = scopedVehicles.map((veh) => {
    const vehRecords = records
      .filter((r) => r.vehicleId === veh.id && isRecordInDateRange(normalizeToThailandDate(r.inspectionDate)))
      .sort((a, b) => {
        const dateA = normalizeToThailandDate(a.inspectionDate);
        const dateB = normalizeToThailandDate(b.inspectionDate);
        const timeA = normalizeToThailandTime(a.inspectionTime);
        const timeB = normalizeToThailandTime(b.inspectionTime);
        return `${dateB}T${timeB}`.localeCompare(`${dateA}T${timeA}`);
      });

    const uniqueDates = new Set(vehRecords.map((r) => normalizeToThailandDate(r.inspectionDate)));
    const daysCount = uniqueDates.size;
    const inspectionCount = vehRecords.length;
    const isInspected = inspectionCount > 0;
    const latestRecord = vehRecords[0] || null;
    const hasIssues = vehRecords.some((r) => r.overallResult === 'issue');

    return {
      vehicle: veh,
      isInspected,
      daysCount,
      inspectionCount,
      latestRecord,
      hasIssues,
      records: vehRecords,
    };
  });

  // ตัวชี้วัดสรุป (Summary KPI Metrics)
  const totalScopedVehicles = vehicleSummaries.length;
  const inspectedVehiclesCount = vehicleSummaries.filter((s) => s.isInspected).length;
  const uninspectedVehiclesCount = vehicleSummaries.filter((s) => !s.isInspected).length;
  const issueVehiclesCount = vehicleSummaries.filter((s) => s.hasIssues).length;
  const totalInspectionsInPeriod = vehicleSummaries.reduce((acc, s) => acc + s.inspectionCount, 0);
  const coveragePercent = totalScopedVehicles > 0 ? Math.round((inspectedVehiclesCount / totalScopedVehicles) * 100) : 0;

  // กรองรายการสรุปรายคันตามตัวเลือกสถานะ
  const filteredVehicleSummaries = vehicleSummaries.filter((item) => {
    if (summaryStatusFilter === 'uninspected') return !item.isInspected;
    if (summaryStatusFilter === 'inspected') return item.isInspected;
    if (summaryStatusFilter === 'issues') return item.hasIssues;
    return true; // 'all'
  });

  // ส่งออกรายงาน CSV บันทึกประวัติ
  const handleExportRecordsCSV = () => {
    if (sortedRecords.length === 0) {
      alert('ไม่มีข้อมูลที่ตรงกับเงื่อนไขการส่งออก');
      return;
    }

    const headers = [
      'วันที่ตรวจ',
      'เวลา',
      'สาขาการไฟฟ้า (PEA)',
      'ทะเบียนรถ',
      'จังหวัด',
      'ยี่ห้อ/รุ่น',
      'แผนก/สังกัด',
      'ผู้ตรวจเช็ค',
      'ตำแหน่ง',
      'เลขไมล์ (กม.)',
      'ผลการตรวจ',
      'จำนวนอุปกรณ์ที่ตรวจ',
      'หมายเหตุ',
    ];

    const rows = sortedRecords.map((r) => [
      `"${formatThaiDate(r.inspectionDate)}"`,
      `"${formatThaiTime(r.inspectionTime)}"`,
      `"${r.peaBranchName || 'การไฟฟ้าส่วนภูมิภาค'}"`,
      `"${r.plateNumber}"`,
      `"${r.province}"`,
      `"${r.vehicleBrand}"`,
      `"${r.department}"`,
      `"${r.inspectorName}"`,
      `"${r.inspectorRole}"`,
      r.odometerReading,
      r.overallResult === 'pass' ? 'ผ่านสมบูรณ์' : 'พบอุปกรณ์ชำรุด/สูญหาย',
      r.items.length,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pea_inspections_records_${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ส่งออกรายงาน CSV สรุปการตรวจรายคัน (ความครอบคลุม, จำนวนวัน, จำนวนครั้ง)
  const handleExportSummaryCSV = () => {
    if (vehicleSummaries.length === 0) {
      alert('ไม่มีข้อมูลรถยนต์ที่ตรงกับเงื่อนไขการส่งออก');
      return;
    }

    const headers = [
      'ช่วงเวลารายงาน',
      'ทะเบียนรถ',
      'จังหวัด',
      'สาขาการไฟฟ้า (PEA)',
      'ยี่ห้อ/รุ่น',
      'แผนก/สังกัด',
      'สถานะการตรวจ',
      'จำนวนวันที่ตรวจ (วัน)',
      'จำนวนครั้งที่ตรวจทั้งหมด (ครั้ง)',
      'ตรวจล่าสุดเมื่อ',
      'ผู้ตรวจล่าสุด',
      'ผลการตรวจล่าสุด',
    ];

    const rows = vehicleSummaries.map((s) => [
      `"${getPeriodLabel()}"`,
      `"${s.vehicle.plateNumber}"`,
      `"${s.vehicle.province}"`,
      `"${s.vehicle.peaBranchName || 'การไฟฟ้าส่วนภูมิภาค'}"`,
      `"${s.vehicle.brand}"`,
      `"${s.vehicle.department}"`,
      s.isInspected ? 'ตรวจแล้ว' : 'ยังไม่ได้ตรวจ',
      s.daysCount,
      s.inspectionCount,
      s.latestRecord
        ? `"${formatThaiDate(s.latestRecord.inspectionDate)} ${formatThaiTime(s.latestRecord.inspectionTime)} น."`
        : '"-"',
      s.latestRecord ? `"${s.latestRecord.inspectorName}"` : '"-"',
      s.latestRecord ? (s.latestRecord.overallResult === 'pass' ? 'ผ่านสมบูรณ์' : 'พบอุปกรณ์ชำรุด/สูญหาย') : '"-"',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pea_vehicle_inspection_summary_${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 mb-1">
            <Building2 className="w-4 h-4" />
            <span>การไฟฟ้าส่วนภูมิภาค (PEA) · {getPeriodLabel()}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            ประวัติการตรวจเช็คอุปกรณ์ประจำรถย้อนหลัง
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            ตรวจสอบความครอบคลุมของการตรวจเช็ค ดูรถที่ยังไม่ได้ตรวจ และดูจำนวนวัน/จำนวนครั้งที่ตรวจของรถแต่ละคัน
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {activeTab === 'summary' ? (
            <button
              onClick={handleExportSummaryCSV}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              title="ดาวน์โหลดสรุปจำนวนวันและจำนวนครั้งที่ตรวจของรถแต่ละคัน"
            >
              <Download className="w-4 h-4 text-purple-700" />
              <span>ส่งออกสรุปรายคัน (CSV)</span>
            </button>
          ) : (
            <button
              onClick={handleExportRecordsCSV}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              title="ดาวน์โหลดบันทึกประวัติการตรวจเช็คย้อนหลังทุกรายการ"
            >
              <Download className="w-4 h-4 text-purple-700" />
              <span>ส่งออกบันทึกประวัติ (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip for Selected Period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vehicles in Scope */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">รถทั้งหมดในระบบ</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {totalScopedVehicles}
            </span>
            <span className="text-xs text-slate-500">คันพร้อมใช้งาน</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {selectedBranchIds.length === 0 ? 'ทุกสาขาการไฟฟ้า' : `ใน ${selectedBranchIds.length} สาขาที่เลือก`}
          </p>
        </div>

        {/* Inspected Vehicles */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">ตรวจแล้วในช่วงนี้</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono tabular-nums">
              {inspectedVehiclesCount}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              ({coveragePercent}%)
            </span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
        </div>

        {/* Uninspected Vehicles (Critical KPI) */}
        <div
          onClick={() => {
            setActiveTab('summary');
            setSummaryStatusFilter('uninspected');
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            uninspectedVehiclesCount > 0
              ? 'bg-rose-50/80 border-rose-300 hover:border-rose-400 shadow-2xs'
              : 'bg-white border-slate-200'
          }`}
          title="คลิกเพื่อดูรายชื่อรถที่ยังไม่ได้ตรวจ"
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${uninspectedVehiclesCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              ยังไม่ได้ตรวจในช่วงนี้
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                uninspectedVehiclesCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                uninspectedVehiclesCount > 0 ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {uninspectedVehiclesCount}
            </span>
            <span className="text-xs text-slate-500">คันที่ยังไม่ตรวจ</span>
          </div>
          <p className="text-[11px] font-medium text-rose-700 mt-2 flex items-center gap-1">
            {uninspectedVehiclesCount > 0 ? (
              <>
                <span>คลิกเพื่อดูรายชื่อรถค้างตรวจ</span>
                <ArrowRight className="w-3 h-3" />
              </>
            ) : (
              <span className="text-emerald-700">ตรวจครบทุกคันแล้ว 100%</span>
            )}
          </p>
        </div>

        {/* Total Inspection Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-900">จำนวนการตรวจทั้งหมด</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-purple-900 font-mono tabular-nums">
              {totalInspectionsInPeriod}
            </span>
            <span className="text-xs text-slate-500">ครั้งในรายงาน</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 truncate">
            {issueVehiclesCount > 0 ? (
              <span className="text-amber-700 font-medium">พบจุดบกพร่อง {issueVehiclesCount} คัน</span>
            ) : (
              <span className="text-emerald-700">อุปกรณ์สมบูรณ์ทุกคัน</span>
            )}
          </p>
        </div>
      </div>

      {/* Alert Banner if any vehicle is not inspected in this period */}
      {uninspectedVehiclesCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                พบรถยนต์ยังไม่ได้ตรวจเช็คอุปกรณ์ในช่วง {getPeriodLabel()} จำนวน {uninspectedVehiclesCount} คัน
              </p>
              <p className="text-xs text-amber-800/80">
                มีรถที่ยังไม่มีการบันทึกผลการตรวจความพร้อมก่อนนำออกปฏิบัติงาน
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('summary');
              setSummaryStatusFilter('uninspected');
            }}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            แสดงรถที่ยังไม่ได้ตรวจ ({uninspectedVehiclesCount} คัน)
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาทะเบียน, ผู้ตรวจ, สาขา..."
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Branch Filter */}
          <div>
            <MultiBranchSelect
              branches={branches}
              selectedBranchIds={selectedBranchIds}
              onChange={setSelectedBranchIds}
            />
          </div>

          {/* Vehicle Filter */}
          <div>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">รถทุกคันในระบบ</option>
              {vehicles
                .filter((v) => selectedBranchIds.length === 0 || selectedBranchIds.includes(v.peaBranchId))
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} ({v.brand})
                  </option>
                ))}
            </select>
          </div>

          {/* Result Filter */}
          <div>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">ทุกผลการตรวจ</option>
              <option value="pass">ผ่านการตรวจสมบูรณ์ (Pass)</option>
              <option value="issue">พบอุปกรณ์ชำรุด/สูญหาย (Issues)</option>
            </select>
          </div>
        </div>

        {/* Date Filter & Presets (จัดเรียงตามที่ผู้ใช้ร้องขอ: วันนี้ เป็นหลัก, ย้าย ทั้งหมด ไปไว้หลัง 30 วันล่าสุด) */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Quick Presets: วันนี้ -> เมื่อวาน -> 7 วันล่าสุด -> 30 วันล่าสุด -> ทั้งหมด */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 text-[11px] font-medium mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                <span>ช่วงเวลา:</span>
              </span>
              {(['today', 'yesterday', 'week', 'month', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRangeFilter(range);
                    setStartDate('');
                    setEndDate('');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                    dateRangeFilter === range && !startDate && !endDate
                      ? 'bg-purple-700 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {range === 'today' && 'วันนี้'}
                  {range === 'yesterday' && 'เมื่อวาน'}
                  {range === 'week' && '7 วันล่าสุด'}
                  {range === 'month' && '30 วันล่าสุด'}
                  {range === 'all' && 'ทั้งหมด'}
                </button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-purple-900 pl-1">
                ระบุช่วงวันที่:
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateRangeFilter('custom');
                  }}
                  title="จากวันที่"
                  className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <span className="text-slate-400 text-xs">ถึง</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateRangeFilter('custom');
                  }}
                  title="ถึงวันที่"
                  className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setDateRangeFilter('today');
                  }}
                  className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="ล้างช่วงวันที่แล้วกลับไปที่วันนี้"
                >
                  ล้างวันที่
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs: สรุปการตรวจรายคัน vs รายการบันทึกประวัติทั้งหมด */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white text-purple-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-purple-700" />
            <span>สรุปการตรวจรายคัน ({totalScopedVehicles} คัน)</span>
            {uninspectedVehiclesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                ยังไม่ตรวจ {uninspectedVehiclesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'records'
                ? 'bg-white text-purple-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-700" />
            <span>บันทึกประวัติทั้งหมด ({sortedRecords.length} รายการ)</span>
          </button>
        </div>

        {/* Quick Filter buttons if on 'summary' tab */}
        {activeTab === 'summary' && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">กรองสถานะ:</span>
            <button
              onClick={() => setSummaryStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                summaryStatusFilter === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              ทั้งหมด ({totalScopedVehicles})
            </button>

            <button
              onClick={() => setSummaryStatusFilter('uninspected')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                summaryStatusFilter === 'uninspected'
                  ? 'bg-rose-700 text-white font-semibold'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-medium'
              }`}
            >
              ยังไม่ได้ตรวจ ({uninspectedVehiclesCount})
            </button>

            <button
              onClick={() => setSummaryStatusFilter('inspected')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                summaryStatusFilter === 'inspected'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              ตรวจแล้ว ({inspectedVehiclesCount})
            </button>

            {issueVehiclesCount > 0 && (
              <button
                onClick={() => setSummaryStatusFilter('issues')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  summaryStatusFilter === 'issues'
                    ? 'bg-amber-700 text-white font-semibold'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                พบปัญหา ({issueVehiclesCount})
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: สรุปการตรวจรายคัน (ความครอบคลุม, จำนวนวัน, จำนวนครั้ง) */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">ทะเบียนรถ</th>
                  <th className="py-3 px-4">สังกัดสาขาการไฟฟ้า (PEA)</th>
                  <th className="py-3 px-4">ยี่ห้อ / แผนก</th>
                  <th className="py-3 px-4 text-center">สถานะในช่วงที่เลือก</th>
                  <th className="py-3 px-4 text-center">ตรวจแล้ว (วัน)</th>
                  <th className="py-3 px-4 text-center">จำนวนครั้งที่ตรวจ</th>
                  <th className="py-3 px-4">ตรวจล่าสุดเมื่อ</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredVehicleSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Car className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p>ไม่พบข้อมูลรถยนต์ที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่เลือก</p>
                    </td>
                  </tr>
                ) : (
                  filteredVehicleSummaries.map((item) => {
                    const veh = item.vehicle;
                    const isUninspected = !item.isInspected;

                    return (
                      <tr
                        key={veh.id}
                        className={`transition-colors ${
                          isUninspected
                            ? 'bg-rose-50/20 hover:bg-rose-50/40'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* ทะเบียนรถ & จังหวัด */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg inline-block text-xs sm:text-sm shadow-2xs">
                            {veh.plateNumber}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                            {veh.province}
                          </div>
                        </td>

                        {/* สาขาการไฟฟ้า */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-purple-950 text-xs flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="truncate max-w-[190px]">
                              {veh.peaBranchName || 'การไฟฟ้าส่วนภูมิภาค'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            ผู้รับผิดชอบ: {veh.custodian || 'พนักงานขับรถ'}
                          </span>
                        </td>

                        {/* ยี่ห้อ & แผนก */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{veh.brand}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                            {veh.department}
                          </div>
                        </td>

                        {/* สถานะการตรวจในช่วงนี้ (ตรวจแล้ว / ยังไม่ได้ตรวจ) */}
                        <td className="py-3.5 px-4 text-center">
                          {isUninspected ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>ยังไม่ได้ตรวจ</span>
                            </span>
                          ) : item.hasIssues ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>พบจุดบกพร่อง</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>ตรวจแล้ว (ผ่าน)</span>
                            </span>
                          )}
                        </td>

                        {/* จำนวนวันที่ตรวจ */}
                        <td className="py-3.5 px-4 text-center">
                          {item.daysCount > 0 ? (
                            <div className="inline-flex items-baseline gap-1 bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-lg font-mono font-bold">
                              <span>{item.daysCount}</span>
                              <span className="text-[10px] font-sans font-normal text-purple-700">วัน</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">0 วัน</span>
                          )}
                        </td>

                        {/* จำนวนครั้งที่ตรวจทั้งหมด */}
                        <td className="py-3.5 px-4 text-center">
                          {item.inspectionCount > 0 ? (
                            <div>
                              <span className="font-bold font-mono text-sm text-slate-900">
                                {item.inspectionCount}
                              </span>
                              <span className="text-xs text-slate-500 ml-1">ครั้ง</span>
                              {item.inspectionCount > item.daysCount && (
                                <div className="text-[10px] text-purple-700 font-medium">
                                  (ตรวจซ้ำ {item.inspectionCount - item.daysCount} ครั้ง)
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">0 ครั้ง</span>
                          )}
                        </td>

                        {/* ตรวจล่าสุดเมื่อ */}
                        <td className="py-3.5 px-4">
                          {item.latestRecord ? (
                            <div className="space-y-0.5">
                              <div className="font-medium text-slate-900 text-xs">
                                {formatThaiDate(item.latestRecord.inspectionDate)}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                เวลา {formatThaiTime(item.latestRecord.inspectionTime)} น.
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                โดย {item.latestRecord.inspectorName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">
                              ไม่มีบันทึกในช่วงนี้
                            </span>
                          )}
                        </td>

                        {/* ปุ่มการดำเนินการ */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {item.latestRecord ? (
                              <>
                                <button
                                  onClick={() => onSelectRecord(item.latestRecord!)}
                                  className="px-2.5 py-1 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                                  title="ดูรายงานผลการตรวจล่าสุด"
                                >
                                  ดูผลล่าสุด
                                </button>
                                {item.inspectionCount > 1 && (
                                  <button
                                    onClick={() => {
                                      setSelectedVehicleId(veh.id);
                                      setActiveTab('records');
                                    }}
                                    className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                                    title={`ดูกระดานประวัติทั้งหมดของคันนี้ (${item.inspectionCount} ครั้ง)`}
                                  >
                                    ประวัติ ({item.inspectionCount})
                                  </button>
                                )}
                              </>
                            ) : (
                              onStartInspection && (
                                <button
                                  onClick={() => onStartInspection(veh)}
                                  className="px-2.5 py-1 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                                >
                                  <span>เริ่มตรวจอุปกรณ์</span>
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: รายการบันทึกประวัติทั้งหมด (Log ละเอียดย้อนหลัง) */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              บันทึกประวัติการตรวจเช็คทั้งหมด {sortedRecords.length} รายการ (เรียงตามวันและเวลาล่าสุด)
            </span>
            {selectedVehicleId !== 'all' && (
              <button
                onClick={() => setSelectedVehicleId('all')}
                className="text-purple-700 hover:underline font-medium cursor-pointer"
              >
                แสดงรถทุกคัน (ล้างตัวกรองเฉพาะคัน)
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">วันที่ / เวลา</th>
                  <th className="py-3 px-4">ทะเบียนรถ</th>
                  <th className="py-3 px-4">สาขาการไฟฟ้า (PEA)</th>
                  <th className="py-3 px-4">ยี่ห้อ / แผนก</th>
                  <th className="py-3 px-4">ผู้ตรวจเช็ค</th>
                  <th className="py-3 px-4 text-right">เลขไมล์</th>
                  <th className="py-3 px-4 text-center">อุปกรณ์ที่ตรวจ</th>
                  <th className="py-3 px-4 text-center">ผลการตรวจ</th>
                  <th className="py-3 px-4 text-right">{role === 'admin' ? 'จัดการ' : 'รายงาน'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {sortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p>ไม่พบประวัติการตรวจเช็คที่ตรงกับเงื่อนไขที่เลือกในช่วงเวลานี้</p>
                    </td>
                  </tr>
                ) : (
                  sortedRecords.map((rec) => {
                    const damagedCount = rec.items.filter((i) => i.status === 'damaged').length;
                    const missingCount = rec.items.filter((i) => i.status === 'missing').length;

                    return (
                      <tr
                        key={rec.id}
                        onClick={() => onSelectRecord(rec)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">
                            {formatThaiDate(rec.inspectionDate)}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {formatThaiTime(rec.inspectionTime)} น.
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs">
                            {rec.plateNumber}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5">{rec.province}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-purple-950 text-xs flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-purple-600 shrink-0" />
                            <span className="truncate max-w-[170px]">
                              {rec.peaBranchName || 'การไฟฟ้าส่วนภูมิภาค'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{rec.vehicleBrand}</div>
                          <div className="text-[11px] text-slate-500">{rec.department}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">{rec.inspectorName}</div>
                          <div className="text-[11px] text-slate-500">{rec.inspectorRole}</div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {rec.odometerReading.toLocaleString()} กม.
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {rec.items.length} ชิ้น
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {rec.overallResult === 'pass' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ผ่านสมบูรณ์</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                มีปัญหา
                                {damagedCount > 0 && ` (ชำรุด ${damagedCount})`}
                                {missingCount > 0 && ` (หาย ${missingCount})`}
                              </span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectRecord(rec);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="ดูรายละเอียดการตรวจเช็ค"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ดูรายงาน</span>
                            </button>

                            {role === 'admin' && onDeleteRecord && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteRecord(rec.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="ลบรายการประวัตินี้ (เฉพาะผู้ดูแลระบบ)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

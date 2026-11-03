import React, { useState } from 'react';
import { Search, Calendar, FileText, Download, CheckCircle, AlertTriangle, Eye, Car, Building2, Trash2 } from 'lucide-react';
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
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  vehicles,
  branches,
  role = 'user',
  onSelectRecord,
  onDeleteRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [resultFilter, setResultFilter] = useState<'all' | 'pass' | 'issue'>('all');

  const todayStr = getTodayDateString();
  const yesterdayStr = getOffsetDateString(-1);
  const sevenDaysAgoStr = getOffsetDateString(-7);
  const thirtyDaysAgoStr = getOffsetDateString(-30);

  const filteredRecords = records.filter((rec) => {
    // Search filter
    const matchesSearch =
      rec.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.vehicleBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.peaBranchName && rec.peaBranchName.toLowerCase().includes(searchTerm.toLowerCase()));

    // Vehicle filter
    const matchesVehicle = selectedVehicleId === 'all' || rec.vehicleId === selectedVehicleId;

    // Branch filter
    const matchesBranch =
      selectedBranchIds.length === 0 ||
      (rec.peaBranchId && selectedBranchIds.includes(rec.peaBranchId)) ||
      selectedBranchIds.includes(vehicles.find((v) => v.id === rec.vehicleId)?.peaBranchId || '');

    // Result filter
    const matchesResult = resultFilter === 'all' || rec.overallResult === resultFilter;

    // Date range filter (using Thailand timezone standard YYYY-MM-DD)
    const recDate = normalizeToThailandDate(rec.inspectionDate);
    let matchesDate = true;
    if (dateRangeFilter === 'today') {
      matchesDate = recDate === todayStr;
    } else if (dateRangeFilter === 'yesterday') {
      matchesDate = recDate === yesterdayStr;
    } else if (dateRangeFilter === 'week') {
      matchesDate = recDate >= sevenDaysAgoStr && recDate <= todayStr;
    } else if (dateRangeFilter === 'month') {
      matchesDate = recDate >= thirtyDaysAgoStr && recDate <= todayStr;
    } else if (dateRangeFilter === 'custom' || startDate || endDate) {
      if (startDate && recDate < startDate) matchesDate = false;
      if (endDate && recDate > endDate) matchesDate = false;
    }

    return matchesSearch && matchesVehicle && matchesBranch && matchesResult && matchesDate;
  });

  // Sort descending by Thailand date & time
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const dateA = normalizeToThailandDate(a.inspectionDate);
    const dateB = normalizeToThailandDate(b.inspectionDate);
    const timeA = normalizeToThailandTime(a.inspectionTime);
    const timeB = normalizeToThailandTime(b.inspectionTime);
    const compA = `${dateA}T${timeA}_${a.createdAt || a.id}`;
    const compB = `${dateB}T${timeB}_${b.createdAt || b.id}`;
    return compB.localeCompare(compA);
  });

  // Export CSV
  const handleExportCSV = () => {
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
    link.download = `pea_inspections_${todayStr}.csv`;
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
            <span>การไฟฟ้าส่วนภูมิภาค (PEA)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            ประวัติการตรวจเช็คอุปกรณ์ประจำรถย้อนหลัง
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            ค้นหา ตรวจสอบผลการบันทึกย้อนหลัง และดูรายละเอียดรายงานการตรวจของรถแต่ละสาขา
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-purple-700" />
          <span>ส่งออกรายงาน CSV</span>
        </button>
      </div>

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

        {/* Date Filter & Presets */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 text-[11px] font-medium mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                <span>ช่วงเวลา:</span>
              </span>
              {(['all', 'today', 'yesterday', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRangeFilter(range);
                    setStartDate('');
                    setEndDate('');
                  }}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    dateRangeFilter === range && !startDate && !endDate
                      ? 'bg-purple-700 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {range === 'all' && 'ทั้งหมด'}
                  {range === 'today' && 'วันนี้'}
                  {range === 'yesterday' && 'เมื่อวาน'}
                  {range === 'week' && '7 วันล่าสุด'}
                  {range === 'month' && '30 วันล่าสุด'}
                </button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-purple-900 pl-1">
                เลือกช่วงวันที่:
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
                    setDateRangeFilter('all');
                  }}
                  className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="ล้างช่วงวันที่"
                >
                  ล้างวันที่
                </button>
              )}

              <span className="ml-auto text-[11px] text-slate-500 font-mono pr-1">
                พบ {sortedRecords.length} รายการ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
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
                    <p>ไม่พบประวัติการตรวจเช็คที่ตรงกับเงื่อนไขที่เลือก</p>
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
                          {formatThaiTime(rec.inspectionTime)}
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
    </div>
  );
};

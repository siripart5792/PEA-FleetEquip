import React, { useState } from 'react';
import { 
  Car, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  Search, 
  Wrench, 
  User, 
  Calendar,
  ChevronRight,
  Eye,
  Check,
  Building2
} from 'lucide-react';
import { Vehicle, MasterEquipment, InspectionRecord, UserRole, PeaBranch } from '../types/fleet';
import { getTodayDateString } from '../data/initialData';
import { getTodayStatusCounts, getTodayInspectionForVehicle } from '../utils/storage';
import { formatFullThaiDate } from '../utils/lineMessage';
import { MultiBranchSelect } from './MultiBranchSelect';

interface DailyInspectionViewProps {
  vehicles: Vehicle[];
  masterEquipment: MasterEquipment[];
  branches: PeaBranch[];
  records: InspectionRecord[];
  role: UserRole;
  onStartInspection: (vehicle: Vehicle) => void;
  onViewRecord: (record: InspectionRecord) => void;
  onOpenLineModal: () => void;
  onQuickCopyLine: () => void;
  quickCopied: boolean;
}

export const DailyInspectionView: React.FC<DailyInspectionViewProps> = ({
  vehicles,
  masterEquipment,
  branches,
  records,
  role,
  onStartInspection,
  onViewRecord,
  onOpenLineModal,
  onQuickCopyLine,
  quickCopied,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'inspected' | 'issues'>('all');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  const todayStr = getTodayDateString();
  const { totalActive, inspectedCount, pendingCount, pendingVehicles, issueCount } = getTodayStatusCounts(
    vehicles,
    records,
    selectedBranchIds
  );

  const percentage = totalActive > 0 ? Math.round((inspectedCount / totalActive) * 100) : 0;

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    // Only active vehicles for daily inspection
    if (v.status !== 'active') return false;

    const matchesSearch =
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.peaBranchName && v.peaBranchName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBranch = selectedBranchIds.length === 0 || selectedBranchIds.includes(v.peaBranchId);

    const todayRecord = getTodayInspectionForVehicle(v.id, records);

    let matchesStatus = true;
    if (statusFilter === 'pending') {
      matchesStatus = !todayRecord;
    } else if (statusFilter === 'inspected') {
      matchesStatus = !!todayRecord;
    } else if (statusFilter === 'issues') {
      matchesStatus = !!todayRecord && todayRecord.overallResult === 'issue';
    }

    return matchesSearch && matchesBranch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Date & Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 mb-1">
            <Building2 className="w-4 h-4" />
            <span>การไฟฟ้าส่วนภูมิภาค (PEA) · {formatFullThaiDate(new Date())}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            ตรวจอุปกรณ์ประจำรถประจำวัน
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            บันทึกการตรวจความพร้อมอุปกรณ์ประจำรถแต่ละคันของสาขาการไฟฟ้าก่อนนำออกปฏิบัติงาน
          </p>
        </div>

        {/* Action Buttons for LINE Alert */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onQuickCopyLine}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
              quickCopied
                ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title="คัดลอกข้อความแจ้งเตือนรถที่ยังไม่ได้ตรวจเพื่อส่งใน LINE ทันที"
          >
            {quickCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>คัดลอกข้อความ LINE แล้ว!</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                <span>คัดลอกข้อความแจ้งเตือน LINE</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenLineModal}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            ดูตัวอย่าง & ตั้งค่า LINE
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Vehicles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {selectedBranchIds.length === 0
                ? 'รถทั้งหมดในระบบ'
                : `รถใน ${selectedBranchIds.length} สาขาที่เลือก`}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {totalActive}
            </span>
            <span className="text-xs text-slate-500">คันพร้อมใช้งาน</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-700 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Inspected Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">ตรวจแล้ววันนี้</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono tabular-nums">
              {inspectedCount}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              ({percentage}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 truncate">
            {inspectedCount === totalActive
              ? 'ตรวจครบทุกคันแล้ว 100%'
              : `คืบหน้า ${inspectedCount} จาก ${totalActive} คัน`}
          </p>
        </div>

        {/* Pending Inspection */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            pendingCount > 0
              ? 'bg-rose-50/70 border-rose-200 shadow-2xs'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${pendingCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              ยังไม่ได้ตรวจวันนี้
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                pendingCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                pendingCount > 0 ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {pendingCount}
            </span>
            <span className="text-xs text-slate-500">คันที่รอตรวจ</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 truncate">
            {pendingCount > 0 ? 'แจ้งเตือนพนักงานผ่าน LINE' : 'ไม่มีรถค้างตรวจ'}
          </p>
        </div>

        {/* Issues Found */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">อุปกรณ์มีปัญหา</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-700 font-mono tabular-nums">
              {issueCount}
            </span>
            <span className="text-xs text-amber-600">คันที่พบปัญหา</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 truncate">
            อุปกรณ์ชำรุด หรือสูญหาย
          </p>
        </div>
      </div>

      {/* Filter and Search Row */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Branch filter dropdown */}
          <div className="sm:w-80">
            <MultiBranchSelect
              branches={branches}
              selectedBranchIds={selectedBranchIds}
              onChange={setSelectedBranchIds}
            />
          </div>

          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาทะเบียน, ยี่ห้อ, แผนก, สาขาการไฟฟ้า..."
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Status segmented buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รถทั้งหมด ({totalActive})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-white text-rose-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ยังไม่ได้ตรวจ ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('inspected')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'inspected'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ตรวจแล้ว ({inspectedCount})
          </button>
          <button
            onClick={() => setStatusFilter('issues')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'issues'
                ? 'bg-white text-amber-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            พบปัญหา ({issueCount})
          </button>
        </div>
      </div>

      {/* Vehicle Inspection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <Car className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">ไม่พบรถยนต์ที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนตัวกรองสาขาการไฟฟ้า หรือสถานะการตรวจ</p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => {
            const todayRecord = getTodayInspectionForVehicle(vehicle.id, records);
            const isInspected = !!todayRecord;
            const hasIssue = todayRecord?.overallResult === 'issue';

            return (
              <div
                key={vehicle.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                  !isInspected
                    ? 'border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-xs'
                    : hasIssue
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-emerald-200 bg-emerald-50/10'
                }`}
              >
                {/* Card Top */}
                <div className="p-5 space-y-3.5">
                  {/* Plate, Branch, and Status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-base font-bold text-slate-900 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-lg inline-block shadow-2xs">
                        {vehicle.plateNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {vehicle.province} · {vehicle.brand}
                      </div>
                      {/* PEA Branch Badge */}
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-purple-900">
                        <Building2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {vehicle.peaBranchName || 'การไฟฟ้าส่วนภูมิภาค'}
                        </span>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div>
                      {!isInspected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-rose-500" />
                          <span>ยังไม่ได้ตรวจ</span>
                        </span>
                      ) : hasIssue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>พบอุปกรณ์มีปัญหา</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ตรวจแล้ว (ผ่าน)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vehicle details */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Car className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                      <span className="truncate font-medium">{vehicle.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        อุปกรณ์ประจำรถ: <strong className="text-slate-700 font-mono">{vehicle.assignedEquipmentIds.length}</strong> รายการ
                      </span>
                    </div>
                  </div>

                  {/* Inspection status metadata if already inspected */}
                  {todayRecord && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>ตรวจเมื่อ: {todayRecord.inspectionTime} น.</span>
                        <span className="font-mono tabular-nums">{todayRecord.odometerReading.toLocaleString()} กม.</span>
                      </div>
                      <div className="text-slate-500 truncate">
                        ผู้ตรวจ: {todayRecord.inspectorName} ({todayRecord.inspectorRole})
                      </div>
                      {todayRecord.notes && (
                        <div className="text-amber-800 font-medium truncate pt-0.5">
                          หมายเหตุ: {todayRecord.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                  {todayRecord ? (
                    <>
                      <button
                        onClick={() => onViewRecord(todayRecord)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>ดูผลการตรวจ</span>
                      </button>

                      <button
                        onClick={() => onStartInspection(vehicle)}
                        className="px-3 py-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                      >
                        ตรวจซ้ำ / อัปเดต
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onStartInspection(vehicle)}
                      className="w-full py-2 px-3 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>เริ่มตรวจอุปกรณ์ประจำรถ</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

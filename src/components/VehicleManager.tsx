import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Lock, Car, Shield, Wrench, CheckSquare, Square, AlertCircle, X, ShieldCheck, Check, Building2 } from 'lucide-react';
import { Vehicle, MasterEquipment, UserRole, VehicleType, EquipmentCategory, PeaBranch } from '../types/fleet';
import { MultiBranchSelect } from './MultiBranchSelect';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  masterEquipment: MasterEquipment[];
  branches: PeaBranch[];
  role: UserRole;
  onOpenAdminLogin: () => void;
  onAddVehicle: (newVehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (id: string, updated: Partial<Vehicle>) => void;
  onDeleteVehicle: (id: string) => void;
}

const PROVINCES = [
  'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สระบุรี', 'พระนครศรีอยุธยา',
  'ลพบุรี', 'ชลบุรี', 'ระยอง', 'ฉะเชิงเทรา', 'จันทบุรี', 'เชียงใหม่', 'เชียงราย',
  'ลำปาง', 'พิษณุโลก', 'นครราชสีมา', 'ขอนแก่น', 'อุดรธานี', 'อุบลราชธานี',
  'สงขลา', 'ภูเก็ต', 'สุราษฎร์ธานี', 'นครศรีธรรมราช'
];

export const VehicleManager: React.FC<VehicleManagerProps> = ({
  vehicles,
  masterEquipment,
  branches,
  role,
  onOpenAdminLogin,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterBranches, setFilterBranches] = useState<string[]>([]);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [plateNumber, setPlateNumber] = useState('');
  const [province, setProvince] = useState('สระบุรี');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<VehicleType>('pickup');
  const [peaBranchId, setPeaBranchId] = useState(branches[0]?.id || 'branch-1');
  const [department, setDepartment] = useState('');
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'maintenance' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);

  // If user is not admin, show locked view with friendly prompt
  if (role !== 'admin') {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            หน้านี้สงวนไว้สำหรับ &quot;ผู้ดูแลระบบ&quot; เท่านั้น
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            ผู้ใช้งานทั่วไปสามารถตรวจเช็คอุปกรณ์ประจำรถประจำวันและดูประวัติย้อนหลังได้ แต่ไม่สามารถเพิ่ม ลบ หรือแก้ไขข้อมูลรถในระบบได้
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenAdminLogin}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>เข้าสู่ระบบผู้ดูแลระบบ (Admin PIN)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const openAddModal = () => {
    setModalMode('add');
    setEditingVehicleId(null);
    setPlateNumber('');
    setProvince('สระบุรี');
    setBrand('');
    setType('pickup');
    setPeaBranchId(branches[0]?.id || '');
    setDepartment('แผนกปฏิบัติการระบบไฟฟ้า');
    setCurrentMileage(0);
    setStatus('active');
    setNotes('');
    setSelectedEquipmentIds(masterEquipment.filter((e) => e.isRequiredDefault).map((e) => e.id));
  };

  const openEditModal = (vehicle: Vehicle) => {
    setModalMode('edit');
    setEditingVehicleId(vehicle.id);
    setPlateNumber(vehicle.plateNumber);
    setProvince(vehicle.province);
    setBrand(vehicle.brand);
    setType(vehicle.type);
    setPeaBranchId(vehicle.peaBranchId || branches[0]?.id || '');
    setDepartment(vehicle.department);
    setCurrentMileage(vehicle.currentMileage);
    setStatus(vehicle.status);
    setNotes(vehicle.notes || '');
    setSelectedEquipmentIds([...vehicle.assignedEquipmentIds]);
  };

  const handleSelectAllEquipment = () => {
    setSelectedEquipmentIds(masterEquipment.map((e) => e.id));
  };

  const handleSelectRequiredOnly = () => {
    setSelectedEquipmentIds(masterEquipment.filter((e) => e.isRequiredDefault).map((e) => e.id));
  };

  const handleClearAllEquipment = () => {
    setSelectedEquipmentIds([]);
  };

  const toggleEquipment = (id: string) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim() || !brand.trim()) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ทะเบียนรถ, ยี่ห้อ/รุ่น)');
      return;
    }

    const matchedBranch = branches.find((b) => b.id === peaBranchId);
    const branchName = matchedBranch ? matchedBranch.name : 'การไฟฟ้าส่วนภูมิภาค';

    if (modalMode === 'add') {
      onAddVehicle({
        plateNumber: plateNumber.trim(),
        province,
        brand: brand.trim(),
        type,
        peaBranchId,
        peaBranchName: branchName,
        department: department.trim() || 'ส่วนกลาง',
        currentMileage: Number(currentMileage) || 0,
        status,
        notes: notes.trim(),
        assignedEquipmentIds: selectedEquipmentIds,
      });
    } else if (modalMode === 'edit' && editingVehicleId) {
      onUpdateVehicle(editingVehicleId, {
        plateNumber: plateNumber.trim(),
        province,
        brand: brand.trim(),
        type,
        peaBranchId,
        peaBranchName: branchName,
        department: department.trim() || 'ส่วนกลาง',
        currentMileage: Number(currentMileage) || 0,
        status,
        notes: notes.trim(),
        assignedEquipmentIds: selectedEquipmentIds,
      });
    }

    setModalMode(null);
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.peaBranchName && v.peaBranchName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || v.type === filterType;
    const matchesBranch = filterBranches.length === 0 || filterBranches.includes(v.peaBranchId);
    return matchesSearch && matchesType && matchesBranch;
  });

  const getVehicleTypeLabel = (t: VehicleType) => {
    switch (t) {
      case 'pickup':
        return 'รถกระบะ';
      case 'van':
        return 'รถตู้';
      case 'truck':
        return 'รถบรรทุก';
      case 'sedan':
        return 'รถเก๋ง';
      case 'suv':
        return 'รถ SUV';
      case 'utility':
        return 'เครื่องมือพิเศษ / กระเช้า';
      default:
        return t;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 mb-1">
            <Building2 className="w-4 h-4" />
            <span>การไฟฟ้าส่วนภูมิภาค (PEA)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            จัดการข้อมูลรถยนต์ในระบบ ({vehicles.length} คัน)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            เพิ่ม ลบ หรือแก้ไขข้อมูลรถ ระบุสาขาการไฟฟ้า และกำหนดรายการอุปกรณ์ประจำรถเฉพาะคัน
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มรถยนต์เข้าสู่ระบบ</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาทะเบียน, ยี่ห้อ, แผนก, สาขาการไฟฟ้า..."
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <MultiBranchSelect
            branches={branches}
            selectedBranchIds={filterBranches}
            onChange={setFilterBranches}
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">ทุกประเภทรถ</option>
            <option value="pickup">รถกระบะ</option>
            <option value="van">รถตู้</option>
            <option value="truck">รถบรรทุก</option>
            <option value="sedan">รถเก๋ง</option>
            <option value="suv">รถ SUV</option>
            <option value="utility">รถพิเศษ / กระเช้า</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">ทะเบียนรถ</th>
                <th className="py-3 px-4">สังกัดสาขาการไฟฟ้า (PEA)</th>
                <th className="py-3 px-4">ยี่ห้อ / รุ่น</th>
                <th className="py-3 px-4">แผนก / สังกัด</th>
                <th className="py-3 px-4 text-center">อุปกรณ์ประจำรถ</th>
                <th className="py-3 px-4 text-right">เลขไมล์</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลรถยนต์ที่ตรงกับการค้นหา
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((veh) => (
                  <tr key={veh.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-md inline-block">
                        {veh.plateNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{veh.province}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-purple-950 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{veh.peaBranchName || 'การไฟฟ้าส่วนภูมิภาค'}</span>
                      </div>
                      <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                        {getVehicleTypeLabel(veh.type)}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {veh.brand}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{veh.department}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-200">
                        <Wrench className="w-3 h-3" />
                        <span>{veh.assignedEquipmentIds.length} รายการ</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {veh.currentMileage.toLocaleString()} กม.
                    </td>

                    <td className="py-3 px-4 text-center">
                      {veh.status === 'active' && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          พร้อมใช้งาน
                        </span>
                      )}
                      {veh.status === 'maintenance' && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          ซ่อมบำรุง
                        </span>
                      )}
                      {veh.status === 'inactive' && (
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          งดใช้
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(veh)}
                          className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขข้อมูลรถและอุปกรณ์"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(veh.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="ลบรถออกจากระบบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">ยืนยันการลบข้อมูลรถ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                หากลบแล้ว ประวัติการตรวจและข้อมูลรถคันนี้จะไม่แสดงในรายการประจำวัน
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteVehicle(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-purple-50">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === 'add' ? 'เพิ่มรถยนต์ใหม่เข้าสู่ระบบ กฟภ.' : 'แก้ไขข้อมูลรถยนต์และอุปกรณ์ประจำรถ'}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* General Vehicle Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-purple-700">
                  1. ข้อมูลพื้นฐานและสาขาการไฟฟ้าส่วนภูมิภาค
                </h4>

                {/* PEA Branch Selection */}
                <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200">
                  <label className="block text-xs font-bold text-purple-900 mb-1">
                    สาขาการไฟฟ้าส่วนภูมิภาคที่สังกัด <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={peaBranchId}
                    onChange={(e) => setPeaBranchId(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-900"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code}) - {b.region}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-purple-700 mt-1">
                    ระบุสาขาการไฟฟ้าที่เป็นเจ้าของรถ เพื่อจัดกลุ่มรายงานและการแจ้งเตือนผ่าน LINE
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ทะเบียนรถ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      placeholder="เช่น 1ฒผ 9920 หรือ กบ 4589"
                      className="w-full text-sm font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      จังหวัด
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ประเภทรถยนต์
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as VehicleType)}
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="pickup">รถกระบะสายตรวจ / แก้กระแสไฟฟ้า</option>
                      <option value="van">รถตู้ประสานงาน / ส่วนกลาง</option>
                      <option value="truck">รถบรรทุก 6 ล้อ / 10 ล้อ</option>
                      <option value="utility">รถกระเช้าซ่อมบำรุง / เครื่องมือพิเศษ</option>
                      <option value="sedan">รถเก๋งธุรการ</option>
                      <option value="suv">รถตรวจการณ์ SUV</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ยี่ห้อ / รุ่น <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="เช่น Toyota Hilux Revo 2.8 4WD"
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      แผนก / กอง / แผนกย่อย
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="เช่น แผนกปฏิบัติการและบำรุงรักษา"
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขไมล์ปัจจุบัน (กม.)
                  </label>
                  <input
                    type="number"
                    value={currentMileage}
                    onChange={(e) => setCurrentMileage(Number(e.target.value))}
                    min={0}
                    className="w-full text-sm font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      สถานะรถยนต์
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="active">พร้อมใช้งาน (Active)</option>
                      <option value="maintenance">อยู่ระหว่างซ่อมบำรุง (Maintenance)</option>
                      <option value="inactive">งดใช้งานชั่วคราว (Inactive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      หมายเหตุเพิ่มเติม
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="เช่น รถประจำหน่วยแก้ไฟฟ้าดับเคลื่อนที่เร็ว"
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Equipment Selection */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-purple-700">
                      2. กำหนดอุปกรณ์ประจำรถคันนี้ (เลือกแล้ว {selectedEquipmentIds.length} จาก {masterEquipment.length} ชิ้น)
                    </h4>
                    <p className="text-xs text-slate-500">
                      เลือกอุปกรณ์ที่ต้องตรวจเช็คประจำวันสำหรับรถคันนี้โดยเฉพาะ
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleSelectAllEquipment}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      เลือกทั้งหมด
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectRequiredOnly}
                      className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors cursor-pointer"
                    >
                      เฉพาะอุปกรณ์จำเป็น
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllEquipment}
                      className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                    >
                      ล้าง
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                  {masterEquipment.map((eq) => {
                    const isSelected = selectedEquipmentIds.includes(eq.id);
                    return (
                      <div
                        key={eq.id}
                        onClick={() => toggleEquipment(eq.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                          isSelected
                            ? 'bg-purple-50/70 border-purple-300 text-purple-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-700" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold leading-snug">{eq.name}</span>
                            {eq.isRequiredDefault && (
                              <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded font-medium">
                                จำเป็น
                              </span>
                            )}
                          </div>
                          {eq.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {eq.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs cursor-pointer"
                >
                  {modalMode === 'add' ? 'บันทึกเพิ่มรถยนต์' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

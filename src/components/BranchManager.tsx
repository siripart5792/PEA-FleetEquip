import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Building2, Lock, ShieldCheck, AlertCircle, X, Car, Phone, MapPin } from 'lucide-react';
import { PeaBranch, Vehicle, UserRole } from '../types/fleet';

interface BranchManagerProps {
  branches: PeaBranch[];
  vehicles: Vehicle[];
  role: UserRole;
  onOpenAdminLogin: () => void;
  onAddBranch: (branchData: Omit<PeaBranch, 'id'>) => void;
  onUpdateBranch: (id: string, updated: Partial<PeaBranch>) => void;
  onDeleteBranch: (id: string) => void;
  onSelectBranchToViewVehicles?: (branchId: string) => void;
}

export const BranchManager: React.FC<BranchManagerProps> = ({
  branches,
  vehicles,
  role,
  onOpenAdminLogin,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  onSelectBranchToViewVehicles,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [region, setRegion] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // If user is not admin, show locked view
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
            การเพิ่ม ลบ หรือแก้ไขข้อมูลสาขาการไฟฟ้าส่วนภูมิภาค ต้องใช้สิทธิ์ผู้ดูแลระบบ
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
    setEditingId(null);
    setName('');
    setCode('');
    setRegion('');
    setPhone('');
    setAddress('');
  };

  const openEditModal = (branch: PeaBranch) => {
    setModalMode('edit');
    setEditingId(branch.id);
    setName(branch.name);
    setCode(branch.code);
    setRegion(branch.region);
    setPhone(branch.phone || '');
    setAddress(branch.address || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณากรอกชื่อสาขาการไฟฟ้าส่วนภูมิภาค');
      return;
    }

    if (modalMode === 'add') {
      onAddBranch({
        name: name.trim(),
        code: code.trim() || `กฟภ.${name.slice(0, 3)}`,
        region: region.trim() || 'การไฟฟ้าส่วนภูมิภาค',
        phone: phone.trim(),
        address: address.trim(),
      });
    } else if (modalMode === 'edit' && editingId) {
      onUpdateBranch(editingId, {
        name: name.trim(),
        code: code.trim(),
        region: region.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
    }

    setModalMode(null);
  };

  const filteredBranches = branches.filter((b) => {
    return (
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.region.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getVehicleCount = (branchId: string) => {
    return vehicles.filter((v) => v.peaBranchId === branchId).length;
  };

  const branchToDelete = deleteConfirmId ? branches.find((b) => b.id === deleteConfirmId) : null;
  const vehiclesInBranchToDelete = deleteConfirmId ? getVehicleCount(deleteConfirmId) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 mb-1">
            <Building2 className="w-4 h-4" />
            <span>การไฟฟ้าส่วนภูมิภาค (PEA)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            จัดการข้อมูลสาขาการไฟฟ้า ({branches.length} แห่ง)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            เพิ่ม ลบ หรือแก้ไขรายชื่อสาขาการไฟฟ้าส่วนภูมิภาคสำหรับใช้กำหนดสังกัดรถแต่ละคัน
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มสาขาการไฟฟ้าใหม่</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาชื่อสาขาการไฟฟ้า, รหัสย่อ, เขต/ภาค..."
          className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-32">รหัสย่อ</th>
                <th className="py-3 px-4">ชื่อสาขาการไฟฟ้าส่วนภูมิภาค</th>
                <th className="py-3 px-4">เขต / ภาค</th>
                <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                <th className="py-3 px-4 text-center">รถในสังกัด</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    ไม่พบข้อมูลสาขาการไฟฟ้าที่ตรงกับการค้นหา
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => {
                  const count = getVehicleCount(branch.id);
                  return (
                    <tr key={branch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-purple-900">
                        <span className="bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md text-xs">
                          {branch.code}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{branch.name}</div>
                        {branch.address && (
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-sm">{branch.address}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {branch.region}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {branch.phone || '-'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Car className="w-3 h-3 text-slate-500" />
                          <span>{count} คัน</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(branch)}
                            className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขชื่อและข้อมูลสาขา"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(branch.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบสาขาการไฟฟ้า"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && branchToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการลบสาขา &quot;{branchToDelete.name}&quot;?
              </h3>
              {vehiclesInBranchToDelete > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs mt-2 text-left">
                  ⚠️ <strong>คำเตือน:</strong> มีรถยนต์ในระบบจำนวน{' '}
                  <strong>{vehiclesInBranchToDelete} คัน</strong> ที่ผูกอยู่กับสาขานี้
                  หากลบสาขา รถเหล่านั้นจะถูกปรับสังกัดเป็นสาขาอื่นโดยอัตโนมัติ
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  สาขานี้ยังไม่มีรถผูกอยู่ สามารถลบออกจากระบบได้อย่างปลอดภัย
                </p>
              )}
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
                  onDeleteBranch(deleteConfirmId);
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

      {/* Add / Edit Branch Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-purple-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === 'add' ? 'เพิ่มสาขาการไฟฟ้าส่วนภูมิภาคใหม่' : 'แก้ไขข้อมูลสาขาการไฟฟ้า'}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อสาขาการไฟฟ้าส่วนภูมิภาค <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น การไฟฟ้าส่วนภูมิภาคจังหวัดสระบุรี"
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสย่อสาขา
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="เช่น กฟภ.สบร. หรือ กฟภ.ชบ."
                  className="w-full text-sm font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เขต / ภาค (สังกัด)
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="เช่น กฟก.1 (ภาคกลาง เขต 1 อยุธยา)"
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อสำนักงาน
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 036-221-144 หรือ 038-274-122"
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ที่ตั้งสำนักงาน / ที่อยู่
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="เช่น ถ.พหลโยธิน ต.ปากเพรส อ.เมือง จ.สระบุรี"
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

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
                  {modalMode === 'add' ? 'บันทึกสาขาการไฟฟ้า' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

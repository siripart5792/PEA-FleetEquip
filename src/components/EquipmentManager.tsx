import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Lock, ShieldCheck, Shield, Wrench, FileText, Cpu, Package, AlertCircle, X, Check } from 'lucide-react';
import { MasterEquipment, EquipmentCategory, UserRole, Vehicle } from '../types/fleet';

interface EquipmentManagerProps {
  masterEquipment: MasterEquipment[];
  vehicles: Vehicle[];
  role: UserRole;
  onOpenAdminLogin: () => void;
  onAddEquipment: (newEquip: Omit<MasterEquipment, 'id'>) => void;
  onUpdateEquipment: (id: string, updated: Partial<MasterEquipment>) => void;
  onDeleteEquipment: (id: string) => void;
}

export const EquipmentManager: React.FC<EquipmentManagerProps> = ({
  masterEquipment,
  vehicles,
  role,
  onOpenAdminLogin,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('safety');
  const [description, setDescription] = useState('');
  const [isRequiredDefault, setIsRequiredDefault] = useState(false);

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
            การเพิ่ม ลบ หรือแก้ไขรายการอุปกรณ์มาตรฐานประจำรถ ต้องได้รับสิทธิ์จากผู้ดูแลระบบ
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenAdminLogin}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs inline-flex items-center gap-2"
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
    setCode(`EQ-${String(masterEquipment.length + 1).padStart(2, '0')}`);
    setCategory('safety');
    setDescription('');
    setIsRequiredDefault(false);
  };

  const openEditModal = (item: MasterEquipment) => {
    setModalMode('edit');
    setEditingId(item.id);
    setName(item.name);
    setCode(item.code);
    setCategory(item.category);
    setDescription(item.description);
    setIsRequiredDefault(item.isRequiredDefault);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณากรอกชื่ออุปกรณ์');
      return;
    }

    if (modalMode === 'add') {
      onAddEquipment({
        name: name.trim(),
        code: code.trim() || `EQ-${Date.now().toString().slice(-3)}`,
        category,
        description: description.trim(),
        isRequiredDefault,
      });
    } else if (modalMode === 'edit' && editingId) {
      onUpdateEquipment(editingId, {
        name: name.trim(),
        code: code.trim(),
        category,
        description: description.trim(),
        isRequiredDefault,
      });
    }

    setModalMode(null);
  };

  const getCategoryIcon = (cat: EquipmentCategory) => {
    switch (cat) {
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

  const getCategoryLabel = (cat: EquipmentCategory) => {
    switch (cat) {
      case 'safety':
        return 'ความปลอดภัย';
      case 'emergency':
        return 'เครื่องมือฉุกเฉิน';
      case 'documents':
        return 'เอกสารประจำรถ';
      case 'electronics':
        return 'อุปกรณ์ไฟฟ้า/สื่อสาร';
      default:
        return 'อุปกรณ์ทั่วไป';
    }
  };

  const filteredEquipment = masterEquipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate vehicle count using this equipment
  const getUsageCount = (equipId: string) => {
    return vehicles.filter((v) => v.assignedEquipmentIds.includes(equipId)).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            จัดการรายการอุปกรณ์ประจำรถ ({masterEquipment.length} รายการ)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            เพิ่ม ลบ หรือแก้ไขรายการอุปกรณ์ที่สามารถเลือกผูกกับรถแต่ละคันในระบบ
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มอุปกรณ์ใหม่</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่ออุปกรณ์, รหัส, วิธีการตรวจ..."
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setSelectedCategory('safety')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === 'safety'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ความปลอดภัย
          </button>
          <button
            onClick={() => setSelectedCategory('emergency')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === 'emergency'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เครื่องมือฉุกเฉิน
          </button>
          <button
            onClick={() => setSelectedCategory('documents')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === 'documents'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เอกสารประจำรถ
          </button>
          <button
            onClick={() => setSelectedCategory('electronics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === 'electronics'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ไฟฟ้า/สื่อสาร
          </button>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-24">รหัส</th>
                <th className="py-3 px-4">ชื่ออุปกรณ์ประจำรถ</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">ข้อแนะนำ / จุดตรวจเช็ค</th>
                <th className="py-3 px-4 text-center">ผูกกับรถ</th>
                <th className="py-3 px-4 text-center">ค่าเริ่มต้น</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ไม่พบรายการอุปกรณ์ที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((eq) => {
                  const usage = getUsageCount(eq.id);
                  return (
                    <tr key={eq.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">
                        {eq.code}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {eq.name}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                          {getCategoryIcon(eq.category)}
                          <span>{getCategoryLabel(eq.category)}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-500 max-w-xs">
                        {eq.description || '-'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          {usage} คัน
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {eq.isRequiredDefault ? (
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            จำเป็น
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            ตามรุ่น
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(eq)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไขรายการอุปกรณ์"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(eq.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="ลบอุปกรณ์ออกจากระบบ"
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
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">ยืนยันการลบรายการอุปกรณ์?</h3>
              <p className="text-xs text-slate-500 mt-1">
                รายการอุปกรณ์นี้จะถูกนำออกจากรายการตรวจของรถที่ผูกไว้ทั้งหมด
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteEquipment(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Equipment Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === 'add' ? 'เพิ่มรายการอุปกรณ์ประจำรถใหม่' : 'แก้ไขรายการอุปกรณ์ประจำรถ'}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสอุปกรณ์
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="เช่น EQ-15"
                  className="w-full text-sm font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่ออุปกรณ์ประจำรถ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น สายลากจูงรถฉุกเฉิน, ชุดปะยางฉุกเฉิน"
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมวดหมู่อุปกรณ์
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="safety">ความปลอดภัย (ถังดับเพลิง, ป้ายสามเหลี่ยม, เสื้อกั๊ก)</option>
                  <option value="emergency">เครื่องมือฉุกเฉิน (ยางอะไหล่, แม่แรง, สายพ่วง)</option>
                  <option value="documents">เอกสารประจำรถ (สมุด พ.ร.บ., บัตรน้ำมัน)</option>
                  <option value="electronics">อุปกรณ์ไฟฟ้า/สื่อสาร (กล้องหน้ารถ, วอร์สื่อสาร)</option>
                  <option value="general">ทั่วไป</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำแนะนำ / วิธีการตรวจเช็คสภาพ
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เช่น ตรวจสอบความสมบูรณ์ ไม่มีรอยฉีกขาด และเก็บในตำแหน่งที่หยิบใช้ง่าย"
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70">
                  <input
                    type="checkbox"
                    checked={isRequiredDefault}
                    onChange={(e) => setIsRequiredDefault(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      กำหนดให้เป็น &quot;อุปกรณ์จำเป็นเริ่มต้น&quot;
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      เมื่อเพิ่มรถคันใหม่เข้าระบบ อุปกรณ์นี้จะถูกติ๊กเลือกให้โดยอัตโนมัติ
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  {modalMode === 'add' ? 'บันทึกอุปกรณ์' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

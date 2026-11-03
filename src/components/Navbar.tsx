import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, Unlock, Building2 } from 'lucide-react';
import { UserRole } from '../types/fleet';

interface NavbarProps {
  currentTab: 'daily' | 'history' | 'line' | 'vehicles' | 'equipment' | 'branches';
  onSelectTab: (tab: 'daily' | 'history' | 'line' | 'vehicles' | 'equipment' | 'branches') => void;
  role: UserRole;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  pendingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  role,
  onOpenAdminLogin,
  onLogoutAdmin,
  pendingCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Brand wordmark with PEA Identity */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onSelectTab('daily')}
              className="text-left font-bold text-lg sm:text-xl tracking-tight text-purple-900 whitespace-nowrap shrink-0 hover:text-purple-700 transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <img
                src="/favicon.svg"
                alt="PEA FleetEquip Logo"
                className="w-9 h-9 rounded-xl shadow-xs"
              />
              <span className="flex items-baseline gap-1">
                <span className="text-purple-900 font-black">PEA</span>
                <span className="text-slate-800 font-bold">FleetEquip</span>
              </span>
            </button>
            <span className="hidden xl:inline-block text-xs font-medium text-slate-500 border-l border-slate-200 pl-2.5 whitespace-nowrap">
              ระบบตรวจอุปกรณ์ประจำรถ การไฟฟ้าส่วนภูมิภาค
            </span>
          </div>

          {/* Zone 2: Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('daily')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'daily'
                  ? 'text-purple-800 bg-purple-50 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              ตรวจเช็คประจำวัน
            </button>

            <button
              onClick={() => onSelectTab('history')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'history'
                  ? 'text-purple-800 bg-purple-50 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              ประวัติตรวจเช็ค
            </button>

            <button
              onClick={() => onSelectTab('line')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'line'
                  ? 'text-emerald-700 bg-emerald-50 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>แจ้งเตือน LINE</span>
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-rose-500 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('vehicles')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                currentTab === 'vehicles'
                  ? 'text-purple-800 bg-purple-50 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>จัดการรถยนต์</span>
              {role !== 'admin' && <Lock className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={() => onSelectTab('equipment')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                currentTab === 'equipment'
                  ? 'text-purple-800 bg-purple-50 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>จัดการอุปกรณ์</span>
              {role !== 'admin' && <Lock className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={() => onSelectTab('branches')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                currentTab === 'branches'
                  ? 'text-purple-800 bg-purple-50 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>สาขาการไฟฟ้า</span>
              {role !== 'admin' && <Lock className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action (Role Indicator / Toggle) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {role === 'admin' ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-purple-800 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-200">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>ผู้ดูแลระบบ</span>
                </div>
                <button
                  onClick={onLogoutAdmin}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                  title="ออกจากโหมดผู้ดูแลระบบ"
                >
                  <Unlock className="w-3.5 h-3.5 text-slate-500" />
                  <span>ออกโหมดแอดมิน</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                <span>เข้าสู่ระบบผู้ดูแล</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center overflow-x-auto py-2 border-t border-slate-100 text-xs font-medium text-slate-600 gap-1.5 scrollbar-none">
          <button
            onClick={() => onSelectTab('daily')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap cursor-pointer ${
              currentTab === 'daily' ? 'text-purple-800 bg-purple-50 font-semibold' : ''
            }`}
          >
            ตรวจประจำวัน
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap cursor-pointer ${
              currentTab === 'history' ? 'text-purple-800 bg-purple-50 font-semibold' : ''
            }`}
          >
            ประวัติ
          </button>
          <button
            onClick={() => onSelectTab('line')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              currentTab === 'line' ? 'text-emerald-700 bg-emerald-50 font-semibold' : ''
            }`}
          >
            <span>แจ้งเตือน LINE</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 text-[10px] flex items-center justify-center font-bold text-white bg-rose-500 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('vehicles')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              currentTab === 'vehicles' ? 'text-purple-800 bg-purple-50 font-semibold' : ''
            }`}
          >
            <span>จัดการรถ</span>
            {role !== 'admin' && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
          <button
            onClick={() => onSelectTab('equipment')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              currentTab === 'equipment' ? 'text-purple-800 bg-purple-50 font-semibold' : ''
            }`}
          >
            <span>จัดการอุปกรณ์</span>
            {role !== 'admin' && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
          <button
            onClick={() => onSelectTab('branches')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              currentTab === 'branches' ? 'text-purple-800 bg-purple-50 font-semibold' : ''
            }`}
          >
            <span>สาขา กฟภ.</span>
            {role !== 'admin' && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};

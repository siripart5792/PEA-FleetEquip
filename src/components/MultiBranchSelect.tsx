import React, { useState, useRef, useEffect } from 'react';
import { Building2, Check, ChevronDown, X, CheckSquare, Square, Search } from 'lucide-react';
import { PeaBranch } from '../types/fleet';

interface MultiBranchSelectProps {
  branches: PeaBranch[];
  selectedBranchIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
  placeholder?: string;
}

export const MultiBranchSelect: React.FC<MultiBranchSelectProps> = ({
  branches,
  selectedBranchIds,
  onChange,
  className = '',
  placeholder = 'เลือกสาขาการไฟฟ้า',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isAllSelected =
    selectedBranchIds.length === 0 ||
    selectedBranchIds.includes('all') ||
    selectedBranchIds.length === branches.length;

  const handleToggleBranch = (branchId: string) => {
    if (isAllSelected) {
      // If was 'all', switching to single selection
      onChange([branchId]);
      return;
    }

    if (selectedBranchIds.includes(branchId)) {
      const next = selectedBranchIds.filter((id) => id !== branchId);
      onChange(next.length === 0 ? [] : next);
    } else {
      const next = [...selectedBranchIds, branchId];
      if (next.length === branches.length) {
        onChange([]); // Empty represents all selected
      } else {
        onChange(next);
      }
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const handleClear = () => {
    if (branches.length > 0) {
      // Keep at least one or select empty
      onChange([branches[0].id]);
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Display label
  const getDisplayLabel = () => {
    if (isAllSelected) {
      return `ทุกสาขาการไฟฟ้า (${branches.length})`;
    }
    if (selectedBranchIds.length === 1) {
      const b = branches.find((item) => item.id === selectedBranchIds[0]);
      return b ? `${b.code} - ${b.name}` : placeholder;
    }
    return `เลือกแล้ว ${selectedBranchIds.length} สาขา`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-900 flex items-center justify-between gap-2 shadow-2xs hover:border-purple-400 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-4 h-4 text-purple-700 shrink-0" />
          <span className="truncate">{getDisplayLabel()}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isAllSelected && (
            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full">
              {selectedBranchIds.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-100 min-w-[280px]">
          {/* Top Quick Actions */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>เลือกหลายสาขา</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({isAllSelected ? branches.length : selectedBranchIds.length}/{branches.length})
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  isAllSelected
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                เลือกทั้งหมด
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-0.5 rounded text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ล้าง
              </button>
            </div>
          </div>

          {/* Search box inside dropdown */}
          {branches.length > 4 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อสาขา..."
                className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Branch Checkbox List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {filteredBranches.map((branch) => {
              const isChecked = isAllSelected || selectedBranchIds.includes(branch.id);
              return (
                <div
                  key={branch.id}
                  onClick={() => handleToggleBranch(branch.id)}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center gap-2.5 select-none ${
                    isChecked
                      ? 'bg-purple-50/70 border-purple-200 text-purple-950 font-medium'
                      : 'bg-white border-transparent text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-purple-700" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs truncate">{branch.name}</span>
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-100/60 px-1 py-0.2 rounded shrink-0">
                        {branch.code}
                      </span>
                    </div>
                    {branch.region && (
                      <span className="text-[10px] text-slate-400 block truncate">
                        {branch.region}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Done button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {isAllSelected
                ? 'กำลังแสดงรถทุกสาขา'
                : `เลือกแล้ว ${selectedBranchIds.length} สาขา`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

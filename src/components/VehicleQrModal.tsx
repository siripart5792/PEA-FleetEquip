import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Car, 
  Building2, 
  Layers, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { Vehicle, PeaBranch } from '../types/fleet';

interface VehicleQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  branches: PeaBranch[];
  initialVehicle?: Vehicle | null;
  onSelectVehicleForInspection?: (vehicle: Vehicle) => void;
}

export const VehicleQrModal: React.FC<VehicleQrModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  branches,
  initialVehicle,
  onSelectVehicleForInspection,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'single' | 'batch'>('single');
  const [batchBranchId, setBatchBranchId] = useState<string>('all');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [batchQrUrls, setBatchQrUrls] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Set initial selected vehicle when opened
  useEffect(() => {
    if (initialVehicle) {
      setSelectedVehicleId(initialVehicle.id);
      setViewMode('single');
    } else if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [initialVehicle, vehicles, isOpen]);

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Helper to construct the inspection URL
  const getInspectionUrl = (vehicle: Vehicle) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?action=inspect&vehicleId=${encodeURIComponent(vehicle.id)}&plate=${encodeURIComponent(vehicle.plateNumber)}`;
  };

  // Generate single QR Code data URL
  useEffect(() => {
    if (!currentVehicle || !isOpen) return;

    const url = getInspectionUrl(currentVehicle);
    QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1e1b4b', // deep indigo/purple PEA theme
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
      });
  }, [currentVehicle, isOpen]);

  // Generate batch QR Code data URLs
  useEffect(() => {
    if (viewMode !== 'batch' || !isOpen) return;

    const targetVehicles = vehicles.filter((v) => {
      if (v.status !== 'active') return false;
      if (batchBranchId === 'all') return true;
      return v.peaBranchId === batchBranchId;
    });

    const generateBatch = async () => {
      const urls: Record<string, string> = {};
      for (const veh of targetVehicles) {
        try {
          const directUrl = getInspectionUrl(veh);
          const dataUrl = await QRCode.toDataURL(directUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#1e1b4b',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          });
          urls[veh.id] = dataUrl;
        } catch (e) {
          console.error('Error generating QR for vehicle', veh.plateNumber, e);
        }
      }
      setBatchQrUrls(urls);
    };

    generateBatch();
  }, [viewMode, batchBranchId, vehicles, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!currentVehicle) return;
    const url = getInspectionUrl(currentVehicle);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !currentVehicle) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_ตรวจอุปกรณ์_${currentVehicle.plateNumber}_${currentVehicle.province}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredBatchVehicles = vehicles.filter((v) => {
    if (v.status !== 'active') return false;
    if (batchBranchId === 'all') return true;
    return v.peaBranchId === batchBranchId;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0 print:z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* Modal Header (Hidden during print) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-purple-50/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>คิวอาร์โค้ดติดหน้ารถสำหรับตรวจอุปกรณ์</span>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                  สแกนแล้วเข้าตรวจทันที
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                นำ QR Code ไปพิมพ์สติกเกอร์ติดหน้ารถหรือคอนโซลหน้ารถ ให้พนักงานสแกนด้วยโทรศัพท์มือถือ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Switcher (Hidden during print) */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'single'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>พิมพ์รายคัน</span>
            </button>
            <button
              onClick={() => setViewMode('batch')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'batch'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>พิมพ์รวมทุกลำดับ ({filteredBatchVehicles.length} คัน)</span>
            </button>
          </div>

          {viewMode === 'single' ? (
            <div className="flex items-center gap-2">
              <label htmlFor="vehicle-select" className="text-xs text-slate-500 font-medium hidden sm:inline">
                เลือกรถ:
              </label>
              <select
                id="vehicle-select"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="text-xs font-mono font-semibold py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} ({v.province}) - {v.brand} [{v.peaBranchName || 'PEA'}]
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={batchBranchId}
                onChange={(e) => setBatchBranchId(e.target.value)}
                className="text-xs font-semibold py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">ทุกสาขาการไฟฟ้า ({vehicles.filter(v => v.status === 'active').length} คัน)</option>
                {branches.map((b) => {
                  const count = vehicles.filter((v) => v.status === 'active' && v.peaBranchId === b.id).length;
                  return (
                    <option key={b.id} value={b.id}>
                      {b.name} ({count} คัน)
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div ref={printContainerRef} className="p-6 overflow-y-auto flex-1 bg-slate-100/60 print:p-0 print:bg-white print:overflow-visible">
          {viewMode === 'single' && currentVehicle ? (
            <div className="max-w-md mx-auto space-y-5 print:max-w-none">
              
              {/* Printable Windshield Card */}
              <div 
                id="printable-vehicle-card" 
                className="bg-white rounded-2xl border-2 border-purple-900 shadow-md p-6 text-center space-y-4 relative overflow-hidden print:border-2 print:border-black print:rounded-xl print:shadow-none print:page-break-inside-avoid print:m-4"
              >
                {/* Purple decorative top bar */}
                <div className="absolute top-0 left-0 right-0 h-3 bg-purple-700 print:bg-black" />
                
                {/* Header with PEA Branding */}
                <div className="pt-2 flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2 text-left">
                    <img src="/favicon.svg" alt="PEA Logo" className="w-8 h-8 rounded-md shrink-0 shadow-2xs" />
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-purple-950 uppercase tracking-tight print:text-black">
                        การไฟฟ้าส่วนภูมิภาค (PEA)
                      </h3>
                      <p className="text-[11px] font-semibold text-purple-700 truncate max-w-[220px] print:text-black">
                        {currentVehicle.peaBranchName || 'การไฟฟ้าส่วนภูมิภาค'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold tracking-wider text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded uppercase print:border-black print:text-black">
                    VEHICLE CHECK
                  </span>
                </div>

                {/* License Plate Display (Authentic Thai license plate style) */}
                <div className="bg-slate-50 border-2 border-slate-800 rounded-xl p-3 shadow-inner my-2">
                  <div className="font-mono text-3xl font-black text-slate-900 tracking-wider">
                    {currentVehicle.plateNumber}
                  </div>
                  <div className="text-xs font-bold text-slate-700 tracking-wide mt-0.5">
                    {currentVehicle.province}
                  </div>
                </div>

                {/* QR Code Canvas/Image */}
                <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code ${currentVehicle.plateNumber}`}
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-400">
                      กำลังสร้าง QR Code...
                    </div>
                  )}
                  <p className="text-xs font-bold text-slate-800 mt-2">
                    สแกนเพื่อเริ่มตรวจอุปกรณ์ประจำรถ
                  </p>
                  <p className="text-[11px] text-slate-500">
                    เปิดหน้าตรวจเช็คของรถคันนี้ทันที ไม่ต้องค้นหา
                  </p>
                </div>

                {/* Vehicle Specs Footer */}
                <div className="pt-2 border-t border-slate-200 text-left grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">รุ่น/ยี่ห้อ:</span>
                    <strong className="text-slate-800">{currentVehicle.brand}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">แผนก/สังกัด:</span>
                    <strong className="text-slate-800 truncate block">{currentVehicle.department}</strong>
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 text-center tracking-tight print:text-black">
                  ระบบตรวจสอบความพร้อมอุปกรณ์ประจำรถ PEA Fleet Safety System
                </div>
              </div>

              {/* Action Buttons for Single Mode (Hidden during print) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 print:hidden">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>ตัวเลือกการใช้งาน</span>
                  <span className="text-slate-400 font-normal">ความละเอียดสูงพร้อมพิมพ์</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>พิมพ์การ์ดหน้ารถ</span>
                  </button>

                  <button
                    onClick={handleDownloadQr}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>บันทึกรูป QR (PNG)</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">คัดลอกแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span>คัดลอกลิงก์ตรง</span>
                      </>
                    )}
                  </button>
                </div>

                {onSelectVehicleForInspection && (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectVehicleForInspection(currentVehicle);
                    }}
                    className="w-full mt-2 py-2 text-xs font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>ทดลองเปิดแบบฟอร์มตรวจเช็คคันนี้ ({currentVehicle.plateNumber})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Batch Multi-Card Grid View (Optimized for A4 printing) */
            <div className="space-y-4">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600 print:hidden">
                <div>
                  <span className="font-semibold text-slate-800">โหมดพิมพ์หลายคันพร้อมกัน:</span>{' '}
                  แสดง {filteredBatchVehicles.length} คัน (จัดเรียง 2 คอลัมน์ เหมาะสำหรับกระดาษ A4)
                </div>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์ทั้งหมด</span>
                </button>
              </div>

              {/* Grid Cards for Printing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print:m-0">
                {filteredBatchVehicles.map((veh) => {
                  const dataUrl = batchQrUrls[veh.id];
                  return (
                    <div
                      key={veh.id}
                      className="bg-white rounded-xl border-2 border-purple-900 p-4 text-center space-y-3 relative overflow-hidden shadow-xs print:border-2 print:border-black print:rounded-lg print:shadow-none print:page-break-inside-avoid"
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-1.5 text-left">
                          <img src="/favicon.svg" alt="PEA" className="w-5 h-5 rounded" />
                          <span className="font-bold text-xs text-purple-950 uppercase print:text-black">
                            PEA {veh.peaBranchName || 'การไฟฟ้าส่วนภูมิภาค'}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 print:text-black print:border-black">
                          ตรวจอุปกรณ์
                        </span>
                      </div>

                      {/* License plate */}
                      <div className="bg-slate-50 border border-slate-800 rounded-lg py-1.5 px-2">
                        <div className="font-mono text-xl font-black text-slate-900 leading-tight">
                          {veh.plateNumber}
                        </div>
                        <div className="text-[10px] font-bold text-slate-700">
                          {veh.province} · {veh.brand}
                        </div>
                      </div>

                      {/* QR */}
                      <div className="flex flex-col items-center justify-center">
                        {dataUrl ? (
                          <img
                            src={dataUrl}
                            alt={veh.plateNumber}
                            className="w-36 h-36 object-contain"
                          />
                        ) : (
                          <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                            กำลังโหลด QR...
                          </div>
                        )}
                        <p className="text-[11px] font-bold text-slate-800 mt-1">
                          สแกนเพื่อตรวจเช็คอุปกรณ์ประจำรถ
                        </p>
                      </div>

                      <div className="text-[9px] text-slate-500 border-t border-slate-100 pt-1 flex justify-between">
                        <span className="truncate max-w-[120px]">{veh.department}</span>
                        <span>PEA Safety</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer (Hidden during print) */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            💡 แนะนำ: พิมพ์ลงบนกระดาษสติกเกอร์หรือเคลือบพลาสติก ติดไว้ที่กระจกหน้ารถฝั่งคนขับ หรือแผงคอนโซลหน้ารถ
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { getAdminPin, setAdminPin } from '../utils/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPin = getAdminPin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === currentPin) {
      setError(false);
      onSuccess();
      onClose();
    } else {
      setError(true);
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      alert('รหัส PIN ต้องมีความยาวอย่างน้อย 4 หลัก');
      return;
    }
    if (newPin !== confirmNewPin) {
      alert('รหัส PIN ใหม่ไม่ตรงกัน');
      return;
    }
    setAdminPin(newPin);
    setChangeSuccess(true);
    setTimeout(() => {
      setIsChangingPin(false);
      setChangeSuccess(false);
      setPin(newPin);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isChangingPin ? 'เปลี่ยนรหัส Admin PIN' : 'เข้าสู่ระบบผู้ดูแลระบบ'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isChangingPin ? (
          <form onSubmit={handleLogin} className="pt-4 space-y-4">
            <p className="text-xs text-slate-600">
              กรุณากรอกรหัส PIN 4 หลัก เพื่อปลดล็อกสิทธิ์การจัดการข้อมูลรถยนต์และอุปกรณ์
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสผ่าน PIN ผู้ดูแล
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  maxLength={8}
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="กรอกรหัส PIN"
                  className={`w-full text-center font-mono tracking-widest text-lg pl-9 pr-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                    error
                      ? 'border-rose-400 ring-2 ring-rose-300 bg-rose-50'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
              </div>
              {error && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>รหัส PIN ไม่ถูกต้อง</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
              >
                เข้าสู่ระบบผู้ดูแล
              </button>

              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                className="text-xs text-slate-500 hover:text-slate-800 text-center py-1 cursor-pointer"
              >
                ตั้งค่าเปลี่ยนรหัส PIN ใหม่
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePin} className="pt-4 space-y-4">
            {changeSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-semibold">
                เปลี่ยนรหัส PIN สำเร็จเรียบร้อย!
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัส PIN ใหม่ (อย่างน้อย 4 หลัก)
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="เช่น 5678"
                    className="w-full text-center font-mono text-base px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ยืนยันรหัส PIN ใหม่อีกครั้ง
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={8}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value)}
                    placeholder="ยืนยันรหัส PIN"
                    className="w-full text-center font-mono text-base px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="flex-1 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700"
                  >
                    บันทึก PIN ใหม่
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

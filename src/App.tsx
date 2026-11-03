/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { GoogleSheetsBar } from './components/GoogleSheetsBar';
import { DailyInspectionView } from './components/DailyInspectionView';
import { HistoryView } from './components/HistoryView';
import { VehicleManager } from './components/VehicleManager';
import { EquipmentManager } from './components/EquipmentManager';
import { BranchManager } from './components/BranchManager';
import { DailyInspectionModal } from './components/DailyInspectionModal';
import { InspectionDetailModal } from './components/InspectionDetailModal';
import { LineReminderModal } from './components/LineReminderModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ToastContainer, ToastMessage } from './components/Toast';

import {
  Vehicle,
  MasterEquipment,
  InspectionRecord,
  PeaBranch,
  UserRole,
} from './types/fleet';

import {
  loadVehicles,
  saveVehicles,
  loadMasterEquipment,
  saveMasterEquipment,
  loadPeaBranches,
  savePeaBranches,
  loadInspections,
  saveInspections,
  getAdminPin,
  setAdminPin,
  getTodayStatusCounts,
  resetAllDataToDefault,
} from './utils/storage';
import {
  normalizeToThailandDate,
  normalizeToThailandTime,
  formatThaiDate,
  formatThaiTime,
} from './utils/thaiDate';

import {
  initGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
  findOrCreateSpreadsheet,
  fetchAllFromGoogleSheets,
  pushAllToGoogleSheets,
  getCurrentToken,
  getStoredSpreadsheetId,
  setStoredSpreadsheetId,
  getStoredWebAppUrl,
  setStoredWebAppUrl,
  fetchFromWebApp,
  pushToWebApp,
  postToWebAppAction,
  extractSheetId,
} from './services/googleSheets';

import { GoogleAppsScriptModal } from './components/GoogleAppsScriptModal';
import { generateLinePendingAlertMessage } from './utils/lineMessage';
import { RefreshCw, Building2 } from 'lucide-react';
import { User } from 'firebase/auth';

export default function App() {
  const [branches, setBranches] = useState<PeaBranch[]>(() => loadPeaBranches());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadVehicles());
  const [masterEquipment, setMasterEquipment] = useState<MasterEquipment[]>(() =>
    loadMasterEquipment()
  );
  const [records, setRecords] = useState<InspectionRecord[]>(() => loadInspections());

  const [currentTab, setCurrentTab] = useState<'daily' | 'history' | 'line' | 'vehicles' | 'equipment' | 'branches'>('daily');
  const [role, setRole] = useState<UserRole>('user');

  // Google Sheets integration state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [webAppUrl, setWebAppUrl] = useState<string | null>(() => getStoredWebAppUrl());
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => getStoredSpreadsheetId());
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    const id = getStoredSpreadsheetId();
    return id ? `https://docs.google.com/spreadsheets/d/${id}` : null;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [appsScriptModalOpen, setAppsScriptModalOpen] = useState(false);

  // Modals
  const [inspectingVehicle, setInspectingVehicle] = useState<Vehicle | null>(null);
  const [viewingRecord, setViewingRecord] = useState<InspectionRecord | null>(null);
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);

  // Quick copy feedback
  const [quickCopied, setQuickCopied] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Status counts
  const { pendingCount } = getTodayStatusCounts(vehicles, records);

  // Refs to store current values for callbacks without causing re-render loops
  const branchesRef = useRef(branches);
  branchesRef.current = branches;
  const equipmentRef = useRef(masterEquipment);
  equipmentRef.current = masterEquipment;
  const vehiclesRef = useRef(vehicles);
  vehiclesRef.current = vehicles;
  const recordsRef = useRef(records);
  recordsRef.current = records;
  const webAppUrlRef = useRef(webAppUrl);
  webAppUrlRef.current = webAppUrl;
  const googleTokenRef = useRef(googleToken);
  googleTokenRef.current = googleToken;
  const spreadsheetIdRef = useRef(spreadsheetId);
  spreadsheetIdRef.current = spreadsheetId;
  const isSyncingRef = useRef(false);

  // Google Sheets: Push data to sheets helper (handles Web App API and/or OAuth)
  const pushCurrentStateToSheets = useCallback(
    async (
      customData?: {
        b?: PeaBranch[];
        e?: MasterEquipment[];
        v?: Vehicle[];
        r?: InspectionRecord[];
      },
      actionInfo?: {
        action: string;
        payload?: any;
      }
    ) => {
      const payload = {
        branches: customData?.b || branchesRef.current,
        equipment: customData?.e || equipmentRef.current,
        vehicles: customData?.v || vehiclesRef.current,
        records: customData?.r || recordsRef.current,
        adminPin: getAdminPin(),
      };

      const currentWebAppUrl = webAppUrlRef.current;
      const currentToken = googleTokenRef.current || getCurrentToken();
      const currentSheetId = spreadsheetIdRef.current;

      // 1. If Web App URL is configured, push via Google Apps Script Web App immediately
      if (currentWebAppUrl) {
        setIsSyncing(true);
        isSyncingRef.current = true;
        try {
          if (actionInfo) {
            await postToWebAppAction(currentWebAppUrl, actionInfo.action, actionInfo.payload);
          }
          await pushToWebApp(currentWebAppUrl, payload);
          const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          setLastSyncTime(timeStr);
          setSyncError(null);
        } catch (err: any) {
          console.warn('Web App push error:', err);
        } finally {
          setIsSyncing(false);
          isSyncingRef.current = false;
        }
      }

      // 2. If OAuth token & sheetId are available, also push via Google Sheets API
      if (currentToken && currentSheetId) {
        setIsSyncing(true);
        isSyncingRef.current = true;
        try {
          await pushAllToGoogleSheets(currentToken, currentSheetId, payload);
          const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          setLastSyncTime(timeStr);
          setSyncError(null);
        } catch (err: any) {
          console.warn('Failed to push to Google Sheets:', err);
        } finally {
          setIsSyncing(false);
          isSyncingRef.current = false;
        }
      }
    },
    []
  );

  /**
   * Fetch from Google Sheets
   * Syncs ONLY when clicked or operated by user, never in a continuous background loop
   */
  const syncFromGoogleSheets = useCallback(
    async (showSuccessToast = false) => {
      if (isSyncingRef.current) return;

      const currentWebAppUrl = webAppUrlRef.current;
      const currentToken = googleTokenRef.current || getCurrentToken();
      const currentSheetId = spreadsheetIdRef.current;

      // 1. If Web App URL is configured, prioritize Apps Script Web App
      if (currentWebAppUrl) {
        setIsSyncing(true);
        isSyncingRef.current = true;
        setSyncError(null);
        try {
          const data = await fetchFromWebApp(currentWebAppUrl);
          if (data.hasData) {
            if (data.branches && data.branches.length > 0) {
              setBranches(data.branches);
              savePeaBranches(data.branches);
            }
            if (data.equipment && data.equipment.length > 0) {
              setMasterEquipment(data.equipment);
              saveMasterEquipment(data.equipment);
            }
            if (data.vehicles && data.vehicles.length > 0) {
              setVehicles(data.vehicles);
              saveVehicles(data.vehicles);
            }
            if (data.records && data.records.length > 0) {
              const cleanRecords = data.records.map((r) => ({
                ...r,
                inspectionDate: normalizeToThailandDate(r.inspectionDate),
                inspectionTime: normalizeToThailandTime(r.inspectionTime),
              }));
              setRecords(cleanRecords);
              saveInspections(cleanRecords);
            }
            if (data.adminPin) {
              setAdminPin(data.adminPin);
            }
          }
          const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          setLastSyncTime(timeStr);
          if (showSuccessToast) {
            addToast('success', 'ซิงค์ข้อมูลผ่าน Google Apps Script สำเร็จ', `อัปเดตข้อมูลล่าสุดเมื่อเวลา ${timeStr} น.`);
          }
          return;
        } catch (webAppErr: any) {
          console.warn('Apps Script Web App sync failed:', webAppErr);
          setSyncError(webAppErr.message || 'ไม่สามารถซิงค์ผ่าน Web App API ได้');
        } finally {
          setIsSyncing(false);
          isSyncingRef.current = false;
        }
      }

      if (!currentToken) return;

      setIsSyncing(true);
      isSyncingRef.current = true;
      setSyncError(null);

      try {
        // Ensure spreadsheet exists or locate it
        const sheetInfo = await findOrCreateSpreadsheet(currentToken, currentSheetId || undefined);
        setSpreadsheetId(sheetInfo.id);
        setSpreadsheetUrl(sheetInfo.url);

        if (sheetInfo.isNew) {
          // New sheet created: push initial dataset up immediately
          await pushAllToGoogleSheets(currentToken, sheetInfo.id, {
            branches: branchesRef.current,
            equipment: equipmentRef.current,
            vehicles: vehiclesRef.current,
            records: recordsRef.current,
            adminPin: getAdminPin(),
          });
          const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          setLastSyncTime(timeStr);
          if (showSuccessToast) {
            addToast('success', 'สร้าง Google Sheets ใหม่อัตโนมัติสำเร็จ!', 'ข้อมูลทั้งหมดถูกอัปโหลดขึ้นสเปรดชีตเรียบร้อย');
          }
          return;
        }

        // Fetch all 5 tables from Google Sheets
        const data = await fetchAllFromGoogleSheets(currentToken, sheetInfo.id);

        if (data.hasData) {
          if (data.branches && data.branches.length > 0) {
            setBranches(data.branches);
            savePeaBranches(data.branches);
          }
          if (data.equipment && data.equipment.length > 0) {
            setMasterEquipment(data.equipment);
            saveMasterEquipment(data.equipment);
          }
          if (data.vehicles && data.vehicles.length > 0) {
            setVehicles(data.vehicles);
            saveVehicles(data.vehicles);
          }
          if (data.records && data.records.length > 0) {
            const cleanRecords = data.records.map((r) => ({
              ...r,
              inspectionDate: normalizeToThailandDate(r.inspectionDate),
              inspectionTime: normalizeToThailandTime(r.inspectionTime),
            }));
            setRecords(cleanRecords);
            saveInspections(cleanRecords);
          }
          if (data.adminPin) {
            setAdminPin(data.adminPin);
          }
        } else {
          // Sheets were empty, populate with local data
          await pushAllToGoogleSheets(currentToken, sheetInfo.id, {
            branches: branchesRef.current,
            equipment: equipmentRef.current,
            vehicles: vehiclesRef.current,
            records: recordsRef.current,
            adminPin: getAdminPin(),
          });
        }

        const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(timeStr);

        if (showSuccessToast) {
          addToast('success', 'ซิงค์ข้อมูลกับ Google Sheets สำเร็จ', `อัปเดตข้อมูลล่าสุดเมื่อเวลา ${timeStr} น.`);
        }
      } catch (err: any) {
        console.error('Sync error:', err);
        setSyncError(err.message || 'ไม่สามารถซิงค์กับ Google Sheets ได้');
        if (showSuccessToast) {
          addToast('error', 'การซิงค์ข้อมูลล้มเหลว', err.message || 'โปรดตรวจสอบสิทธิ์การเข้าถึงสเปรดชีต');
        }
      } finally {
        setIsSyncing(false);
        isSyncingRef.current = false;
      }
    },
    [addToast]
  );

  // Initialize Auth on App Mount & Sync ONCE on entrance (not continuously)
  useEffect(() => {
    // Initial sync from Google Sheets on app startup (only once)
    syncFromGoogleSheets(false);

    const unsubscribe = initGoogleAuth((user, token) => {
      setGoogleUser(user);
      setGoogleToken(token);
    });

    return () => unsubscribe();
    // Empty array ensures it runs ONCE on mount, not continuously in background
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      setIsSyncing(true);
      const res = await signInWithGoogle();
      setGoogleUser(res.user);
      setGoogleToken(res.accessToken);
      addToast('success', 'เข้าสู่ระบบ Google สำเร็จ', `ยินดีต้อนรับ ${res.user.displayName || res.user.email}`);

      // Locate or create sheet and sync immediately
      const sheetInfo = await findOrCreateSpreadsheet(res.accessToken, spreadsheetId || undefined);
      setSpreadsheetId(sheetInfo.id);
      setSpreadsheetUrl(sheetInfo.url);

      // Perform initial bidirectional sync
      const data = await fetchAllFromGoogleSheets(res.accessToken, sheetInfo.id);
      if (data.hasData) {
        if (data.branches && data.branches.length > 0) {
          setBranches(data.branches);
          savePeaBranches(data.branches);
        }
        if (data.equipment && data.equipment.length > 0) {
          setMasterEquipment(data.equipment);
          saveMasterEquipment(data.equipment);
        }
        if (data.vehicles && data.vehicles.length > 0) {
          setVehicles(data.vehicles);
          saveVehicles(data.vehicles);
        }
        if (data.records && data.records.length > 0) {
          setRecords(data.records);
          saveInspections(data.records);
        }
      } else {
        await pushAllToGoogleSheets(res.accessToken, sheetInfo.id, {
          branches,
          equipment: masterEquipment,
          vehicles,
          records,
          adminPin: getAdminPin(),
        });
      }

      const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);
    } catch (err: any) {
      console.error('Google Login error:', err);
      addToast('error', 'ไม่สามารถเชื่อมต่อ Google ได้', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Logout Handler
  const handleGoogleLogout = async () => {
    try {
      await signOutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
      addToast('info', 'ออกจากระบบ Google Sheets แล้ว');
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Switch custom sheet ID
  const handleSetCustomSheetId = async (input: string) => {
    const cleanId = extractSheetId(input);
    setStoredSpreadsheetId(cleanId);
    setSpreadsheetId(cleanId);
    setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${cleanId}`);
    addToast('info', 'เปลี่ยน Google Sheet เป้าหมายแล้ว', `กำลังดึงข้อมูลจาก ${cleanId}...`);
    setTimeout(() => syncFromGoogleSheets(true), 100);
  };

  // Force Push to Sheets / Web App
  const handleForcePushToSheets = async () => {
    const token = googleToken || getCurrentToken();
    if (!token && !webAppUrl) {
      addToast('error', 'ยังไม่ได้เชื่อมต่อ Google Sheets หรือ Web App');
      return;
    }
    setIsSyncing(true);
    try {
      const payload = {
        branches,
        equipment: masterEquipment,
        vehicles,
        records,
        adminPin: getAdminPin(),
      };
      if (webAppUrl) {
        await pushToWebApp(webAppUrl, payload);
      }
      if (token && spreadsheetId) {
        await pushAllToGoogleSheets(token, spreadsheetId, payload);
      }
      const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);
      addToast('success', 'ส่งข้อมูลทั้งหมดขึ้น Google Sheets สำเร็จ!', 'ข้อมูล 5 แผ่นงานได้รับการอัปเดตเรียบร้อย');
    } catch (err: any) {
      addToast('error', 'ส่งข้อมูลล้มเหลว', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Tab navigation: Requirement "กำหนดในระบบดึงข้อมูลจากgoogle sheetsนี้ทุกครั้งที่มีการเข้าหรือเปลี่ยนหน้าหรือคลิกเมนูต่างๆในระบบ"
  const handleSelectTab = (tab: 'daily' | 'history' | 'line' | 'vehicles' | 'equipment' | 'branches') => {
    if (tab === 'line') {
      setLineModalOpen(true);
      // Trigger background sync from Google Sheets / Web App
      if (webAppUrl || googleToken || getCurrentToken()) {
        syncFromGoogleSheets(false);
      }
      return;
    }

    setCurrentTab(tab);

    // Trigger sync from Google Sheets / Web App on tab/menu change
    if (webAppUrl || googleToken || getCurrentToken()) {
      syncFromGoogleSheets(false);
    }
  };

  // Handle Quick Copy LINE alert directly
  const handleQuickCopyLine = async () => {
    const message = generateLinePendingAlertMessage(vehicles, records);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = message;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setQuickCopied(true);
      addToast(
        'success',
        'คัดลอกข้อความแจ้งเตือน LINE แล้ว!',
        'คุณสามารถนำข้อความไปวางส่งในกลุ่ม LINE การไฟฟ้าได้ทันที'
      );
      setTimeout(() => setQuickCopied(false), 2500);
    } catch (err) {
      console.error('Error copying text:', err);
      addToast('error', 'ไม่สามารถคัดลอกข้อความได้ กรุณาเปิดหน้าต่างตัวอย่างเพื่อคัดลอก');
    }
  };

  // Inspection Save (เพิ่มเป็นข้อมูลใหม่เสมอเมื่อมีการตรวจซ้ำ ไม่แก้ไขหรือเขียนทับในอันเดิมที่บันทึกไว้)
  const handleSaveInspection = (newRecord: InspectionRecord, updatedMileage: number) => {
    const uniqueId = newRecord.id && !records.some((r) => r.id === newRecord.id)
      ? newRecord.id
      : `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const sanitizedRecord: InspectionRecord = {
      ...newRecord,
      id: uniqueId,
      inspectionDate: normalizeToThailandDate(newRecord.inspectionDate),
      inspectionTime: normalizeToThailandTime(newRecord.inspectionTime),
      createdAt: newRecord.createdAt || new Date().toISOString(),
    };

    // เพิ่มเป็นรายการใหม่ไว้บนสุดเสมอ เก็บประวัติทุกครั้งที่มีการตรวจซ้ำ
    const updatedRecords: InspectionRecord[] = [sanitizedRecord, ...records];

    setRecords(updatedRecords);
    saveInspections(updatedRecords);

    // Update vehicle mileage
    const updatedVehicles = vehicles.map((v) =>
      v.id === sanitizedRecord.vehicleId
        ? { ...v, currentMileage: Math.max(v.currentMileage, updatedMileage) }
        : v
    );
    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);

    setInspectingVehicle(null);
    addToast(
      'success',
      `บันทึกผลการตรวจทะเบียน ${sanitizedRecord.plateNumber} สำเร็จ`,
      sanitizedRecord.overallResult === 'pass'
        ? 'อุปกรณ์ประจำรถครบถ้วน พร้อมใช้งาน (บันทึกเป็นประวัติใหม่)'
        : 'พบรายการอุปกรณ์แจ้งซ่อมหรือสูญหาย (บันทึกเป็นประวัติใหม่)'
    );

    // Sync to Google Sheets & Web App immediately
    pushCurrentStateToSheets(
      { r: updatedRecords, v: updatedVehicles },
      { action: 'saveInspection', payload: { record: sanitizedRecord, updatedMileage } }
    );
  };

  // Delete Inspection Record (Admin only)
  const handleDeleteInspection = (id: string) => {
    const recToDelete = records.find((r) => r.id === id);
    if (!recToDelete) return;

    const displayDate = formatThaiDate(recToDelete.inspectionDate);
    const displayTime = formatThaiTime(recToDelete.inspectionTime);

    if (
      !window.confirm(
        `ยืนยันการลบประวัติการตรวจเช็ค\nทะเบียน: ${recToDelete.plateNumber} (${recToDelete.province})\nวันที่ตรวจ: ${displayDate} เวลา ${displayTime}\n\nเมื่อลบแล้วจะไม่สามารถกู้คืนได้ ยืนยันหรือไม่?`
      )
    ) {
      return;
    }

    const updatedRecords = records.filter((r) => r.id !== id);
    setRecords(updatedRecords);
    saveInspections(updatedRecords);

    if (viewingRecord && viewingRecord.id === id) {
      setViewingRecord(null);
    }

    addToast('info', 'ลบประวัติการตรวจเช็คสำเร็จ', `ทะเบียน ${recToDelete.plateNumber} (${displayDate})`);

    // Sync to Google Sheets & Web App immediately
    pushCurrentStateToSheets(
      { r: updatedRecords },
      { action: 'deleteInspection', payload: { id } }
    );
  };

  // PEA Branch Management Handlers
  const handleAddBranch = (branchData: Omit<PeaBranch, 'id'>) => {
    const newBranch: PeaBranch = {
      ...branchData,
      id: `branch-${Date.now()}`,
    };
    const updated = [...branches, newBranch];
    setBranches(updated);
    savePeaBranches(updated);
    addToast('success', 'เพิ่มสาขาการไฟฟ้าสำเร็จ', newBranch.name);

    pushCurrentStateToSheets(
      { b: updated },
      { action: 'saveBranch', payload: { branch: newBranch } }
    );
  };

  const handleUpdateBranch = (id: string, updatedData: Partial<PeaBranch>) => {
    const updatedBranches = branches.map((b) => (b.id === id ? { ...b, ...updatedData } : b));
    setBranches(updatedBranches);
    savePeaBranches(updatedBranches);

    let updatedVehicles = vehicles;
    if (updatedData.name) {
      updatedVehicles = vehicles.map((v) =>
        v.peaBranchId === id ? { ...v, peaBranchName: updatedData.name! } : v
      );
      setVehicles(updatedVehicles);
      saveVehicles(updatedVehicles);
    }

    addToast('success', 'บันทึกการแก้ไขสาขาการไฟฟ้าเรียบร้อยแล้ว');

    const updatedBranch = updatedBranches.find((b) => b.id === id);
    pushCurrentStateToSheets(
      { b: updatedBranches, v: updatedVehicles },
      updatedBranch ? { action: 'saveBranch', payload: { branch: updatedBranch } } : undefined
    );
  };

  const handleDeleteBranch = (id: string) => {
    const targetBranch = branches.find((b) => b.id === id);
    const updatedBranches = branches.filter((b) => b.id !== id);
    setBranches(updatedBranches);
    savePeaBranches(updatedBranches);

    let updatedVehicles = vehicles;
    const fallbackBranch = updatedBranches[0];
    if (fallbackBranch) {
      updatedVehicles = vehicles.map((v) =>
        v.peaBranchId === id
          ? { ...v, peaBranchId: fallbackBranch.id, peaBranchName: fallbackBranch.name }
          : v
      );
      setVehicles(updatedVehicles);
      saveVehicles(updatedVehicles);
    }

    addToast('info', 'ลบสาขาการไฟฟ้าเรียบร้อยแล้ว', targetBranch?.name);

    pushCurrentStateToSheets(
      { b: updatedBranches, v: updatedVehicles },
      { action: 'deleteBranch', payload: { id } }
    );
  };

  // Vehicle Management (without custodian / phone)
  const handleAddVehicle = (newVehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...newVehicleData,
      id: `veh-${Date.now()}`,
    };
    const updated = [newVehicle, ...vehicles];
    setVehicles(updated);
    saveVehicles(updated);
    addToast('success', 'เพิ่มรถยนต์ใหม่สำเร็จ', `ทะเบียน ${newVehicle.plateNumber} (${newVehicle.peaBranchName})`);

    pushCurrentStateToSheets(
      { v: updated },
      { action: 'saveVehicle', payload: { vehicle: newVehicle } }
    );
  };

  const handleUpdateVehicle = (id: string, updatedData: Partial<Vehicle>) => {
    const updated = vehicles.map((v) => (v.id === id ? { ...v, ...updatedData } : v));
    setVehicles(updated);
    saveVehicles(updated);
    addToast('success', 'บันทึกการแก้ไขข้อมูลรถสำเร็จ');

    const updatedVehicle = updated.find((v) => v.id === id);
    pushCurrentStateToSheets(
      { v: updated },
      updatedVehicle ? { action: 'saveVehicle', payload: { vehicle: updatedVehicle } } : undefined
    );
  };

  const handleDeleteVehicle = (id: string) => {
    const target = vehicles.find((v) => v.id === id);
    const updated = vehicles.filter((v) => v.id !== id);
    setVehicles(updated);
    saveVehicles(updated);
    addToast('info', 'ลบข้อมูลรถออกจากระบบแล้ว', target ? `ทะเบียน ${target.plateNumber}` : undefined);

    pushCurrentStateToSheets(
      { v: updated },
      { action: 'deleteVehicle', payload: { id } }
    );
  };

  // Master Equipment Management
  const handleAddEquipment = (newEquipData: Omit<MasterEquipment, 'id'>) => {
    const newEquip: MasterEquipment = {
      ...newEquipData,
      id: `eq-${Date.now()}`,
    };
    const updated = [...masterEquipment, newEquip];
    setMasterEquipment(updated);
    saveMasterEquipment(updated);
    addToast('success', 'เพิ่มอุปกรณ์ใหม่สำเร็จ', newEquip.name);

    pushCurrentStateToSheets(
      { e: updated },
      { action: 'saveEquipment', payload: { equipment: newEquip } }
    );
  };

  const handleUpdateEquipment = (id: string, updatedData: Partial<MasterEquipment>) => {
    const updated = masterEquipment.map((eq) => (eq.id === id ? { ...eq, ...updatedData } : eq));
    setMasterEquipment(updated);
    saveMasterEquipment(updated);
    addToast('success', 'บันทึกการแก้ไขอุปกรณ์เรียบร้อยแล้ว');

    const updatedEquip = updated.find((eq) => eq.id === id);
    pushCurrentStateToSheets(
      { e: updated },
      updatedEquip ? { action: 'saveEquipment', payload: { equipment: updatedEquip } } : undefined
    );
  };

  const handleDeleteEquipment = (id: string) => {
    const updatedMaster = masterEquipment.filter((eq) => eq.id !== id);
    setMasterEquipment(updatedMaster);
    saveMasterEquipment(updatedMaster);

    const updatedVehicles = vehicles.map((v) => ({
      ...v,
      assignedEquipmentIds: v.assignedEquipmentIds.filter((eqId) => eqId !== id),
    }));
    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);

    addToast('info', 'ลบรายการอุปกรณ์เรียบร้อยแล้ว');

    pushCurrentStateToSheets(
      { e: updatedMaster, v: updatedVehicles },
      { action: 'deleteEquipment', payload: { id } }
    );
  };

  // Reset to factory defaults
  const handleResetData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      resetAllDataToDefault();
      const b = loadPeaBranches();
      const v = loadVehicles();
      const e = loadMasterEquipment();
      const r = loadInspections();
      setBranches(b);
      setVehicles(v);
      setMasterEquipment(e);
      setRecords(r);
      addToast('info', 'รีเซ็ตข้อมูลเป็นค่าเริ่มต้นเรียบร้อยแล้ว');

      pushCurrentStateToSheets({ b, v, e, r });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      {/* Top Google Sheets Sync Bar */}
      <GoogleSheetsBar
        role={role}
        user={googleUser}
        spreadsheetId={spreadsheetId}
        spreadsheetUrl={spreadsheetUrl}
        webAppUrl={webAppUrl}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        syncError={syncError}
        onLoginGoogle={handleGoogleLogin}
        onLogoutGoogle={handleGoogleLogout}
        onManualSync={() => syncFromGoogleSheets(true)}
        onPushToSheets={handleForcePushToSheets}
        onSetCustomSheetId={handleSetCustomSheetId}
        onOpenAppsScriptModal={() => setAppsScriptModalOpen(true)}
      />

      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        role={role}
        onOpenAdminLogin={() => setAdminLoginOpen(true)}
        onLogoutAdmin={() => {
          setRole('user');
          addToast('info', 'ออกจากโหมดผู้ดูแลระบบแล้ว', 'เปลี่ยนกลับเป็นสิทธิ์ผู้ใช้งานทั่วไป');
          if (currentTab === 'vehicles' || currentTab === 'equipment' || currentTab === 'branches') {
            setCurrentTab('daily');
          }
        }}
        pendingCount={pendingCount}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'daily' && (
          <DailyInspectionView
            vehicles={vehicles}
            masterEquipment={masterEquipment}
            branches={branches}
            records={records}
            role={role}
            onStartInspection={(veh) => setInspectingVehicle(veh)}
            onViewRecord={(rec) => setViewingRecord(rec)}
            onOpenLineModal={() => setLineModalOpen(true)}
            onQuickCopyLine={handleQuickCopyLine}
            quickCopied={quickCopied}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            records={records}
            vehicles={vehicles}
            branches={branches}
            role={role}
            onSelectRecord={(rec) => setViewingRecord(rec)}
            onDeleteRecord={handleDeleteInspection}
          />
        )}

        {currentTab === 'vehicles' && (
          <VehicleManager
            vehicles={vehicles}
            masterEquipment={masterEquipment}
            branches={branches}
            role={role}
            onOpenAdminLogin={() => setAdminLoginOpen(true)}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        )}

        {currentTab === 'equipment' && (
          <EquipmentManager
            masterEquipment={masterEquipment}
            vehicles={vehicles}
            role={role}
            onOpenAdminLogin={() => setAdminLoginOpen(true)}
            onAddEquipment={handleAddEquipment}
            onUpdateEquipment={handleUpdateEquipment}
            onDeleteEquipment={handleDeleteEquipment}
          />
        )}

        {currentTab === 'branches' && (
          <BranchManager
            branches={branches}
            vehicles={vehicles}
            role={role}
            onOpenAdminLogin={() => setAdminLoginOpen(true)}
            onAddBranch={handleAddBranch}
            onUpdateBranch={handleUpdateBranch}
            onDeleteBranch={handleDeleteBranch}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="PEA" className="w-5 h-5 rounded shadow-2xs" />
            <span className="font-semibold text-slate-800">
              การไฟฟ้าส่วนภูมิภาค (Provincial Electricity Authority)
            </span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="hidden sm:inline">
              ระบบตรวจสอบอุปกรณ์ประจำรถเพื่อความปลอดภัยในการปฏิบัติงาน
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-medium hover:underline flex items-center gap-1"
              >
                <span>Google Sheets Database ↗</span>
              </a>
            )}
            <span>v2.2.0 (Google Sheets Real-time)</span>
          </div>
        </div>
      </footer>

      {/* Daily Inspection Checklist Modal */}
      {inspectingVehicle && (
        <DailyInspectionModal
          vehicle={inspectingVehicle}
          masterEquipment={masterEquipment}
          onClose={() => setInspectingVehicle(null)}
          onSave={handleSaveInspection}
        />
      )}

      {/* Inspection Record Detail Modal */}
      {viewingRecord && (
        <InspectionDetailModal
          record={viewingRecord}
          role={role}
          onClose={() => setViewingRecord(null)}
          onDelete={handleDeleteInspection}
        />
      )}

      {/* LINE Reminder & Clipboard Modal */}
      <LineReminderModal
        vehicles={vehicles}
        records={records}
        branches={branches}
        isOpen={lineModalOpen}
        onClose={() => setLineModalOpen(false)}
        onCopySuccess={() =>
          addToast(
            'success',
            'คัดลอกข้อความสำเร็จ!',
            'พร้อมนำไปส่งแจ้งเตือนในแอปพลิเคชัน LINE'
          )
        }
      />

      {/* Admin Login PIN Modal */}
      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onSuccess={() => {
          setRole('admin');
          addToast(
            'success',
            'เข้าสู่โหมดผู้ดูแลระบบสำเร็จ',
            'คุณสามารถจัดการ เพิ่ม ลบ แก้ไข ข้อมูลรถ รายการอุปกรณ์ และสาขาการไฟฟ้าได้แล้ว'
          );
        }}
      />

      {/* Google Apps Script Modal */}
      <GoogleAppsScriptModal
        isOpen={appsScriptModalOpen}
        onClose={() => setAppsScriptModalOpen(false)}
        webAppUrl={webAppUrl}
        onSaveWebAppUrl={(url) => {
          setStoredWebAppUrl(url || null);
          setWebAppUrl(url || null);
          if (url) {
            addToast('success', 'บันทึก Web App URL สำเร็จ', 'กำลังเชื่อมต่อและดึงข้อมูลจาก Google Sheets...');
            setTimeout(() => syncFromGoogleSheets(true), 150);
          } else {
            addToast('info', 'ยกเลิกการใช้ Web App URL แล้ว');
          }
        }}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

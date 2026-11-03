/**
 * Google Sheets & Firebase Auth Service for PEA FleetEquip
 * Real-time synchronization for:
 * - Admin PIN / Settings
 * - Master Equipment
 * - Vehicles (without custodian / phone)
 * - PEA Branches
 * - Inspection Records
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  PeaBranch,
  MasterEquipment,
  Vehicle,
  InspectionRecord,
  VehicleType,
  EquipmentCategory,
} from '../types/fleet';
import { normalizeToThailandDate, normalizeToThailandTime } from '../utils/thaiDate';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory access token cache (CRITICAL: Do NOT store in localStorage per security rule)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

const SPREADSHEET_TITLE = 'PEA FleetEquip - ข้อมูลตรวจอุปกรณ์ประจำรถ';
const STORAGE_SHEET_ID_KEY = 'fleet_equip_google_sheet_id';
const STORAGE_WEB_APP_URL_KEY = 'fleet_equip_gas_web_app_url';

export const DEFAULT_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwThzBGUy6bezurp0zydeN-BeTT4Znb-OQcEoDuzDSKbcRHCPwwmv0RU55BDdaY6-9H/exec';

export function getStoredSpreadsheetId(): string | null {
  try {
    return localStorage.getItem(STORAGE_SHEET_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredSpreadsheetId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_SHEET_ID_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_SHEET_ID_KEY);
    }
  } catch {
    // ignore
  }
}

export function getStoredWebAppUrl(): string | null {
  try {
    const val = localStorage.getItem(STORAGE_WEB_APP_URL_KEY);
    if (val && val.trim()) {
      return val.trim();
    }
    return DEFAULT_WEB_APP_URL;
  } catch {
    return DEFAULT_WEB_APP_URL;
  }
}

export function setStoredWebAppUrl(url: string | null): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_WEB_APP_URL_KEY, url.trim());
    } else {
      localStorage.setItem(STORAGE_WEB_APP_URL_KEY, DEFAULT_WEB_APP_URL);
    }
  } catch {
    // ignore
  }
}

/**
 * Initialize Auth listener
 */
export function initGoogleAuth(
  callback: (user: User | null, token: string | null) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (user && cachedAccessToken) {
      callback(user, cachedAccessToken);
    } else if (user && !isSigningIn) {
      // User is logged into Firebase, but token is not yet in memory
      // We keep user state; token will be populated on explicit sign-in or prompt
      callback(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      callback(null, null);
    }
  });
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่สามารถดึง Access Token จาก Google ได้');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: any) {
    console.error('Google Sign-in error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Sign out
 */
export async function signOutGoogle(): Promise<void> {
  await firebaseSignOut(auth);
  cachedAccessToken = null;
}

export function getCurrentToken(): string | null {
  return cachedAccessToken;
}

/**
 * Find or create the Google Spreadsheet
 */
export async function findOrCreateSpreadsheet(
  accessToken: string,
  preferredSheetId?: string
): Promise<{ id: string; url: string; isNew: boolean }> {
  // 1. If custom preferred ID is provided, verify accessibility
  if (preferredSheetId && preferredSheetId.trim()) {
    const cleanId = extractSheetId(preferredSheetId);
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setStoredSpreadsheetId(cleanId);
        return {
          id: cleanId,
          url: `https://docs.google.com/spreadsheets/d/${cleanId}`,
          isNew: false,
        };
      }
    } catch {
      // fall through to storage or auto-find
    }
  }

  // 2. Check stored sheet ID
  const savedId = getStoredSpreadsheetId();
  if (savedId) {
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${savedId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        return {
          id: savedId,
          url: `https://docs.google.com/spreadsheets/d/${savedId}`,
          isNew: false,
        };
      }
    } catch {
      // not accessible, continue
    }
  }

  // 3. Search Google Drive for existing sheet by title
  try {
    const query = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (driveRes.ok) {
      const driveData = await driveRes.json();
      if (driveData.files && driveData.files.length > 0) {
        const found = driveData.files[0];
        setStoredSpreadsheetId(found.id);
        return {
          id: found.id,
          url: found.webViewLink || `https://docs.google.com/spreadsheets/d/${found.id}`,
          isNew: false,
        };
      }
    }
  } catch (err) {
    console.warn('Drive search failed, proceeding to create sheet:', err);
  }

  // 4. Create new Google Spreadsheet with 5 sheets
  const createPayload = {
    properties: {
      title: SPREADSHEET_TITLE,
    },
    sheets: [
      { properties: { title: 'Admin' } },
      { properties: { title: 'Branches' } },
      { properties: { title: 'Equipment' } },
      { properties: { title: 'Vehicles' } },
      { properties: { title: 'Inspections' } },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`ไม่สามารถสร้าง Google Sheet ได้: ${errorText}`);
  }

  const created = await createRes.json();
  const newId = created.spreadsheetId;
  setStoredSpreadsheetId(newId);

  return {
    id: newId,
    url: created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${newId}`,
    isNew: true,
  };
}

/**
 * Extract sheet ID from full URL or return ID as-is
 */
export function extractSheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Fetch all tables from Google Sheets
 */
export async function fetchAllFromGoogleSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  branches: PeaBranch[];
  equipment: MasterEquipment[];
  vehicles: Vehicle[];
  records: InspectionRecord[];
  adminPin?: string;
  hasData: boolean;
}> {
  const ranges = [
    'Admin!A1:C20',
    'Branches!A1:F200',
    'Equipment!A1:F200',
    'Vehicles!A1:L500',
    'Inspections!A1:R5000',
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges
    .map((r) => `ranges=${encodeURIComponent(r)}`)
    .join('&')}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`ไม่สามารถดึงข้อมูลจาก Google Sheets ได้ (Status ${res.status})`);
  }

  const data = await res.json();
  const valueRanges: { range: string; values?: any[][] }[] = data.valueRanges || [];

  const getValues = (sheetName: string): any[][] => {
    const found = valueRanges.find((vr) => vr.range.startsWith(sheetName) || vr.range.startsWith(`'${sheetName}'`));
    return found?.values || [];
  };

  // 1. Admin
  const adminRows = getValues('Admin');
  let adminPin: string | undefined = undefined;
  if (adminRows.length > 1) {
    for (let i = 1; i < adminRows.length; i++) {
      const row = adminRows[i];
      if (row[0] === 'admin_pin' && row[1]) {
        adminPin = String(row[1]).trim();
      }
    }
  }

  // 2. Branches
  const branchRows = getValues('Branches');
  const branches: PeaBranch[] = [];
  if (branchRows.length > 1) {
    for (let i = 1; i < branchRows.length; i++) {
      const r = branchRows[i];
      if (!r || !r[0] || !r[2]) continue;
      branches.push({
        id: String(r[0]),
        code: String(r[1] || ''),
        name: String(r[2]),
        region: String(r[3] || 'กฟภ.'),
        phone: r[4] ? String(r[4]) : undefined,
        address: r[5] ? String(r[5]) : undefined,
      });
    }
  }

  // 3. Equipment
  const equipRows = getValues('Equipment');
  const equipment: MasterEquipment[] = [];
  if (equipRows.length > 1) {
    for (let i = 1; i < equipRows.length; i++) {
      const r = equipRows[i];
      if (!r || !r[0] || !r[2]) continue;
      equipment.push({
        id: String(r[0]),
        code: String(r[1] || ''),
        name: String(r[2]),
        category: (r[3] as EquipmentCategory) || 'general',
        description: String(r[4] || ''),
        isRequiredDefault: String(r[5]).toLowerCase() === 'true' || r[5] === '1' || r[5] === 'ใช่',
      });
    }
  }

  // 4. Vehicles (without custodian / phone)
  const vehicleRows = getValues('Vehicles');
  const vehicles: Vehicle[] = [];
  if (vehicleRows.length > 1) {
    for (let i = 1; i < vehicleRows.length; i++) {
      const r = vehicleRows[i];
      if (!r || !r[0] || !r[1]) continue;
      
      let assignedEquipmentIds: string[] = [];
      try {
        if (r[10]) {
          const rawEquip = String(r[10]).trim();
          if (rawEquip.startsWith('[')) {
            assignedEquipmentIds = JSON.parse(rawEquip);
          } else {
            assignedEquipmentIds = rawEquip.split(',').map((s) => s.trim()).filter(Boolean);
          }
        }
      } catch {
        assignedEquipmentIds = [];
      }

      vehicles.push({
        id: String(r[0]),
        plateNumber: String(r[1]),
        province: String(r[2] || 'สระบุรี'),
        brand: String(r[3] || ''),
        type: (r[4] as VehicleType) || 'pickup',
        peaBranchId: String(r[5] || ''),
        peaBranchName: String(r[6] || ''),
        department: String(r[7] || ''),
        currentMileage: Number(r[8]) || 0,
        status: (r[9] as any) || 'active',
        assignedEquipmentIds,
        notes: r[11] ? String(r[11]) : '',
      });
    }
  }

  // 5. Inspections
  const inspRows = getValues('Inspections');
  const records: InspectionRecord[] = [];
  if (inspRows.length > 1) {
    for (let i = 1; i < inspRows.length; i++) {
      const r = inspRows[i];
      if (!r || !r[0] || !r[1]) continue;

      let items: any[] = [];
      try {
        if (r[15]) {
          items = JSON.parse(String(r[15]));
        }
      } catch {
        items = [];
      }

      records.push({
        id: String(r[0]),
        vehicleId: String(r[1]),
        plateNumber: String(r[2]),
        province: String(r[3] || ''),
        vehicleBrand: String(r[4] || ''),
        vehicleType: (r[5] as VehicleType) || 'pickup',
        peaBranchId: r[6] ? String(r[6]) : undefined,
        peaBranchName: r[7] ? String(r[7]) : undefined,
        department: String(r[8] || ''),
        inspectionDate: normalizeToThailandDate(r[9]),
        inspectionTime: normalizeToThailandTime(r[10], r[17]),
        inspectorName: String(r[11]),
        inspectorRole: String(r[12] || 'พนักงานขับรถ'),
        odometerReading: Number(r[13]) || 0,
        overallResult: r[14] === 'pass' ? 'pass' : 'issue',
        items,
        notes: r[16] ? String(r[16]) : '',
        createdAt: r[17] ? String(r[17]) : new Date().toISOString(),
      });
    }
  }

  const hasData =
    branches.length > 0 || equipment.length > 0 || vehicles.length > 0 || records.length > 0;

  return {
    branches,
    equipment,
    vehicles,
    records,
    adminPin,
    hasData,
  };
}

/**
 * Push all local data into Google Sheets (batch update)
 */
export async function pushAllToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  data: {
    branches: PeaBranch[];
    equipment: MasterEquipment[];
    vehicles: Vehicle[];
    records: InspectionRecord[];
    adminPin: string;
  }
): Promise<void> {
  // Prepare sheet data rows
  const adminData = [
    ['Key (คีย์)', 'Value (ค่า)', 'UpdatedAt (อัปเดตเมื่อ)'],
    ['admin_pin', data.adminPin, new Date().toISOString()],
  ];

  const branchData = [
    ['ID', 'รหัสสาขา', 'ชื่อสาขาการไฟฟ้า (PEA)', 'เขต กฟภ.', 'เบอร์โทร', 'ที่อยู่'],
    ...data.branches.map((b) => [
      b.id,
      b.code,
      b.name,
      b.region,
      b.phone || '',
      b.address || '',
    ]),
  ];

  const equipData = [
    ['ID', 'รหัสอุปกรณ์', 'ชื่ออุปกรณ์ประจำรถ', 'หมวดหมู่', 'คำอธิบายมาตรฐาน', 'จำเป็นเริ่มต้น'],
    ...data.equipment.map((e) => [
      e.id,
      e.code,
      e.name,
      e.category,
      e.description,
      e.isRequiredDefault ? 'TRUE' : 'FALSE',
    ]),
  ];

  const vehicleData = [
    [
      'ID',
      'ทะเบียนรถ',
      'จังหวัด',
      'ยี่ห้อ/รุ่น',
      'ประเภทรถ',
      'รหัสสาขา',
      'ชื่อสาขาการไฟฟ้า',
      'แผนก/สังกัด',
      'เลขไมล์ปัจจุบัน',
      'สถานะ',
      'อุปกรณ์ประจำรถ (JSON)',
      'หมายเหตุ',
    ],
    ...data.vehicles.map((v) => [
      v.id,
      v.plateNumber,
      v.province,
      v.brand,
      v.type,
      v.peaBranchId,
      v.peaBranchName,
      v.department,
      v.currentMileage,
      v.status,
      JSON.stringify(v.assignedEquipmentIds),
      v.notes || '',
    ]),
  ];

  const inspectionData = [
    [
      'ID',
      'รหัสรถ',
      'ทะเบียนรถ',
      'จังหวัด',
      'ยี่ห้อ/รุ่น',
      'ประเภทรถ',
      'รหัสสาขา',
      'ชื่อสาขาการไฟฟ้า',
      'แผนก',
      'วันที่ตรวจ',
      'เวลา',
      'ผู้ตรวจเช็ค',
      'ตำแหน่ง',
      'เลขไมล์',
      'ผลการตรวจ',
      'รายละเอียดรายการที่ตรวจ (JSON)',
      'หมายเหตุ',
      'บันทึกเมื่อ',
    ],
    ...data.records.map((r) => [
      r.id,
      r.vehicleId,
      r.plateNumber,
      r.province,
      r.vehicleBrand,
      r.vehicleType,
      r.peaBranchId || '',
      r.peaBranchName || '',
      r.department,
      normalizeToThailandDate(r.inspectionDate),
      normalizeToThailandTime(r.inspectionTime),
      r.inspectorName,
      r.inspectorRole,
      r.odometerReading,
      r.overallResult,
      JSON.stringify(r.items),
      r.notes || '',
      r.createdAt,
    ]),
  ];

  // Clear existing ranges first to avoid leftovers
  const clearRanges = [
    'Admin!A1:Z50',
    'Branches!A1:Z300',
    'Equipment!A1:Z300',
    'Vehicles!A1:Z1000',
    'Inspections!A1:Z10000',
  ];

  for (const range of clearRanges) {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
    } catch {
      // ignore clear errors on fresh tabs
    }
  }

  // Batch update values
  const payload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      { range: 'Admin!A1', values: adminData },
      { range: 'Branches!A1', values: branchData },
      { range: 'Equipment!A1', values: equipData },
      { range: 'Vehicles!A1', values: vehicleData },
      { range: 'Inspections!A1', values: inspectionData },
    ],
  };

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`ไม่สามารถบันทึกข้อมูลลง Google Sheets ได้: ${errText}`);
  }
}

/**
 * Fetch data via Google Apps Script Web App URL
 */
export async function fetchFromWebApp(webAppUrl: string): Promise<{
  branches: PeaBranch[];
  equipment: MasterEquipment[];
  vehicles: Vehicle[];
  records: InspectionRecord[];
  adminPin?: string;
  hasData: boolean;
}> {
  const url = `${webAppUrl}${webAppUrl.includes('?') ? '&' : '?'}action=getAll&t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ไม่สามารถเชื่อมต่อกับ Web App API ได้ (HTTP ${res.status})`);
  }
  const result = await res.json();
  if (result.status === 'error') {
    throw new Error(result.message || 'Web App API ส่งข้อความข้อผิดพลาดกลับมา');
  }

  const d = result.data || {};
  const branches = Array.isArray(d.branches) ? d.branches : [];
  const equipment = Array.isArray(d.equipment) ? d.equipment : [];
  const vehicles = Array.isArray(d.vehicles) ? d.vehicles : [];
  const rawRecords = Array.isArray(d.records) ? d.records : [];
  const records = rawRecords.map((r: any) => ({
    ...r,
    inspectionDate: normalizeToThailandDate(r.inspectionDate),
    inspectionTime: normalizeToThailandTime(r.inspectionTime, r.createdAt),
  }));
  const adminPin = d.adminPin;

  return {
    branches,
    equipment,
    vehicles,
    records,
    adminPin,
    hasData: branches.length > 0 || equipment.length > 0 || vehicles.length > 0 || records.length > 0,
  };
}

/**
 * Post an action to Google Apps Script Web App URL
 * Uses standard fetch with graceful fallback to mode: 'no-cors' to handle Google Apps Script 302 redirect in browsers
 */
export async function postToWebAppAction(
  webAppUrl: string,
  action: string,
  payloadData?: Record<string, any>
): Promise<void> {
  if (!webAppUrl || !webAppUrl.trim()) return;

  const payload = {
    action,
    ...(payloadData || {}),
  };
  const bodyStr = JSON.stringify(payload);

  // 1. First attempt: standard fetch
  try {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyStr,
    });
    if (res.ok) {
      return;
    }
  } catch (err) {
    // In browsers, cross-origin 302 redirect from script.google.com to script.googleusercontent.com
    // can trigger a CORS TypeError even though the script received the request.
    // We fall through to mode: 'no-cors' to ensure guaranteed delivery.
  }

  // 2. Guaranteed delivery via mode: 'no-cors'
  // When mode: 'no-cors' is used, browser sends the POST with text/plain body without CORS blocking.
  // Google Apps Script doPost(e) receives the payload and executes it on the spreadsheet.
  try {
    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyStr,
    });
  } catch (finalErr) {
    console.warn('Failed to post to Web App:', finalErr);
  }
}

/**
 * Push all data via Google Apps Script Web App URL
 */
export async function pushToWebApp(
  webAppUrl: string,
  data: {
    branches: PeaBranch[];
    equipment: MasterEquipment[];
    vehicles: Vehicle[];
    records: InspectionRecord[];
    adminPin: string;
  }
): Promise<void> {
  await postToWebAppAction(webAppUrl, 'syncAll', { data });
}

export async function saveVehicleToWebApp(webAppUrl: string, vehicle: Vehicle): Promise<void> {
  await postToWebAppAction(webAppUrl, 'saveVehicle', { vehicle });
}

export async function deleteVehicleFromWebApp(webAppUrl: string, id: string): Promise<void> {
  await postToWebAppAction(webAppUrl, 'deleteVehicle', { id });
}

export async function saveEquipmentToWebApp(webAppUrl: string, equipment: MasterEquipment): Promise<void> {
  await postToWebAppAction(webAppUrl, 'saveEquipment', { equipment });
}

export async function deleteEquipmentFromWebApp(webAppUrl: string, id: string): Promise<void> {
  await postToWebAppAction(webAppUrl, 'deleteEquipment', { id });
}

export async function saveBranchToWebApp(webAppUrl: string, branch: PeaBranch): Promise<void> {
  await postToWebAppAction(webAppUrl, 'saveBranch', { branch });
}

export async function deleteBranchFromWebApp(webAppUrl: string, id: string): Promise<void> {
  await postToWebAppAction(webAppUrl, 'deleteBranch', { id });
}

export async function saveInspectionToWebApp(
  webAppUrl: string,
  record: InspectionRecord,
  updatedMileage?: number
): Promise<void> {
  const normRecord = {
    ...record,
    inspectionDate: normalizeToThailandDate(record.inspectionDate),
    inspectionTime: normalizeToThailandTime(record.inspectionTime),
  };
  await postToWebAppAction(webAppUrl, 'saveInspection', { record: normRecord, updatedMileage });
}

export async function deleteInspectionFromWebApp(webAppUrl: string, id: string): Promise<void> {
  await postToWebAppAction(webAppUrl, 'deleteInspection', { id });
}

export async function setAdminPinToWebApp(webAppUrl: string, pin: string): Promise<void> {
  await postToWebAppAction(webAppUrl, 'setAdminPin', { pin });
}


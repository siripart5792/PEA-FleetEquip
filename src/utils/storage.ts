import { MasterEquipment, Vehicle, InspectionRecord, PeaBranch } from '../types/fleet';
import { INITIAL_EQUIPMENT, INITIAL_VEHICLES, INITIAL_PEA_BRANCHES, getInitialRecords, getTodayDateString } from '../data/initialData';
import { normalizeToThailandDate, normalizeToThailandTime } from './thaiDate';

const STORAGE_KEYS = {
  EQUIPMENT: 'fleet_equip_master_v1',
  VEHICLES: 'fleet_equip_vehicles_v1',
  INSPECTIONS: 'fleet_equip_inspections_v1',
  BRANCHES: 'fleet_equip_pea_branches_v1',
  ADMIN_PIN: 'fleet_equip_admin_pin_v1',
};

export function loadPeaBranches(): PeaBranch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(INITIAL_PEA_BRANCHES));
      return INITIAL_PEA_BRANCHES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading branches:', err);
    return INITIAL_PEA_BRANCHES;
  }
}

export function savePeaBranches(branches: PeaBranch[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  } catch (err) {
    console.error('Error saving branches:', err);
  }
}

export function loadMasterEquipment(): MasterEquipment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(INITIAL_EQUIPMENT));
      return INITIAL_EQUIPMENT;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading equipment:', err);
    return INITIAL_EQUIPMENT;
  }
}

export function saveMasterEquipment(equipment: MasterEquipment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment));
  } catch (err) {
    console.error('Error saving equipment:', err);
  }
}

export function loadVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading vehicles:', err);
    return INITIAL_VEHICLES;
  }
}

export function saveVehicles(vehicles: Vehicle[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  } catch (err) {
    console.error('Error saving vehicles:', err);
  }
}

export function loadInspections(): InspectionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
    if (!raw) {
      const init = getInitialRecords();
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((r: InspectionRecord) => ({
        ...r,
        inspectionDate: normalizeToThailandDate(r.inspectionDate),
        inspectionTime: normalizeToThailandTime(r.inspectionTime),
      }));
    }
    return getInitialRecords();
  } catch (err) {
    console.error('Error loading inspections:', err);
    return getInitialRecords();
  }
}

export function saveInspections(records: InspectionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving inspections:', err);
  }
}

export function getAdminPin(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '1234';
  } catch {
    return '1234';
  }
}

export function setAdminPin(pin: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin);
  } catch (err) {
    console.error('Error setting PIN:', err);
  }
}

export function resetAllDataToDefault(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(INITIAL_PEA_BRANCHES));
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(INITIAL_EQUIPMENT));
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(getInitialRecords()));
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, '1234');
  } catch (err) {
    console.error('Error resetting data:', err);
  }
}

// Helpers for today's status
export function getTodayInspectionForVehicle(vehicleId: string, records: InspectionRecord[]): InspectionRecord | undefined {
  const today = getTodayDateString();
  const matched = records.filter(r => r.vehicleId === vehicleId && normalizeToThailandDate(r.inspectionDate) === today);
  if (matched.length === 0) return undefined;
  if (matched.length === 1) return matched[0];
  // เมื่อมีการตรวจซ้ำ ให้ดึงรายการตรวจเช็คล่าสุดของวันนี้
  return matched.sort((a, b) => {
    const timeA = `${normalizeToThailandDate(a.inspectionDate)} ${normalizeToThailandTime(a.inspectionTime)} ${a.createdAt || ''}`;
    const timeB = `${normalizeToThailandDate(b.inspectionDate)} ${normalizeToThailandTime(b.inspectionTime)} ${b.createdAt || ''}`;
    return timeB.localeCompare(timeA);
  })[0];
}

export function getTodayStatusCounts(
  vehicles: Vehicle[],
  records: InspectionRecord[],
  branchFilter?: string | string[]
) {
  const today = getTodayDateString();
  const activeVehicles = vehicles
    .filter(v => v.status === 'active')
    .filter(v => {
      if (!branchFilter) return true;
      if (typeof branchFilter === 'string') {
        return branchFilter === 'all' || v.peaBranchId === branchFilter;
      }
      return branchFilter.length === 0 || branchFilter.includes(v.peaBranchId);
    });

  const todayRecords = records.filter(r => normalizeToThailandDate(r.inspectionDate) === today);
  
  const inspectedVehicleIds = new Set(todayRecords.map(r => r.vehicleId));
  const inspectedCount = activeVehicles.filter(v => inspectedVehicleIds.has(v.id)).length;
  const pendingVehicles = activeVehicles.filter(v => !inspectedVehicleIds.has(v.id));
  
  const issueCount = todayRecords.filter(r => {
    const isTargetBranch = !branchFilter || 
      (typeof branchFilter === 'string' && branchFilter === 'all') ||
      activeVehicles.some(v => v.id === r.vehicleId);
    return isTargetBranch && r.overallResult === 'issue';
  }).length;

  return {
    totalActive: activeVehicles.length,
    inspectedCount,
    pendingCount: pendingVehicles.length,
    pendingVehicles,
    issueCount,
  };
}

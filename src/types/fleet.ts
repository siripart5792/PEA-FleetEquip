export type EquipmentCategory = 
  | 'safety'       // ความปลอดภัย (ถังดับเพลิง, ป้ายสามเหลี่ยม)
  | 'emergency'    // เครื่องมือฉุกเฉิน (แม่แรง, ประแจ, สายพ่วง)
  | 'documents'    // เอกสารประจำรถ (สมุด พ.ร.บ., บัตรน้ำมัน)
  | 'electronics'  // อุปกรณ์อิเล็กทรอนิกส์/สื่อสาร (กล้องหน้ารถ, วิทยุสื่อสาร)
  | 'general';     // ทั่วไป (ยางอะไหล่, เสื้อสะท้อนแสง)

export interface MasterEquipment {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  description: string;
  isRequiredDefault: boolean;
}

export interface PeaBranch {
  id: string;
  code: string;       // เช่น กฟภ.ชบ., PEA-C01
  name: string;       // เช่น การไฟฟ้าส่วนภูมิภาคจังหวัดชลบุรี, การไฟฟ้าส่วนภูมิภาคอำเภอศรีราชา
  region: string;     // เช่น กฟก.2 (ภาคกลาง เขต 2 ชลบุรี), กฟน.1 (ภาคเหนือ เขต 1 เชียงใหม่)
  phone?: string;
  address?: string;
}

export type VehicleType = 
  | 'pickup'     // รถกระบะ
  | 'van'        // รถตู้
  | 'truck'      // รถบรรทุก 6 ล้อ / 10 ล้อ
  | 'sedan'      // รถเก๋งส่วนกลาง
  | 'suv'        // รถตรวจการณ์ SUV
  | 'utility';   // รถกระเช้า/เครื่องมือพิเศษ

export interface Vehicle {
  id: string;
  plateNumber: string;    // เช่น 1ฒผ 9920, กบ 4589
  province: string;       // เช่น กรุงเทพมหานคร, ชลบุรี
  brand: string;          // เช่น Toyota Hilux Revo 2.8 4x4
  type: VehicleType;
  peaBranchId: string;    // ID ของสาขาการไฟฟ้าส่วนภูมิภาค
  peaBranchName: string;  // ชื่อสาขาการไฟฟ้าส่วนภูมิภาค เช่น การไฟฟ้าส่วนภูมิภาคจังหวัดชลบุรี
  department: string;     // เช่น แผนกปฏิบัติการและซ่อมบำรุง
  custodian?: string;     // ผู้รับผิดชอบ (ตัดออกจากแบบฟอร์มแล้ว)
  phone?: string;         // เบอร์โทรติดต่อ (ตัดออกจากแบบฟอร์มแล้ว)
  currentMileage: number; // เลขไมล์ปัจจุบัน
  assignedEquipmentIds: string[]; // อุปกรณ์ประจำรถคันนี้ (เลือกได้ตอนเพิ่ม/แก้ไขรถ)
  status: 'active' | 'maintenance' | 'inactive';
  notes?: string;
}

export type EquipmentItemStatus = 'pass' | 'damaged' | 'missing' | 'na';

export interface InspectionCheckItem {
  equipmentId: string;
  equipmentName: string;
  category: EquipmentCategory;
  status: EquipmentItemStatus;
  issueDescription?: string;
}

export interface InspectionRecord {
  id: string;
  vehicleId: string;
  plateNumber: string;
  province: string;
  vehicleBrand: string;
  vehicleType: VehicleType;
  peaBranchId?: string;
  peaBranchName?: string;
  department: string;
  inspectionDate: string; // YYYY-MM-DD
  inspectionTime: string; // HH:mm
  inspectorName: string;  // ผู้ตรวจเช็ค
  inspectorRole: string;  // ตำแหน่ง / ฝ่าย
  odometerReading: number;// เลขไมล์ขณะตรวจ
  items: InspectionCheckItem[];
  overallResult: 'pass' | 'issue';
  notes?: string;
  createdAt: string;
}

export type UserRole = 'user' | 'admin';

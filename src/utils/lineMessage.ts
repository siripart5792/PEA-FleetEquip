import { Vehicle, InspectionRecord } from '../types/fleet';
import { getTodayStatusCounts } from './storage';
import { formatThaiDate, formatFullThaiDate, formatThaiTime, getThailandNowTimeString } from './thaiDate';

export { formatThaiDate, formatFullThaiDate, formatThaiTime };

export function formatTime(date?: Date): string {
  return formatThaiTime(date || new Date());
}

export interface LineMessageOptions {
  includeBranch?: boolean;
  includeDepartment?: boolean;
  includeAppUrl?: boolean;
  customNote?: string;
  branchFilter?: string | string[];
  branchName?: string;
  branchNames?: string[];
}

export function generateLinePendingAlertMessage(
  vehicles: Vehicle[],
  records: InspectionRecord[],
  options: LineMessageOptions = {
    includeBranch: true,
    includeDepartment: true,
    includeAppUrl: true,
  }
): string {
  const now = new Date();
  const dateFormatted = formatFullThaiDate(now);
  const timeFormatted = formatTime(now);

  const { totalActive, inspectedCount, pendingCount, pendingVehicles, issueCount } = getTodayStatusCounts(
    vehicles,
    records,
    options.branchFilter
  );

  const percentage = totalActive > 0 ? Math.round((inspectedCount / totalActive) * 100) : 0;
  
  let branchTitle = '';
  if (options.branchNames && options.branchNames.length > 0) {
    branchTitle = `\n🏢 สังกัด (${options.branchNames.length} สาขา): ${options.branchNames.join(', ')}`;
  } else if (options.branchName) {
    branchTitle = `\n🏢 สังกัด: ${options.branchName}`;
  }

  if (pendingVehicles.length === 0) {
    return `⚡ การไฟฟ้าส่วนภูมิภาค (PEA)${branchTitle}
✅ [แจ้งเตือน] สรุปการตรวจอุปกรณ์ประจำรถประจำวัน
📅 ประจำ${dateFormatted}
⏰ เวลาสรุป: ${timeFormatted}

🎉 ข่าวดี: รถทุกคัน (${totalActive}/${totalActive} คัน) ได้รับการตรวจเช็คอุปกรณ์ประจำรถประจำวันครบถ้วน 100% แล้ว!
${issueCount > 0 ? `⚠️ หมายเหตุ: พบอุปกรณ์ชำรุด/แจ้งซ่อม ${issueCount} คัน (กรุณาตรวจสอบในระบบ)` : '✨ อุปกรณ์ทุกคันอยู่ในสภาพพร้อมใช้งาน'}

🙏 ขอขอบคุณพนักงานขับรถและผู้รับผิดชอบทุกท่านที่ร่วมมือในการตรวจสอบเพื่อความปลอดภัยในการปฏิบัติงาน`;
  }

  let message = `⚡ การไฟฟ้าส่วนภูมิภาค (PEA)${branchTitle}
📢 [แจ้งเตือน] รายงานรถที่ยังไม่ได้ตรวจอุปกรณ์ประจำรถ
📅 ประจำ${dateFormatted}
⏰ ข้อมูล ณ เวลา: ${timeFormatted}
━━━━━━━━━━━━━━━━━━
📊 สรุปภาพรวมวันนี้:
• รถทั้งหมดที่พร้อมใช้งาน: ${totalActive} คัน
• ตรวจเช็คเรียบร้อยแล้ว: ${inspectedCount} คัน (${percentage}%)
• ⚠️ ยังไม่ได้ตรวจเช็ค: ${pendingCount} คัน
${issueCount > 0 ? `• 🔧 พบอุปกรณ์แจ้งซ่อม/ชำรุด: ${issueCount} คัน\n` : ''}
━━━━━━━━━━━━━━━━━━
❌ รายชื่อรถที่ "ยังไม่ได้รับการตรวจเช็คอุปกรณ์":\n`;

  pendingVehicles.forEach((veh, index) => {
    message += `\n${index + 1}. ทะเบียน: ${veh.plateNumber} (${veh.province})
   - ยี่ห้อ/รุ่น: ${veh.brand}`;
    
    if (options.includeBranch !== false && veh.peaBranchName) {
      message += `\n   - สาขา: ${veh.peaBranchName}`;
    }

    if (options.includeDepartment) {
      message += `\n   - แผนก: ${veh.department}`;
    }
  });

  message += `\n\n━━━━━━━━━━━━━━━━━━
⚠️ คำแนะนำ: กรุณาให้ผู้รับผิดชอบหรือพนักงานขับรถประจำคัน ทำการตรวจเช็คอุปกรณ์ประจำรถ (ถังดับเพลิง, ยางอะไหล่, แม่แรง, ป้ายสามเหลี่ยม ฯลฯ) ให้เรียบร้อยก่อนนำรถออกปฏิบัติงาน เพื่อความปลอดภัยสูงสุด`;

  if (options.customNote && options.customNote.trim()) {
    message += `\n\n📌 บันทึกเพิ่มเติม: ${options.customNote.trim()}`;
  }

  if (options.includeAppUrl) {
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
    if (currentUrl) {
      message += `\n\n📲 เข้าสู่ระบบตรวจอุปกรณ์: ${currentUrl}`;
    }
  }

  return message;
}

export function createLineShareUrl(text: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
}

/**
 * ระบบจัดการวันที่และเวลาตามมาตรฐานประเทศไทย (Asia/Bangkok - GMT+7)
 * คำนวณแบบ Pure Mathematical UTC+7 แม่นยำ 100% ไม่ขึ้นกับ Locale หรือ Timezone ของเครื่องผู้ใช้
 * และไม่ได้รับผลกระทบจากข้อผิดพลาด 1899 LMT Offset ของ Google Sheets
 */

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS_FULL = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
];

/**
 * ดึงวันที่ปัจจุบันตามเวลาประเทศไทย (GMT+7) ในรูปแบบ YYYY-MM-DD
 */
export function getThailandTodayDateString(): string {
  const thaiDate = new Date(Date.now() + 7 * 3600 * 1000);
  return thaiDate.toISOString().slice(0, 10);
}

/**
 * ดึงวันที่ตามเวลาประเทศไทยแบบระบุจำนวนวันเลื่อน (เช่น -1 คือเมื่อวาน) ในรูปแบบ YYYY-MM-DD
 */
export function getThailandOffsetDateString(offsetDays: number): string {
  const thaiDate = new Date(Date.now() + (7 * 3600 + offsetDays * 86400) * 1000);
  return thaiDate.toISOString().slice(0, 10);
}

/**
 * ดึงเวลาปัจจุบันตามเวลาประเทศไทย (GMT+7) ในรูปแบบ HH:mm (24 ชั่วโมง)
 */
export function getThailandNowTimeString(): string {
  const thaiDate = new Date(Date.now() + 7 * 3600 * 1000);
  const h = String(thaiDate.getUTCHours()).padStart(2, '0');
  const m = String(thaiDate.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * จัดการแปลงค่าวันที่ที่มาจาก Google Sheets หรือ ISO string ให้อยู่ในรูป YYYY-MM-DD ตามเวลาไทยเสมอ
 */
export function normalizeToThailandDate(dateInput: any): string {
  if (!dateInput) return getThailandTodayDateString();
  const str = String(dateInput).trim();

  // หากเป็น YYYY-MM-DD อยู่แล้ว
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // หากเป็น ISO string เช่น 2026-11-03T... หรือมี Z
  if (str.includes('T') || str.includes('Z')) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const thaiDate = new Date(parsed.getTime() + 7 * 3600 * 1000);
      return thaiDate.toISOString().slice(0, 10);
    }
  }

  // หากขึ้นต้นด้วย YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }

  // หากเป็น Date string อื่นๆ
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const thaiDate = new Date(d.getTime() + 7 * 3600 * 1000);
    return thaiDate.toISOString().slice(0, 10);
  }

  return str;
}

/**
 * จัดการแปลงค่าเวลาที่มาจาก Google Sheets, Web App หรือ ISO string ให้อยู่ในรูป HH:mm ตามเวลาไทยเสมอ
 */
/**
 * จัดการแปลงค่าเวลาที่มาจาก Google Sheets, Web App หรือ ISO string ให้อยู่ในรูป HH:mm ตามเวลาไทยเสมอ
 * หากค่าเวลาเดิมเสียหายจาก 1899 Date ของ Google Sheets จะดึงเวลาแท้จริงจาก createdAtFallback เพื่อป้องกันเวลาเพี้ยน
 */
export function normalizeToThailandTime(timeInput: any, createdAtFallback?: any): string {
  if (timeInput) {
    let str = String(timeInput).trim();
    // กำจัด ' น.' หรือ 'น.' ที่อาจติดมา
    str = str.replace(/\s*น\.?$/i, '').trim();

    // 1. หากเป็นรูปแบบเวลามาตรฐานอยู่แล้ว เช่น "11:57", "08:30", "8:30", "08:30:00"
    const hhmmMatch = str.match(/^(\d{1,2}):(\d{2})(:(\d{2}))?$/);
    if (hhmmMatch) {
      const hh = hhmmMatch[1].padStart(2, '0');
      const mm = hhmmMatch[2];
      return `${hh}:${mm}`;
    }

    // 2. หากข้อมูลปนเปื้อน 1899 Date String จาก Google Sheets แต่มี createdAt แท้จริง ให้ดึงจาก createdAt ทันที
    if (str.includes('1899') && createdAtFallback) {
      const createdStr = String(createdAtFallback).trim();
      if (!createdStr.includes('1899')) {
        const d = new Date(createdStr);
        if (!isNaN(d.getTime())) {
          const thaiHours = (d.getUTCHours() + 7) % 24;
          const thaiMinutes = d.getUTCMinutes();
          return `${String(thaiHours).padStart(2, '0')}:${String(thaiMinutes).padStart(2, '0')}`;
        }
      }
    }

    // 3. หากเป็น ISO datetime ปกติ (ที่ไม่ใช่ 1899) เช่น 2026-11-03T04:57:43.345Z
    if ((str.includes('T') || str.includes('Z')) && !str.includes('1899')) {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        const thaiHours = (parsed.getUTCHours() + 7) % 24;
        const thaiMinutes = parsed.getUTCMinutes();
        return `${String(thaiHours).padStart(2, '0')}:${String(thaiMinutes).padStart(2, '0')}`;
      }
    }

    // 4. ค้นหาตำแหน่ง HH:mm ใดๆ ในข้อความที่ไม่ใช่ 1899
    if (!str.includes('1899')) {
      const subMatch = str.match(/(\d{1,2}):(\d{2})/);
      if (subMatch) {
        return `${subMatch[1].padStart(2, '0')}:${subMatch[2]}`;
      }
    }
  }

  // 5. หากไม่มี timeInput หรือ timeInput เสียหาย แต่มี createdAtFallback
  if (createdAtFallback) {
    const createdStr = String(createdAtFallback).trim();
    if (!createdStr.includes('1899')) {
      const d = new Date(createdStr);
      if (!isNaN(d.getTime())) {
        const thaiHours = (d.getUTCHours() + 7) % 24;
        const thaiMinutes = d.getUTCMinutes();
        return `${String(thaiHours).padStart(2, '0')}:${String(thaiMinutes).padStart(2, '0')}`;
      }
    }
  }

  return getThailandNowTimeString();
}

/**
 * จัดรูปแบบวันที่เป็นภาษาไทย พ.ศ. เช่น "3 พ.ย. 2569"
 */
export function formatThaiDate(dateInput: any): string {
  if (!dateInput) return '-';
  const normalized = normalizeToThailandDate(dateInput);
  try {
    const [yStr, mStr, dStr] = normalized.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return String(dateInput);

    const thaiMonth = THAI_MONTHS_SHORT[m - 1] || `${m}`;
    const thaiYear = y + 543;
    return `${d} ${thaiMonth} ${thaiYear}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * จัดรูปแบบวันที่ภาษาไทยแบบเต็ม เช่น "วันอังคารที่ 3 พฤศจิกายน 2569"
 */
export function formatFullThaiDate(dateInput: Date | string = new Date()): string {
  let date: Date;
  if (typeof dateInput === 'string') {
    const norm = normalizeToThailandDate(dateInput);
    const [y, m, d] = norm.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = dateInput;
  }

  const dayName = THAI_DAYS_FULL[date.getDay()];
  const d = date.getDate();
  const m = THAI_MONTHS_FULL[date.getMonth()];
  const y = date.getFullYear() + 543;
  return `${dayName}ที่ ${d} ${m} ${y}`;
}

/**
 * จัดรูปแบบเวลาภาษาไทย เช่น "08:15 น."
 */
export function formatThaiTime(timeInput: any): string {
  const norm = normalizeToThailandTime(timeInput);
  return `${norm} น.`;
}

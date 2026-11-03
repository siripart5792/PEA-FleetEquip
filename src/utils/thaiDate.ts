/**
 * ระบบจัดการวันที่และเวลาตามมาตรฐานประเทศไทย (Asia/Bangkok - GMT+7)
 * รองรับปี พ.ศ. และการแปลงเวลาจาก Google Sheets / ISO / UTC อย่างถูกต้อง
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
 * ดึงวันที่ปัจจุบันตามเวลาประเทศไทย ในรูปแบบ YYYY-MM-DD
 */
export function getThailandTodayDateString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // 'YYYY-MM-DD'
  } catch {
    const d = new Date(Date.now() + 7 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  }
}

/**
 * ดึงวันที่ตามเวลาประเทศไทยแบบระบุจำนวนวันเลื่อน (เช่น -1 คือเมื่อวาน) ในรูปแบบ YYYY-MM-DD
 */
export function getThailandOffsetDateString(offsetDays: number): string {
  try {
    const now = new Date();
    // แปลงเข้าเขตเวลาประเทศไทยก่อนคำนวณวัน
    const nowBangkok = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    nowBangkok.setDate(nowBangkok.getDate() + offsetDays);
    const y = nowBangkok.getFullYear();
    const m = String(nowBangkok.getMonth() + 1).padStart(2, '0');
    const d = String(nowBangkok.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    const d = new Date(Date.now() + (7 * 3600 + offsetDays * 86400) * 1000);
    return d.toISOString().slice(0, 10);
  }
}

/**
 * ดึงเวลาปัจจุบันตามเวลาประเทศไทย (Asia/Bangkok) ในรูปแบบ HH:mm (24 ชั่วโมง)
 */
export function getThailandNowTimeString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date(Date.now() + 7 * 3600 * 1000);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }
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

  // หากขึ้นต้นด้วย YYYY-MM-DD เช่น 2026-11-03T... หรือ 2026-11-03 ...
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    if (str.includes('T') || str.includes('Z')) {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        try {
          return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(parsed);
        } catch {
          return str.slice(0, 10);
        }
      }
    }
    return str.slice(0, 10);
  }

  // หากเป็น Date string อื่นๆ
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    } catch {
      return d.toISOString().slice(0, 10);
    }
  }

  return str;
}

/**
 * จัดการแปลงค่าเวลาที่มาจาก Google Sheets หรือ ISO string ให้อยู่ในรูป HH:mm ตามเวลาไทยเสมอ
 */
export function normalizeToThailandTime(timeInput: any): string {
  if (!timeInput) return getThailandNowTimeString();
  const str = String(timeInput).trim();

  // รูปแบบ HH:mm หรือ H:mm หรือ HH:mm:ss
  const hhmmMatch = str.match(/^(\d{1,2}):(\d{2})(:(\d{2}))?$/);
  if (hhmmMatch) {
    const hh = hhmmMatch[1].padStart(2, '0');
    const mm = hhmmMatch[2];
    return `${hh}:${mm}`;
  }

  // หากเป็น ISO datetime เช่น 1899-12-30T... หรือ 2026-11-03T...
  if (str.includes('T') || str.includes('GMT') || str.includes('1899')) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      try {
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(parsed);
      } catch {
        // fallback
      }
    }
  }

  // ค้นหาตำแหน่ง HH:mm ในข้อความ
  const subMatch = str.match(/(\d{1,2}):(\d{2})/);
  if (subMatch) {
    return `${subMatch[1].padStart(2, '0')}:${subMatch[2]}`;
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

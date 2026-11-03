/**
 * Google Apps Script API for PEA FleetEquip
 * Complete script to paste into Google Sheets (Extensions > Apps Script)
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * PEA FleetEquip - Google Apps Script API & Database Backend
 * ระบบตรวจอุปกรณ์ประจำรถ การไฟฟ้าส่วนภูมิภาค (PEA)
 * =========================================================================
 * 
 * วิธีการติดตั้ง:
 * 1. ใน Google Sheets เปิดเมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 2. ลบโค้ดเดิมใน Code.gs ทั้งหมด แล้ววางโค้ดนี้ลงไป
 * 3. กดบันทึก (Ctrl + S หรือคลิกไอคอนแผ่นดิสก์)
 * 4. คลิกเมนู "การทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 5. คลิกไอคอนฟันเฟืองเลือกประเภท "เว็บแอป" (Web app)
 *    - คำอธิบาย: PEA FleetEquip API
 *    - ดำเนินการในฐานะ (Execute as): "ฉัน (อีเมลของคุณ)"
 *    - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): "ทุกคน (Anyone)"
 * 6. คลิก "ทำให้ใช้งานได้" (Deploy) > อนุมัติสิทธิ์ (Authorize access)
 * 7. คัดลอก "URL ของเว็บแอป" (Web app URL) ไปวางในระบบ PEA FleetEquip
 * =========================================================================
 */

// ชื่อแผ่นงานทั้ง 5 แผ่น
var SHEET_NAMES = {
  ADMIN: "Admin",
  BRANCHES: "Branches",
  EQUIPMENT: "Equipment",
  VEHICLES: "Vehicles",
  INSPECTIONS: "Inspections"
};

/**
 * เพิ่มเมนูพิเศษบน Google Sheets
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("⚡ PEA FleetEquip")
    .addItem("🛠️ สร้าง/ตั้งค่าโครงสร้างแผ่นงานเริ่มต้น", "setupAllSheets")
    .addItem("📦 ลงข้อมูลตัวอย่าง กฟภ. (สระบุรี, ชลบุรี, เชียงใหม่)", "seedInitialData")
    .addSeparator()
    .addItem("📋 สรุปรถค้างตรวจวันนี้", "showTodayPendingSummary")
    .addToUi();
}

/**
 * Handle GET Requests (ดึงข้อมูล)
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    checkAndCreateSheets(ss);

    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAll";

    if (action === "getAll") {
      var data = {
        adminPin: getAdminPinFromSheet(ss),
        branches: getBranchesFromSheet(ss),
        equipment: getEquipmentFromSheet(ss),
        vehicles: getVehiclesFromSheet(ss),
        records: getInspectionsFromSheet(ss)
      };

      return createJsonResponse({
        status: "success",
        message: "ดึงข้อมูลระบบตรวจอุปกรณ์ประจำรถ กฟภ. สำเร็จ",
        data: data
      });
    }

    return createJsonResponse({
      status: "error",
      message: "ไม่พบคำสั่ง action ที่ระบุ: " + action
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "เกิดข้อผิดพลาด: " + err.toString()
    });
  }
}

/**
 * Handle POST Requests (บันทึก / อัปเดต / ซิงค์ข้อมูล)
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    checkAndCreateSheets(ss);

    var rawContent = e.postData.contents;
    var payload = JSON.parse(rawContent);
    var action = payload.action;

    if (action === "syncAll") {
      // บันทึกทับข้อมูลทั้งหมดทั้ง 5 แผ่น
      syncAllDataToSheets(ss, payload.data);
      return createJsonResponse({
        status: "success",
        message: "ซิงค์ข้อมูลทั้งหมดลง Google Sheets สำเร็จ"
      });
    }

    if (action === "saveInspection") {
      saveInspectionRecord(ss, payload.record, payload.updatedMileage);
      return createJsonResponse({
        status: "success",
        message: "บันทึกผลการตรวจทะเบียน " + payload.record.plateNumber + " เรียบร้อย"
      });
    }

    if (action === "deleteInspection") {
      deleteInspectionRecord(ss, payload.id);
      return createJsonResponse({
        status: "success",
        message: "ลบประวัติการตรวจเช็คเรียบร้อย"
      });
    }

    if (action === "saveVehicle") {
      saveVehicleRecord(ss, payload.vehicle);
      return createJsonResponse({
        status: "success",
        message: "บันทึกข้อมูลรถทะเบียน " + payload.vehicle.plateNumber + " เรียบร้อย"
      });
    }

    if (action === "deleteVehicle") {
      deleteVehicleRecord(ss, payload.id);
      return createJsonResponse({
        status: "success",
        message: "ลบรถยนต์ออกจากระบบแล้ว"
      });
    }

    if (action === "saveEquipment") {
      saveEquipmentRecord(ss, payload.equipment);
      return createJsonResponse({
        status: "success",
        message: "บันทึกข้อมูลอุปกรณ์ " + payload.equipment.name + " เรียบร้อย"
      });
    }

    if (action === "deleteEquipment") {
      deleteEquipmentRecord(ss, payload.id);
      return createJsonResponse({
        status: "success",
        message: "ลบรายการอุปกรณ์เรียบร้อย"
      });
    }

    if (action === "saveBranch") {
      saveBranchRecord(ss, payload.branch);
      return createJsonResponse({
        status: "success",
        message: "บันทึกข้อมูลสาขาการไฟฟ้า " + payload.branch.name + " เรียบร้อย"
      });
    }

    if (action === "deleteBranch") {
      deleteBranchRecord(ss, payload.id);
      return createJsonResponse({
        status: "success",
        message: "ลบสาขาการไฟฟ้าเรียบร้อย"
      });
    }

    if (action === "setAdminPin") {
      setAdminPinInSheet(ss, payload.pin);
      return createJsonResponse({
        status: "success",
        message: "อัปเดตรหัส PIN ผู้ดูแลระบบเรียบร้อย"
      });
    }

    return createJsonResponse({
      status: "error",
      message: "ไม่รู้จักคำสั่ง action: " + action
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "เกิดข้อผิดพลาดในการประมวลผล: " + err.toString()
    });
  }
}

/**
 * Response Helper with CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ตรวจสอบและสร้างโครงสร้าง 5 แผ่นงาน
 */
function checkAndCreateSheets(ss) {
  var requiredSheets = [
    { name: SHEET_NAMES.ADMIN, headers: ["Key (คีย์)", "Value (ค่า)", "UpdatedAt (อัปเดตเมื่อ)"] },
    { name: SHEET_NAMES.BRANCHES, headers: ["ID", "รหัสสาขา", "ชื่อสาขาการไฟฟ้า (PEA)", "เขต กฟภ.", "เบอร์โทร", "ที่อยู่"] },
    { name: SHEET_NAMES.EQUIPMENT, headers: ["ID", "รหัสอุปกรณ์", "ชื่ออุปกรณ์ประจำรถ", "หมวดหมู่", "คำอธิบายมาตรฐาน", "จำเป็นเริ่มต้น"] },
    { name: SHEET_NAMES.VEHICLES, headers: ["ID", "ทะเบียนรถ", "จังหวัด", "ยี่ห้อ/รุ่น", "ประเภทรถ", "รหัสสาขา", "ชื่อสาขาการไฟฟ้า", "แผนก/สังกัด", "เลขไมล์ปัจจุบัน", "สถานะ", "อุปกรณ์ประจำรถ (JSON)", "หมายเหตุ"] },
    { name: SHEET_NAMES.INSPECTIONS, headers: ["ID", "รหัสรถ", "ทะเบียนรถ", "จังหวัด", "ยี่ห้อ/รุ่น", "ประเภทรถ", "รหัสสาขา", "ชื่อสาขาการไฟฟ้า", "แผนก", "วันที่ตรวจ", "เวลา", "ผู้ตรวจเช็ค", "ตำแหน่ง", "เลขไมล์", "ผลการตรวจ", "รายละเอียดรายการที่ตรวจ (JSON)", "หมายเหตุ", "บันทึกเมื่อ"] }
  ];

  requiredSheets.forEach(function(item) {
    var sheet = ss.getSheetByName(item.name);
    if (!sheet) {
      sheet = ss.insertSheet(item.name);
      sheet.getRange(1, 1, 1, item.headers.length).setValues([item.headers]);
      styleHeaderRow(sheet, item.headers.length);
    }
  });
}

function styleHeaderRow(sheet, colCount) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setBackground("#581c87"); // PEA Deep Purple
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

/**
 * Setup All Sheets via Menu
 */
function setupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  checkAndCreateSheets(ss);
  SpreadsheetApp.getUi().alert("✅ สร้างแผ่นงานทั้ง 5 แผ่นงานสำหรับระบบ PEA FleetEquip เรียบร้อยแล้ว!");
}

/**
 * Get Data Helpers
 */
function getAdminPinFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.ADMIN);
  if (!sheet) return "1234";
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === "admin_pin" && data[i][1]) {
      return String(data[i][1]).trim();
    }
  }
  return "1234";
}

function getBranchesFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.BRANCHES);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] || !r[2]) continue;
    result.push({
      id: String(r[0]),
      code: String(r[1] || ""),
      name: String(r[2]),
      region: String(r[3] || "กฟภ."),
      phone: r[4] ? String(r[4]) : "",
      address: r[5] ? String(r[5]) : ""
    });
  }
  return result;
}

function getEquipmentFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.EQUIPMENT);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] || !r[2]) continue;
    result.push({
      id: String(r[0]),
      code: String(r[1] || ""),
      name: String(r[2]),
      category: String(r[3] || "general"),
      description: String(r[4] || ""),
      isRequiredDefault: String(r[5]).toLowerCase() === "true" || r[5] === 1 || r[5] === "ใช่"
    });
  }
  return result;
}

function getVehiclesFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] || !r[1]) continue;

    var assignedEquipmentIds = [];
    try {
      if (r[10]) {
        var rawEquip = String(r[10]).trim();
        if (rawEquip.indexOf("[") === 0) {
          assignedEquipmentIds = JSON.parse(rawEquip);
        } else {
          assignedEquipmentIds = rawEquip.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
        }
      }
    } catch (e) {
      assignedEquipmentIds = [];
    }

    result.push({
      id: String(r[0]),
      plateNumber: String(r[1]),
      province: String(r[2] || "สระบุรี"),
      brand: String(r[3] || ""),
      type: String(r[4] || "pickup"),
      peaBranchId: String(r[5] || ""),
      peaBranchName: String(r[6] || ""),
      department: String(r[7] || ""),
      currentMileage: Number(r[8]) || 0,
      status: String(r[9] || "active"),
      assignedEquipmentIds: assignedEquipmentIds,
      notes: r[11] ? String(r[11]) : ""
    });
  }
  return result;
}

function getInspectionsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.INSPECTIONS);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] || !r[1]) continue;

    var items = [];
    try {
      if (r[15]) {
        items = JSON.parse(String(r[15]));
      }
    } catch (e) {
      items = [];
    }

    var rawDate = r[9];
    var formattedDate = "";
    if (rawDate instanceof Date) {
      var y = rawDate.getFullYear();
      var mo = rawDate.getMonth() + 1;
      var d = rawDate.getDate();
      formattedDate = y + "-" + (mo < 10 ? "0" + mo : "" + mo) + "-" + (d < 10 ? "0" + d : "" + d);
    } else if (rawDate) {
      var dStr = String(rawDate).trim();
      var dm = dStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (dm) {
        var y = dm[1];
        var mo = dm[2].length < 2 ? "0" + dm[2] : dm[2];
        var d = dm[3].length < 2 ? "0" + dm[3] : dm[3];
        formattedDate = y + "-" + mo + "-" + d;
      } else {
        formattedDate = dStr;
      }
    }

    var rawTime = r[10];
    var formattedTime = "";
    if (rawTime instanceof Date) {
      var h = rawTime.getHours();
      var min = rawTime.getMinutes();
      formattedTime = (h < 10 ? "0" + h : "" + h) + ":" + (min < 10 ? "0" + min : "" + min);
    } else if (rawTime) {
      var tStr = String(rawTime).trim().replace(/\s*น\.?$/i, "");
      var tm = tStr.match(/(\d{1,2}):(\d{2})/);
      if (tm) {
        var h = parseInt(tm[1], 10);
        var min = tm[2];
        formattedTime = (h < 10 ? "0" + h : "" + h) + ":" + min;
      } else {
        formattedTime = tStr;
      }
    }

    result.push({
      id: String(r[0]),
      vehicleId: String(r[1]),
      plateNumber: String(r[2]),
      province: String(r[3] || ""),
      vehicleBrand: String(r[4] || ""),
      vehicleType: String(r[5] || "pickup"),
      peaBranchId: r[6] ? String(r[6]) : "",
      peaBranchName: r[7] ? String(r[7]) : "",
      department: String(r[8] || ""),
      inspectionDate: formattedDate,
      inspectionTime: formattedTime,
      inspectorName: String(r[11]),
      inspectorRole: String(r[12] || "พนักงานขับรถ"),
      odometerReading: Number(r[13]) || 0,
      overallResult: r[14] === "pass" ? "pass" : "issue",
      items: items,
      notes: r[16] ? String(r[16]) : "",
      createdAt: r[17] ? String(r[17]) : new Date().toISOString()
    });
  }
  return result;
}

/**
 * Save Inspection Record (เพิ่มเป็นรายการใหม่เสมอเมื่อตรวจซ้ำ ไม่เขียนทับรายการเดิม)
 */
function saveInspectionRecord(ss, record, updatedMileage) {
  var sheet = ss.getSheetByName(SHEET_NAMES.INSPECTIONS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.INSPECTIONS);
  }

  var dateStr = String(record.inspectionDate || "").trim();
  var timeStr = String(record.inspectionTime || "").trim();

  var rowValues = [
    record.id || ("rec-" + Date.now()),
    record.vehicleId,
    record.plateNumber,
    record.province,
    record.vehicleBrand,
    record.vehicleType,
    record.peaBranchId || "",
    record.peaBranchName || "",
    record.department,
    dateStr,
    timeStr,
    record.inspectorName,
    record.inspectorRole,
    record.odometerReading,
    record.overallResult,
    JSON.stringify(record.items),
    record.notes || "",
    record.createdAt || new Date().toISOString()
  ];

  // เพิ่มเป็นแถวใหม่ต่อท้ายเสมอ (ไม่เขียนทับอันเดิม)
  sheet.appendRow(rowValues);

  // อัปเดตเลขไมล์ในแผ่น Vehicles
  if (updatedMileage) {
    var vSheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
    if (vSheet) {
      var vData = vSheet.getDataRange().getValues();
      for (var j = 1; j < vData.length; j++) {
        if (vData[j][0] === record.vehicleId) {
          var cur = Number(vData[j][8]) || 0;
          if (updatedMileage > cur) {
            vSheet.getRange(j + 1, 9).setValue(updatedMileage);
          }
          break;
        }
      }
    }
  }
}

function deleteInspectionRecord(ss, id) {
  var sheet = ss.getSheetByName(SHEET_NAMES.INSPECTIONS);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/**
 * Save / Update Vehicle
 */
function saveVehicleRecord(ss, vehicle) {
  var sheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === vehicle.id) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowValues = [
    vehicle.id,
    vehicle.plateNumber,
    vehicle.province,
    vehicle.brand,
    vehicle.type,
    vehicle.peaBranchId,
    vehicle.peaBranchName,
    vehicle.department,
    vehicle.currentMileage || 0,
    vehicle.status || "active",
    JSON.stringify(vehicle.assignedEquipmentIds || []),
    vehicle.notes || ""
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteVehicleRecord(ss, id) {
  var sheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/**
 * Save / Update Equipment
 */
function saveEquipmentRecord(ss, equipment) {
  var sheet = ss.getSheetByName(SHEET_NAMES.EQUIPMENT);
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === equipment.id) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowValues = [
    equipment.id,
    equipment.code,
    equipment.name,
    equipment.category,
    equipment.description,
    equipment.isRequiredDefault ? "TRUE" : "FALSE"
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteEquipmentRecord(ss, id) {
  var sheet = ss.getSheetByName(SHEET_NAMES.EQUIPMENT);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/**
 * Save / Update Branch
 */
function saveBranchRecord(ss, branch) {
  var sheet = ss.getSheetByName(SHEET_NAMES.BRANCHES);
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === branch.id) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowValues = [
    branch.id,
    branch.code,
    branch.name,
    branch.region,
    branch.phone || "",
    branch.address || ""
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteBranchRecord(ss, id) {
  var sheet = ss.getSheetByName(SHEET_NAMES.BRANCHES);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function setAdminPinInSheet(ss, pin) {
  var sheet = ss.getSheetByName(SHEET_NAMES.ADMIN);
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === "admin_pin") {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 2).setValue(pin);
    sheet.getRange(rowIndex, 3).setValue(new Date().toISOString());
  } else {
    sheet.appendRow(["admin_pin", pin, new Date().toISOString()]);
  }
}

/**
 * Sync All Data
 */
function syncAllDataToSheets(ss, data) {
  checkAndCreateSheets(ss);

  // 1. Admin
  var adminSheet = ss.getSheetByName(SHEET_NAMES.ADMIN);
  adminSheet.clearContents();
  adminSheet.appendRow(["Key (คีย์)", "Value (ค่า)", "UpdatedAt (อัปเดตเมื่อ)"]);
  adminSheet.appendRow(["admin_pin", data.adminPin || "1234", new Date().toISOString()]);
  styleHeaderRow(adminSheet, 3);

  // 2. Branches
  if (data.branches && data.branches.length > 0) {
    var bSheet = ss.getSheetByName(SHEET_NAMES.BRANCHES);
    bSheet.clearContents();
    bSheet.appendRow(["ID", "รหัสสาขา", "ชื่อสาขาการไฟฟ้า (PEA)", "เขต กฟภ.", "เบอร์โทร", "ที่อยู่"]);
    data.branches.forEach(function(b) {
      bSheet.appendRow([b.id, b.code, b.name, b.region, b.phone || "", b.address || ""]);
    });
    styleHeaderRow(bSheet, 6);
  }

  // 3. Equipment
  if (data.equipment && data.equipment.length > 0) {
    var eSheet = ss.getSheetByName(SHEET_NAMES.EQUIPMENT);
    eSheet.clearContents();
    eSheet.appendRow(["ID", "รหัสอุปกรณ์", "ชื่ออุปกรณ์ประจำรถ", "หมวดหมู่", "คำอธิบายมาตรฐาน", "จำเป็นเริ่มต้น"]);
    data.equipment.forEach(function(e) {
      eSheet.appendRow([e.id, e.code, e.name, e.category, e.description, e.isRequiredDefault ? "TRUE" : "FALSE"]);
    });
    styleHeaderRow(eSheet, 6);
  }

  // 4. Vehicles
  if (data.vehicles && data.vehicles.length > 0) {
    var vSheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
    vSheet.clearContents();
    vSheet.appendRow(["ID", "ทะเบียนรถ", "จังหวัด", "ยี่ห้อ/รุ่น", "ประเภทรถ", "รหัสสาขา", "ชื่อสาขาการไฟฟ้า", "แผนก/สังกัด", "เลขไมล์ปัจจุบัน", "สถานะ", "อุปกรณ์ประจำรถ (JSON)", "หมายเหตุ"]);
    data.vehicles.forEach(function(v) {
      vSheet.appendRow([
        v.id,
        v.plateNumber,
        v.province,
        v.brand,
        v.type,
        v.peaBranchId,
        v.peaBranchName,
        v.department,
        v.currentMileage || 0,
        v.status || "active",
        JSON.stringify(v.assignedEquipmentIds || []),
        v.notes || ""
      ]);
    });
    styleHeaderRow(vSheet, 12);
  }

  // 5. Inspections
  if (data.records && data.records.length > 0) {
    var iSheet = ss.getSheetByName(SHEET_NAMES.INSPECTIONS);
    iSheet.clearContents();
    iSheet.appendRow(["ID", "รหัสรถ", "ทะเบียนรถ", "จังหวัด", "ยี่ห้อ/รุ่น", "ประเภทรถ", "รหัสสาขา", "ชื่อสาขาการไฟฟ้า", "แผนก", "วันที่ตรวจ", "เวลา", "ผู้ตรวจเช็ค", "ตำแหน่ง", "เลขไมล์", "ผลการตรวจ", "รายละเอียดรายการที่ตรวจ (JSON)", "หมายเหตุ", "บันทึกเมื่อ"]);
    data.records.forEach(function(r) {
      iSheet.appendRow([
        r.id,
        r.vehicleId,
        r.plateNumber,
        r.province,
        r.vehicleBrand,
        r.vehicleType,
        r.peaBranchId || "",
        r.peaBranchName || "",
        r.department,
        r.inspectionDate,
        r.inspectionTime,
        r.inspectorName,
        r.inspectorRole,
        r.odometerReading,
        r.overallResult,
        JSON.stringify(r.items),
        r.notes || "",
        r.createdAt || new Date().toISOString()
      ]);
    });
    styleHeaderRow(iSheet, 18);
  }
}

/**
 * แสดงสรุปรถค้างตรวจวันนี้ในกล่องข้อความ
 */
function showTodayPendingSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var vSheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
  var iSheet = ss.getSheetByName(SHEET_NAMES.INSPECTIONS);

  if (!vSheet || !iSheet) {
    SpreadsheetApp.getUi().alert("กรุณาสร้างแผ่นงานก่อน");
    return;
  }

  var today = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd");
  var iData = iSheet.getDataRange().getValues();
  var inspectedIds = {};

  for (var i = 1; i < iData.length; i++) {
    if (iData[i][9] === today) {
      inspectedIds[iData[i][1]] = true;
    }
  }

  var vData = vSheet.getDataRange().getValues();
  var pendingList = [];

  for (var j = 1; j < vData.length; j++) {
    var vId = vData[j][0];
    var vPlate = vData[j][1];
    var vStatus = vData[j][9];
    if (vStatus === "active" && !inspectedIds[vId]) {
      pendingList.push("• " + vPlate + " (" + vData[j][3] + ") - " + vData[j][6]);
    }
  }

  var msg = "📅 รายงานประจำวันที่ " + today + "\\n";
  if (pendingList.length === 0) {
    msg += "🎉 ตรวจเช็คครบทุกคันแล้ว 100%!";
  } else {
    msg += "⚠️ รถที่ยังไม่ได้ตรวจ " + pendingList.length + " คัน:\\n" + pendingList.join("\\n");
  }

  SpreadsheetApp.getUi().alert("สรุปการตรวจอุปกรณ์ประจำรถ", msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * ลงข้อมูลตัวอย่าง กฟภ.
 */
function seedInitialData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sampleData = {
    adminPin: "1234",
    branches: [
      { id: "branch-1", code: "PEA-SRB", name: "การไฟฟ้าส่วนภูมิภาคจังหวัดสระบุรี", region: "กฟก.2 (ภาคกลาง เขต 2)", phone: "036-211-123", address: "ถ.พหลโยธิน ต.ปากเพรียว อ.เมือง จ.สระบุรี" },
      { id: "branch-2", code: "PEA-CHB", name: "การไฟฟ้าส่วนภูมิภาคจังหวัดชลบุรี", region: "กฟก.2 (ภาคกลาง เขต 2)", phone: "038-274-001", address: "ถ.สุขุมวิท ต.บางปลาสร้อย อ.เมือง จ.ชลบุรี" },
      { id: "branch-3", code: "PEA-SRC", name: "การไฟฟ้าส่วนภูมิภาคอำเภอศรีราชา", region: "กฟก.2 (ภาคกลาง เขต 2)", phone: "038-311-222", address: "ถ.สุขุมวิท อ.ศรีราชา จ.ชลบุรี" },
      { id: "branch-4", code: "PEA-CNX", name: "การไฟฟ้าส่วนภูมิภาคจังหวัดเชียงใหม่", region: "กฟน.1 (ภาคเหนือ เขต 1)", phone: "053-241-011", address: "ถ.เชียงใหม่-ลำพูน ต.วัดเกต อ.เมือง จ.เชียงใหม่" }
    ],
    equipment: [
      { id: "eq-1", code: "EQ-01", name: "ถังดับเพลิงเคมีแห้ง (Fire Extinguisher)", category: "safety", description: "เกจวัดความดันอยู่ในแถบสีเขียว สลักนิรภัยอยู่ครบ", isRequiredDefault: true },
      { id: "eq-2", code: "EQ-02", name: "ยางอะไหล่ (Spare Tire)", category: "general", description: "เติมลมยางตามสเปก ดอกยางสมบูรณ์ ไม่แตกลายงา", isRequiredDefault: true },
      { id: "eq-3", code: "EQ-03", name: "แม่แรงยกรถ (Car Jack)", category: "emergency", description: "พร้อมด้ามขัน สภาพสมบูรณ์ กลไกขึ้นลงคล่องตัว", isRequiredDefault: true },
      { id: "eq-4", code: "EQ-04", name: "ประแจขันล้อ (Lug Wrench)", category: "emergency", description: "ขนาดตรงกับน็อตล้อรถ ไม่คดงอหรือเกลียวหวาน", isRequiredDefault: true },
      { id: "eq-5", code: "EQ-05", name: "ป้ายสามเหลี่ยมสะท้อนแสงฉุกเฉิน", category: "safety", description: "ขาตั้งแข็งแรง แถบสะท้อนแสงสะอาด มองเห็นได้ไกล", isRequiredDefault: true },
      { id: "eq-6", code: "EQ-06", name: "สายพ่วงแบตเตอรี่ (Jumper Cables)", category: "emergency", description: "หัวคีบแน่น ฉนวนยางไม่แตก ยาวไม่ต่ำกว่า 2.5 ม.", isRequiredDefault: true },
      { id: "eq-7", code: "EQ-07", name: "ชุดปฐมพยาบาลเบื้องต้น (First Aid Kit)", category: "safety", description: "มียาทำแผล ผ้าก๊อซ แอลกอฮอล์ พลาสเตอร์ ยังไม่หมดอายุ", isRequiredDefault: true },
      { id: "eq-8", code: "EQ-08", name: "กล้องติดหน้ารถยนต์ (Dashcam)", category: "electronics", description: "เปิดติดอัตโนมัติ บันทึกภาพลง SD Card ได้ปกติ", isRequiredDefault: false },
      { id: "eq-9", code: "EQ-09", name: "ไฟฉายส่องสว่างฉุกเฉิน PEA", category: "emergency", description: "แบตเตอรี่พร้อมใช้งาน แสงไฟสว่าง ปรับโหมดได้", isRequiredDefault: false },
      { id: "eq-10", code: "EQ-10", name: "เสื้อกั๊กสะท้อนแสงนิรภัย PEA", category: "safety", description: "แถบสะท้อนแสงไม่ลอกหลุด สะอาดและสวมใส่สะดวก", isRequiredDefault: false },
      { id: "eq-11", code: "EQ-11", name: "สมุดคู่มือ / พ.ร.บ. / ประกันภัย", category: "documents", description: "ป้ายภาษีไม่ขาดอายุ มีเอกสารประกันภัยครบ", isRequiredDefault: true },
      { id: "eq-12", code: "EQ-12", name: "บัตรเติมน้ำมันประจำรถ (Fleet Card)", category: "documents", description: "บัตรสมบูรณ์ ชิปการ์ดและแถบแม่เหล็กไม่ชำรุด", isRequiredDefault: true }
    ],
    vehicles: [
      { id: "veh-1", plateNumber: "1ฒผ 9920", province: "สระบุรี", brand: "Toyota Hilux Revo 2.8 4x4", type: "pickup", peaBranchId: "branch-1", peaBranchName: "การไฟฟ้าส่วนภูมิภาคจังหวัดสระบุรี", department: "แผนกปฏิบัติการระบบไฟฟ้า", currentMileage: 84320, status: "active", assignedEquipmentIds: ["eq-1","eq-2","eq-3","eq-4","eq-5","eq-6","eq-7","eq-8","eq-11","eq-12"], notes: "รถสายตรวจแก้กระแสไฟฟ้าขัดข้อง" },
      { id: "veh-2", plateNumber: "กบ 4589", province: "ชลบุรี", brand: "Isuzu D-Max Hi-Lander 1.9", type: "pickup", peaBranchId: "branch-2", peaBranchName: "การไฟฟ้าส่วนภูมิภาคจังหวัดชลบุรี", department: "แผนกบริการลูกค้าและติดตั้งมิเตอร์", currentMileage: 52140, status: "active", assignedEquipmentIds: ["eq-1","eq-2","eq-3","eq-4","eq-5","eq-6","eq-7","eq-11","eq-12"], notes: "รถประจำทีมเทคนิคติดตั้งระบบไฟฟ้า" },
      { id: "veh-3", plateNumber: "3ขษ 7712", province: "สระบุรี", brand: "Toyota Commuter 2.8 VIP", type: "van", peaBranchId: "branch-1", peaBranchName: "การไฟฟ้าส่วนภูมิภาคจังหวัดสระบุรี", department: "แผนกธุรการและยานพาหนะ", currentMileage: 112450, status: "active", assignedEquipmentIds: ["eq-1","eq-2","eq-3","eq-4","eq-5","eq-7","eq-8","eq-10","eq-11","eq-12"], notes: "รถตู้ประสานงานและตรวจราชการ" },
      { id: "veh-4", plateNumber: "82-6641", province: "สระบุรี", brand: "Hino 300 Series รถกระเช้าซ่อมบำรุง", type: "utility", peaBranchId: "branch-1", peaBranchName: "การไฟฟ้าส่วนภูมิภาคจังหวัดสระบุรี", department: "แผนกก่อสร้างและบำรุงรักษาระบบจำหน่าย", currentMileage: 145200, status: "active", assignedEquipmentIds: ["eq-1","eq-2","eq-3","eq-4","eq-5","eq-6","eq-7","eq-9","eq-10","eq-11","eq-12"], notes: "รถกระเช้างานซ่อมบำรุงสายส่งไฟฟ้าแรงสูง" }
    ],
    records: []
  };

  syncAllDataToSheets(ss, sampleData);
  SpreadsheetApp.getUi().alert("🎉 ลงข้อมูลตัวอย่าง กฟภ. เรียบร้อยแล้ว!");
}
`;

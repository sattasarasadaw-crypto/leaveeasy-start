// ─────────────────────────────────────────────────────────────
// js/seed.js — ใส่ข้อมูลตัวอย่างลง Firestore (ใช้ครั้งเดียว)
// ข้อมูลชุดนี้สะกดตรงกับ leaveeasy-spec.md หัวข้อ 7 ทุกตัวอักษร
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

var ปุ่ม = document.getElementById("seedBtn");
var กล่องผล = document.getElementById("result");

ปุ่ม.addEventListener("click", ใส่ข้อมูลตัวอย่าง);

async function ใส่ข้อมูลตัวอย่าง() {
  ปุ่ม.disabled = true;
  ปุ่ม.textContent = "กำลังใส่ข้อมูล...";
  แสดงผล("", "");

  try {
    // 📁 users
    var users = [
      { id: "u001", name: "สมชาย ใจดี",    email: "somchai@example.com", role: "employee" },
      { id: "u002", name: "สมหญิง รักงาน", email: "somying@example.com", role: "manager" },
      { id: "u003", name: "สมศรี ตั้งใจ",   email: "somsri@example.com",  role: "hr" }
    ];
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      await setDoc(doc(db, "users", u.id), { name: u.name, email: u.email, role: u.role });
    }

    // 📁 leaveTypes
    var leaveTypes = [
      { id: "lt001", name: "ลาพักร้อน" },
      { id: "lt002", name: "ลาป่วย" },
      { id: "lt003", name: "ลากิจ" }
    ];
    for (var j = 0; j < leaveTypes.length; j++) {
      var lt = leaveTypes[j];
      await setDoc(doc(db, "leaveTypes", lt.id), { name: lt.name });
    }

    // 📁 leaveRequests (ชื่อผู้ขอลา/ผู้อนุมัติ/ประเภทการลา จดซ้ำไว้ในไฟล์ตามสเปกหัวข้อ 5.3)
    var leaveRequests = [
      {
        id: "lr001",
        title: "ลาพักร้อนไปเที่ยวกับครอบครัว",
        reason: "วางแผนเดินทางไปต่างจังหวัดกับครอบครัว จองที่พักไว้ล่วงหน้าแล้ว",
        status: "รอพิจารณา",
        requesterId: "u001", requesterName: "สมชาย ใจดี",
        approverId: "u002",  approverName: "สมหญิง รักงาน",
        leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
        startDate: "2026-09-07", endDate: "2026-09-09",
        createdAt: "2026-09-01 09:15"
      },
      {
        id: "lr002",
        title: "ลาป่วยไข้หวัดใหญ่",
        reason: "มีไข้สูงและไอมาก แพทย์แนะนำให้พักอยู่บ้าน 2 วัน",
        status: "อนุมัติ",
        requesterId: "u001", requesterName: "สมชาย ใจดี",
        approverId: "u002",  approverName: "สมหญิง รักงาน",
        leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
        startDate: "2026-08-24", endDate: "2026-08-25",
        createdAt: "2026-08-24 08:05"
      },
      {
        id: "lr003",
        title: "ลากิจไปทำบัตรประชาชน",
        reason: "บัตรประชาชนหมดอายุ ต้องไปทำที่สำนักงานเขตในวันทำการ",
        status: "รอพิจารณา",
        requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
        approverId: "",      approverName: "",
        leaveTypeId: "lt003", leaveTypeName: "ลากิจ",
        startDate: "2026-09-15", endDate: "2026-09-15",
        createdAt: "2026-09-10 16:30"
      },
      {
        id: "lr004",
        title: "ลาพักร้อนช่วงวันหยุดยาว",
        reason: "อยากต่อวันหยุดยาวไปพักผ่อนกับครอบครัวอีก 3 วัน",
        status: "ไม่อนุมัติ",
        requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
        approverId: "u002",  approverName: "สมหญิง รักงาน",
        leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
        startDate: "2026-10-12", endDate: "2026-10-16",
        createdAt: "2026-09-20 11:00"
      },
      {
        id: "lr005",
        title: "ลาป่วยไปพบแพทย์ตามนัด",
        reason: "มีนัดตรวจติดตามอาการกับแพทย์ในช่วงเช้า",
        status: "รอพิจารณา",
        requesterId: "u001", requesterName: "สมชาย ใจดี",
        approverId: "u002",  approverName: "สมหญิง รักงาน",
        leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
        startDate: "2026-09-22", endDate: "2026-09-22",
        createdAt: "2026-09-18 14:45"
      }
    ];
    for (var k = 0; k < leaveRequests.length; k++) {
      var lr = leaveRequests[k];
      var id = lr.id;
      delete lr.id;
      await setDoc(doc(db, "leaveRequests", id), lr);
    }

    // 📁 approvals — โฟลเดอร์ย่อยของใบลาแต่ละใบ
    var approvals = [
      { requestId: "lr001", id: "ap001", authorId: "u002", authorName: "สมหญิง รักงาน",
        message: "รับเรื่องแล้ว ขอดูตารางงานของทีมช่วงนั้นก่อนนะครับ", createdAt: "2026-09-01 13:40" },
      { requestId: "lr001", id: "ap002", authorId: "u003", authorName: "สมศรี ตั้งใจ",
        message: "ตรวจแล้ว วันลาพักร้อนคงเหลือครอบคลุมช่วงที่ขอ ไม่ติดขัดฝั่งฝ่ายบุคคล", createdAt: "2026-09-02 10:05" },
      { requestId: "lr002", id: "ap003", authorId: "u002", authorName: "สมหญิง รักงาน",
        message: "อนุมัติแล้ว พักผ่อนให้เต็มที่ งานที่ค้างไว้เดี๋ยวทีมช่วยดูให้", createdAt: "2026-08-24 09:20" },
      { requestId: "lr004", id: "ap004", authorId: "u002", authorName: "สมหญิง รักงาน",
        message: "ช่วงนั้นทีมมีงานส่งมอบพอดี ขอเลื่อนเป็นสัปดาห์ถัดไปได้ไหมครับ", createdAt: "2026-09-20 15:10" }
    ];
    for (var m = 0; m < approvals.length; m++) {
      var ap = approvals[m];
      await setDoc(
        doc(db, "leaveRequests", ap.requestId, "approvals", ap.id),
        { authorId: ap.authorId, authorName: ap.authorName, message: ap.message, createdAt: ap.createdAt }
      );
    }

    ปุ่ม.textContent = "ใส่ข้อมูลเรียบร้อยแล้ว";
    แสดงผล("alert-ok", "✅ ใส่ข้อมูลตัวอย่างครบแล้ว — เปิด Firebase Console ไปเช็คได้เลย (users 3 · leaveTypes 3 · leaveRequests 5 · approvals 4)");
  } catch (err) {
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = "ใส่ข้อมูลตัวอย่าง";
    แสดงผล("alert-error", "❌ ใส่ข้อมูลไม่สำเร็จ: " + err.message);
  }
}

function แสดงผล(class_, ข้อความ) {
  กล่องผล.innerHTML = ข้อความ ? '<div class="alert ' + class_ + '">' + ข้อความ + "</div>" : "";
}

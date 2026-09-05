// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ
// สัปดาห์ที่ 7: signInWithEmailAndPassword จริงผ่าน Firebase Authentication
// ─────────────────────────────────────────────────────────────

import { auth } from "./firebase-config.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// ล็อกอินอยู่แล้ว ไม่ต้องเห็นฟอร์มนี้อีก — เช็คแค่ตอนเปิดหน้า ไม่ใช่ระหว่างกำลังเข้าสู่ระบบอยู่ (กัน redirect ซ้อนกัน)
var กำลังเข้าสู่ระบบ = false;
onAuthStateChanged(auth, function (ผู้ใช้) {
  if (ผู้ใช้ && !กำลังเข้าสู่ระบบ) location.href = ค่าจากURL("next") || "leave-requests.html";
});

var ฟอร์ม = document.getElementById("ฟอร์มเข้าสู่ระบบ");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่ม = document.getElementById("ปุ่มเข้าสู่ระบบ");
var ข้อความปุ่มเดิม = ปุ่ม.textContent;

var ข้อความผิดพลาด = {
  "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "auth/user-not-found": "ไม่พบบัญชีนี้ในระบบ",
  "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
  "auth/too-many-requests": "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่",
  "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง"
};

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();
  กล่องเตือน.classList.add("hidden");
  กำลังเข้าสู่ระบบ = true;
  ปุ่ม.disabled = true;
  ปุ่ม.textContent = "กำลังเข้าสู่ระบบ...";

  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("email").value.trim(),
      document.getElementById("password").value
    );
    location.href = ค่าจากURL("next") || "leave-requests.html";
  } catch (err) {
    กล่องเตือน.textContent = "⚠️ " + (ข้อความผิดพลาด[err.code] || err.message);
    กล่องเตือน.classList.remove("hidden");
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความปุ่มเดิม;
  }
});

// ─────────────────────────────────────────────────────────────
// js/register.js — หน้าสมัครสมาชิก
// สัปดาห์ที่ 7: createUserWithEmailAndPassword จริง + สร้าง users/{uid} คู่กันเสมอ (role เริ่มต้น employee)
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// กันคนที่ล็อกอินอยู่แล้วเห็นฟอร์มนี้ซ้ำ — ต้องเช็คแค่ตอนเปิดหน้า ไม่ใช่ระหว่างสมัครสมาชิกกำลังทำงานอยู่
// (onAuthStateChanged ยิงทันทีที่ createUserWithEmailAndPassword สำเร็จ ก่อน setDoc ด้านล่างจะเขียนเสร็จ
//  ถ้าไม่กันจุดนี้ไว้ จะ redirect ออกกลางคันจน setDoc ไม่ทันได้เขียน)
var กำลังสมัครสมาชิก = false;
onAuthStateChanged(auth, function (ผู้ใช้) {
  if (ผู้ใช้ && !กำลังสมัครสมาชิก) location.href = "leave-requests.html";
});

var ฟอร์ม = document.getElementById("ฟอร์มสมัครสมาชิก");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่ม = document.getElementById("ปุ่มสมัครสมาชิก");
var ข้อความปุ่มเดิม = ปุ่ม.textContent;

var ข้อความผิดพลาด = {
  "auth/email-already-in-use": "อีเมลนี้มีบัญชีอยู่แล้ว — ลองเข้าสู่ระบบแทน",
  "auth/weak-password": "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร",
  "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง"
};

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();
  กล่องเตือน.classList.add("hidden");

  var ชื่อ = document.getElementById("name").value.trim();
  var อีเมล = document.getElementById("email").value.trim();
  var รหัสผ่าน = document.getElementById("password").value;

  if (!ชื่อ) {
    กล่องเตือน.textContent = "⚠️ กรอกชื่อ-นามสกุลก่อน";
    กล่องเตือน.classList.remove("hidden");
    return;
  }

  กำลังสมัครสมาชิก = true;
  ปุ่ม.disabled = true;
  ปุ่ม.textContent = "กำลังสมัคร...";

  try {
    var ผลลัพธ์ = await createUserWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
    await setDoc(doc(db, "users", ผลลัพธ์.user.uid), { name: ชื่อ, email: อีเมล, role: "employee" });
    location.href = "leave-requests.html";
  } catch (err) {
    กล่องเตือน.textContent = "⚠️ " + (ข้อความผิดพลาด[err.code] || err.message);
    กล่องเตือน.classList.remove("hidden");
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความปุ่มเดิม;
  }
});

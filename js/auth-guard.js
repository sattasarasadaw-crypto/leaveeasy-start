// ─────────────────────────────────────────────────────────────
// js/auth-guard.js — ทุกหน้า (ยกเว้น login.html/register.html) import ไฟล์นี้
// สัปดาห์ที่ 7: บังคับล็อกอินก่อนถึงเข้าหน้าได้ (US-08) + วาดชื่อผู้ใช้/ปุ่มออกจากระบบใน nav
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

var ตัวจัดการ;
var สัญญาผู้ใช้ = new Promise(function (resolve) { ตัวจัดการ = resolve; });

onAuthStateChanged(auth, async function (ผู้ใช้) {
  if (!ผู้ใช้) {
    location.href = "login.html?next=" + encodeURIComponent(location.pathname + location.search);
    return;
  }

  var role = "employee";
  var name = ผู้ใช้.email;
  try {
    var snap = await getDoc(doc(db, "users", ผู้ใช้.uid));
    if (snap.exists()) {
      role = snap.data().role || "employee";
      name = snap.data().name || name;
    } else {
      console.warn("ไม่พบข้อมูลผู้ใช้ใน users/" + ผู้ใช้.uid + " — ใช้ role เริ่มต้น employee ไปก่อน");
    }
  } catch (err) {
    console.warn("อ่านข้อมูลผู้ใช้ไม่สำเร็จ: " + err.message);
  }

  var ข้อมูลผู้ใช้ = { uid: ผู้ใช้.uid, email: ผู้ใช้.email, name: name, role: role };
  window.LEAVEEASY_USER = ข้อมูลผู้ใช้;
  ตัวจัดการ(ข้อมูลผู้ใช้);

  var กล่อง = document.getElementById("navUser");
  if (กล่อง) {
    กล่อง.innerHTML = esc(name) + " · <a href=\"#\" id=\"ปุ่มออกจากระบบ\">ออกจากระบบ</a>";
    document.getElementById("ปุ่มออกจากระบบ").addEventListener("click", async function (e) {
      e.preventDefault();
      await signOut(auth);
      location.href = "login.html";
    });
  }
});

// module script อื่น เรียก await รอผู้ใช้ล็อกอิน() ก่อนใช้ uid/name/role ได้เลย
export function รอผู้ใช้ล็อกอิน() {
  return สัญญาผู้ใช้;
}

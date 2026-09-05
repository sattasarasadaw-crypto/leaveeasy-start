// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ตั้งค่าเชื่อมต่อ Firebase / Firestore
//
// ทุกหน้าที่ต้องคุยกับฐานข้อมูลจริง ให้ import ไฟล์นี้ก่อน เช่น
//   import { db } from "./firebase-config.js";
//
// ⚠️ apiKey ด้านล่างไม่ใช่รหัสลับ — ฝังในโค้ดฝั่งเว็บได้ตามปกติ
// ตัวที่กันไม่ให้คนอื่นอ่าน/แก้ข้อมูลจริง ๆ คือ Security Rules
// (ยังไม่ทำสัปดาห์นี้ ตาม leaveeasy-spec.md หัวข้อ 0.2)
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmrsM_Vfv09ql_ESb6PiDeXxKhvhUEa_0",
  authDomain: "leaveeasy-sattasarasada.firebaseapp.com",
  projectId: "leaveeasy-sattasarasada",
  storageBucket: "leaveeasy-sattasarasada.firebasestorage.app",
  messagingSenderId: "390132526369",
  appId: "1:390132526369:web:b186911ee8f239eedfe260",
  measurementId: "G-8JT0THE8TQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

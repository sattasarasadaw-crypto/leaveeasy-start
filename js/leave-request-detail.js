// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่าน/เขียน Firestore จริง — เปลี่ยนสถานะ (US-04) และเขียนความเห็น (US-05)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { รอผู้ใช้ล็อกอิน } from "./auth-guard.js";
import { OPENROUTER_API_KEY } from "./config.local.js";
import {
  doc, getDoc, updateDoc, deleteDoc,
  collection, addDoc, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

var รหัสใบลา = ค่าจากURL("id");
var กล่องใบลา = document.getElementById("กล่องใบลา");
var กล่องความเห็น = document.getElementById("กล่องความเห็น");

var ใบ = null;
var ความเห็น = [];
var ผู้ใช้ปัจจุบัน = null;

โหลดและแสดง();

async function โหลดและแสดง() {
  try {
    ผู้ใช้ปัจจุบัน = await รอผู้ใช้ล็อกอิน();

    var snap = await getDoc(doc(db, "leaveRequests", รหัสใบลา));
    if (!snap.exists()) {
      กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
      return;
    }
    ใบ = Object.assign({ id: snap.id }, snap.data());

    await โหลดความเห็น();

    วาดใบลา();
    วาดความเห็น();
    กล่องความเห็น.classList.remove("hidden");

    document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);
  } catch (err) {
    กล่องใบลา.innerHTML = '<div class="alert alert-error">❌ โหลดข้อมูลไม่สำเร็จ: ' + esc(err.message) + "</div>";
  }
}

async function โหลดความเห็น() {
  var q = query(collection(db, "leaveRequests", รหัสใบลา, "approvals"), orderBy("createdAt"));
  var snapshot = await getDocs(q);
  ความเห็น = snapshot.docs.map(function (d) {
    return Object.assign({ id: d.id }, d.data());
  });
}

// ── วาดข้อมูลใบลาลงหน้าจอ ──
function วาดใบลา() {
  var แถว = [
    ["หัวข้อ", esc(ใบ.title)],
    ["เหตุผลการลา", esc(ใบ.reason)],
    ["ประเภทการลา", esc(ใบ.leaveTypeName)],
    ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
    ["ผู้ขอลา", esc(ใบ.requesterName)],
    ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
    ["สถานะ", ป้ายสถานะ(ใบ.status)],
    ["วันที่ยื่น", esc(ใบ.createdAt)]
  ];

  var html = แถว.map(function (r) {
    return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
  }).join("");

  // ปุ่มอนุมัติ / ไม่อนุมัติ ขึ้นเฉพาะใบที่ยังรอพิจารณา และเฉพาะ role ที่พิจารณาได้ (ผู้ขอลาเปลี่ยนสถานะไม่ได้ — ACL.md)
  var พิจารณาได้ = ผู้ใช้ปัจจุบัน.role !== "employee";

  // ปุ่มให้ AI สรุปใบลา — ให้อ่านประกอบการตัดสินใจเท่านั้น ไม่แตะ status (ใบงานสัปดาห์ที่ 8 ส่วน B)
  if (พิจารณาได้) {
    html +=
      '<div class="btn-row">' +
      '<button type="button" id="ปุ่มสรุปAI" class="btn-ghost">🤖 ให้ AI สรุปใบลานี้</button>' +
      "</div>" +
      '<div id="ผลสรุปAI" class="alert alert-ai' + (ใบ.aiSuggestion ? "" : " hidden") + '">' +
      (ใบ.aiSuggestion ? "🤖 สรุปโดย AI — ใช้ประกอบการตัดสินใจเท่านั้น: " + esc(ใบ.aiSuggestion) : "") +
      "</div>";
  }

  if (ใบ.status === "รอพิจารณา" && พิจารณาได้) {
    html +=
      '<div class="btn-row">' +
      '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
      '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
      "</div>";
  } else if (ใบ.status === "รอพิจารณา") {
    html += '<p class="hint">รอผู้อนุมัติหรือฝ่ายบุคคลพิจารณา</p>';
  } else {
    html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
  }

  // ปุ่มลบ — ลบได้เฉพาะใบของตัวเองที่ยังรอพิจารณา (US-07)
  var ลบได้ = ใบ.status === "รอพิจารณา" && ใบ.requesterId === ผู้ใช้ปัจจุบัน.uid;
  html +=
    '<div class="btn-row">' +
    '<button type="button" class="btn-danger" id="ปุ่มลบใบลา"' +
    (ลบได้ ? "" : " disabled") + ">ลบใบลา</button>" +
    "</div>";

  กล่องใบลา.innerHTML = html;

  if (พิจารณาได้) {
    document.getElementById("ปุ่มสรุปAI").addEventListener("click", สรุปใบลาด้วยAI);
  }
  if (ใบ.status === "รอพิจารณา" && พิจารณาได้) {
    document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
    document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
  }
  document.getElementById("ปุ่มลบใบลา").addEventListener("click", ลบใบลา);
}

// ── ให้ AI สรุปใบลาให้หัวหน้าอ่าน — สรุปเท่านั้น ห้ามแตะ status ──
async function สรุปใบลาด้วยAI() {
  var ปุ่ม = document.getElementById("ปุ่มสรุปAI");
  var กล่องผล = document.getElementById("ผลสรุปAI");
  var ข้อความปุ่มเดิม = ปุ่ม.textContent;

  ปุ่ม.disabled = true;
  ปุ่ม.textContent = "กำลังให้ AI สรุป...";
  กล่องผล.className = "alert hidden";
  กล่องผล.textContent = "";

  var ตัวควบคุมยกเลิก = new AbortController();
  var หมดเวลา = setTimeout(function () { ตัวควบคุมยกเลิก.abort(); }, 15000);

  var ข้อความให้AI =
    "หัวข้อ: " + ใบ.title + "\n" +
    "ประเภทการลา: " + ใบ.leaveTypeName + "\n" +
    "ช่วงวันที่: " + ใบ.startDate + " ถึง " + ใบ.endDate + "\n" +
    "ผู้ขอลา: " + ใบ.requesterName + "\n" +
    "เหตุผลการลา: " + ใบ.reason;

  try {
    var res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: ตัวควบคุมยกเลิก.signal,
      headers: {
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "คุณช่วยสรุปใบลาให้หัวหน้าอ่านก่อนตัดสินใจ ตอบเป็นภาษาไทยสั้น ๆ 1-2 ประโยค สรุปข้อเท็จจริงเท่านั้น ห้ามแนะนำว่าควรอนุมัติหรือไม่อนุมัติ"
          },
          { role: "user", content: ข้อความให้AI }
        ]
      })
    });

    var data = await res.json();
    if (!res.ok) {
      throw new Error((data.error && data.error.message) || "เรียก API ไม่สำเร็จ");
    }
    var สรุป = (data.choices[0].message.content || "").trim();
    if (!สรุป) throw new Error("AI ไม่ได้ตอบข้อความสรุปกลับมา");

    // เขียนเฉพาะช่อง aiSuggestion — ห้ามเขียนทับช่องอื่นของใบลา (โดยเฉพาะ status)
    await updateDoc(doc(db, "leaveRequests", รหัสใบลา), { aiSuggestion: สรุป });
    await addDoc(collection(db, "leaveRequests", รหัสใบลา, "aiLog"), {
      input: ข้อความให้AI,
      output: สรุป,
      createdAt: เวลาตอนนี้()
    });

    ใบ.aiSuggestion = สรุป;
    วาดใบลา();
  } catch (err) {
    var ข้อความเตือน = err.name === "AbortError"
      ? "⌛ รอ AI นานเกิน 15 วินาที — ยังกดอนุมัติ/ไม่อนุมัติได้ตามปกติ"
      : "❌ ให้ AI สรุปไม่สำเร็จ: " + err.message + " — ยังกดอนุมัติ/ไม่อนุมัติได้ตามปกติ";
    กล่องผล.className = "alert alert-error";
    กล่องผล.textContent = ข้อความเตือน;
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความปุ่มเดิม;
  } finally {
    clearTimeout(หมดเวลา);
  }
}

// ── ลบใบลา — ต้องยืนยันก่อนเสมอ ลบได้เฉพาะใบที่ยังรอพิจารณา ──
async function ลบใบลา() {
  if (ใบ.status !== "รอพิจารณา" || ใบ.requesterId !== ผู้ใช้ปัจจุบัน.uid) return;
  if (!confirm('ยืนยันการลบใบลา "' + ใบ.title + '" หรือไม่ — เมื่อลบแล้วกู้คืนไม่ได้')) return;

  var ปุ่มลบ = document.getElementById("ปุ่มลบใบลา");
  ปุ่มลบ.disabled = true;
  ปุ่มลบ.textContent = "กำลังลบ...";

  try {
    await deleteDoc(doc(db, "leaveRequests", รหัสใบลา));
    location.href = "leave-requests.html";
  } catch (err) {
    alert("ลบไม่สำเร็จ: " + err.message);
    ปุ่มลบ.disabled = false;
    ปุ่มลบ.textContent = "ลบใบลา";
  }
}

// ── เปลี่ยนสถานะจริงใน Firestore — แก้เฉพาะช่อง status เท่านั้น ห้ามเขียนทับช่องอื่น ──
async function เปลี่ยนสถานะ(สถานะใหม่) {
  // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
  if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
    alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
    return;
  }

  var ปุ่มอนุมัติ = document.getElementById("ปุ่มอนุมัติ");
  var ปุ่มไม่อนุมัติ = document.getElementById("ปุ่มไม่อนุมัติ");
  ปุ่มอนุมัติ.disabled = true;
  ปุ่มไม่อนุมัติ.disabled = true;

  try {
    await updateDoc(doc(db, "leaveRequests", รหัสใบลา), { status: สถานะใหม่ });
    ใบ.status = สถานะใหม่;
    วาดใบลา();
  } catch (err) {
    alert("เปลี่ยนสถานะไม่สำเร็จ: " + err.message);
    ปุ่มอนุมัติ.disabled = false;
    ปุ่มไม่อนุมัติ.disabled = false;
  }
}

// ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
function วาดความเห็น() {
  var ที่วาง = document.getElementById("รายการความเห็น");
  if (ความเห็น.length === 0) {
    ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
    return;
  }
  ที่วาง.innerHTML = ความเห็น
    .map(function (c) {
      return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
             "</div><div>" + esc(c.message) + "</div></div>";
    }).join("");
}

// ── ส่งความเห็นใหม่ลง subcollection approvals จริง ──
async function ส่งความเห็น() {
  var ช่อง = document.getElementById("ข้อความความเห็น");
  var เตือน = document.getElementById("เตือนความเห็น");
  var ปุ่มส่ง = document.getElementById("ปุ่มส่งความเห็น");
  var ข้อความ = ช่อง.value.trim();

  if (!ข้อความ) {
    เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
    เตือน.classList.remove("hidden");
    return;
  }
  เตือน.classList.add("hidden");
  ปุ่มส่ง.disabled = true;

  var ความเห็นใหม่ = {
    authorId: ผู้ใช้ปัจจุบัน.uid, authorName: ผู้ใช้ปัจจุบัน.name,
    message: ข้อความ,
    createdAt: เวลาตอนนี้()
  };

  try {
    var เอกสารใหม่ = await addDoc(collection(db, "leaveRequests", รหัสใบลา, "approvals"), ความเห็นใหม่);
    ความเห็น.push(Object.assign({ id: เอกสารใหม่.id }, ความเห็นใหม่));
    ช่อง.value = "";
    วาดความเห็น();
  } catch (err) {
    เตือน.textContent = "⚠️ ส่งความเห็นไม่สำเร็จ: " + err.message;
    เตือน.classList.remove("hidden");
  } finally {
    ปุ่มส่ง.disabled = false;
  }
}

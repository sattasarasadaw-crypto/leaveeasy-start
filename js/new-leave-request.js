// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกใบลาใหม่ลง Firestore จริง (collection leaveRequests)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { รอผู้ใช้ล็อกอิน } from "./auth-guard.js";
import { OPENROUTER_API_KEY } from "./config.local.js";
import {
  collection, addDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
  var ข้อความปุ่มเดิม = ปุ่มบันทึก.textContent;
  var ปุ่มAI = document.getElementById("ปุ่มAI");
  var กล่องผลAI = document.getElementById("ผลลัพธ์AI");
  var ข้อความปุ่มAIเดิม = ปุ่มAI.textContent;

  // เติมรายการเลื่อนลงด้วยประเภทการลาที่มีอยู่
  window.LEAVE_DATA.leaveTypes.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement("option");
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });

  ปุ่มAI.addEventListener("click", ให้AIช่วยจัดประเภท);

  async function ให้AIช่วยจัดประเภท() {
    var เหตุผล = document.getElementById("reason").value.trim();
    if (!เหตุผล) {
      แสดงผลAI("alert-error", "⚠️ กรอกเหตุผลการลาก่อน แล้วค่อยกดให้ AI ช่วยจัดประเภท");
      return;
    }

    ปุ่มAI.disabled = true;
    ปุ่มAI.textContent = "กำลังให้ AI ช่วยเลือก...";
    แสดงผลAI("", "");

    var ตัวควบคุมยกเลิก = new AbortController();
    var หมดเวลา = setTimeout(function () { ตัวควบคุมยกเลิก.abort(); }, 15000);

    try {
      var รายชื่อประเภท = window.LEAVE_DATA.leaveTypes.map(function (t) {
        return { id: t.id, name: t.name };
      });

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
              content: "คุณช่วยจัดประเภทการลาจากเหตุผลที่พนักงานพิมพ์ ตอบกลับเป็น id ของประเภทที่เลือกเพียงอย่างเดียว ห้ามมีคำอธิบายหรือข้อความอื่นใด ๆ ต้องเลือก id จากรายการที่ให้มาเท่านั้น"
            },
            {
              role: "user",
              content: "เหตุผลการลา: " + เหตุผล + "\nรายการประเภทการลาที่มีอยู่จริง (เลือก id เดียวจากนี้): " + JSON.stringify(รายชื่อประเภท)
            }
          ]
        })
      });

      var data = await res.json();
      if (!res.ok) {
        throw new Error((data.error && data.error.message) || "เรียก API ไม่สำเร็จ");
      }

      var ผลดิบ = (data.choices[0].message.content || "").trim();
      var idที่เลือก = ผลดิบ.replace(/["'.\s]/g, "");
      var ประเภทที่ตรง = window.LEAVE_DATA.leaveTypes.find(function (t) { return t.id === idที่เลือก; })
        || window.LEAVE_DATA.leaveTypes.find(function (t) { return ผลดิบ.indexOf(t.id) !== -1; });

      if (!ประเภทที่ตรง) {
        แสดงผลAI("alert-error", "❌ AI จัดประเภทให้ไม่ได้ (ผลลัพธ์ไม่ตรงกับประเภทที่มีอยู่จริง) — กรุณาเลือกประเภทเอง");
        return;
      }

      ช่องประเภท.value = ประเภทที่ตรง.id;
      แสดงผลAI("alert-ai", "🤖 ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน: ระบบเลือกประเภท \"" + ประเภทที่ตรง.name + "\" ให้ (แก้ไขเป็นประเภทอื่นได้เสมอ)");
    } catch (err) {
      if (err.name === "AbortError") {
        แสดงผลAI("alert-error", "⌛ รอ AI นานเกิน 15 วินาที — ยังกดบันทึกใบลาต่อได้ตามปกติ กรุณาเลือกประเภทเอง");
      } else {
        แสดงผลAI("alert-error", "❌ เรียก AI ไม่สำเร็จ: " + err.message + " — ยังกดบันทึกใบลาต่อได้ตามปกติ");
      }
    } finally {
      clearTimeout(หมดเวลา);
      ปุ่มAI.disabled = false;
      ปุ่มAI.textContent = ข้อความปุ่มAIเดิม;
    }
  }

  function แสดงผลAI(ประเภทกล่อง, ข้อความ) {
    if (!ข้อความ) {
      กล่องผลAI.classList.add("hidden");
      กล่องผลAI.textContent = "";
      return;
    }
    กล่องผลAI.className = "alert " + ประเภทกล่อง;
    กล่องผลAI.textContent = ข้อความ;
  }

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ประเภท = window.LEAVE_DATA.leaveTypes.find(function (t) { return t.id === ค่า.leaveTypeId; });

    บันทึกลงฐานข้อมูล(ค่า, ประเภท);
  });

  async function บันทึกลงฐานข้อมูล(ค่า, ประเภท) {
    ปุ่มบันทึก.disabled = true;
    ปุ่มบันทึก.textContent = "กำลังบันทึก...";
    กล่องเตือน.classList.add("hidden");

    try {
      var ผู้ใช้ = await รอผู้ใช้ล็อกอิน();
      var ใบใหม่ = {
        title: ค่า.title,
        reason: ค่า.reason,
        status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
        requesterId: ผู้ใช้.uid, requesterName: ผู้ใช้.name,
        approverId: "",      approverName: "",
        leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
        startDate: ค่า.startDate,
        endDate: ค่า.endDate,
        createdAt: เวลาตอนนี้()
      };
      await addDoc(collection(db, "leaveRequests"), ใบใหม่);
      location.href = "leave-requests.html";
    } catch (err) {
      เตือน("บันทึกไม่สำเร็จ: " + err.message);
      ปุ่มบันทึก.disabled = false;
      ปุ่มบันทึก.textContent = ข้อความปุ่มเดิม;
    }
  }

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();

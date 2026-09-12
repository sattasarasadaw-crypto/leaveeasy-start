// ─────────────────────────────────────────────────────────────
// js/ai-test.js — ทดสอบเรียก AI ผ่าน OpenRouter (ใบงานสัปดาห์ที่ 8 ส่วน A1)
// หน้านี้ใช้ทดสอบการเชื่อมต่อเท่านั้น ยังไม่ใช่ฟีเจอร์จริงของระบบ
// ─────────────────────────────────────────────────────────────

var ปุ่ม = document.getElementById("testBtn");
var กล่องผล = document.getElementById("result");

ปุ่ม.addEventListener("click", ทดสอบเรียกAI);

async function ทดสอบเรียกAI() {
  ปุ่ม.disabled = true;
  ปุ่ม.textContent = "กำลังส่ง...";
  แสดงผล("", "");

  try {
    var { OPENROUTER_API_KEY } = await import("./config.local.js");

    var res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: "สวัสดี" }]
      })
    });

    var data = await res.json();
    if (!res.ok) {
      throw new Error((data.error && data.error.message) || "เรียก API ไม่สำเร็จ");
    }

    var คำตอบ = data.choices[0].message.content;
    แสดงผล("alert-ok", "✅ AI ตอบว่า: " + esc(คำตอบ));
  } catch (err) {
    แสดงผล("alert-error", "❌ เรียก AI ไม่สำเร็จ: " + esc(err.message));
  } finally {
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = "ส่งข้อความทดสอบ";
  }
}

function แสดงผล(class_, ข้อความ) {
  กล่องผล.innerHTML = ข้อความ ? '<div class="alert ' + class_ + '">' + ข้อความ + "</div>" : "";
}

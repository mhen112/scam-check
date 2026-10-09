export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { data } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ 
            error: 'ไม่พบ GEMINI_API_KEY', 
            details: 'กรุณาเช็กการตั้งค่า Environment Variables ใน Vercel' 
        });
    }

    const promptText = `
คุณคือ AI, Cybersecurity และ Risk Assessment Expert มีหน้าที่ประเมินความเสี่ยง Scam
วิเคราะห์ข้อมูลนี้: "${data}"

ตอบกลับเป็น JSON Structure เท่านั้น (ห้ามมีอักขระอื่นนอกเหนือจาก JSON):
{
  "risk_level": "SAFE" หรือ "SUSPICIOUS" หรือ "HIGH_RISK",
  "risk_score": คะแนนตัวเลข 0 ถึง 100,
  "input_information": "สรุปข้อมูลที่ป้อนเข้ามา",
  "scam_signals": ["สัญญาณที่ 1", "สัญญาณที่ 2"],
  "verification_results": "ผลการตรวจสอบ หรือระบุ 'ไม่พบข้อมูลเพียงพอสำหรับการยืนยัน'",
  "risk_reasons": ["เหตุผลความเสี่ยงที่ 1"],
  "recommendation": {
    "actions": "ข้อแนะนำสิ่งที่ควรทำ",
    "warning": "คำเตือนไม่ให้กดลิงก์หรือให้ข้อมูลส่วนตัว"
  },
  "evidence_sources": "แหล่งอ้างอิง หรือระบุ 'ไม่พบข้อมูลเพียงพอสำหรับการยืนยัน'"
}
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }]
            })
        });

        const apiData = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: 'Gemini API Error', 
                details: apiData.error?.message || JSON.stringify(apiData)
            });
        }

        const rawText = apiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // ล้างMarkdown Code Block ออกเผื่อ AI ส่ง ```json มาด้วย
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(cleanJson);

        return res.status(200).json(parsedJson);
    } catch (error) {
        return res.status(500).json({ 
            error: 'Failed to process response', 
            details: error.message 
        });
    }
}

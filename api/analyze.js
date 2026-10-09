export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { data } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing on server.' });
    }

    const systemPrompt = `
    คุณคือผู้เชี่ยวชาญด้าน AI, Cybersecurity และ Risk Assessment Expert
    หน้าที่ของคุณคือ วิเคราะห์ข้อมูลผู้ใช้นำเข้ามาว่าเกี่ยวข้องกับ Scam หรือไม่

    [ข้อกำหนดสำคัญ]
    1. ห้ามสรุปว่าข้อมูลเป็น Scam อย่างแน่นอน หากไม่มีข้อมูลเพียงพอ แต่ให้ระบุระดับความเสี่ยงพร้อมเหตุผล
    2. หากไม่พบข้อมูลบัญชี/เบอร์โทร ให้ระบุชัดเจนว่า "ไม่พบข้อมูลเพียงพอสำหรับการยืนยัน" ห้ามสร้างผลลัพธ์ปลอมขึ้นมาเอง
    3. ส่งคืนผลลัพธ์ในรูปแบบ JSON Structure เท่านั้นตามฟอร์แมตนี้:

    {
      "risk_level": "SAFE" | "SUSPICIOUS" | "HIGH_RISK",
      "risk_score": 0-100 (Integer),
      "input_information": "ข้อมูลสรุปสิ่งที่ผู้ใช้ส่งเข้ามา",
      "scam_signals": ["สัญญาณที่ 1", "สัญญาณที่ 2"],
      "verification_results": "ผลการตรวจสอบจากฐานข้อมูลหรือเว็บ",
      "risk_reasons": ["เหตุผลที่ 1", "เหตุผลที่ 2"],
      "recommendation": {
        "actions": "สิ่งที่ผู้ใช้ควรปฏิบัติ",
        "warning": "คำเตือนเรื่องการไม่คลิกลิงก์/ไม่ให้ข้อมูลทางการเงิน"
      },
      "evidence_sources": "แหล่งอ้างอิง หรือระบุว่า 'ไม่พบข้อมูลเพียงพอสำหรับการยืนยัน'"
    }
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt + "\n\nข้อมูลที่ต้องวิเคราะห์: " + data }] }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const apiData = await response.json();
        const jsonText = apiData.candidates[0].content.parts[0].text;
        const parsedJson = JSON.parse(jsonText);

        return res.status(200).json(parsedJson);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to analyze data', details: error.message });
    }
}

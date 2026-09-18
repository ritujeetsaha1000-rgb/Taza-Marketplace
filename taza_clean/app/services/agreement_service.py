import uuid
import smtplib
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class AgreementService:
    """
    Manages generation and email dispatch for the TAZA Farmer Produce Agreement
    (???? ??? ?????? / ????? ??? ??????).
    """

    def generate_agreement_html(
        self,
        farmer_name: str,
        contact_number: str,
        agreement_date: Optional[str] = None,
        country_of_origin: str = "India"
    ) -> str:
        if not agreement_date:
            agreement_date = datetime.now(timezone.utc).strftime("%d %B %Y")

        clean_contact = contact_number.strip()
        if not clean_contact.startswith("+"):
            clean_contact = f"+91 {clean_contact}"

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body {{
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #f8fafc;
    margin: 0;
    padding: 24px;
    line-height: 1.5;
  }}
  .agreement-container {{
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 32px 36px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }}
  .agreement-header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #16a34a;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }}
  .brand-title {{
    font-size: 26px;
    font-weight: 800;
    color: #15803d;
    letter-spacing: -0.5px;
    margin: 0;
  }}
  .brand-subtitle {{
    font-size: 13px;
    color: #64748b;
    margin-top: 4px;
    font-weight: 500;
  }}
  .agreement-badge {{
    background-color: #dcfce7;
    color: #166534;
    font-weight: 700;
    font-size: 12px;
    padding: 6px 12px;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .title-block {{
    text-align: center;
    margin-bottom: 24px;
  }}
  .doc-title-en {{
    font-size: 19px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 6px 0;
  }}
  .doc-title-regional {{
    font-size: 15px;
    font-weight: 600;
    color: #475569;
    margin: 0;
  }}
  .meta-table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    background-color: #f1f5f9;
    border-radius: 6px;
    overflow: hidden;
  }}
  .meta-table td {{
    padding: 10px 14px;
    font-size: 13px;
    border-bottom: 1px solid #e2e8f0;
  }}
  .meta-table td.label {{
    font-weight: 600;
    color: #475569;
    width: 25%;
    background-color: #e2e8f0;
  }}
  .meta-table td.val {{
    font-weight: 700;
    color: #0f172a;
  }}
  .clause-card {{
    margin-bottom: 20px;
    padding: 16px 18px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #16a34a;
    border-radius: 4px;
  }}
  .clause-num {{
    font-size: 14px;
    font-weight: 800;
    color: #15803d;
    margin-bottom: 6px;
    text-transform: uppercase;
  }}
  .clause-title {{
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 8px;
  }}
  .clause-text {{
    font-size: 12.5px;
    color: #334155;
    margin-bottom: 6px;
    line-height: 1.55;
  }}
  .clause-text.hi {{
    color: #475569;
    font-style: normal;
  }}
  .clause-text.bn {{
    color: #475569;
    font-style: normal;
  }}
  .signatures-wrap {{
    margin-top: 32px;
    padding-top: 20px;
    border-top: 2px dashed #cbd5e1;
    display: flex;
    justify-content: space-between;
  }}
  .sig-box {{
    width: 46%;
  }}
  .sig-title {{
    font-size: 13px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 28px;
  }}
  .sig-line {{
    border-bottom: 1px solid #94a3b8;
    margin-bottom: 6px;
  }}
  .sig-name {{
    font-size: 12px;
    font-weight: 600;
    color: #0f172a;
  }}
  .sig-meta {{
    font-size: 11px;
    color: #64748b;
  }}
  .footer-note {{
    margin-top: 28px;
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
    border-top: 1px solid #f1f5f9;
    padding-top: 12px;
  }}
</style>
</head>
<body>
<div class="agreement-container">
  <div class="agreement-header">
    <div>
      <h1 class="brand-title">TAZA AGRO PLATFORM</h1>
      <div class="brand-subtitle">Empowering Farmers with Fair Prices & Guaranteed Market Access</div>
    </div>
    <div class="agreement-badge">Official Agreement</div>
  </div>

  <div class="title-block">
    <div class="doc-title-en">TAZA FARMER PRODUCE AGREEMENT</div>
    <div class="doc-title-regional">কৃষক ফসল চুক্তি &bull; किसान उपज समझौता</div>
  </div>

  <table class="meta-table">
    <tr>
      <td class="label">Farmer Name / কৃষক / किसान:</td>
      <td class="val">{farmer_name}</td>
      <td class="label">Contact Number / যোগাযোগ / संपर्क:</td>
      <td class="val">{clean_contact}</td>
    </tr>
    <tr>
      <td class="label">Effective Date / তারিখ / दिनांक:</td>
      <td class="val">{agreement_date}</td>
      <td class="label">Country of Origin / দেশ / देश:</td>
      <td class="val">{country_of_origin}</td>
    </tr>
    <tr>
      <td class="label">Digital Ref ID:</td>
      <td class="val" colspan="3">{uuid.uuid4().hex[:12].upper()}</td>
    </tr>
  </table>

  <!-- Clause 1 -->
  <div class="clause-card">
    <div class="clause-num">Clause 1 &bull; ধারা ১ &bull; खंड १</div>
    <div class="clause-title">Guaranteed Price and Profit / নিশ্চিত মূল্য এবং লাভ / न्यूनतम सुनिश्चित मूल्य एवं लाभ</div>
    <div class="clause-text">
      <strong>English:</strong> The company (TAZA) guarantees to purchase the produce from the farmer at a pre-agreed fair price that ensures at least a designated minimum profit margin over the prevailing market rate, protecting the farmer against sudden wholesale price drops.
    </div>
    <div class="clause-text bn">
      <strong>বাংলা:</strong> কোম্পানি (তাজা) কৃষকের কাছ থেকে প্রাক-নির্ধারিত ন্যায্য মূল্যে ফসল ক্রয় করার নিশ্চয়তা প্রদান করে, যা প্রচলিত পাইকারি বাজার মূল্যের চেয়ে লাভজনক মার্জিন সুনিশ্চিত করে এবং আকস্মিক বাজার দরপতন থেকে কৃষককে সুরক্ষিত রাখে।
    </div>
    <div class="clause-text hi">
      <strong>हिन्दी:</strong> कंपनी (ताज़ा) किसान से पूर्व-निर्धारित उचित मूल्य पर उपज खरीदने की गारंटी देती है, जो प्रचलित बाजार दर पर न्यूनतम लाभ सुनिश्चित करती है और किसान को बाजार के अचानक उतार-चढ़ाव से बचाती है।
    </div>
  </div>

  <!-- Clause 2 -->
  <div class="clause-card">
    <div class="clause-num">Clause 2 &bull; ধারা ২ &bull; खंड २</div>
    <div class="clause-title">Storage, Quality & Quantity Verification at Warehouse / গুদামজাতকরণ এবং গুণমান যাচাই / वेयरहाउस भंडारण, गुणवत्ता एवं मात्रा सत्यापन</div>
    <div class="clause-text">
      <strong>English:</strong> The farmer shall transport the harvest to the nearest designated TAZA AI-optimized warehouse (within 40km or next nearest available center). The crop shall undergo transparent digital weighing and computerized grade testing for moisture and purity in the farmer's presence.
    </div>
    <div class="clause-text bn">
      <strong>বাংলা:</strong> কৃষক নিকটবর্তী নির্ধারিত তাজা ওয়্যারহাউসে (৪০ কিমি ব্যাসার্ধ বা পরবর্তী নিকটতম কেন্দ্র) ফসল পরিবহন করবেন। কৃষকের উপস্থিতিতে ফসলের ওজন এবং কম্পিউটারাইজড গুণমান পরীক্ষা স্বচ্ছভাবে সম্পন্ন করা হবে।
    </div>
    <div class="clause-text hi">
      <strong>हिन्दी:</strong> किसान अपनी फसल निकटतम निर्धारित ताज़ा वेयरहाउस (४० किमी दायरा अथवा अगले उपलब्ध केंद्र) तक पहुंचाएंगे। किसान की उपस्थिति में डिजिटल वजन और गुणवत्ता जांच पारदर्शी रूप से की जाएगी।
    </div>
  </div>

  <!-- Clause 3 -->
  <div class="clause-card">
    <div class="clause-num">Clause 3 &bull; ধারা ৩ &bull; खंड ३</div>
    <div class="clause-title">Payment Settlement / পেমেন্ট ও অর্থ প্রদান / भुगतान एवं निपटान</div>
    <div class="clause-text">
      <strong>English:</strong> Upon successful quality acceptance and receipt at the warehouse, TAZA guarantees direct electronic payment transfer to the farmer's verified bank account or UPI within the statutory period of maximum 30 days, without any unauthorized middlemen deductions.
    </div>
    <div class="clause-text bn">
      <strong>বাংলা:</strong> গুদামে ফসল সফলভাবে যাচাই ও গ্রহণের পর, তাজা সর্বোচ্চ ৩০ দিনের বিধিবদ্ধ সময়ের মধ্যে কৃষকের যাচাইকৃত ব্যাঙ্ক অ্যাকাউন্ট বা ইউপিআই (UPI)-তে সরাসরি ইলেকট্রনিক অর্থ স্থানান্তর নিশ্চিত করে।
    </div>
    <div class="clause-text hi">
      <strong>हिन्दी:</strong> वेयरहाउस पर गुणवत्ता सत्यापन और रसीद प्राप्ति के पश्चात, ताज़ा अधिकतम ३० दिनों की वैधानिक अवधि के भीतर किसान के सत्यापित बैंक खाते अथवा यूपीआई में सीधे भुगतान की गारंटी देता है।
    </div>
  </div>

  <!-- Clause 4 -->
  <div class="clause-card">
    <div class="clause-num">Clause 4 &bull; ধারা ৪ &bull; खंड ৪</div>
    <div class="clause-title">Fair Treatment, Zero Land Claim & Natural Disaster Protection / ন্যায্য আচরণ ও প্রাকৃতিক দুর্যোগ সুরক্ষা / निष्पक्ष व्यवहार, शून्य भूमि दावा एवं आपदा सुरक्षा</div>
    <div class="clause-text">
      <strong>English:</strong> Under no circumstances shall TAZA or any associated partner lay any legal claim, lien, or mortgage over the farmer's agricultural land. In case of verified crop loss due to catastrophic climate events (cyclone, floods, severe hail), the farmer shall not be penalized.
    </div>
    <div class="clause-text bn">
      <strong>বাংলা:</strong> কোনো অবস্থাতেই তাজা বা তার সহযোগী কোনো পক্ষ কৃষকের চাষযোগ্য জমির ওপর কোনো আইনি দাবি, বন্ধক বা অধিকার প্রয়োগ করবে না। চরম আবহাওয়া বা প্রাকৃতিক দুর্যোগে ক্ষতি হলে কৃষককে কোনো জরিমানা করা হবে না।
    </div>
    <div class="clause-text hi">
      <strong>हिन्दी:</strong> किसी भी परिस्थिति में ताज़ा या उसका कोई भी भागीदार किसान की कृषि भूमि पर कोई कानूनी दावा, ग्रहणाधिकार या बंधक नहीं रखेगा। प्राकृतिक आपदा या चक्रवात से फसल क्षति होने पर किसान पर कोई जुर्माना नहीं लगाया जाएगा।
    </div>
  </div>

  <!-- Clause 5 -->
  <div class="clause-card">
    <div class="clause-num">Clause 5 &bull; ধারা ৫ &bull; खंड ५</div>
    <div class="clause-title">Dispute Resolution & Legal Framework / বিরোধ নিষ্পত্তি ও আইনি কাঠামো / विवाद समाधान एवं कानूनी ढांचा</div>
    <div class="clause-text">
      <strong>English:</strong> Any grievance or discrepancy regarding grade classification or settlement shall be submitted to the TAZA Farmer Support Desk and resolved amicably within 7 business days under the statutory agricultural trade dispute settlement guidelines and local jurisdiction.
    </div>
    <div class="clause-text bn">
      <strong>বাংলা:</strong> গ্রেডিং বা অর্থপ্রদান সংক্রান্ত যেকোনো অভিযোগ তাজা কৃষক সহায়তা কেন্দ্রে জানানো হবে এবং ৭ কার্যদিবসের মধ্যে বিধিবদ্ধ কৃষি বাণিজ্য বিরোধ নিষ্পত্তি নির্দেশিকা অনুযায়ী সৌহার্দ্যপূর্ণভাবে সমাধান করা হবে।
    </div>
    <div class="clause-text hi">
      <strong>हिन्दी:</strong> उपज की ग्रेडिंग अथवा भुगतान संबंधी किसी भी विवाद को ताज़ा किसान सहायता केंद्र में प्रस्तुत किया जाएगा और ७ कार्य दिवसों के भीतर संबंधित कृषि विवाद निपटान नियमों के तहत सुलझाया जाएगा।
    </div>
  </div>

  <!-- Signatures -->
  <div class="signatures-wrap">
    <div class="sig-box">
      <div class="sig-title">Authorized Signatory (TAZA AGRO):</div>
      <div class="sig-line"></div>
      <div class="sig-name">Debabrata Roy / Operations Director</div>
      <div class="sig-meta">TAZA Agricultural Logistics & Warehouse Network</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Farmer Signatory / ডিজিটাল সম্মতি:</div>
      <div class="sig-line"></div>
      <div class="sig-name">{farmer_name}</div>
      <div class="sig-meta">Contact: {clean_contact} (Verified via Digital OTP)</div>
    </div>
  </div>

  <div class="footer-note">
    This document is legally binding upon digital acceptance during sign-up. Generated by TAZA Agro Digital Network &bull; Government of India Agricultural Facilitation Compliant.
  </div>
</div>
</body>
</html>"""
        return html

    def _send_smtp_sync(
        self,
        host: str,
        port: int,
        user: Optional[str],
        password: Optional[str],
        from_email: str,
        from_name: str,
        to_email: str,
        subject: str,
        html_content: str,
        use_tls: bool = True
    ) -> None:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email

        plain_text = (
            f"TAZA FARMER PRODUCE AGREEMENT\n\n"
            f"Farmer Name: {to_email}\n"
            f"Dear Farmer,\n\n"
            f"Please find your official TAZA Farmer Produce Agreement (কৃষক ফসল চুক্তি / किसान उपज समझौता).\n"
            f"Guaranteed Pricing, 40km warehouse storage, 30-day electronic payments, and fair protection are active.\n\n"
            f"TAZA Agro Platform & Logistics Network\nSupport: 6289069619"
        )
        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            if use_tls:
                server.starttls()

        if user and password:
            server.login(user, password)

        server.sendmail(from_email, [to_email], msg.as_string())
        server.quit()

    async def _send_via_smtp(self, to_email: str, farmer_name: str, html_content: str) -> Dict[str, Any]:
        host = settings.SMTP_HOST
        port = settings.SMTP_PORT or 587
        user = settings.SMTP_USER
        password = settings.SMTP_PASSWORD
        from_email = settings.SMTP_FROM_EMAIL or user or "agri@taza.in"
        from_name = settings.SMTP_FROM_NAME or "TAZA Agro Platform"

        # Auto-configure host if user supplied gmail address
        if not host and user and "@gmail.com" in user.lower():
            host = "smtp.gmail.com"
            port = 587

        if not host or not user or not password:
            return {"success": False, "error": "SMTP_HOST, SMTP_USER, or SMTP_PASSWORD not configured."}

        subject = f"TAZA Farmer Produce Agreement - {farmer_name} (কৃষক ফসল চুক্তি)"
        try:
            await asyncio.to_thread(
                self._send_smtp_sync,
                host,
                port,
                user,
                password,
                from_email,
                from_name,
                to_email,
                subject,
                html_content,
                settings.SMTP_USE_TLS
            )
            return {"success": True, "provider": f"SMTP ({host}:{port})"}
        except Exception as e:
            logger.error(f"SMTP delivery failed: {e}")
            return {"success": False, "error": str(e)}

    async def _send_via_resend(self, to_email: str, farmer_name: str, html_content: str) -> Dict[str, Any]:
        if not settings.RESEND_API_KEY:
            return {"success": False, "error": "RESEND_API_KEY not configured"}
        from_email = settings.SMTP_FROM_EMAIL or "TAZA Agri <onboarding@resend.dev>"
        subject = f"TAZA Farmer Produce Agreement - {farmer_name} (কৃষক ফসল চুক্তি)"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": from_email,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content
                    }
                )
                if res.status_code in [200, 201]:
                    return {"success": True, "provider": "Resend API"}
                else:
                    return {"success": False, "error": f"Resend API error: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _send_via_brevo(self, to_email: str, farmer_name: str, html_content: str) -> Dict[str, Any]:
        if not settings.BREVO_API_KEY:
            return {"success": False, "error": "BREVO_API_KEY not configured"}
        from_email = settings.SMTP_FROM_EMAIL or "noreply@taza.in"
        from_name = settings.SMTP_FROM_NAME or "TAZA Agro Platform"
        subject = f"TAZA Farmer Produce Agreement - {farmer_name} (কৃষক ফসল চুক্তি)"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers={
                        "api-key": settings.BREVO_API_KEY,
                        "Content-Type": "application/json"
                    },
                    json={
                        "sender": {"name": from_name, "email": from_email},
                        "to": [{"email": to_email, "name": farmer_name}],
                        "subject": subject,
                        "htmlContent": html_content
                    }
                )
                if res.status_code in [200, 201]:
                    return {"success": True, "provider": "Brevo API"}
                else:
                    return {"success": False, "error": f"Brevo API error: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def dispatch_agreement_email(
        self,
        db: Any,
        farmer_name: str,
        farmer_email: str,
        contact_number: str
    ) -> Dict[str, Any]:
        """
        Dispatches agreement to the farmer's email and logs the record in MongoDB.
        Supports live SMTP, Resend, and Brevo delivery when configured.
        """
        agreement_date = datetime.now(timezone.utc).strftime("%d %B %Y")
        agreement_html = self.generate_agreement_html(
            farmer_name=farmer_name,
            contact_number=contact_number,
            agreement_date=agreement_date
        )

        doc_id = str(uuid.uuid4())

        # Attempt live email delivery
        dispatch_result = None
        if settings.RESEND_API_KEY:
            dispatch_result = await self._send_via_resend(farmer_email, farmer_name, agreement_html)
        elif settings.BREVO_API_KEY:
            dispatch_result = await self._send_via_brevo(farmer_email, farmer_name, agreement_html)
        elif settings.SMTP_USER and (settings.SMTP_PASSWORD or settings.SMTP_HOST):
            dispatch_result = await self._send_via_smtp(farmer_email, farmer_name, agreement_html)

        if dispatch_result and dispatch_result.get("success"):
            provider_name = dispatch_result.get("provider", "SMTP")
            is_live = True
            msg = f"Agreement copy successfully delivered to {farmer_email} via {provider_name} with Farmer Name '{farmer_name}' and Contact '{contact_number}'."
            err = None
            db_status = "DELIVERED"
        elif dispatch_result and not dispatch_result.get("success"):
            provider_name = "FAILED_ATTEMPT"
            is_live = False
            err = dispatch_result.get("error")
            msg = f"Delivery to {farmer_email} failed ({err}). Document generated with Farmer Name '{farmer_name}' and Contact '{contact_number}'. Download directly from portal."
            db_status = "SEND_FAILED"
        else:
            provider_name = "UNCONFIGURED_FALLBACK"
            is_live = False
            err = "No live SMTP or Email API key configured on server. Provide SMTP_USER/SMTP_PASSWORD in environment."
            msg = f"Agreement copy generated for {farmer_email} with Farmer Name '{farmer_name}' and Contact '{contact_number}'. (Awaiting SMTP/Email API configuration for live transmission)."
            db_status = "DISPATCH_PENDING_CONFIG"

        record = {
            "agreement_id": doc_id,
            "farmer_name": farmer_name,
            "farmer_email": farmer_email,
            "contact_number": contact_number,
            "agreement_date": agreement_date,
            "accepted_at": datetime.now(timezone.utc),
            "status": db_status,
            "is_live_delivered": is_live,
            "dispatch_provider": provider_name,
            "error_detail": err,
            "country_of_origin": "India"
        }

        if db is not None:
            await db["farmer_agreements"].insert_one(record)

        return {
            "status": "success",
            "agreement_id": doc_id,
            "farmer_name": farmer_name,
            "farmer_email": farmer_email,
            "contact_number": contact_number,
            "delivery_provider": provider_name,
            "is_live_delivered": is_live,
            "error_detail": err,
            "message": msg
        }


agreement_service = AgreementService()

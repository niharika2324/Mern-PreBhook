import nodemailer from "nodemailer";

/* Transporter is created lazily on first send so that dotenv is already
   loaded by the time we read process.env.EMAIL_USER / EMAIL_PASS.
   (ES module imports are hoisted before dotenv.config() in app.js runs.) */
const getTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      // Strip spaces — Gmail shows app passwords as "xxxx xxxx xxxx xxxx"
      // but the actual credential is the 16 chars without spaces.
      pass: (process.env.EMAIL_PASS || "").replace(/\s/g, ""),
    },
  });

export const sendOTPEmail = async (to, otp) => {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"PreBhookh" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your PreBhookh Verification Code",
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;background:#080C12;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#2C7A5C,#3A9970);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
            Pre<span style="color:#C8A96A;">Bhookh</span>
          </h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Reserve. Dine. Enjoy.</p>
        </div>

        <div style="padding:36px 40px;background:#0E1520;border:1px solid rgba(255,255,255,0.07);border-top:none;">
          <p style="color:#8B9CB5;font-size:15px;margin:0 0 24px;">
            Use the verification code below to complete your registration.
            It expires in <strong style="color:#F1F5F9;">10 minutes</strong>.
          </p>

          <div style="background:#131B27;border:1px solid rgba(200,169,106,0.3);border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#C8A96A;">Your OTP</p>
            <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:12px;color:#F1F5F9;font-family:'Courier New',monospace;">${otp}</p>
          </div>

          <p style="color:#4A5568;font-size:13px;margin:0;">
            If you did not request this code, you can safely ignore this email.
            Do not share this code with anyone.
          </p>
        </div>

        <div style="padding:20px 40px;background:#080C12;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;color:#2A3545;font-size:12px;">© ${new Date().getFullYear()} PreBhookh · All rights reserved</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

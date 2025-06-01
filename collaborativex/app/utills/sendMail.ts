import nodemailer from "nodemailer";

export const sendMail = async (
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NEXT_EMAIL_USER as string,
      pass: process.env.NEXT_EMAIL_PASS as string,
    },
  });

  const mailOptions = {
    from: process.env.NEXT_EMAIL_USER,
    to: toEmail,
    subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

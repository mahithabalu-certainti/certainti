import { IEmailMessage } from "./types";

function otpMailTemplate(otp: string, email: string): { message: IEmailMessage } {
  const emailMessage = {
    message: {
      subject: "Security Alert: Your OTP for Account Verification",
      body: {
        contentType: "HTML",
        content: `
          <p>Hello</p>

        <p>We received a request to verify your identity. Please use the One-Time Password (OTP) below to continue:</p>

        <h2 style="color: #0073e6;">🔐 Your OTP: ${otp}</h2>

        <p>This OTP is valid for <strong>3 minutes</strong>. Do not share this code with anyone.</p>

        <p><strong>🕒 What to do next:</strong></p>
        <ol>
            <li>Enter the OTP on the verification screen.</li>
            <li>If prompted, complete any additional security steps.</li>
        </ol>

        <p><strong>⚠️ Important Security Information:</strong></p>
        <ul>
            <li>This OTP is valid for a single use only.</li>
            <li>Never share your OTP with anyone — not even our support team.</li>
            <li>If you did not request this OTP, your account may be at risk. Please contact us immediately.</li>
        </ul>

        <p><strong>📧 Need Help?</strong></p>
        <p>If you're having trouble with the verification process, reach out to our support team:</p>
        <p>Email: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #0073e6;">${process.env.SUPPORT_EMAIL}</a></p>

        <p>Thank you,<br><strong>Think R&D Team</strong><br>Powered by Certainiti.ai</p>

        `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: email,
          },
        },
      ],
    },
  };

  return emailMessage;
}

export { otpMailTemplate };

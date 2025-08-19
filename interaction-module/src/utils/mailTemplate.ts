import { IEmailMessage } from "./types";

function surveyMailTemplate(
  recipient: { name: string; email: string },
  project: { project_name: string; project_code: string,fiscalYear: number },
  account: { account_name: string;},
  interactionLink: string
): { message: IEmailMessage } {
  const emailMessage = {
    message: {
      subject: `Survey Invitation: R&D Credits Claims Process for ${project.project_name} (${project.project_code}) - FY ${project.fiscalYear}`,
      body: {
        contentType: "HTML",
        content: `
          <p>Dear ${recipient.name},</p>
          <p>Greetings For The Day!</p>
          <p>
            We are conducting a survey for R&D Credits Claims Process for ${account.account_name} FY ${project.fiscalYear} for the project <strong>${project.project_name || ""}</strong> (Project ID: <strong>${project.project_code}</strong>).
          </p>
          <p>Please take a moment to complete the survey using one of the following options:</p>
          <ol>
            <li>
              <strong>Click on this <a href="${interactionLink}" style="color: #0073e6;">Link</a> to complete the survey.</strong>
              <br>
              If you are not able to access the above link due to security restrictions, please use option #2.
            </li>
            <li>
              Fill the answers in the attached excel template and simply reply back to this email.
            </li>
          </ol>
          <p>Your responses are invaluable to us and will contribute significantly to our efforts. Upon completion, submit the survey, and your responses will be securely forwarded to us for further processing.</p>
          <p>Thank you,<br><strong>Think R&D Team</strong><br>Powered by Certainiti.ai</p>
        `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: recipient.email,
          },
        },
      ],
    },
  };
  return emailMessage;
}
function interactionMailTemplate(
  emailInfo: {name:string, email:string},
): { message: IEmailMessage } {
  console.log("Email info");
  console.log(emailInfo);
  const emailMessage: any = {
    message: {
      subject: "Security Alert: Your OTP for Account Verification",
      body: {
        contentType: "HTML",
        content: `
          <p>Hello ${emailInfo.name}</p> 
          <p>Email: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #0073e6;">${process.env.SUPPORT_EMAIL}</a></p>
          <p>Thank you,<br><strong>Think R&D Team</strong><br>Powered by Certainiti.ai</p>
        `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: emailInfo.email,
          },
        },
      ],
    },
  };



  return emailMessage;
}
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

        <p>This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>

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

export { otpMailTemplate,interactionMailTemplate,surveyMailTemplate };

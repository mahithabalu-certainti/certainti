import { IEmailMessage } from "./types";

interface User {
  first_name: string;
  email: string;
}

function mailTemplate(
  user: User,
  password: string
): { message: IEmailMessage } {
  const emailMessage = {
    message: {
      subject: "Welcome to Platform2.0! Your Account is Ready",
      body: {
        contentType: "HTML",
        content: `
          <p>Hello ${user.first_name},</p>
          
          <p>We are excited to welcome you to <strong>Platform2.0</strong>, your gateway to AI-driven solutions.</p>
          
          <p>Your account has been created successfully. Please find your login details below:</p>
          
          <ul>
              <li><strong>Username:</strong> ${user.email}</li>
              <li><strong>Temporary Password:</strong> ${password}</li>
          </ul>
  
          <p>🔗 <a href="${process.env.LOGIN_URL}" style="color: #0073e6; font-weight: bold;">Login Here</a></p>
          
          <p><strong>🔒 Security Instructions:</strong></p>
          <ul>
              <li>The temporary password is valid only for first-time login.</li>
              <li>Do not share your login credentials with anyone.</li>
              <li>If you did not expect this email, please contact support immediately.</li>
          </ul>

          <p><strong>💡 Next Steps:</strong></p>
          <ol>
              <li>Click on the <a href="${process.env.LOGIN_URL}" style="color: #0073e6; font-weight: bold;">Login Link</a> provided above.</li>
              <li>Enter your username and temporary password.</li>
              <li>Follow the instructions to set a new secure password.</li>
              <li>Complete the multi-factor authentication (MFA) setup if prompted.</li>
          </ol>
      
          <p><strong>📧 Need Help?</strong></p>
          <p>If you encounter any issues while accessing your account, please reach out to our support team:</p>
          <p>Email: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #0073e6;">${process.env.SUPPORT_EMAIL}</a></p>
  
          <p>Thank you,<br><strong>Platform2.0 Team</strong><br>Powered by Certainiti.ai</p>
        `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: user.email,
          },
        },
      ],
    },
  };

  return emailMessage;
}

export { mailTemplate };

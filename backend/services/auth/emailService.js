/**
 * @file services/emailService.js
 * @description Email sending service for auth domain
 */

import nodemailer from 'nodemailer';

/**
 * Email service configuration
 * In production, use environment variables for credentials
 */
const createTransporter = async () => {
  // For development/testing, use ethereal email (fake SMTP)
  // In production, configure with your actual email provider
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  } else {
    // Development mode - create ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
};

/**
 * Sends an invitation email
 * @param {string} toEmail - Recipient email address
 * @param {string} inviterName - Name of person sending invitation
 * @param {string} inviterEmail - Email of person sending invitation
 * @param {string} invitationToken - Invitation token for acceptance URL
 * @param {string} baseUrl - Base URL for the application (optional)
 * @returns {Promise<Object>} Email sending result
 */
export async function sendInvitationEmail(toEmail, inviterName, inviterEmail, invitationToken, baseUrl = 'http://localhost:3000') {
  console.log('📧 EMAIL: Sending invitation email', { 
    to: toEmail, 
    from: inviterName,
    token: invitationToken.substring(0, 8) + '...'
  });

  try {
    const transporter = await createTransporter();
    
    // Create invitation acceptance URL
    const inviteUrl = `${baseUrl}/invite?token=${invitationToken}`;
    
    // Email content
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@backstage.app',
      to: toEmail,
      subject: `Invitation to join from ${inviterName}`,
      text: `
Hello!

${inviterName} (${inviterEmail}) has invited you to join the platform.

To accept this invitation and create your account, please click the link below:
${inviteUrl}

This invitation will expire in 7 days.

If you have any questions, you can contact ${inviterName} at ${inviterEmail}.

Best regards,
The Backstage Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You've been invited!</h2>
          
          <p>Hello!</p>
          
          <p><strong>${inviterName}</strong> (${inviterEmail}) has invited you to join the platform.</p>
          
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p><small>Or copy this link: <br><a href="${inviteUrl}">${inviteUrl}</a></small></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #666; font-size: 14px;">
            This invitation will expire in 7 days.<br>
            If you have any questions, you can contact ${inviterName} at ${inviterEmail}.
          </p>
          
          <p style="color: #666; font-size: 12px;">
            Best regards,<br>
            The Backstage Team
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('📧 EMAIL: Invitation sent successfully', {
      messageId: result.messageId,
      to: toEmail
    });
    
    // In development with ethereal, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(result);
      if (previewUrl) {
        console.log('📧 EMAIL: Preview URL (ethereal):', previewUrl);
      }
    }
    
    return {
      success: true,
      messageId: result.messageId,
      previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(result) : null
    };
    
  } catch (error) {
    console.error('📧 EMAIL: Error sending invitation:', error.message);
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
}

/**
 * Validates email configuration
 * @returns {Promise<boolean>} True if email service is properly configured
 */
export async function validateEmailConfig() {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    console.log('📧 EMAIL: Configuration validated successfully');
    return true;
  } catch (error) {
    console.error('📧 EMAIL: Configuration validation failed:', error.message);
    return false;
  }
}
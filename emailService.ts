import emailjs from '@emailjs/browser';

// ============================================
// YOUR EMAILJS CREDENTIALS
// ============================================
// Get from: https://dashboard.emailjs.com/
// 
// 1. Public Key: Account → API Keys → Public Key
// 2. Service ID: Email Services → Your Service → Service ID
// 3. Template ID: Email Templates → Your Template → Template ID
// ============================================

// Use environment variables (recommended)
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY_HERE';
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID_HERE';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID_HERE';

// ============================================
// VALIDATE CONFIGURATION
// ============================================
console.log('📧 EmailJS Configuration:');
console.log('  Public Key:', EMAILJS_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
console.log('  Service ID:', SERVICE_ID ? '✅ Set' : '❌ Missing');
console.log('  Template ID:', TEMPLATE_ID ? '✅ Set' : '❌ Missing');

if (!EMAILJS_PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
  console.error('❌ EmailJS configuration is incomplete!');
  console.log('📋 Please check your .env file or hardcoded values:');
  console.log('  VITE_EMAILJS_PUBLIC_KEY=your_key');
  console.log('  VITE_EMAILJS_SERVICE_ID=your_service_id');
  console.log('  VITE_EMAILJS_TEMPLATE_ID=your_template_id');
}

// ============================================
// INITIALIZE EMAILJS
// ============================================
try {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log('✅ EmailJS initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize EmailJS:', error);
}

// ============================================
// GENERATE OTP AND TOKENS
// ============================================
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
};

// ============================================
// EMAIL SERVICE
// ============================================
export const emailService = {
  /**
   * Send login notification email
   */
  async sendLoginNotification(email: string, name: string, company: string): Promise<boolean> {
    try {
      if (!email) {
        console.error('❌ No email provided');
        return false;
      }

      console.log('📧 Sending login notification to:', email);
      
      const emailContent = `
        <h2 style="color: #2563eb; margin: 0 0 20px 0;">🔐 Login Notification</h2>
        <p style="font-size: 16px; color: #1f2937;">Hello <strong>${name || 'User'}</strong>,</p>
        <p style="font-size: 16px; color: #1f2937;">We noticed a new login to your account.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Login Details:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>Company:</strong> ${company || 'N/A'}</li>
          </ul>
        </div>
        <p style="color: #1f2937;">If this wasn't you, please contact support immediately.</p>
        <p style="color: #1f2937; margin-top: 20px;">Thank you,<br><strong>Wholesale System Team</strong></p>
      `;
      
      const templateParams = {
        to_email: email,
        to_name: name || 'User',
        subject: '🔐 New Login Notification',
        user_name: name || 'User',
        company: company || 'N/A',
        login_time: new Date().toLocaleString(),
        message: `Hello ${name || 'User'}, you have logged in successfully.`,
        email_content: emailContent
      };

      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
      console.log('✅ Login notification sent successfully!', response.status);
      return true;
    } catch (error) {
      console.error('❌ Error sending login notification:', error);
      return false;
    }
  },

  /**
   * Send OTP for verification
   */
  async sendOTP(email: string, name: string, otp: string, resetToken: string): Promise<boolean> {
    try {
      if (!email) {
        console.error('❌ No email provided for OTP');
        return false;
      }

      console.log('📧 Sending OTP to:', email);
      console.log('🔑 OTP:', otp);
      
      const expiryTime = new Date(Date.now() + 10 * 60000).toLocaleString();
      
      const emailContent = `
        <h2 style="color: #2563eb; margin: 0 0 20px 0;">🔐 Password Reset OTP</h2>
        <p style="font-size: 16px; color: #1f2937;">Hello <strong>${name || 'User'}</strong>,</p>
        <p style="font-size: 16px; color: #1f2937;">You have requested to reset your password.</p>
        <p style="font-size: 16px; color: #1f2937;">Use the OTP code below to verify your identity:</p>
        <div style="text-align: center; margin: 30px 0; padding: 25px; background: #f3f4f6; border-radius: 8px;">
          <p style="font-size: 42px; font-weight: bold; color: #2563eb; letter-spacing: 10px; margin: 0;">
            ${otp}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          <strong>This OTP will expire in 10 minutes.</strong>
        </p>
        <p style="color: #1f2937;">Enter this code to verify your identity and reset your password.</p>
        <p style="color: #1f2937;">If you didn't request this, please ignore this email.</p>
        <p style="color: #1f2937; margin-top: 20px;">Thank you,<br><strong>Wholesale System Team</strong></p>
      `;
      
      const templateParams = {
        to_email: email,
        to_name: name || 'User',
        subject: '🔐 Password Reset OTP',
        user_name: name || 'User',
        otp_code: otp,
        otp_expiry: expiryTime,
        reset_token: resetToken,
        message: `Hello ${name || 'User'}, your OTP code is: ${otp}`,
        email_content: emailContent
      };

      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
      console.log('✅ OTP email sent successfully!', response.status);
      return true;
    } catch (error) {
      console.error('❌ Error sending OTP email:', error);
      return false;
    }
  },

  /**
   * Send welcome email for new registrations
   */
  async sendWelcomeEmail(email: string, name: string, company: string): Promise<boolean> {
    try {
      if (!email) {
        console.error('❌ No email provided for welcome email');
        return false;
      }

      console.log('📧 Sending welcome email to:', email);
      
      const emailContent = `
        <h2 style="color: #22c55e; margin: 0 0 20px 0;">🎉 Welcome to Wholesale System!</h2>
        <p style="font-size: 16px; color: #1f2937;">Hello <strong>${name || 'User'}</strong>,</p>
        <p style="font-size: 16px; color: #1f2937;">Thank you for registering with Wholesale System.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Account Details:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>Company:</strong> ${company || 'N/A'}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
          </ul>
        </div>
        <p style="color: #1f2937;">You can now start shopping and placing orders.</p>
        <p style="color: #1f2937;">If you have any questions, feel free to contact our support team.</p>
        <p style="color: #1f2937; margin-top: 20px;">Best regards,<br><strong>Wholesale System Team</strong></p>
      `;
      
      const templateParams = {
        to_email: email,
        to_name: name || 'User',
        subject: '🎉 Welcome to Wholesale System',
        user_name: name || 'User',
        company: company || 'N/A',
        message: `Welcome to Wholesale System, ${name || 'User'}!`,
        email_content: emailContent
      };

      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
      console.log('✅ Welcome email sent successfully!', response.status);
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return false;
    }
  },

  /**
   * Send test email to verify configuration
   */
  async sendTestEmail(testEmail: string): Promise<boolean> {
    try {
      if (!testEmail) {
        console.error('❌ No test email provided');
        return false;
      }

      console.log('📧 Sending test email to:', testEmail);
      
      const emailContent = `
        <h2 style="color: #2563eb; margin: 0 0 20px 0;">✅ Email Service Test</h2>
        <p style="font-size: 16px; color: #1f2937;">Hello <strong>Test User</strong>,</p>
        <p style="font-size: 16px; color: #1f2937;">This is a test email from your Wholesale System.</p>
        <p style="font-size: 16px; color: #1f2937;">If you received this email, your EmailJS configuration is working correctly!</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Test Details:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>Service ID:</strong> ${SERVICE_ID}</li>
            <li><strong>Template ID:</strong> ${TEMPLATE_ID}</li>
          </ul>
        </div>
        <p style="color: #1f2937; margin-top: 20px;">Best regards,<br><strong>Wholesale System Team</strong></p>
      `;
      
      const templateParams = {
        to_email: testEmail,
        to_name: 'Test User',
        subject: '✅ Email Service Test',
        user_name: 'Test User',
        message: 'This is a test email from your Wholesale System.',
        email_content: emailContent
      };

      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
      console.log('✅ Test email sent successfully!', response.status);
      return true;
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      return false;
    }
  }
};

export default emailService;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import emailService, { generateOTP, generateSecureToken } from '../services/emailService';
import { userService } from '../services/userService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isOTPVerification, setIsOTPVerification] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<'wholesaler' | 'retailer'>('wholesaler');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [storedOTP, setStoredOTP] = useState('');
  const [otpExpiry, setOtpExpiry] = useState<number>(0);
  const [resetToken, setResetToken] = useState('');
  const { login } = useAuth();

  const API_URL = 'http://localhost:3001';

  // ============ HANDLE LOGIN ============
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        // Get user from database
        const user = await userService.getUserByEmail(email);
        
        if (user) {
          // Update last login time
          await userService.updateLastLogin(email);
          
          // Send login notification - EMAIL AUTOMATICALLY FROM DATABASE
          console.log('📧 Sending login notification to:', user.email);
          const emailSent = await emailService.sendLoginNotification(
            user.email,
            user.fullName || 'User',
            user.company || 'N/A'
          );
          
          if (emailSent) {
            console.log('✅ Login notification sent to:', user.email);
          } else {
            console.warn('⚠️ Login notification failed but login was successful');
          }

          // Redirect to appropriate page
          if (user.role === 'admin') {
            navigate('/admin');
          } else if (user.role === 'wholesaler') {
            navigate('/wholesaler');
          } else {
            navigate('/retailer');
          }
        } else {
          setError('User not found');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // ============ HANDLE REGISTRATION ============
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!fullName || !email || !password || !company) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const exists = await userService.userExists(email);
      if (exists) {
        setError('User with this email already exists');
        setLoading(false);
        return;
      }

      const newUser = {
        id: `user-${Date.now()}`,
        email,
        password,
        role: role,
        company: company,
        fullName: fullName,
        createdAt: new Date().toISOString(),
        isVerified: false,
        lastLogin: null
      };

      await axios.post(`${API_URL}/users`, newUser);
      
      console.log('📧 Sending welcome email to:', email);
      const emailSent = await emailService.sendWelcomeEmail(email, fullName, company);
      
      if (emailSent) {
        console.log('✅ Welcome email sent to:', email);
        setSuccess('Registration successful! A confirmation email has been sent.');
      } else {
        console.warn('⚠️ Welcome email failed but registration was successful');
        setSuccess('Registration successful! Please check your email for confirmation.');
      }
      
      setLoading(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setCompany('');
      setRole('wholesaler');
      
      setTimeout(() => {
        setIsLogin(true);
        setSuccess('');
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  // ============ HANDLE FORGOT PASSWORD ============
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      console.log('🔍 Checking for user with email:', email);
      
      const user = await userService.getUserByEmail(email);
      
      if (!user) {
        setError('No account found with this email');
        setLoading(false);
        return;
      }

      console.log('👤 User found:', user.fullName || user.email);
      
      const otpCode = generateOTP(6);
      const expiryTime = Date.now() + 10 * 60 * 1000;
      const token = generateSecureToken(32);
      
      setStoredOTP(otpCode);
      setOtpExpiry(expiryTime);
      setResetToken(token);
      
      // Store reset data
      localStorage.setItem(`reset_${token}`, JSON.stringify({
        email: email,
        otp: otpCode,
        expiry: expiryTime
      }));
      
      try {
        console.log('📧 Sending OTP to:', user.email);
        const emailSent = await emailService.sendOTP(
          user.email,
          user.fullName || 'User',
          otpCode,
          token
        );
        
        if (emailSent) {
          console.log('✅ OTP sent successfully to:', user.email);
          setSuccess(`An OTP has been sent to ${user.email}. Please check your email.`);
          setIsOTPVerification(true);
          setLoading(false);
        } else {
          setError('Failed to send OTP. Please try again.');
          setLoading(false);
        }
      } catch (emailError) {
        console.error('Failed to send OTP:', emailError);
        setError('Failed to send OTP. Please try again.');
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // ============ VERIFY OTP ============
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (Date.now() > otpExpiry) {
        setError('OTP has expired. Please request a new one.');
        setLoading(false);
        return;
      }

      if (otp !== storedOTP) {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ OTP verified successfully!');
      
      // Navigate to reset password page with token
      navigate(`/reset-password?token=${resetToken}`);
      
      setLoading(false);

    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Failed to verify OTP. Please try again.');
      setLoading(false);
    }
  };

  // ============ TEST EMAIL FUNCTION ============
  const handleTestEmail = async () => {
    try {
      const testEmail = prompt('Enter email address to send test:');
      if (!testEmail) return;
      
      const result = await emailService.sendTestEmail(testEmail);
      if (result) {
        alert('✅ Test email sent! Check your inbox/spam folder.');
      } else {
        alert('❌ Test email failed. Check console for errors.');
      }
    } catch (error) {
      console.error('Test email error:', error);
      alert('❌ Test email failed. Check console for errors.');
    }
  };

  // ============ FORGOT PASSWORD FORM ============
  if (isForgotPassword && !isOTPVerification) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '48px', 
          borderRadius: '16px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
          width: '100%', 
          maxWidth: '420px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔑</div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
              Reset Password
            </h2>
            <p style={{ color: '#718096', marginTop: '4px' }}>
              Enter your email to receive an OTP
            </p>
          </div>

          <form onSubmit={handleForgotPassword}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                placeholder="your@email.com"
                required
              />
            </div>

            {error && (
              <div style={{ 
                background: '#fed7d7', 
                color: '#c53030', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ 
                background: '#d1fae5', 
                color: '#065f46', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: loading ? '#a0aec0' : '#4299e1', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setIsOTPVerification(false);
                setError('');
                setSuccess('');
                setOtp('');
              }}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '10px',
                background: 'transparent',
                color: '#4a5568',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============ OTP VERIFICATION FORM ============
  if (isOTPVerification) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '48px', 
          borderRadius: '16px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
          width: '100%', 
          maxWidth: '420px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔐</div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
              Verify OTP
            </h2>
            <p style={{ color: '#718096', marginTop: '4px' }}>
              Enter the OTP sent to your email
            </p>
          </div>

          <form onSubmit={handleVerifyOTP}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
                OTP Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontSize: '24px',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontWeight: 'bold'
                }}
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            {error && (
              <div style={{ 
                background: '#fed7d7', 
                color: '#c53030', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ 
                background: '#d1fae5', 
                color: '#065f46', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: loading ? '#a0aec0' : '#22c55e', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOTPVerification(false);
                setIsForgotPassword(true);
                setError('');
                setSuccess('');
                setOtp('');
              }}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '10px',
                background: 'transparent',
                color: '#4a5568',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back to Reset Password
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============ LOGIN / REGISTER FORM ============
  return (
    <div style={{ 
      minHeight: 'auto', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundImage: 'url(/src/assets/images/sweden.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '25px',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{ 
        background: 'cornsilk', 
        padding: '48px', 
        borderRadius: '15px', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
        width: '100%', 
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏪</div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: '#718096', marginTop: '4px' }}>
            {isLogin ? 'Sign in to your account' : 'Register as a new customer'}
          </p>
        </div>

        {/* Toggle Login/Register */}
        <div style={{ 
          display: 'flex', 
          background: '#87304a', 
          borderRadius: '8px', 
          padding: '4px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
              setSuccess('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              background: isLogin ? '#2563eb' : 'transparent',
              color: isLogin ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: isLogin ? 'bold' : 'normal',
              transition: 'all 0.3s'
            }}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
              setSuccess('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              background: !isLogin ? '#2563eb' : 'transparent',
              color: !isLogin ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: !isLogin ? 'bold' : 'normal',
              transition: 'all 0.3s'
            }}
          >
            Register
          </button>
        </div>

        {/* LOGIN FORM */}
        {isLogin ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '5px 5px', 
                  border: '2px solid #5a6d87', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s'
                }}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '3px 4px', 
                  border: '2px solid #061529', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s'
                }}
                placeholder="password123"
                required
              />
            </div>

            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setIsOTPVerification(false);
                  setError('');
                  setSuccess('');
                  setOtp('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <div style={{ 
                background: '#fed7d7', 
                color: '#c53030', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: loading ? '#a0aec0' : '#4299e1', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                fontSize: '16px',
                fontWeight: '600',
                transition: 'background 0.2s'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          // REGISTRATION FORM
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                placeholder="John Doe"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                placeholder="customer@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
                Company Name *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                placeholder="Your Company"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
                Account Type *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'wholesaler' | 'retailer')}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: 'white'
                }}
                required
              >
                <option value="wholesaler">Wholesaler</option>
                <option value="retailer">Retailer</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                placeholder="Min 6 characters"
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                placeholder="Confirm your password"
                required
              />
            </div>

            {error && (
              <div style={{ 
                background: '#fed7d7', 
                color: '#c53030', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ 
                background: '#d1fae5', 
                color: '#065f46', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: loading ? '#a0aec0' : '#22c55e', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                fontSize: '16px',
                fontWeight: '600',
                transition: 'background 0.2s'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

      

        {!isLogin && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#718096' }}>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setSuccess('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
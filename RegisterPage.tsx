import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import emailService from '../services/emailService';
import { userService } from '../services/userService';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    role: 'wholesaler' as 'wholesaler' | 'retailer',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const API_URL = 'http://localhost:3000';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { fullName, email, company, role, password, confirmPassword } = formData;

    // Validation
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

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // Check if user already exists using userService
      const exists = await userService.userExists(email);
      if (exists) {
        setError('User with this email already exists');
        setLoading(false);
        return;
      }

      // Create new user in database
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

      // Send welcome email - AUTOMATICALLY TO THE REGISTERED EMAIL
      console.log('📧 Sending welcome email to:', email);
      const emailSent = await emailService.sendWelcomeEmail(
        email,        // ← Automatically from registration
        fullName,
        company
      );

      if (emailSent) {
        console.log('✅ Welcome email sent successfully to:', email);
        setSuccess('Registration successful! A confirmation email has been sent to your inbox.');
      } else {
        console.warn('⚠️ Welcome email failed but registration was successful');
        setSuccess('Registration successful! Please check your email for confirmation.');
      }

      setLoading(false);

      // Clear form
      setFormData({
        fullName: '',
        email: '',
        company: '',
        role: 'wholesaler',
        password: '',
        confirmPassword: ''
      });

      // Navigate to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '48px',
        borderRadius: '16px',
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
            Create Account
          </h2>
          <p style={{ color: '#718096', marginTop: '4px' }}>
            Register as a new customer
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister}>
          {/* Full Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s'
              }}
              placeholder="John Doe"
              required
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s'
              }}
              placeholder="customer@example.com"
              required
            />
          </div>

          {/* Company Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
              Company Name *
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s'
              }}
              placeholder="Your Company"
              required
            />
          </div>

          {/* Account Type */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
              Account Type *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
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

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Min 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '18px'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
              Confirm Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '18px'
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
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

        {/* Login Link */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#718096' }}>
            Already have an account?{' '}
            <a
              href="/login"
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Sign In
            </a>
          </p>
        </div>

        {/* Features */}
        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '12px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <span>✅ Secure Registration</span>
            <span>📧 Email Verification</span>
            <span>🔒 Data Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
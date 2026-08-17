import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const ResetPasswordPage: React.FC = () => {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [email, setEmail] = useState('');

  const API_URL = 'http://localhost:3001';

  // Validate token on load
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    // Check if token exists in localStorage
    const resetData = localStorage.getItem(`reset_${token}`);
    if (!resetData) {
      setError('Invalid or expired reset token. Please request a new one.');
      return;
    }

    try {
      const data = JSON.parse(resetData);
      setEmail(data.email);
      setIsValidToken(true);
    } catch (e) {
      setError('Invalid reset token');
    }
  }, [token]);

  // Password validation
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate password
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '));
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Get user by email
      const response = await axios.get(`${API_URL}/users?email=${email}`);
      const users = response.data;
      
      if (users.length === 0) {
        setError('User not found');
        setLoading(false);
        return;
      }

      const user = users[0];
      
      // Update password
      await axios.patch(`${API_URL}/users/${user.id}`, {
        password: newPassword
      });

      // Clear reset token
      localStorage.removeItem(`reset_${token}`);

      setSuccess('Password reset successful! Signing you in...');
      setLoading(false);

      // Automatically sign in after password reset
      setTimeout(async () => {
        try {
          await login(email, newPassword);
        } catch (error) {
          console.warn('Unable to auto-login after password reset:', error);
        } finally {
          // After login, send user to the default protected route
          navigate('/dashboard');
        }
      }, 1000);

    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password. Please try again.');
      setLoading(false);
    }
  };

  if (!isValidToken && !error) {
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
          textAlign: 'center',
          maxWidth: '420px',
          width: '100%'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Verifying Reset Token...</h2>
          <p style={{ color: '#6b7280' }}>Please wait while we verify your reset link.</p>
        </div>
      </div>
    );
  }

  if (error && !isValidToken) {
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
          textAlign: 'center',
          maxWidth: '420px',
          width: '100%'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#dc2626' }}>Invalid Reset Link</h2>
          <p style={{ color: '#6b7280' }}>{error}</p>
          <button
            onClick={() => navigate('/login')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

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
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔑</div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            Create New Password
          </h2>
          <p style={{ color: '#718096', marginTop: '4px' }}>
            Enter your new password below
          </p>
          {email && (
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
              Resetting password for: <strong>{email}</strong>
            </p>
          )}
        </div>

        {/* Password Requirements */}
        <div style={{
          background: '#f3f4f6',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
            Password Requirements:
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280' }}>
            <li>At least 6 characters long</li>
            <li>At least one <strong>uppercase</strong> letter (A-Z)</li>
            <li>At least one <strong>lowercase</strong> letter (a-z)</li>
            <li>At least one <strong>number</strong> (0-9)</li>
          </ul>
        </div>

        <form onSubmit={handleResetPassword}>
          {/* New Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '6px' }}>
              New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '45px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Enter new password"
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '45px',
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
              background: loading ? '#a0aec0' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
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
};

export default ResetPasswordPage;
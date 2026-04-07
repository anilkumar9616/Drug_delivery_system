import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain number';
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      const error = validatePassword(value);
      setPasswordError(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData.email, formData.password, formData.name);
      if (result.success) {
        navigate('/medicines');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>✍️ Register</h1>
          <p>Create your account on Drug Delivery Platform</p>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError('')}
            ></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              className={`form-control ${passwordError ? 'is-invalid' : ''}`}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="••••••••"
            />
            {passwordError && (
              <div className="invalid-feedback d-block">{passwordError}</div>
            )}
            <small className="text-muted d-block mt-2">
              Password must contain: uppercase, lowercase, number, 8+ characters
            </small>
          </div>

          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              className={`form-control ${
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'is-invalid'
                  : ''
              }`}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              placeholder="••••••••"
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="invalid-feedback d-block">Passwords do not match</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={loading || passwordError !== ''}
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-divider">OR</div>

        <div className="auth-footer">
          <p className="text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary fw-bold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

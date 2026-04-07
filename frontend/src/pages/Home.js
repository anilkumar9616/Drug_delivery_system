import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>💊 Welcome to Drug Delivery Platform</h1>
          <p>Fast, reliable, and affordable medicine delivery at your doorstep</p>
          {!isAuthenticated ? (
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-outline-primary btn-lg">
                Login
              </Link>
            </div>
          ) : (
            <div className="hero-buttons">
              <Link to="/medicines" className="btn btn-primary btn-lg">
                Browse Medicines
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>Fast Delivery</h3>
            <p>Get your medicines delivered within 48 hours</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Safe</h3>
            <p>Your health data is protected with enterprise security</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Affordable Prices</h3>
            <p>Competitive pricing on all medicines</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍⚕️</div>
            <h3>Licensed Pharmacists</h3>
            <p>All prescriptions verified by licensed pharmacists</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Track Orders</h3>
            <p>Real-time tracking for all your deliveries</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏪</div>
            <h3>Wide Selection</h3>
            <p>Browse thousands of medicines online</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Browse</h3>
            <p>Search and select medicines from our catalog</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Upload</h3>
            <p>Upload prescriptions if required for medicines</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Checkout</h3>
            <p>Add items to cart and proceed to payment</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Deliver</h3>
            <p>Track your order and receive medicines at home</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of satisfied customers ordering medicines online</p>
        {!isAuthenticated && (
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Your Account Now
          </Link>
        )}
      </section>
    </div>
  );
};

import React from 'react';
import './Footer.css';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer bg-dark text-white py-4 mt-5">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <h5>💊 Drug Delivery Platform</h5>
            <p className="text-muted">Fast, reliable, and secure medicine delivery at your doorstep.</p>
          </div>
          <div className="col-md-4 mb-3">
            <h5>Quick Links</h5>
            <ul className="list-unstyled text-muted">
              <li><a href="#" className="text-decoration-none text-muted">About Us</a></li>
              <li><a href="#" className="text-decoration-none text-muted">How It Works</a></li>
              <li><a href="#" className="text-decoration-none text-muted">Contact</a></li>
              <li><a href="#" className="text-decoration-none text-muted">Support</a></li>
            </ul>
          </div>
          <div className="col-md-4 mb-3">
            <h5>Legal</h5>
            <ul className="list-unstyled text-muted">
              <li><a href="#" className="text-decoration-none text-muted">Privacy Policy</a></li>
              <li><a href="#" className="text-decoration-none text-muted">Terms of Service</a></li>
              <li><a href="#" className="text-decoration-none text-muted">Disclaimer</a></li>
              <li><a href="#" className="text-decoration-none text-muted">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <hr className="bg-secondary" />
        <div className="text-center text-muted">
          <p>© {currentYear} Drug Delivery Platform. All rights reserved.</p>
          <p className="small">This is a demonstration platform for educational purposes.</p>
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout Components
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth Components
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';

// Pages
import { Home } from './pages/Home';
import { MedicineList } from './components/Medicines/MedicineList';
import { OrderList } from './components/Orders/OrderList';
import { DeliveryTracker } from './components/Deliveries/DeliveryTracker';
import { Checkout } from './pages/Checkout';

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="container-fluid">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/medicines" /> : <Login />}
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to="/medicines" /> : <Register />}
            />

            {/* Protected Routes */}
            <Route
              path="/medicines"
              element={
                <ProtectedRoute>
                  <MedicineList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrderList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deliveries"
              element={
                <ProtectedRoute>
                  <DeliveryTracker />
                </ProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

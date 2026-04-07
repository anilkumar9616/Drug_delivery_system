import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, userAPI } from '../services/api';
import './Checkout.css';

export const Checkout = () => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/medicines');
      return;
    }
    fetchAddresses();
  }, [cart.length, navigate]);

  const fetchAddresses = async () => {
    try {
      const response = await userAPI.getAddresses();
      if (response.data.success) {
        setAddresses(response.data.data || []);
        // Select first address by default (usually the default one)
        if (response.data.data && response.data.data.length > 0) {
          setSelectedAddress(response.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
      setError('Failed to load addresses');
    }
  };

  const removeFromCart = (medicineId) => {
    const updated = cart.filter((item) => item.id !== medicineId);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const updateQuantity = (medicineId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    const updated = cart.map((item) =>
      item.id === medicineId ? { ...item, quantity } : item
    );
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find the selected address details
      const address = addresses.find((a) => a.id === parseInt(selectedAddress));

      const orderData = {
        order_items: cart.map((item) => ({
          medicine_id: item.id,
          quantity: item.quantity,
          unit_price: item.price
        })),
        delivery_address_id: selectedAddress,
        shipping_address: address ? address.address : '',
        idempotency_key: `order-${Date.now()}-${Math.random()}`
      };

      const response = await orderAPI.create(orderData);

      if (response.data.success) {
        setSuccess(true);
        localStorage.removeItem('cart');
        setCart([]);

        // Redirect to orders page after 2 seconds
        setTimeout(() => {
          navigate('/orders', {
            state: { orderId: response.data.data.id }
          });
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to create order');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to create order';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="checkout-container">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Order Placed Successfully!</h2>
          <p>Your order has been created and will be processed shortly.</p>
          <p>Redirecting to your orders...</p>
        </div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = calculateTotal();

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>🛒 Checkout</h1>
        <p>Complete your order</p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      <div className="row">
        {/* Order Summary */}
        <div className="col-md-8">
          <div className="checkout-section">
            <h4>Order Items</h4>
            {cart.length === 0 ? (
              <p className="text-muted">Your cart is empty</p>
            ) : (
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <h5>{item.name}</h5>
                      <p className="text-muted">{item.manufacturer}</p>
                      <p className="text-muted small">{item.strength}</p>
                    </div>
                    <div className="item-quantity">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="form-control form-control-sm quantity-input"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.id, parseInt(e.target.value) || 1)
                        }
                      />
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-price">
                      <p className="mb-0">
                        <strong>₹{(item.price * item.quantity).toFixed(2)}</strong>
                      </p>
                      <small className="text-muted">
                        ₹{item.price.toFixed(2)} each
                      </small>
                    </div>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Address Selection */}
          <div className="checkout-section">
            <h4>Delivery Address</h4>
            {addresses.length === 0 ? (
              <div className="alert alert-warning">
                No addresses found. Please add an address in your profile.
              </div>
            ) : (
              <div className="address-options">
                {addresses.map((address) => (
                  <label key={address.id} className="address-option">
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddress === address.id}
                      onChange={(e) => setSelectedAddress(e.target.value)}
                    />
                    <div className="address-content">
                      <p className="mb-0">
                        <strong>{address.name}</strong>
                      </p>
                      <p className="text-muted mb-0">{address.address}</p>
                      <small className="text-muted">
                        {address.city}, {address.state} {address.postal_code}
                      </small>
                      {address.is_default && (
                        <span className="badge bg-success small">Default</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary & Checkout */}
        <div className="col-md-4">
          <div className="checkout-summary sticky-top">
            <h4>Order Summary</h4>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (18%):</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <button
              className="btn btn-primary w-100 mt-3"
              onClick={handleCheckout}
              disabled={loading || !selectedAddress}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>

            <p className="text-muted small mt-2 text-center">
              Items will be delivered within 48 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

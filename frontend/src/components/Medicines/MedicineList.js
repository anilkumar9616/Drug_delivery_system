import React, { useState, useEffect } from 'react';
import { medicineAPI } from '../../services/api';
import './Medicines.css';

export const MedicineList = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    requires_prescription: ''
  });
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const fetchMedicines = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await medicineAPI.getAll({ limit: 50 });
      if (response.data.success) {
        setMedicines(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch medicines');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await medicineAPI.search(searchQuery, filters);
      if (response.data.success) {
        setMedicines(response.data.data);
      }
    } catch (err) {
      setError('Search failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (medicine) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === medicine.id);
      if (existing) {
        return prev.map((item) =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });
  };

  const removeFromCart = (medicineId) => {
    setCart((prev) => prev.filter((item) => item.id !== medicineId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="medicines-container">
      <div className="medicines-header">
        <h1>🔍 Browse Medicines</h1>
        <p>Search and add medicines to your order</p>
      </div>

      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3">
          <div className="filter-panel">
            <h4>Search & Filter</h4>
            <form onSubmit={handleSearch}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search medicine name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Price Range</label>
                <div className="d-flex gap-2">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, min_price: e.target.value }))
                    }
                  />
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, max_price: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Prescription Required</label>
                <select
                  className="form-control form-control-sm"
                  value={filters.requires_prescription}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      requires_prescription: e.target.value
                    }))
                  }
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-100 mb-2">
                Search
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ min_price: '', max_price: '', requires_prescription: '' });
                  fetchMedicines();
                }}
              >
                Reset
              </button>
            </form>
          </div>

          {/* Cart Summary */}
          {cartCount > 0 && (
            <div className="cart-summary mt-4">
              <h5>🛒 Cart Summary</h5>
              <p><strong>Items:</strong> {cartCount}</p>
              <p><strong>Total:</strong> ₹{cartTotal.toFixed(2)}</p>
              <a href="/checkout" className="btn btn-success w-100">
                Proceed to Checkout
              </a>
            </div>
          )}
        </div>

        {/* Medicines Grid */}
        <div className="col-md-9">
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading medicines...</p>
            </div>
          ) : medicines.length === 0 ? (
            <div className="alert alert-info">No medicines found</div>
          ) : (
            <div className="medicines-grid">
              {medicines.map((medicine) => (
                <div key={medicine.id} className="medicine-card">
                  <div className="medicine-image">
                    <span className="badge bg-info">{medicine.type}</span>
                    {medicine.requires_prescription && (
                      <span className="badge bg-warning">Rx</span>
                    )}
                  </div>
                  <h5>{medicine.name}</h5>
                  <p className="text-muted small">{medicine.manufacturer}</p>
                  <p className="medicine-strength">{medicine.strength}</p>
                  <p className="medicine-stock">
                    {medicine.stock > 0 ? (
                      <span className="badge bg-success">In Stock ({medicine.stock})</span>
                    ) : (
                      <span className="badge bg-danger">Out of Stock</span>
                    )}
                  </p>
                  <p className="medicine-price">₹{medicine.price.toFixed(2)}</p>
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => addToCart(medicine)}
                    disabled={medicine.stock === 0}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

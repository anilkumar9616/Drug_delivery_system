import React, { useState, useEffect } from 'react';
import { orderAPI, deliveryAPI } from '../../services/api';
import './Orders.css';

export const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderAPI.getAll({ limit: 50 });
      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    try {
      const response = await deliveryAPI.getByOrder(order.id);
      if (response.data.success) {
        setDelivery(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch delivery:', err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'warning',
      paid: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'danger',
      refunded: 'secondary'
    };
    return badges[status] || 'secondary';
  };

  const getDeliveryStatusBadge = (status) => {
    const badges = {
      pending: 'warning',
      assigned: 'info',
      in_transit: 'primary',
      delivered: 'success',
      failed: 'danger',
      returned: 'secondary'
    };
    return badges[status] || 'secondary';
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>📦 My Orders</h1>
        <p>View and track your medicine orders</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="alert alert-info">
          No orders found. <a href="/medicines">Start shopping now</a>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h5>Order #{order.id}</h5>
                <span className={`badge bg-${getStatusBadge(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              <div className="order-details">
                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                <p><strong>Items:</strong> {order.order_items?.length || 0}</p>
                <p><strong>Total:</strong> ₹{order.total_amount.toFixed(2)}</p>
              </div>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleViewDetails(order)}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-backdrop show" style={{ display: 'block' }}>
          <div className="modal show" style={{ display: 'block' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Order #{selectedOrder.id} Details</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setSelectedOrder(null);
                      setDelivery(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <h6>Order Status</h6>
                    <span className={`badge bg-${getStatusBadge(selectedOrder.status)}`}>
                      {selectedOrder.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-3">
                    <h6>Items</h6>
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="d-flex justify-content-between mb-2">
                        <span>{item.medicine_name}</span>
                        <span>
                          {item.quantity}x ₹{item.unit_price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-3">
                    <h6>Order Summary</h6>
                    <p><strong>Subtotal:</strong> ₹{selectedOrder.subtotal.toFixed(2)}</p>
                    <p><strong>Tax:</strong> ₹{selectedOrder.tax.toFixed(2)}</p>
                    <p><strong>Total:</strong> ₹{selectedOrder.total_amount.toFixed(2)}</p>
                  </div>

                  {delivery && (
                    <div className="mb-3">
                      <h6>Delivery Status</h6>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span className={`badge bg-${getDeliveryStatusBadge(delivery.status)}`}>
                          {delivery.status.toUpperCase()}
                        </span>
                      </p>
                      <p><strong>Address:</strong> {delivery.delivery_address}</p>
                      {delivery.delivered_at && (
                        <p>
                          <strong>Delivered:</strong>{' '}
                          {new Date(delivery.delivered_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { orderAPI, deliveryAPI } from '../../services/api';
import './Deliveries.css';

export const DeliveryTracker = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError('');
    try {
      // First get all orders
      const ordersResponse = await orderAPI.getAll({ limit: 50 });
      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.data || [];
        
        // Then fetch delivery status for each order
        const deliveriesData = await Promise.all(
          orders.map(async (order) => {
            try {
              const response = await deliveryAPI.getByOrder(order.id);
              if (response.data.success) {
                return { ...response.data.data, order_id: order.id };
              }
            } catch (err) {
              console.error(`Failed to fetch delivery for order ${order.id}`);
            }
            return null;
          })
        );

        setDeliveries(deliveriesData.filter(Boolean));
      }
    } catch (err) {
      setError('Failed to fetch deliveries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      assigned: '👤',
      in_transit: '🚚',
      delivered: '✅',
      failed: '❌',
      returned: '↩️'
    };
    return icons[status] || '❓';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      assigned: 'info',
      in_transit: 'primary',
      delivered: 'success',
      failed: 'danger',
      returned: 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending Assignment',
      assigned: 'Assigned to Agent',
      in_transit: 'Out for Delivery',
      delivered: 'Delivered',
      failed: 'Delivery Failed',
      returned: 'Returned'
    };
    return labels[status] || status;
  };

  return (
    <div className="delivery-container">
      <div className="delivery-header">
        <h1>🚚 Track Your Deliveries</h1>
        <p>Real-time delivery status updates</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading deliveries...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="alert alert-info">
          No deliveries yet. <a href="/medicines">Place an order</a>
        </div>
      ) : (
        <div className="delivery-timeline">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="delivery-card">
              <div className="delivery-status-section">
                <div className="status-badge">
                  <span className={`badge bg-${getStatusColor(delivery.status)} fs-5`}>
                    {getStatusIcon(delivery.status)} {getStatusLabel(delivery.status)}
                  </span>
                </div>

                <div className="status-timeline">
                  <div className={`timeline-step ${delivery.status !== 'pending' ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <span>Order Placed</span>
                  </div>
                  <div className={`timeline-step ${['assigned', 'in_transit', 'delivered'].includes(delivery.status) ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <span>Assigned</span>
                  </div>
                  <div className={`timeline-step ${['in_transit', 'delivered'].includes(delivery.status) ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <span>In Transit</span>
                  </div>
                  <div className={`timeline-step ${delivery.status === 'delivered' ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <span>Delivered</span>
                  </div>
                </div>
              </div>

              <div className="delivery-details">
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value">#{delivery.order_id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Delivery Address:</span>
                  <span className="detail-value">{delivery.delivery_address}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Estimated Delivery:</span>
                  <span className="detail-value">
                    {new Date(delivery.estimated_delivery_date).toLocaleDateString()}
                  </span>
                </div>
                {delivery.notes && (
                  <div className="detail-row">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{delivery.notes}</span>
                  </div>
                )}
                {delivery.delivered_at && (
                  <div className="detail-row">
                    <span className="detail-label">Delivered On:</span>
                    <span className="detail-value">
                      {new Date(delivery.delivered_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

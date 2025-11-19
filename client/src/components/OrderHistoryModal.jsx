import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import '../styles/OrderHistoryModal.css';

function OrderHistoryModal({ customerId, onClose }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderHistory();
  }, [customerId]);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.ORDERS_CUSTOMER_HISTORY(customerId));

      if (!response.ok) {
        throw new Error('Failed to fetch order history');
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching order history:', err);
      setError('Failed to load order history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' CST';
  };

  const getItemCount = (orderDetails) => {
    try {
      const details = typeof orderDetails === 'string'
        ? JSON.parse(orderDetails)
        : orderDetails;
      return details.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
    } catch {
      return 0;
    }
  };

  const getOrderItems = (orderDetails) => {
    try {
      const details = typeof orderDetails === 'string'
        ? JSON.parse(orderDetails)
        : orderDetails;
      return details.items || [];
    } catch {
      return [];
    }
  };

  const getOrderNotes = (orderDetails) => {
    try {
      const details = typeof orderDetails === 'string'
        ? JSON.parse(orderDetails)
        : orderDetails;
      return details?.order_notes || '';
    } catch {
      return '';
    }
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
  };

  // Order Details View
  if (selectedOrder) {
    const items = getOrderItems(selectedOrder.order_details);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content order-history-modal" onClick={(e) => e.stopPropagation()}>
          <div className="order-details-view">
            <div className="order-details-header">
              <button className="back-button" onClick={handleBackToList}>
                ← Back to Orders
              </button>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>

            <div className="order-details-info">
              <h2>Order #{selectedOrder.order_id}</h2>
              <p className="order-date">{formatDate(selectedOrder.order_date)}</p>
            </div>

            <div className="order-items-section">
              <h3>Items</h3>
              {items.map((item, index) => (
                <div key={index} className="order-item-detail">
                  <div className="item-header">
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">${(item.item_total || 0).toFixed(2)}</span>
                  </div>
                  <div className="item-info">
                    <span className="item-quantity">Qty: {item.quantity || 1}</span>
                    <span className="item-base-price">Base: ${(item.base_price || 0).toFixed(2)}</span>
                  </div>
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="item-customizations">
                      {item.customizations.map((custom, idx) => (
                        <div key={idx} className="customization-item">
                          <span>{custom.name}</span>
                          {custom.price > 0 && <span>+${custom.price.toFixed(2)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${parseFloat(selectedOrder.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Tax:</span>
                <span>${parseFloat(selectedOrder.tax || 0).toFixed(2)}</span>
              </div>
              <div className="total-row total-final">
                <span>Total:</span>
                <span>${parseFloat(selectedOrder.total || 0).toFixed(2)}</span>
              </div>
              <div className="total-row payment-method">
                <span>Payment:</span>
                <span className="payment-type">
                  {selectedOrder.payment_method === 'cash' ? '💵 Cash' : '💳 Card'}
                </span>
              </div>
            </div>

            {getOrderNotes(selectedOrder.order_details) && (
              <div className="order-notes-display">
                <h3>Notes</h3>
                <p className="notes-text">{getOrderNotes(selectedOrder.order_details)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Order List View
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-history-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Order History</h2>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={fetchOrderHistory}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="empty-state">
            <p>You haven't placed any orders yet.</p>
            <p className="empty-subtitle">Start exploring our menu!</p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order.order_id}
                className="order-card"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="order-card-header">
                  <span className="order-number">Order #{order.order_id}</span>
                  <span className="order-total">${parseFloat(order.total || 0).toFixed(2)}</span>
                </div>
                <div className="order-card-info">
                  <span className="order-date">{formatDate(order.order_date)}</span>
                  <span className="order-items-count">
                    {getItemCount(order.order_details)} {getItemCount(order.order_details) === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="order-card-footer">
                  <span className="view-details">Tap to view details →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistoryModal;

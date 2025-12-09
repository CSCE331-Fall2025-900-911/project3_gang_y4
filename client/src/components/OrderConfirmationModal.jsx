import React from 'react';
import '../styles/OrderConfirmationModal.css';

function OrderConfirmationModal({ orderId, total, rewardsInfo, onClose, showThanks = true }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with success icon */}
        <div className="confirmation-header">
          <div className="success-icon">✓</div>
          <h2>Order Placed Successfully!</h2>
        </div>

        {/* Order details */}
        <div className="order-details">
          <div className="detail-row">
            <span className="detail-label">Order #:</span>
            <span className="detail-value">{orderId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Total:</span>
            <span className="detail-value total-amount">${total.toFixed(2)}</span>
          </div>

          {/* Rewards info if available */}
          {rewardsInfo && (
            <div className="rewards-info">
              <div className="detail-row">
                <span className="detail-label">Points Earned:</span>
                <span className="detail-value">+{rewardsInfo.earnedPoints}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Points:</span>
                <span className="detail-value highlight">{rewardsInfo.newBalance}</span>
              </div>
            </div>
          )}
        </div>

        {/* Message (can be hidden for staff view) */}
        {showThanks && (
          <div className="confirmation-message">
            <p>Thank you for your order!</p>
            <p className="sub-message">Your order will be ready shortly.</p>
          </div>
        )}

        {/* Close button */}
        <button className="btn-close-modal" onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default OrderConfirmationModal;

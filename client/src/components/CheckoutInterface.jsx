import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import CustomizationModal from './CustomizationModal';
import { API_ENDPOINTS } from '../config/api';
import '../styles/EmployeeView.css';

function CheckoutInterface({ user }) {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Customization modal state
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingCartIndex, setEditingCartIndex] = useState(null);

  // Customer lookup state
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [customerUsername, setCustomerUsername] = useState('');
  const [customerLookupError, setCustomerLookupError] = useState('');
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);

  // Payment method selection state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Order notes state
  const [orderNotes, setOrderNotes] = useState('');

  // Fetch menu data from API on component mount
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.MENU_GROUPED);

        if (!response.ok) {
          throw new Error(`Failed to fetch menu: ${response.status}`);
        }

        const data = await response.json();

        // Filter out Add-On and Customization items - only show actual products
        const filteredData = data
          .filter(category => category.category !== 'Add-On' && category.category !== 'Customization')
          .map(category => ({
            ...category,
            items: category.items.filter(item =>
              item.type !== 'Add-On' && item.type !== 'Customization'
            )
          }))
          .filter(category => category.items.length > 0); // Remove empty categories

        setMenuData(filteredData);

        // Set first category as active
        if (filteredData.length > 0) {
          setActiveCategory(filteredData[0].category);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu. Please try again.');
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const scrollToCategory = (category) => {
    setActiveCategory(category);
    const element = document.getElementById(`category-${category.replace(/\s+/g, '-')}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openCustomizationModal = (item) => {
    setSelectedItem(item);
    setShowCustomizationModal(true);
    setEditingCartIndex(null);
  };

  const openEditCustomization = (cartIndex) => {
    const cartItem = cart[cartIndex];
    setSelectedItem({
      id: cartItem.id,
      name: cartItem.name,
      price: cartItem.price,
      type: cartItem.type
    });
    setEditingCartIndex(cartIndex);
    setShowCustomizationModal(true);
  };

  const areItemsIdentical = (item1, item2) => {
    if (item1.id !== item2.id) return false;

    const customizations1 = item1.customizations || [];
    const customizations2 = item2.customizations || [];

    if (customizations1.length !== customizations2.length) return false;

    const sorted1 = [...customizations1].sort((a, b) => a.id - b.id);
    const sorted2 = [...customizations2].sort((a, b) => a.id - b.id);

    return sorted1.every((c1, index) => {
      const c2 = sorted2[index];
      return c1.id === c2.id;
    });
  };

  const handleCustomizationConfirm = (customizedItem) => {
    if (editingCartIndex !== null) {
      // Editing existing item
      const updatedCart = [...cart];
      updatedCart[editingCartIndex] = customizedItem;
      setCart(updatedCart);
    } else {
      // Adding new item - check for duplicates
      const existingItemIndex = cart.findIndex(cartItem => areItemsIdentical(cartItem, customizedItem));

      if (existingItemIndex !== -1) {
        // Duplicate found - increment quantity
        const updatedCart = [...cart];
        const existingItem = updatedCart[existingItemIndex];
        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + customizedItem.quantity,
          totalPrice: existingItem.totalPrice + customizedItem.totalPrice
        };
        setCart(updatedCart);
      } else {
        // No duplicate - add as new item
        setCart([...cart, customizedItem]);
      }
    }

    setShowCustomizationModal(false);
    setSelectedItem(null);
    setEditingCartIndex(null);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.0825; // 8.25% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const initiateCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items before checkout.');
      return;
    }
    // Show customer lookup modal
    setShowCustomerLookup(true);
    setCustomerUsername('');
    setCustomerLookupError('');
  };

  const handleGuestCheckout = () => {
    setSelectedCustomerId(0); // 0 = guest customer_id
    setShowCustomerLookup(false);
    setShowPaymentModal(true);
  };

  const handleCustomerLookup = async () => {
    if (!customerUsername.trim()) {
      setCustomerLookupError('Please enter a customer username');
      return;
    }

    setLookingUpCustomer(true);
    setCustomerLookupError('');

    try {
      const response = await fetch(API_ENDPOINTS.CUSTOMERS_LOOKUP(customerUsername));

      if (!response.ok) {
        if (response.status === 404) {
          setCustomerLookupError('Customer not found');
        } else {
          throw new Error('Failed to lookup customer');
        }
        setLookingUpCustomer(false);
        return;
      }

      const customer = await response.json();
      console.log('Customer found:', customer);

      // Customer found, proceed to payment selection
      setSelectedCustomerId(customer.custid);
      setShowCustomerLookup(false);
      setShowPaymentModal(true);
      setLookingUpCustomer(false);
    } catch (err) {
      console.error('Error looking up customer:', err);
      setCustomerLookupError('Error looking up customer. Please try again.');
      setLookingUpCustomer(false);
    }
  };

  const handlePaymentSelection = async (paymentMethod) => {
    setShowPaymentModal(false);
    await completeCheckout(selectedCustomerId, paymentMethod);
  };

  const completeCheckout = async (customerId, paymentMethod) => {
    try {
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotal();

      const orderData = {
        customer_id: customerId,
        order_details: {
          items: cart.map(item => ({
            menu_id: item.id,
            name: item.name,
            base_price: item.price,
            quantity: item.quantity || 1,
            customizations: item.customizations || [],
            item_total: item.totalPrice
          })),
          order_notes: orderNotes
        },
        subtotal: subtotal,
        tax: tax,
        total: total,
        employee_id: user?.employeeid,
        payment_method: paymentMethod
      };

      const response = await fetch(API_ENDPOINTS.ORDERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to create order');
      }

      // If not a guest, add rewards points (total cents spent)
      if (customerId !== 0) {
        const rewardsPoints = Math.round(total * 100); // Convert to cents
        try {
          const rewardsResponse = await fetch(API_ENDPOINTS.CUSTOMERS_REWARDS(customerId), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ points: rewardsPoints }),
          });

          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            console.log('Rewards added:', rewardsData);
          }
        } catch (rewardsErr) {
          console.error('Error adding rewards (order still completed):', rewardsErr);
        }
      }

      alert('Order completed successfully!' + (customerId !== 0 ? ' Rewards points added.' : ''));
      setCart([]);
      setOrderNotes('');
      setShowCustomerLookup(false);
      setShowPaymentModal(false);
    } catch (err) {
      console.error('Error completing order:', err);
      alert('Failed to complete order. Please try again.');
    }
  };

  const handleCancelOrder = () => {
    if (cart.length === 0) return;

    if (window.confirm('Are you sure you want to cancel this order and clear the cart?')) {
      setCart([]);
      setOrderNotes('');
      setShowCustomerLookup(false);
      setShowPaymentModal(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-content">
        <div className="loading-message">Loading menu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-content">
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <div className="employee-content">
        {/* Left: Menu */}
        <div className="menu-section">
          {/* Category Navigation */}
          <nav className="category-nav">
            {menuData.map(category => (
              <button
                key={category.category}
                className={`category-button ${activeCategory === category.category ? 'active' : ''}`}
                onClick={() => scrollToCategory(category.category)}
              >
                {category.category}
              </button>
            ))}
          </nav>

          {/* Menu Items */}
          <div className="menu-items">
            {menuData.map(category => (
              <div
                key={category.category}
                id={`category-${category.category.replace(/\s+/g, '-')}`}
                className="menu-category"
              >
                <h2 className="category-title">{category.category}</h2>
                <div className="items-grid">
                  {category.items.map(item => (
                    <button
                      key={item.id}
                      className="menu-item-card"
                      onClick={() => openCustomizationModal(item)}
                    >
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">${item.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="cart-section">
          <h2>Order</h2>
          {cart.length === 0 ? (
            <p className="empty-cart">No items in cart</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">
                        {item.quantity > 1 && <span className="item-quantity">×{item.quantity} </span>}
                        {item.displayName}
                      </div>
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="cart-item-customizations">
                          {item.customizations.map((custom, idx) => (
                            <span key={idx} className="customization-tag">
                              {custom.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="cart-item-price">${item.totalPrice.toFixed(2)}</div>
                    <div className="cart-item-actions">
                      <button
                        className="btn-edit"
                        onClick={() => openEditCustomization(index)}
                        title="Edit item"
                      >
                        ✎
                      </button>
                      <button
                        className="btn-remove"
                        onClick={() => removeFromCart(index)}
                        title="Remove item"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-line">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="summary-line">
                  <span>Tax (8.25%):</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="summary-line total">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="order-notes-section">
                <label htmlFor="order-notes">Order Notes (optional)</label>
                <textarea
                  id="order-notes"
                  className="order-notes-input"
                  placeholder="Add special instructions or notes..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows="3"
                />
              </div>
            </>
          )}

          <div className="checkout-buttons">
            <button
              className="btn-cancel"
              onClick={handleCancelOrder}
              disabled={cart.length === 0}
            >
              ✕ Cancel
            </button>
            <button
              className="btn-checkout"
              onClick={initiateCheckout}
              disabled={cart.length === 0}
            >
              ✓ Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomizationModal && selectedItem && (
        <CustomizationModal
          item={selectedItem}
          onClose={() => {
            setShowCustomizationModal(false);
            setSelectedItem(null);
            setEditingCartIndex(null);
          }}
          onConfirm={handleCustomizationConfirm}
          existingCustomizations={editingCartIndex !== null ? cart[editingCartIndex].customizations : null}
        />
      )}

      {/* Customer Lookup Modal */}
      {showCustomerLookup && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setShowCustomerLookup(false)}>
          <div className="modal-content customer-lookup-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCustomerLookup(false)}>×</button>
            <h2>Customer Lookup</h2>
            <p className="modal-subtitle">Enter customer username or checkout as guest</p>

            <div className="customer-lookup-form">
              <input
                type="text"
                placeholder="Customer Username"
                value={customerUsername}
                onChange={(e) => setCustomerUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomerLookup()}
                disabled={lookingUpCustomer}
                autoFocus
              />
              {customerLookupError && (
                <div className="lookup-error-message">{customerLookupError}</div>
              )}
              <button
                className="btn-lookup"
                onClick={handleCustomerLookup}
                disabled={lookingUpCustomer}
              >
                {lookingUpCustomer ? 'Looking up...' : 'Find Customer'}
              </button>
            </div>

            <div className="modal-divider">
              <span>OR</span>
            </div>

            <button
              className="btn-guest-checkout"
              onClick={handleGuestCheckout}
              disabled={lookingUpCustomer}
            >
              Guest Checkout
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Payment Method Selection Modal */}
      {showPaymentModal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            <h2>Select Payment Method</h2>
            <p className="modal-subtitle">How will the customer pay?</p>

            <div className="payment-options">
              <button
                className="payment-btn payment-btn-cash"
                onClick={() => handlePaymentSelection('cash')}
              >
                <div className="payment-icon">💵</div>
                <div className="payment-label">Cash</div>
              </button>

              <button
                className="payment-btn payment-btn-card"
                onClick={() => handlePaymentSelection('credit_card')}
              >
                <div className="payment-icon">💳</div>
                <div className="payment-label">Card</div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default CheckoutInterface;

import React, { useState, useEffect, useRef } from 'react';
import CustomizationModal from './CustomizationModal';
import { API_ENDPOINTS } from '../config/api';
import '../styles/CustomerKiosk.css';

function CustomerKiosk({ user, onLogout }) {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Customization modal state
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingCartIndex, setEditingCartIndex] = useState(null);

  // Payment method selection state
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Customer account state
  const [customerInfo, setCustomerInfo] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(true);

  // Ref to prevent duplicate API calls (React 18 Strict Mode runs effects twice)
  const customerFetchInProgress = useRef(false);

  // Fetch/create customer account from Google OAuth on component mount
  useEffect(() => {
    console.log('🔐 DEBUG: CustomerKiosk mounted with user prop:', user);
    console.log('🔐 DEBUG: User has email?', !!user?.email, 'Has name?', !!user?.name);

    const fetchOrCreateCustomer = async () => {
      // Prevent duplicate calls from React 18 Strict Mode or component remounting
      if (customerFetchInProgress.current) {
        console.log('🔐 DEBUG: Customer fetch already in progress, skipping duplicate call');
        return;
      }

      try {
        // Set flag to prevent concurrent calls
        customerFetchInProgress.current = true;
        setCustomerLoading(true);

        console.log('🔐 DEBUG: Calling google-auth API with:', {
          email: user.email,
          name: user.name,
          endpoint: API_ENDPOINTS.CUSTOMERS_GOOGLE_AUTH
        });

        const response = await fetch(API_ENDPOINTS.CUSTOMERS_GOOGLE_AUTH, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name
          }),
        });

        console.log('🔐 DEBUG: API response status:', response.status, response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔐 DEBUG: API error response:', errorText);
          throw new Error('Failed to fetch/create customer account');
        }

        const customerData = await response.json();
        console.log('🔐 DEBUG: API response data:', customerData);
        console.log('✅ Customer account ready:', customerData);

        setCustomerInfo(customerData);
        console.log('🔐 DEBUG: Set customerInfo state to:', customerData);

        if (customerData.is_new) {
          console.log('🎉 New customer account created! Welcome bonus: 0 points');
        } else {
          console.log('👋 Welcome back! Current rewards:', customerData.rewards_points, 'points');
        }

      } catch (err) {
        console.error('❌ Error fetching/creating customer:', err);
        console.log('🔐 DEBUG: Falling back to guest checkout due to error');
        // Fallback to guest checkout if customer creation fails
        setCustomerInfo({ custid: 0, is_guest: true });
      } finally {
        setCustomerLoading(false);
        // Clear flag after request completes
        customerFetchInProgress.current = false;
      }
    };

    if (user && user.email && user.name) {
      console.log('🔐 DEBUG: User has email and name, fetching/creating customer');
      fetchOrCreateCustomer();
    } else {
      console.log('🔐 DEBUG: No user email/name, defaulting to guest checkout');
      // No user info, use guest
      setCustomerInfo({ custid: 0, is_guest: true });
      setCustomerLoading(false);
    }
  }, [user]);

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
        
        setError(null);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu. Please try again later.');
      } finally {
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

  const images = importAll(require.context('../images', false, /\.(png|jpe?g|svg)$/));

  function importAll(r) {
    let imgs = {};
    r.keys.forEach((key) => {
      imgs[key.replace('./', '')] = r(key);
    });
    return imgs;
  }

  const openCustomizationModal = (item) => {
    setSelectedItem(item);
    setEditingCartIndex(null);
    setShowCustomizationModal(true);
  };

  const openEditCustomization = (cartIndex) => {
    const cartItem = cart[cartIndex];
    setSelectedItem({
      id: cartItem.id,
      name: cartItem.name,
      price: cartItem.price
    });
    setEditingCartIndex(cartIndex);
    setShowCustomizationModal(true);
  };

  const handleCustomizationConfirm = (customizedItem) => {
    if (editingCartIndex !== null) {
      // Editing existing item
      const newCart = [...cart];
      newCart[editingCartIndex] = customizedItem;
      setCart(newCart);
    } else {
      // Adding new item
      setCart([...cart, customizedItem]);
    }
    setShowCustomizationModal(false);
    setSelectedItem(null);
    setEditingCartIndex(null);
  };

  const removeFromCart = (cartIndex) => {
    const item = cart[cartIndex];
    if (item.quantity > 1) {
      const newCart = [...cart];
      newCart[cartIndex] = { ...item, quantity: item.quantity - 1, totalPrice: item.totalPrice / item.quantity * (item.quantity - 1) };
      setCart(newCart);
    } else {
      deleteFromCart(cartIndex);
    }
  };

  const addQuantity = (cartIndex) => {
    const item = cart[cartIndex];
    const newCart = [...cart];
    newCart[cartIndex] = { ...item, quantity: item.quantity + 1, totalPrice: item.totalPrice / item.quantity * (item.quantity + 1) };
    setCart(newCart);
  };

  const deleteFromCart = (cartIndex) => {
    setCart(cart.filter((_, index) => index !== cartIndex));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0).toFixed(2);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.0825; // 8.25% tax rate
  };

  const calculateTotalWithTax = () => {
    return calculateSubtotal() + calculateTax();
  };

  const initiateCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items before checkout.');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSelection = async (paymentMethod) => {
    setShowPaymentModal(false);
    await completeCheckout(paymentMethod);
  };

  const completeCheckout = async (paymentMethod) => {
    try {
      console.log('🛒 DEBUG: completeCheckout called with payment method:', paymentMethod);
      console.log('🛒 DEBUG: Current customerInfo state:', customerInfo);

      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotalWithTax();

      // Use customer account if available, otherwise guest (customer_id = 0)
      const customerId = customerInfo?.custid || 0;
      const isGuest = customerInfo?.is_guest || customerId === 0;

      console.log('🛒 DEBUG: Calculated customerId:', customerId);
      console.log('🛒 DEBUG: Is guest checkout?', isGuest);
      console.log('🛒 DEBUG: customerInfo.custid:', customerInfo?.custid);
      console.log('🛒 DEBUG: customerInfo.is_guest:', customerInfo?.is_guest);

      const orderData = {
        customer_id: customerId,
        employee_id: 0, // Self-service kiosk (no employee involved)
        items: cart.map(item => ({
          id: item.id,
          menu_id: item.id,
          name: item.name,
          price: item.price,
          base_price: item.price,
          quantity: item.quantity,
          customizations: item.customizations || [],
          totalPrice: item.totalPrice,
          item_total: item.totalPrice
        })),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        payment_method: paymentMethod
      };

      console.log('🛒 Submitting customer self-service order:', orderData);
      console.log(isGuest ? '👤 Guest checkout (no rewards)' : `👤 Customer ${customerId} (will earn rewards)`);

      const response = await fetch(API_ENDPOINTS.ORDERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit order');
      }

      const result = await response.json();
      console.log('✅ Order submitted successfully:', result);

      // Add rewards points if not a guest
      let rewardsMessage = '';
      if (!isGuest && customerId > 0) {
        const rewardsPoints = Math.round(total * 100); // Convert to cents
        try {
          console.log('🎁 Adding', rewardsPoints, 'rewards points...');

          const rewardsResponse = await fetch(API_ENDPOINTS.CUSTOMERS_REWARDS(customerId), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ points: rewardsPoints }),
          });

          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            console.log('✅ Rewards added! New balance:', rewardsData.new_rewards_balance);
            rewardsMessage = `\n\n🎉 Earned ${rewardsPoints} rewards points!\nNew balance: ${rewardsData.new_rewards_balance} points`;

            // Update local customer info with new rewards balance
            setCustomerInfo(prev => ({
              ...prev,
              rewards_points: rewardsData.new_rewards_balance
            }));
          }
        } catch (rewardsErr) {
          console.error('❌ Error adding rewards (order still completed):', rewardsErr);
          rewardsMessage = '\n\n(Rewards could not be added - please contact support)';
        }
      }

      // Clear cart and show success message
      setCart([]);
      alert(`Order placed successfully!\nOrder #${result.order_id}\nTotal: $${total.toFixed(2)}${rewardsMessage}\n\nThank you for your order!`);

    } catch (error) {
      console.error('❌ Checkout error:', error);
      alert(`Failed to complete order: ${error.message}\nPlease try again or contact staff for assistance.`);
    }
  };

  return (
    <div className="customer-kiosk">
      {/* Header */}
      <header className="kiosk-header">
        <h1>Boba Kiosk</h1>
        <div className="user-info">
          <span>Welcome, {user.name}!</span>
          {customerInfo && !customerInfo.is_guest && customerInfo.rewards_points !== undefined && (
            <span className="rewards-display">🎁 {customerInfo.rewards_points} points</span>
          )}
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </header>

      <div className="kiosk-content">
        {/* Left Sidebar - Category Navigation */}
        <aside className="category-sidebar">
          <h2>Categories</h2>
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : (
            <nav className="category-nav">
              {menuData.map((category) => (
                <button
                  key={category.category}
                  className={`category-button ${activeCategory === category.category ? 'active' : ''}`}
                  onClick={() => scrollToCategory(category.category)}
                >
                  {category.category}
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* Middle Section - Menu Items */}
        <main className="menu-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading menu...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button 
                className="retry-button"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="menu-scroll">
              {menuData.map((category) => (
                <div 
                  key={category.category} 
                  id={`category-${category.category.replace(/\s+/g, '-')}`}
                  className="menu-category"
                >
                  <h2 className="category-heading">{category.category}</h2>
                  <div className="menu-items">
                    {category.items.map((item) => (
                      <div key={item.id} className="menu-item">
                        <img 
                          className="item-image"
                          src={images[`${item.name}.png`]} 
                          alt={item.name}
                        />
                        <div className="item-info">
                          <h3>{item.name}</h3>
                          <p className="item-price">${item.price.toFixed(2)}</p>
                        </div>
                        <button 
                          className="add-button"
                          onClick={() => openCustomizationModal(item)}
                        >
                          Add +
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Right Sidebar - Cart */}
        <aside className="cart-section">
          <h2>Your Cart</h2>
          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <div
                    className="cart-item-info"
                    onClick={() => openEditCustomization(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h4>{item.displayName || item.name}</h4>
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="customizations-list">
                        {item.customizations.map((custom, idx) => (
                          <span key={idx} className="customization-tag">
                            {custom.name}
                            {custom.price > 0 && ` (+$${custom.price.toFixed(2)})`}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="cart-item-price">${item.totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => removeFromCart(index)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => addQuantity(index)}>+</button>
                    <button 
                      className="delete-button"
                      onClick={() => deleteFromCart(index)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="cart-subtotal">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="cart-tax">
                <span>Tax (8.25%):</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              <div className="cart-total">
                <span>Total:</span>
                <span className="total-amount">${calculateTotalWithTax().toFixed(2)}</span>
              </div>
            </div>
            <button
              className="checkout-button"
              onClick={initiateCheckout}
              disabled={cart.length === 0}
            >
              Checkout
            </button>
          </div>
        </aside>
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
          existingCustomizations={
            editingCartIndex !== null ? cart[editingCartIndex].customizations : null
          }
        />
      )}

      {/* Payment Method Selection Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            <h2>Select Payment Method</h2>
            <p className="modal-subtitle">How would you like to pay?</p>

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
        </div>
      )}
    </div>
  );
}

export default CustomerKiosk;
import React, { useState, useEffect, useRef } from 'react';
import CustomizationModal from './CustomizationModal';
import OrderHistoryModal from './OrderHistoryModal';
import { API_ENDPOINTS } from '../config/api';
import placeholderImage from '../images/placeholdertea.png';
import WeatherBackground from './WeatherBackground';
import '../styles/CustomerKiosk.css';

function CustomerKiosk({ user, onLogout }) {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingCartIndex, setEditingCartIndex] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const customerFetchInProgress = useRef(false);

  // Fetch/create customer account
  useEffect(() => {
    const fetchOrCreateCustomer = async () => {
      if (customerFetchInProgress.current) return;
      try {
        customerFetchInProgress.current = true;
        setCustomerLoading(true);
        const response = await fetch(API_ENDPOINTS.CUSTOMERS_GOOGLE_AUTH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, name: user.name }),
        });
        if (!response.ok) throw new Error('Failed to fetch/create customer account');
        const customerData = await response.json();
        setCustomerInfo(customerData);
      } catch (err) {
        console.error('Error fetching/creating customer:', err);
        setCustomerInfo({ custid: 0, is_guest: true });
      } finally {
        setCustomerLoading(false);
        customerFetchInProgress.current = false;
      }
    };

    if (user?.email && user?.name) {
      fetchOrCreateCustomer();
    } else {
      setCustomerInfo({ custid: 0, is_guest: true });
      setCustomerLoading(false);
    }
  }, [user]);

  // Fetch menu data
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.MENU_GROUPED);
        if (!response.ok) throw new Error(`Failed to fetch menu: ${response.status}`);
        const data = await response.json();
        const filteredData = data
          .filter(category => category.category !== 'Add-On' && category.category !== 'Customization')
          .map(category => ({
            ...category,
            items: category.items.filter(item => item.type !== 'Add-On' && item.type !== 'Customization')
          }))
          .filter(category => category.items.length > 0);
        setMenuData(filteredData);
        if (filteredData.length > 0) setActiveCategory(filteredData[0].category);
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

  // Scroll Spy Effect
  useEffect(() => {
    if (menuData.length === 0) return;

    const navList = document.querySelector('.kiosk__nav-list');
    const menuScroll = document.querySelector('.kiosk__menu-scroll');
    if (!menuScroll) return;

    const observerOptions = {
      root: menuScroll,
      rootMargin: '-10% 0px -80% 0px', // Trigger when section is near top (10% from top, 80% from bottom excluded)
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const categoryName = entry.target.dataset.category;
          if (categoryName) {
            setActiveCategory(categoryName);

            // Optional: Scroll nav to active button
            const activeBtn = document.querySelector(`.kiosk__nav-item[data-category="${categoryName}"]`);
            if (activeBtn && navList) {
              // simple scroll into view if needed, but might be distracting
              // activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = document.querySelectorAll('.kiosk__category');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, [menuData]);

  const images = import.meta.glob("../images/*", { eager: true });
  const getImage = (imageName) => {
    const imageKey = `../images/${imageName}.png`;
    return images[imageKey] ? images[imageKey].default : null;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Tea': 'var(--secondary-400)',
      'Seasonal': 'var(--info-500)',
      'Slush': 'var(--primary-400)',
    };
    return colors[category] || 'var(--neutral-400)';
  };

  const getCategoryBgColor = (category) => {
    const colors = {
      'Tea': 'var(--secondary-50)',
      'Seasonal': 'var(--info-bg)', // using predefined semantic bg
      'Slush': 'var(--primary-50)',
    };
    return colors[category] || 'var(--neutral-50)';
  };

  const scrollToCategory = (category) => {
    setActiveCategory(category);
    const element = document.getElementById(`category-${category.replace(/\s+/g, '-')}`);
    // If we click, we might want to temporarily disable observer to avoid jumping, 
    // but the observer will just confirm the click.
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openCustomizationModal = (item) => {
    setSelectedItem(item);
    setEditingCartIndex(null);
    setShowCustomizationModal(true);
  };

  const openEditCustomization = (cartIndex) => {
    const cartItem = cart[cartIndex];
    setSelectedItem({ id: cartItem.id, name: cartItem.name, price: cartItem.price });
    setEditingCartIndex(cartIndex);
    setShowCustomizationModal(true);
  };

  const handleCustomizationConfirm = (customizedItem) => {
    if (editingCartIndex !== null) {
      const newCart = [...cart];
      newCart[editingCartIndex] = customizedItem;
      setCart(newCart);
    } else {
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

  const deleteFromCart = (cartIndex) => setCart(cart.filter((_, index) => index !== cartIndex));
  const calculateSubtotal = () => cart.reduce((total, item) => total + item.totalPrice, 0);
  const calculateTax = () => calculateSubtotal() * 0.0825;
  const calculateTotalWithTax = () => calculateSubtotal() + calculateTax();

  const initiateCheckout = () => {
    if (cart.length === 0) return alert('Cart is empty. Please add items before checkout.');
    setShowPaymentModal(true);
  };

  const handlePaymentSelection = async (paymentMethod) => {
    setShowPaymentModal(false);
    await completeCheckout(paymentMethod);
  };

  const completeCheckout = async (paymentMethod) => {
    try {
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotalWithTax();
      const customerId = customerInfo?.custid || 0;
      const isGuest = customerInfo?.is_guest || customerId === 0;

      const orderData = {
        customer_id: customerId,
        employee_id: 0,
        items: cart.map(item => ({
          id: item.id, menu_id: item.id, name: item.name, price: item.price,
          base_price: item.price, quantity: item.quantity, customizations: item.customizations || [],
          totalPrice: item.totalPrice, item_total: item.totalPrice
        })),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        payment_method: paymentMethod
      };

      const response = await fetch(API_ENDPOINTS.ORDERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit order');
      }

      const result = await response.json();
      let rewardsMessage = '';

      if (!isGuest && customerId > 0) {
        const rewardsPoints = Math.round(total * 100);
        try {
          const rewardsResponse = await fetch(API_ENDPOINTS.CUSTOMERS_REWARDS(customerId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points: rewardsPoints }),
          });
          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            rewardsMessage = `\n\nEarned ${rewardsPoints} rewards points!\nNew balance: ${rewardsData.new_rewards_balance} points`;
            setCustomerInfo(prev => ({ ...prev, rewards_points: rewardsData.new_rewards_balance }));
          }
        } catch (rewardsErr) {
          console.error('Error adding rewards:', rewardsErr);
        }
      }

      setCart([]);
      alert(`Order placed successfully!\nOrder #${result.order_id}\nTotal: $${total.toFixed(2)}${rewardsMessage}\n\nThank you for your order!`);
    } catch (error) {
      console.error('Checkout error:', error);
      alert(`Failed to complete order: ${error.message}\nPlease try again or contact staff.`);
    }
  };

  const handleCancelOrder = () => {
    if (cart.length === 0) return;
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setCart([]);
      setShowPaymentModal(false);
    }
  };

  return (
    <WeatherBackground>
      <div className="kiosk">
        {/* Header */}
        <header className="kiosk__header">
          <div className="kiosk__brand">
            <span className="kiosk__brand-icon">🧋</span>
            <h1 className="kiosk__brand-name">Kung Fu Tea</h1>
          </div>
          <div className="kiosk__user">
            <span className="kiosk__greeting">Welcome, {user.name}</span>
            {customerInfo && !customerInfo.is_guest && customerInfo.rewards_points !== undefined && (
              <div className="kiosk__rewards">
                <span className="kiosk__rewards-icon">⭐</span>
                <span className="kiosk__rewards-points">{customerInfo.rewards_points}</span>
              </div>
            )}
            {customerInfo && !customerInfo.is_guest && customerInfo.custid && (
              <button className="kiosk__btn kiosk__btn--ghost" onClick={() => setShowOrderHistory(true)}>
                Orders
              </button>
            )}
            <button className="kiosk__btn kiosk__btn--outline" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        </header>

        <div className="kiosk__body">
          {/* Categories Sidebar */}
          <nav className="kiosk__nav">
            <h2 className="kiosk__nav-title">Menu</h2>
            {loading ? (
              <div className="kiosk__nav-loading">Loading...</div>
            ) : (
              <ul className="kiosk__nav-list">
                {menuData.map((category) => (
                  <li key={category.category}>
                    <button
                      className={`kiosk__nav-item ${activeCategory === category.category ? 'kiosk__nav-item--active' : ''}`}
                      onClick={() => scrollToCategory(category.category)}
                    >
                      <span className="kiosk__nav-dot" style={{ background: getCategoryColor(category.category) }} />
                      <span className="kiosk__nav-text">{category.category}</span>
                      <span className="kiosk__nav-count">{category.items.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </nav>

          {/* Menu Content */}
          <main className="kiosk__menu">
            {loading ? (
              <div className="kiosk__loading">
                <div className="kiosk__spinner" />
                <p>Loading menu...</p>
              </div>
            ) : error ? (
              <div className="kiosk__error">
                <p>{error}</p>
                <button className="kiosk__btn kiosk__btn--primary" onClick={() => window.location.reload()}>
                  Try Again
                </button>
              </div>
            ) : (
              <div className="kiosk__menu-scroll">
                {menuData.map((category) => (
                  <section
                    key={category.category}
                    id={`category-${category.category.replace(/\s+/g, '-')}`}
                    data-category={category.category}
                    className="kiosk__category"
                  >
                    <header className="kiosk__category-header">
                      <div className="kiosk__category-accent" style={{ background: getCategoryColor(category.category) }} />
                      <h2 className="kiosk__category-title">{category.category}</h2>
                    </header>
                    <div className="kiosk__products">
                      {category.items.map((item) => (
                        <article
                          key={item.id}
                          className="product-card"
                          onClick={() => openCustomizationModal(item)}
                        >
                          <div className="product-card__image-wrap" style={{ background: getCategoryBgColor(category.category) }}>
                            <img
                              src={getImage(item.name) || placeholderImage}
                              alt={item.name}
                              className="product-card__image"
                              loading="lazy"
                            />
                            <div className="product-card__overlay">
                              <span className="product-card__add">+ Add</span>
                            </div>
                          </div>
                          <div className="product-card__body">
                            <h3 className="product-card__name">{item.name}</h3>
                            <p className="product-card__price">${item.price.toFixed(2)}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </main>

          {/* Cart Sidebar */}
          <aside className="kiosk__cart">
            <header className="kiosk__cart-header">
              <h2 className="kiosk__cart-title">Your Order</h2>
              <span className="kiosk__cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </header>

            <div className="kiosk__cart-items">
              {cart.length === 0 ? (
                <div className="kiosk__cart-empty">
                  <span className="kiosk__cart-empty-icon">🛒</span>
                  <p>Your cart is empty</p>
                  <span>Tap items to add them</span>
                </div>
              ) : (
                cart.map((item, index) => (
                  <article key={index} className="cart-item">
                    <div className="cart-item__main" onClick={() => openEditCustomization(index)}>
                      <div className="cart-item__info">
                        <h4 className="cart-item__name">{item.displayName || item.name}</h4>
                        {item.customizations?.length > 0 && (
                          <div className="cart-item__mods">
                            {item.customizations.map((c, i) => (
                              <span key={i} className="cart-item__mod">{c.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="cart-item__price">${item.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="cart-item__actions">
                      <button className="cart-item__qty-btn" onClick={() => removeFromCart(index)}>−</button>
                      <span className="cart-item__qty">{item.quantity}</span>
                      <button className="cart-item__qty-btn" onClick={() => addQuantity(index)}>+</button>
                      <button className="cart-item__delete" onClick={() => deleteFromCart(index)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <footer className="kiosk__cart-footer">
              <div className="kiosk__cart-summary">
                <div className="kiosk__cart-row">
                  <span>Subtotal</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="kiosk__cart-row">
                  <span>Tax (8.25%)</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="kiosk__cart-row kiosk__cart-row--total">
                  <span>Total</span>
                  <span>${calculateTotalWithTax().toFixed(2)}</span>
                </div>
              </div>
              <div className="kiosk__cart-actions">
                <button
                  className="kiosk__btn kiosk__btn--cancel"
                  onClick={handleCancelOrder}
                  disabled={cart.length === 0}
                >
                  Cancel
                </button>
                <button
                  className="kiosk__btn kiosk__btn--checkout"
                  onClick={initiateCheckout}
                  disabled={cart.length === 0}
                >
                  Pay ${calculateTotalWithTax().toFixed(2)}
                </button>
              </div>
            </footer>
          </aside>
        </div>

        {/* Customization Modal */}
        {showCustomizationModal && selectedItem && (
          <CustomizationModal
            item={selectedItem}
            onClose={() => { setShowCustomizationModal(false); setSelectedItem(null); setEditingCartIndex(null); }}
            onConfirm={handleCustomizationConfirm}
            existingCustomizations={editingCartIndex !== null ? cart[editingCartIndex].customizations : null}
          />
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="modal-backdrop" onClick={() => setShowPaymentModal(false)}>
            <dialog className="payment-modal" open onClick={(e) => e.stopPropagation()}>
              <button className="payment-modal__close" onClick={() => setShowPaymentModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <header className="payment-modal__header">
                <h2>How would you like to pay?</h2>
                <p>Total: ${calculateTotalWithTax().toFixed(2)}</p>
              </header>
              <div className="payment-modal__options">
                <button className="payment-option payment-option--cash" onClick={() => handlePaymentSelection('cash')}>
                  <span className="payment-option__icon">💵</span>
                  <span className="payment-option__label">Cash</span>
                </button>
                <button className="payment-option payment-option--card" onClick={() => handlePaymentSelection('credit_card')}>
                  <span className="payment-option__icon">💳</span>
                  <span className="payment-option__label">Card</span>
                </button>
              </div>
            </dialog>
          </div>
        )}

        {/* Order History Modal */}
        {showOrderHistory && customerInfo?.custid && (
          <OrderHistoryModal customerId={customerInfo.custid} onClose={() => setShowOrderHistory(false)} />
        )}
      </div>
    </WeatherBackground>
  );
}

export default CustomerKiosk;

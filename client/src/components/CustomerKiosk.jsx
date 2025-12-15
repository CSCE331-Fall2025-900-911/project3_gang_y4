import React, { useState, useEffect, useRef } from 'react';
import CustomizationModal from './CustomizationModal';
import OrderHistoryModal from './OrderHistoryModal';
import OrderConfirmationModal from './OrderConfirmationModal';
import { API_ENDPOINTS } from '../config/api';
import placeholderImage from '../images/placeholdertea.png';
import WeatherBackground from './WeatherBackground';
import '../styles/CustomerKiosk.css';
import TranslateMenu from './TranslateMenu';
import { useTranslation } from '../context/TranslationContext';


function CustomerKiosk({ user, onLogout }) {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  
  // Original menu data from API (always in English)
  const [menuData, setMenuData] = useState([]);
  
  // NEW: Translated menu data that will be displayed
  const [translatedMenuData, setTranslatedMenuData] = useState([]);
  
  // NEW: Map to store translated customization names by ID
  // Structure: { customizationId: translatedName }
  const [customizationTranslations, setCustomizationTranslations] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingCartIndex, setEditingCartIndex] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [lowContrast, setLowContrast] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kiosk_low_contrast')) || false;
    } catch (e) {
      return false;
    }
  });
  const customerFetchInProgress = useRef(false);
  
  // Get translation functions and current language from context
  const { getStringsForPage, setAppLanguage, translateDynamicContent, language } = useTranslation();
  const strings = getStringsForPage('kiosk');

  // Keep a body-level class in sync so other pages can respond too
  useEffect(() => {
    try {
      const host = document.body || document.documentElement;
      if (lowContrast) host.classList.add('low-contrast');
      else host.classList.remove('low-contrast');
    } catch (e) {
      // ignore server-side renders or environments without DOM
    }
  }, [lowContrast]);

  // Fetch/create customer account
  useEffect(() => {
    console.log('Kiosk strings:', strings);

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


  const categoryMapRef = useRef({});
  // Fetch menu data (this only runs once on mount)
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.MENU_GROUPED);
        if (!response.ok) throw new Error(`Failed to fetch menu: ${response.status}`);
        const data = await response.json();
        
        // Filter out Add-On and Customization categories
        const filteredData = data
          .filter(category => category.category !== 'Add-On' && category.category !== 'Customization')
          .map(category => ({
            ...category,
            items: category.items.filter(item => item.type !== 'Add-On' && item.type !== 'Customization')
          }))
          .filter(category => category.items.length > 0);
        
        // Store the original English menu data
        setMenuData(filteredData);
        
        // Initially set translated menu to the original (English)
        setTranslatedMenuData(filteredData);
        
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

 // CustomerKiosk.jsx

// NEW: Effect to translate menu data whenever language changes
  useEffect(() => {
  if (menuData.length === 0) return;

  const translateMenu = async () => {
    // 1. Always find the ORIGINAL English name of the current category first
    const originalCategoryName = categoryMapRef.current[activeCategory] || activeCategory;

    // 2. Handle English (The Reset)
    if (language === 'en') {
      setTranslatedMenuData(menuData);
      setCustomizationTranslations({});
      setActiveCategory(originalCategoryName);
      
      // Reset the map to English
      const resetMap = {};
      menuData.forEach(cat => { resetMap[cat.category] = cat.category; });
      categoryMapRef.current = resetMap;
      return;
    }

    // 3. Handle Other Languages
    try {
      const translatedCategories = await Promise.all(
        menuData.map(async (category) => {
          const textsToTranslate = [category.category, ...category.items.map(item => item.name)];
          const translations = await translateDynamicContent(textsToTranslate, `menu-${category.category}`, language);

          const translatedCatName = translations[0];
          
          // Update our Map Ref so we can find our way back to English later
          categoryMapRef.current[translatedCatName] = category.category;

          return {
            ...category,
            originalCategory: category.category,
            category: translatedCatName,
            items: category.items.map((item, i) => ({
              ...item,
              originalName: item.name,
              name: translations[i + 1]
            }))
          };
        })
      );

      setTranslatedMenuData(translatedCategories);

      // 4. Update Active Category to the NEW translated name
      const newActiveCat = translatedCategories.find(c => c.originalCategory === originalCategoryName);
      if (newActiveCat) {
        setActiveCategory(newActiveCat.category);
      }
    } catch (err) {
      console.error("Translation failed", err);
      setTranslatedMenuData(menuData);
    }
  };

  translateMenu();
}, [language, menuData]); // Removed translatedMenuData from dependencies to prevent loops



  // NEW: Effect to translate customization options for cart display
  useEffect(() => {
    // Only translate if we have cart items with customizations and language is not English
    if (cart.length === 0 || language === 'en') {
      setCustomizationTranslations({});
      return;
    }

    const translateCartCustomizations = async () => {
      console.log('Translating cart customizations to language:', language);
      
      // Collect all unique customizations from cart items
      const allCustomizations = [];
      const customizationMap = new Map(); // Map to track unique customizations by ID
      
      cart.forEach(cartItem => {
        if (cartItem.customizations && cartItem.customizations.length > 0) {
          cartItem.customizations.forEach(custom => {
            // Only add if we haven't seen this ID before
            if (!customizationMap.has(custom.id)) {
              customizationMap.set(custom.id, custom.name);
              allCustomizations.push({ id: custom.id, name: custom.name });
            }
          });
        }
      });

      // If no customizations to translate, return early
      if (allCustomizations.length === 0) {
        return;
      }

      try {
        // Extract just the names for translation
        const customizationNames = allCustomizations.map(c => c.name);
        
        // Translate all unique customization names
        const translatedNames = await translateDynamicContent(
          customizationNames,
          'cart-customizations',
          language
        );

        // Create a mapping of customization ID to translated name
        const translationMap = {};
        allCustomizations.forEach((custom, index) => {
          translationMap[custom.id] = translatedNames[index];
        });

        console.log('Cart customization translations:', translationMap);
        setCustomizationTranslations(translationMap);
      } catch (err) {
        console.error('Error translating cart customizations:', err);
        // On error, clear translations (will fall back to original names)
        setCustomizationTranslations({});
      }
    };

    translateCartCustomizations();
  }, [language, cart, translateDynamicContent]); // Re-run when language or cart changes

  // Scroll Spy Effect (updated to use translatedMenuData)
  useEffect(() => {
    if (translatedMenuData.length === 0) return;

    const navList = document.querySelector('.kiosk__nav-list');
    const menuScroll = document.querySelector('.kiosk__menu-scroll');
    if (!menuScroll) return;

    const observerOptions = {
      root: menuScroll,
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const categoryName = entry.target.dataset.category;
          if (categoryName) {
            setActiveCategory(categoryName);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = document.querySelectorAll('.kiosk__category');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, [translatedMenuData]);

  const images = import.meta.glob("../images/*", { eager: true });
  const getImage = (imageName) => {
    const imageKey = `../images/${imageName}.png`;
    return images[imageKey] ? images[imageKey].default : null;
  };

  const getCategoryColor = (category) => {
    // Use original category names for color mapping
    const originalCategory = translatedMenuData.find(c => c.category === category)?.originalCategory || category;
    const colors = {
      'Tea': 'var(--secondary-400)',
      'Seasonal': 'var(--info-500)',
      'Slush': 'var(--primary-400)',
    };
    return colors[originalCategory] || 'var(--neutral-400)';
  };

  const getCategoryBgColor = (category) => {
    // Use original category names for color mapping
    const originalCategory = translatedMenuData.find(c => c.category === category)?.originalCategory || category;
    const colors = {
      'Tea': 'var(--secondary-50)',
      'Seasonal': 'var(--info-bg)',
      'Slush': 'var(--primary-50)',
    };
    return colors[originalCategory] || 'var(--neutral-50)';
  };

  const scrollToCategory = (category) => {
    setActiveCategory(category);
    const element = document.getElementById(`category-${category.replace(/\s+/g, '-')}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openCustomizationModal = (item) => {
    // Pass the item with both translated and original names
    setSelectedItem(item);
    setEditingCartIndex(null);
    setShowCustomizationModal(true);
  };

  const openEditCustomization = (cartIndex) => {
    const cartItem = cart[cartIndex];
    // Use original name for item lookup, but display translated name
    setSelectedItem({ 
      id: cartItem.id, 
      name: cartItem.originalName || cartItem.name, 
      displayName: cartItem.name,
      price: cartItem.price 
    });
    setEditingCartIndex(cartIndex);
    setShowCustomizationModal(true);
  };

  const handleCustomizationConfirm = (customizedItem) => {
    // Store both original and translated names in cart
    const itemToAdd = {
      ...customizedItem,
      originalName: customizedItem.originalName || customizedItem.name
    };
    
    if (editingCartIndex !== null) {
      const newCart = [...cart];
      newCart[editingCartIndex] = itemToAdd;
      setCart(newCart);
    } else {
      setCart([...cart, itemToAdd]);
    }
    setShowCustomizationModal(false);
    setSelectedItem(null);
    setEditingCartIndex(null);
  };

  function getGradientColor(category) {
    switch (category) {
      case 'Tea':
        return 'rgba(255, 229, 137, 0.9)'; 
      case 'Seasonal':
        return 'rgba(132, 238, 235, 0.85)';
      case 'Slush':
        return 'rgba(254, 164, 188, 0.85)';
      default:
        return 'rgba(211, 211, 211, 0.8)'; // Light Gray
    }
  }

  const removeFromCart = (cartIndex) => {
    const item = cart[cartIndex];
    if (item.quantity > 1) {
      const newCart = [...cart];
      newCart[cartIndex] = { 
        ...item, 
        quantity: item.quantity - 1, 
        totalPrice: item.totalPrice / item.quantity * (item.quantity - 1) 
      };
      setCart(newCart);
    } else {
      deleteFromCart(cartIndex);
    }
  };

  const addQuantity = (cartIndex) => {
    const item = cart[cartIndex];
    const newCart = [...cart];
    newCart[cartIndex] = { 
      ...item, 
      quantity: item.quantity + 1, 
      totalPrice: item.totalPrice / item.quantity * (item.quantity + 1) 
    };
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

      // Use original names when sending to API
      const orderData = {
        customer_id: customerId,
        employee_id: 0,
        items: cart.map(item => ({
          id: item.id, 
          menu_id: item.id, 
          name: item.originalName || item.name, // Use original name for API
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
      setConfirmationData({
        orderId: result.order_id,
        total: total,
        rewardsInfo: rewardsMessage ? {
          earnedPoints: Math.round(total * 100),
          newBalance: rewardsMessage.split('New balance: ')[1]?.split(' points')[0] || 0
        } : null
      });
      setShowConfirmation(true);
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
      <div className={`kiosk ${lowContrast ? 'low-contrast' : ''}`}>
        {/* Header */}
        <header className="kiosk__header">
          <div className="kiosk__brand">
            <span className="kiosk__brand-icon">🧋</span>
            <h1 className="kiosk__brand-name">{strings.kfTea}</h1>
          </div>
          <div className="kiosk__user">
            <span className="kiosk__greeting"> {strings.welcome} {user.name}</span>
            {customerInfo && !customerInfo.is_guest && customerInfo.rewards_points !== undefined && (
              <div className="kiosk__rewards">
                <span className="kiosk__rewards-icon">⭐</span>
                <span className="kiosk__rewards-points">{customerInfo.rewards_points}</span>
              </div>
            )}
            {customerInfo && !customerInfo.is_guest && customerInfo.custid && (
              <button className="kiosk__btn kiosk__btn--ghost" onClick={() => setShowOrderHistory(true)}>
                {strings.orders}
              </button>
            )}

            <TranslateMenu currentLanguage={setAppLanguage} />
            <button className="kiosk__btn kiosk__btn--outline" onClick={onLogout}>
              {strings.signOut}
            </button>
          </div>
        </header>

        <div className="kiosk__body">
          {/* Categories Sidebar - NOW USES TRANSLATED DATA */}
          <nav className="kiosk__nav">
            <h2 className="kiosk__nav-title">{strings.menu}</h2>
            {loading ? (
              <div className="kiosk__nav-loading">{strings.loading}</div>
            ) : (
              <ul className="kiosk__nav-list">
                {translatedMenuData.map((category) => (
                  <li key={category.originalCategory || category.category}>
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

          {/* Menu Content - NOW USES TRANSLATED DATA */}
          <main className="kiosk__menu">
            {loading ? (
              <div className="kiosk__loading">
                <div className="kiosk__spinner" />
                <p>{strings.loading}</p>
              </div>
            ) : error ? (
              <div className="kiosk__error">
                <p>{error}</p>
                <button className="kiosk__btn kiosk__btn--primary" onClick={() => window.location.reload()}>
                  {strings.tAgain}
                </button>
              </div>
            ) : (
              <div className="kiosk__menu-scroll">
                {translatedMenuData.map((category) => (
                  <section
                    key={category.originalCategory || category.category}
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
                              src={getImage(item.originalName || item.name) || placeholderImage}
                              alt={item.name}
                              className="product-card__image"
                              loading="lazy"
                            />
                            <div className="product-card__overlay">
                              <span className="product-card__add">{strings.add}</span>
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
              <h2 className="kiosk__cart-title">{strings.yourOrder}</h2>
              <span className="kiosk__cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </header>

            <div className="kiosk__cart-items">
              {cart.length === 0 ? (
                <div className="kiosk__cart-empty">
                  <span className="kiosk__cart-empty-icon">🛒</span>
                  <p>{strings.emptyOrder}</p>
                  <span>{strings.instructions}</span>
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
                              <span key={i} className="cart-item__mod">
                                {/* Display translated name if available, otherwise fall back to original */}
                                {customizationTranslations[c.id] || c.name}
                              </span>
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
                  <span>{strings.subtotal}</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="kiosk__cart-row">
                  <span>{strings.tax} (8.25%)</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="kiosk__cart-row kiosk__cart-row--total">
                  <span>{strings.total}</span>
                  <span>${calculateTotalWithTax().toFixed(2)}</span>
                </div>
              </div>
              <div className="kiosk__cart-actions">
                <button
                  className="kiosk__btn kiosk__btn--cancel"
                  onClick={handleCancelOrder}
                  disabled={cart.length === 0}
                >
                  {strings.cancel}
                </button>
                <button
                  className="kiosk__btn kiosk__btn--checkout"
                  onClick={initiateCheckout}
                  disabled={cart.length === 0}
                >
                  {strings.pay} ${calculateTotalWithTax().toFixed(2)}
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
                <h2>{strings.payQ}</h2>
                <p>{strings.total}: ${calculateTotalWithTax().toFixed(2)}</p>
              </header>
              <div className="payment-modal__options">
                <button className="payment-option payment-option--cash" onClick={() => handlePaymentSelection('cash')}>
                  <span className="payment-option__icon">💵</span>
                  <span className="payment-option__label">{strings.cash}</span>
                </button>
                <button className="payment-option payment-option--card" onClick={() => handlePaymentSelection('credit_card')}>
                  <span className="payment-option__icon">💳</span>
                  <span className="payment-option__label">{strings.card}</span>
                </button>
              </div>
            </dialog>
          </div>
        )}

        {/* Order History Modal */}
        {showOrderHistory && customerInfo?.custid && (
          <OrderHistoryModal customerId={customerInfo.custid} onClose={() => setShowOrderHistory(false)} />
        )}

        {/* Order Confirmation Modal */}
        {showConfirmation && confirmationData && (
          <OrderConfirmationModal
            orderId={confirmationData.orderId}
            total={confirmationData.total}
            rewardsInfo={confirmationData.rewardsInfo}
            onClose={() => setShowConfirmation(false)}
          />
        )}

        {/* Low contrast toggle - bottom left */}
        <button
          className="kiosk__low-contrast-toggle"
          onClick={() => {
            const next = !lowContrast;
            setLowContrast(next);
            try { localStorage.setItem('kiosk_low_contrast', JSON.stringify(next)); } catch (e) {}
          }}
          aria-pressed={lowContrast}
          title="Toggle low contrast view"
        >
          {lowContrast ? 'Normal contrast' : 'Low contrast'}
        </button>
      </div>
    </WeatherBackground>
  );
}

export default CustomerKiosk;
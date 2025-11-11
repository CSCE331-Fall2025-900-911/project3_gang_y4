import React, { useState, useEffect } from 'react';
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
      newCart[cartIndex] = { ...item, quantity: item.quantity - 1, itemTotal: item.itemTotal / item.quantity * (item.quantity - 1) };
      setCart(newCart);
    } else {
      deleteFromCart(cartIndex);
    }
  };

  const addQuantity = (cartIndex) => {
    const item = cart[cartIndex];
    const newCart = [...cart];
    newCart[cartIndex] = { ...item, quantity: item.quantity + 1, itemTotal: item.itemTotal / item.quantity * (item.quantity + 1) };
    setCart(newCart);
  };

  const deleteFromCart = (cartIndex) => {
    setCart(cart.filter((_, index) => index !== cartIndex));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.itemTotal, 0).toFixed(2);
  };

  const handleCheckout = () => {
    // TODO: Implement checkout logic
    console.log('Checkout:', cart);
    alert(`Total: $${calculateTotal()}\nCheckout functionality coming soon!`);
  };

  return (
    <div className="customer-kiosk">
      {/* Header */}
      <header className="kiosk-header">
        <h1>Boba Kiosk</h1>
        <div className="user-info">
          <span>Welcome, {user.name}!</span>
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
                    <h4>{item.name}</h4>
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
                    <p className="cart-item-price">${item.itemTotal.toFixed(2)}</p>
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
            <div className="cart-total">
              <span>Total:</span>
              <span className="total-amount">${calculateTotal()}</span>
            </div>
            <button 
              className="checkout-button"
              onClick={handleCheckout}
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
    </div>
  );
}

export default CustomerKiosk;
import React, { useState, useEffect } from 'react';
import '../styles/CustomerKiosk.css';

function CustomerKiosk({ user, onLogout }) {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch menu data from API on component mount
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/menu/grouped');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch menu: ${response.status}`);
        }
        
        const data = await response.json();
        setMenuData(data);
        
        // Set first category as active
        if (data.length > 0) {
          setActiveCategory(data[0].category);
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
  }, []); // Empty dependency array = run once on mount

  const scrollToCategory = (category) => {
    setActiveCategory(category);
    const element = document.getElementById(`category-${category.replace(/\s+/g, '-')}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    if (existingItem.quantity > 1) {
      setCart(cart.map(cartItem => 
        cartItem.id === itemId 
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.id !== itemId));
    }
  };

  const deleteFromCart = (itemId) => {
    setCart(cart.filter(cartItem => cartItem.id !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
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
                          onClick={() => addToCart(item)}
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
              cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => removeFromCart(item.id)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => addToCart(item)}>+</button>
                    <button 
                      className="delete-button"
                      onClick={() => deleteFromCart(item.id)}
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
    </div>
  );
}

export default CustomerKiosk;

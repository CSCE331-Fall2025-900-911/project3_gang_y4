import React, { useState, useEffect } from 'react';
import '../styles/CustomizationModal.css';

function CustomizationModal({ item, onClose, onConfirm, existingCustomizations = null }) {
  const [addons, setAddons] = useState([]);
  const [customizations, setCustomizations] = useState({ ice: [], sweetness: [] });
  const [loading, setLoading] = useState(true);
  
  // Selected options
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [selectedIce, setSelectedIce] = useState(null);
  const [selectedSweetness, setSelectedSweetness] = useState(null);
  
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchCustomizationOptions();
    
    // If editing existing item, pre-populate selections
    if (existingCustomizations) {
      const addOns = existingCustomizations.filter(c => c.price > 0);
      const ice = existingCustomizations.find(c => c.name.toLowerCase().includes('ice'));
      const sweet = existingCustomizations.find(c => 
        c.name.toLowerCase().includes('sweet') || c.name.toLowerCase().includes('sugar')
      );
      
      setSelectedAddons(addOns.map(a => a.id));
      if (ice) setSelectedIce(ice.id);
      if (sweet) setSelectedSweetness(sweet.id);
    } else {
      // Set defaults for new item
      setSelectedIce('regular'); // Will be handled in UI
      setSelectedSweetness('regular'); // Will be handled in UI
    }
  }, [existingCustomizations]);

  const fetchCustomizationOptions = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching customization options...');
      
      // Fetch add-ons
      const addonsResponse = await fetch('/api/customizations/addons');
      if (addonsResponse.ok) {
        const addonsData = await addonsResponse.json();
        console.log('Add-ons fetched:', addonsData);
        setAddons(Array.isArray(addonsData) ? addonsData : []);
      } else {
        console.error('Failed to fetch add-ons:', addonsResponse.status);
        setAddons([]);
      }
      
      // Fetch customizations (ice, sweetness)
      const customResponse = await fetch('/api/customizations/grouped');
      if (customResponse.ok) {
        const customData = await customResponse.json();
        console.log('Customizations fetched:', customData);
        setCustomizations({
          ice: customData.ice || [],
          sweetness: customData.sweetness || []
        });
      } else {
        console.error('Failed to fetch customizations:', customResponse.status);
        setCustomizations({ ice: [], sweetness: [] });
      }
      
    } catch (error) {
      console.error('Error fetching customization options:', error);
      setAddons([]);
      setCustomizations({ ice: [], sweetness: [] });
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons(prev => 
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const calculateTotal = () => {
    let total = item.price * quantity;
    
    // Add addon prices
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) {
        total += addon.price * quantity;
      }
    });
    
    return total.toFixed(2);
  };

  const handleConfirm = () => {
    const allCustomizations = [];
    
    // Add selected add-ons
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) {
        allCustomizations.push({
          id: addon.id,
          name: addon.name,
          price: addon.price
        });
      }
    });
    
    // Add ice customization (if not regular)
    if (selectedIce && selectedIce !== 'regular') {
      const ice = customizations.ice.find(i => i.id === selectedIce);
      if (ice) {
        allCustomizations.push({
          id: ice.id,
          name: ice.name,
          price: ice.price
        });
      }
    }
    
    // Add sweetness customization (if not regular)
    if (selectedSweetness && selectedSweetness !== 'regular') {
      const sweet = customizations.sweetness.find(s => s.id === selectedSweetness);
      if (sweet) {
        allCustomizations.push({
          id: sweet.id,
          name: sweet.name,
          price: sweet.price
        });
      }
    }
    
    onConfirm({
      ...item,
      quantity,
      customizations: allCustomizations,
      itemTotal: parseFloat(calculateTotal())
    });
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
            <p>Loading options...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no add-ons or customizations loaded, show simple add to cart
  const hasOptions = addons.length > 0 || customizations.ice.length > 0 || customizations.sweetness.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content customization-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Customize Your Drink</h2>
        <h3 className="item-name">{item.name}</h3>
        <p className="base-price">Base Price: ${item.price.toFixed(2)}</p>

        {!hasOptions && (
          <p style={{ textAlign: 'center', color: '#999', margin: '20px 0' }}>
            No customization options available
          </p>
        )}

        {/* Add-ons Section */}
        {addons.length > 0 && (
          <div className="customization-section">
            <h4>Add-Ons</h4>
            <div className="options-grid">
              {addons.map(addon => (
                <button
                  key={addon.id}
                  className={`option-button ${selectedAddons.includes(addon.id) ? 'selected' : ''}`}
                  onClick={() => toggleAddon(addon.id)}
                >
                  <span>{addon.name}</span>
                  <span className="option-price">+${addon.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ice Level Section */}
        {customizations.ice.length > 0 && (
          <div className="customization-section">
            <h4>Ice Level</h4>
            <div className="options-grid">
              <button
                className={`option-button ${selectedIce === 'regular' ? 'selected' : ''}`}
                onClick={() => setSelectedIce('regular')}
              >
                Regular Ice
              </button>
              {customizations.ice.map(ice => (
                <button
                  key={ice.id}
                  className={`option-button ${selectedIce === ice.id ? 'selected' : ''}`}
                  onClick={() => setSelectedIce(ice.id)}
                >
                  {ice.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sweetness Level Section */}
        {customizations.sweetness.length > 0 && (
          <div className="customization-section">
            <h4>Sweetness Level</h4>
            <div className="options-grid">
              <button
                className={`option-button ${selectedSweetness === 'regular' ? 'selected' : ''}`}
                onClick={() => setSelectedSweetness('regular')}
              >
                Regular Sweet (100%)
              </button>
              {customizations.sweetness.map(sweet => (
                <button
                  key={sweet.id}
                  className={`option-button ${selectedSweetness === sweet.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSweetness(sweet.id)}
                >
                  {sweet.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Section */}
        <div className="customization-section quantity-section">
          <h4>Quantity</h4>
          <div className="quantity-controls">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span className="quantity-display">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>
        </div>

        {/* Total and Confirm */}
        <div className="modal-footer">
          <div className="total-display">
            <span>Total:</span>
            <span className="total-amount">${calculateTotal()}</span>
          </div>
          <button className="confirm-button" onClick={handleConfirm}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomizationModal;

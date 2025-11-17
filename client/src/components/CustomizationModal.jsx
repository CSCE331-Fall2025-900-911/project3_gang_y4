import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import '../styles/CustomizationModal.css';

function CustomizationModal({ item, onClose, onConfirm, existingCustomizations = null }) {
    const [addons, setAddons] = useState([]);
    const [customizations, setCustomizations] = useState({ ice: [], sweetness: [], size: [] });
    const [loading, setLoading] = useState(true);

    // Selected options
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [selectedIce, setSelectedIce] = useState(null);
    const [selectedSweetness, setSelectedSweetness] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);

    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const initializeOptions = async () => {
            await fetchCustomizationOptions();

            if (existingCustomizations) {
                // EDIT MODE: Load existing choices
                const addOns = existingCustomizations.filter(c => c.price > 0 && !c.name.includes('Size'));
                const ice = existingCustomizations.find(c => c.name.toLowerCase().includes('ice'));
                const sweet = existingCustomizations.find(c => c.name.toLowerCase().includes('sweet') || c.name.toLowerCase().includes('sugar'));
                const size = existingCustomizations.find(c => c.name.toLowerCase().includes('size'));

                setSelectedAddons(addOns.map(a => a.id));

                // Set IDs if found, otherwise defaults
                setSelectedIce(ice ? ice.id : 'regular');
                setSelectedSweetness(sweet ? sweet.id : 'regular');
                setSelectedSize(size ? size.id : 'regular');

            } else {
                // NEW ITEM MODE: Set Defaults
                setSelectedIce('regular');
                setSelectedSweetness('regular');
                setSelectedSize('regular'); // Default to Medium (Hardcoded)
            }
        };

        initializeOptions();
    }, [existingCustomizations]);

    const fetchCustomizationOptions = async () => {
        try {
            setLoading(true);
            let customData = { ice: [], sweetness: [], size: [] };

            // Fetch add-ons
            const addonsResponse = await fetch(API_ENDPOINTS.CUSTOMIZATIONS_ADDONS);
            if (addonsResponse.ok) {
                const addonsData = await addonsResponse.json();
                setAddons(Array.isArray(addonsData) ? addonsData : []);
            }

            // Fetch customizations
            const customResponse = await fetch(API_ENDPOINTS.CUSTOMIZATIONS_GROUPED);
            if (customResponse.ok) {
                customData = await customResponse.json();
                setCustomizations({
                    ice: customData.ice || [],
                    sweetness: customData.sweetness || [],
                    size: customData.size || []
                });
            }
        } catch (error) {
            console.error('Error fetching customization options:', error);
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
            if (addon) total += addon.price * quantity;
        });

        // Add Size Price (Only if NOT regular/medium)
        if (selectedSize && selectedSize !== 'regular') {
            const sizeOpt = customizations.size.find(s => s.id === selectedSize);
            if (sizeOpt) total += sizeOpt.price * quantity;
        }

        return total.toFixed(2);
    };

    const handleConfirm = () => {
        const allCustomizations = [];

        // Add Size (If not Regular/Medium)
        if (selectedSize && selectedSize !== 'regular') {
            const size = customizations.size.find(s => s.id === selectedSize);
            if (size) allCustomizations.push({ id: size.id, name: size.name, price: size.price });
        }

        // Add selected add-ons
        selectedAddons.forEach(addonId => {
            const addon = addons.find(a => a.id === addonId);
            if (addon) allCustomizations.push({ id: addon.id, name: addon.name, price: addon.price });
        });

        // Add ice (If not Regular)
        if (selectedIce && selectedIce !== 'regular') {
            const ice = customizations.ice.find(i => i.id === selectedIce);
            if (ice) allCustomizations.push({ id: ice.id, name: ice.name, price: ice.price });
        }

        // Add sweetness (If not Regular)
        if (selectedSweetness && selectedSweetness !== 'regular') {
            const sweet = customizations.sweetness.find(s => s.id === selectedSweetness);
            if (sweet) allCustomizations.push({ id: sweet.id, name: sweet.name, price: sweet.price });
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

    // Show options if any exist (including the hardcoded Size check logic)
    const hasOptions = addons.length > 0 || customizations.ice.length > 0 || customizations.sweetness.length > 0 || customizations.size.length > 0;

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

                {/* Size Section */}
                {/* Only show if we have DB options (Large) OR we want to force it.
            Usually good to check customizations.size.length > 0 */}
                {customizations.size.length > 0 && (
                    <div className="customization-section">
                        <h4>Size</h4>
                        <div className="options-grid">
                            {/* 1. Hardcoded Medium Button */}
                            <button
                                className={`option-button ${selectedSize === 'regular' ? 'selected' : ''}`}
                                onClick={() => setSelectedSize('regular')}
                            >
                                Medium
                            </button>

                            {/* 2. Database Options (Large, etc) */}
                            {customizations.size.map(sizeOpt => (
                                <button
                                    key={sizeOpt.id}
                                    className={`option-button ${selectedSize === sizeOpt.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedSize(sizeOpt.id)}
                                >
                                    <span>{sizeOpt.name.replace('Size - ', '')}</span>
                                    {sizeOpt.price > 0 && <span className="option-price">+${sizeOpt.price.toFixed(2)}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
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

                {/* Quantity and Footer */}
                <div className="customization-section quantity-section">
                    <h4>Quantity</h4>
                    <div className="quantity-controls">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                        <span className="quantity-display">{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)}>+</button>
                    </div>
                </div>

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
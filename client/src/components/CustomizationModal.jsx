import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { API_ENDPOINTS } from '../config/api';
import '../styles/CustomizationModal.css';
import { useTranslation } from '../context/TranslationContext';

function CustomizationModal({ item, onClose, onCancel, onConfirm, existingCustomizations = null }) {
    // Support both onClose and onCancel props for compatibility
    const handleClose = onClose || onCancel;
    
    // Original data from API (always in English)
    const [addons, setAddons] = useState([]);
    const [customizations, setCustomizations] = useState({ ice: [], sweetness: [], size: [] });
    
    // NEW: Translated versions for display
    const [translatedAddons, setTranslatedAddons] = useState([]);
    const [translatedCustomizations, setTranslatedCustomizations] = useState({ ice: [], sweetness: [], size: [] });
    
    const [loading, setLoading] = useState(true);

    // Selected options (store by ID, not by name)
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [selectedIce, setSelectedIce] = useState(null);
    const [selectedSweetness, setSelectedSweetness] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);

    const [quantity, setQuantity] = useState(1);

    // Get translation functions and current language
    const { getStringsForPage, translateDynamicContent, language } = useTranslation();
    const strings = getStringsForPage('customizationModal');

    // Initialize selected options from existing customizations
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
                // Store original English data
                setAddons(Array.isArray(addonsData) ? addonsData : []);
            }

            // Fetch customizations
            const customResponse = await fetch(API_ENDPOINTS.CUSTOMIZATIONS_GROUPED);
            if (customResponse.ok) {
                customData = await customResponse.json();
                // Store original English data
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

    // NEW: Effect to translate customization options when language changes
    useEffect(() => {
        // Only translate if we have data
        if (addons.length === 0 && 
            customizations.ice.length === 0 && 
            customizations.sweetness.length === 0 && 
            customizations.size.length === 0) {
            return;
        }

        const translateOptions = async () => {
            console.log(`Translating customization options to language: ${language}`);
            
            // If English, just use original data
            if (language === 'en') {
                setTranslatedAddons(addons);
                setTranslatedCustomizations(customizations);
                return;
            }

            try {
                // Translate Add-ons
                if (addons.length > 0) {
                    const addonTexts = addons.map(addon => addon.name);
                    const translatedAddonNames = await translateDynamicContent(
                        addonTexts,
                        'customization-addons',
                        language
                    );
                    
                    // Map translated names back to addon objects
                    const translatedAddonsList = addons.map((addon, index) => ({
                        ...addon,
                        originalName: addon.name, // Store original for API calls
                        name: translatedAddonNames[index] // Use translated for display
                    }));
                    
                    setTranslatedAddons(translatedAddonsList);
                } else {
                    setTranslatedAddons([]);
                }

                // Translate Ice options
                if (customizations.ice.length > 0) {
                    const iceTexts = customizations.ice.map(ice => ice.name);
                    const translatedIceNames = await translateDynamicContent(
                        iceTexts,
                        'customization-ice',
                        language
                    );
                    
                    const translatedIceList = customizations.ice.map((ice, index) => ({
                        ...ice,
                        originalName: ice.name,
                        name: translatedIceNames[index]
                    }));
                    
                    setTranslatedCustomizations(prev => ({
                        ...prev,
                        ice: translatedIceList
                    }));
                } else {
                    setTranslatedCustomizations(prev => ({ ...prev, ice: [] }));
                }

                // Translate Sweetness options
                if (customizations.sweetness.length > 0) {
                    const sweetnessTexts = customizations.sweetness.map(sweet => sweet.name);
                    const translatedSweetnessNames = await translateDynamicContent(
                        sweetnessTexts,
                        'customization-sweetness',
                        language
                    );
                    
                    const translatedSweetnessList = customizations.sweetness.map((sweet, index) => ({
                        ...sweet,
                        originalName: sweet.name,
                        name: translatedSweetnessNames[index]
                    }));
                    
                    setTranslatedCustomizations(prev => ({
                        ...prev,
                        sweetness: translatedSweetnessList
                    }));
                } else {
                    setTranslatedCustomizations(prev => ({ ...prev, sweetness: [] }));
                }

                // Translate Size options
                if (customizations.size.length > 0) {
                    const sizeTexts = customizations.size.map(size => size.name);
                    const translatedSizeNames = await translateDynamicContent(
                        sizeTexts,
                        'customization-size',
                        language
                    );
                    
                    const translatedSizeList = customizations.size.map((size, index) => ({
                        ...size,
                        originalName: size.name,
                        name: translatedSizeNames[index]
                    }));
                    
                    setTranslatedCustomizations(prev => ({
                        ...prev,
                        size: translatedSizeList
                    }));
                } else {
                    setTranslatedCustomizations(prev => ({ ...prev, size: [] }));
                }

                console.log('Customization options translation complete');
            } catch (err) {
                console.error('Error translating customization options:', err);
                // On error, fall back to original English data
                setTranslatedAddons(addons);
                setTranslatedCustomizations(customizations);
            }
        };

        translateOptions();
    }, [language, addons, customizations, translateDynamicContent]);

    const toggleAddon = (addonId) => {
        setSelectedAddons(prev =>
            prev.includes(addonId)
                ? prev.filter(id => id !== addonId)
                : [...prev, addonId]
        );
    };

    const calculateTotal = () => {
        let total = item.price * quantity;

        // Add addon prices (use original addons array for price calculation)
        selectedAddons.forEach(addonId => {
            const addon = addons.find(a => a.id === addonId);
            if (addon) total += addon.price * quantity;
        });

        // Add Size Price (Only if NOT regular/medium)
        // Use original customizations array for price calculation
        if (selectedSize && selectedSize !== 'regular') {
            const sizeOpt = customizations.size.find(s => s.id === selectedSize);
            if (sizeOpt) total += sizeOpt.price * quantity;
        }

        return total.toFixed(2);
    };

    const handleConfirm = () => {
        const allCustomizations = [];

        // Add Size (If not Regular/Medium)
        // Use ORIGINAL data for storing in cart/API
        if (selectedSize && selectedSize !== 'regular') {
            const size = customizations.size.find(s => s.id === selectedSize);
            if (size) allCustomizations.push({ 
                id: size.id, 
                name: size.name, // Store original English name
                price: size.price 
            });
        }

        // Add selected add-ons (use original data)
        selectedAddons.forEach(addonId => {
            const addon = addons.find(a => a.id === addonId);
            if (addon) allCustomizations.push({ 
                id: addon.id, 
                name: addon.name, // Store original English name
                price: addon.price 
            });
        });

        // Add ice (If not Regular) (use original data)
        if (selectedIce && selectedIce !== 'regular') {
            const ice = customizations.ice.find(i => i.id === selectedIce);
            if (ice) allCustomizations.push({ 
                id: ice.id, 
                name: ice.name, // Store original English name
                price: ice.price 
            });
        }

        // Add sweetness (If not Regular) (use original data)
        if (selectedSweetness && selectedSweetness !== 'regular') {
            const sweet = customizations.sweetness.find(s => s.id === selectedSweetness);
            if (sweet) allCustomizations.push({ 
                id: sweet.id, 
                name: sweet.name, // Store original English name
                price: sweet.price 
            });
        }

        // Use the item's name (which may already be translated if passed from menu)
        let displayName = item.displayName || item.name;

        // Return item with original name for API, but translated displayName
        onConfirm({
            id: item.id,
            name: item.originalName || item.name, // Store original English name
            displayName: displayName, // Use translated name for display
            price: item.price,
            quantity,
            customizations: allCustomizations, // Contains original English names
            totalPrice: parseFloat(calculateTotal())
        });
    };

    if (loading) {
        return (
            <div className="modal-overlay" onClick={handleClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
                        <p>Loading options...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show options if any exist (using translated data for display)
    const hasOptions = translatedAddons.length > 0 || 
                       translatedCustomizations.ice.length > 0 || 
                       translatedCustomizations.sweetness.length > 0 || 
                       translatedCustomizations.size.length > 0;

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content customization-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={handleClose}>×</button>

                <h2>{strings.title}</h2>
                {/* Display translated item name */}
                <h3 className="item-name">{item.displayName || item.name}</h3>
                <p className="base-price">{strings.basePrice}: ${item.price.toFixed(2)}</p>

                {!hasOptions && (
                    <p style={{ textAlign: 'center', color: '#999', margin: '20px 0' }}>
                        {strings.noCustomizations}
                    </p>
                )}

                {/* Size Section - USES TRANSLATED DATA */}
                {translatedCustomizations.size.length > 0 && (
                    <div className="customization-section">
                        <h4>{strings.sizeLabel}</h4>
                        <div className="options-grid">
                            {/* 1. Hardcoded Medium Button (could be translated via strings file) */}
                            <button
                                className={`option-button ${selectedSize === 'regular' ? 'selected' : ''}`}
                                onClick={() => setSelectedSize('regular')}
                            >
                                {strings.medium}
                            </button>

                            {/* 2. Database Options (Large, etc) - TRANSLATED */}
                            {translatedCustomizations.size.map(sizeOpt => (
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

                {/* Add-ons Section - USES TRANSLATED DATA */}
                {translatedAddons.length > 0 && (
                    <div className="customization-section">
                        <h4>{strings.addOns}</h4>
                        <div className="options-grid">
                            {translatedAddons.map(addon => (
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

                {/* Ice Level Section - USES TRANSLATED DATA */}
                {translatedCustomizations.ice.length > 0 && (
                    <div className="customization-section">
                        <h4>{strings.iceLevel}</h4>
                        <div className="options-grid">
                            {/* Hardcoded "Regular Ice" (could be translated via strings file) */}
                            <button
                                className={`option-button ${selectedIce === 'regular' ? 'selected' : ''}`}
                                onClick={() => setSelectedIce('regular')}
                            >
                                {strings.regIce} 
                            </button>
                            {translatedCustomizations.ice.map(ice => (
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

                {/* Sweetness Level Section - USES TRANSLATED DATA */}
                {translatedCustomizations.sweetness.length > 0 && (
                    <div className="customization-section">
                        <h4>{strings.sweetness}</h4>
                        <div className="options-grid">
                            {/* Hardcoded "Regular Sweet" (could be translated via strings file) */}
                            <button
                                className={`option-button ${selectedSweetness === 'regular' ? 'selected' : ''}`}
                                onClick={() => setSelectedSweetness('regular')}
                            >
                                {strings.regSweet} (100%)
                            </button>
                            {translatedCustomizations.sweetness.map(sweet => (
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
                    <h4>{strings.quantity}</h4>
                    <div className="quantity-controls">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                        <span className="quantity-display">{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)}>+</button>
                    </div>
                </div>

                <div className="modal-footer">
                    <div className="total-display">
                        <span>{strings.total}:</span>
                        <span className="total-amount">${calculateTotal()}</span>
                    </div>
                    <button className="confirm-button" onClick={handleConfirm}>
                        {strings.confirm}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default CustomizationModal;
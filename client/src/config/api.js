// API Configuration
// In production, use the environment variable
// In development, use the proxy (empty string means relative URLs will use Vite proxy)
const API_URL = import.meta.env.VITE_API_URL || '';

export const API_ENDPOINTS = {
  // Menu
  MENU_GROUPED: `${API_URL}/api/menu/grouped`,
  MENU_ITEMS: `${API_URL}/api/menu/items`,
  
  // Customizations
  CUSTOMIZATIONS_ADDONS: `${API_URL}/api/customizations/addons`,
  CUSTOMIZATIONS_GROUPED: `${API_URL}/api/customizations/grouped`,
  
  // Orders
  ORDERS: `${API_URL}/api/orders`,
  
  // Auth
  AUTH_GOOGLE: `${API_URL}/api/auth/google`,
  AUTH_MANAGER: `${API_URL}/api/auth/manager`,
};

export default API_URL;
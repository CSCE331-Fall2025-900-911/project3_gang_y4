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
  AUTH_EMPLOYEE: `${API_URL}/api/auth/employee`,
  AUTH_MANAGER: `${API_URL}/api/auth/manager`,

  // Customers
  CUSTOMERS_LOOKUP: (username) => `${API_URL}/api/customers/lookup/${username}`,
  CUSTOMERS_REWARDS: (custid) => `${API_URL}/api/customers/${custid}/rewards`,
  CUSTOMERS_GOOGLE_AUTH: `${API_URL}/api/customers/google-auth`,
};

export default API_URL;
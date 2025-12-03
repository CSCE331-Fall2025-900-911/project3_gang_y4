// API Configuration
// Priority:
// 1. Vite build-time env `VITE_API_URL` (set in Render or during build)
// 2. Runtime heuristic: if running on Render, use the deployed backend URL
// 3. Development: empty string -> use relative URLs (Vite proxy)
const BUILT_API_URL = import.meta.env.VITE_API_URL || '';

// Runtime fallback: helps when the site is already built but VITE_API_URL wasn't provided.
// Detect common Render hostnames and fall back to the known backend URL.
const RUNTIME_FALLBACK = (() => {
  try {
    const host = window?.location?.hostname || '';
    if (host.includes('onrender.com')) {
      // Replace with your actual Render backend URL
      return 'https://express-backend-yvwj.onrender.com';
    }
  } catch (e) {
    // ignore
  }
  return '';
})();

const API_URL = BUILT_API_URL || RUNTIME_FALLBACK || '';

export const API_ENDPOINTS = {
  // Menu
  MENU_GROUPED: `${API_URL}/api/menu/grouped`,
  MENU_ITEMS: `${API_URL}/api/menu/items`,
  
  // Customizations
  CUSTOMIZATIONS_ADDONS: `${API_URL}/api/customizations/addons`,
  CUSTOMIZATIONS_GROUPED: `${API_URL}/api/customizations/grouped`,
  
  // Orders
  ORDERS: `${API_URL}/api/orders`,
  ORDERS_CUSTOMER_HISTORY: (customerId) => `${API_URL}/api/orders/customer/${customerId}`,
  ORDERS_RECENT: `${API_URL}/api/orders/recent`,
  ORDERS_SEARCH: `${API_URL}/api/orders/search`,

  // Auth
  AUTH_GOOGLE: `${API_URL}/api/auth/google`,
  AUTH_EMAIL: `${API_URL}/api/auth/email`,
  AUTH_EMPLOYEE: `${API_URL}/api/auth/employee`,
  AUTH_MANAGER: `${API_URL}/api/auth/manager`,

  // Customers
  CUSTOMERS_LOOKUP: (username) => `${API_URL}/api/customers/lookup/${username}`,
  CUSTOMERS_REWARDS: (custid) => `${API_URL}/api/customers/${custid}/rewards`,
  CUSTOMERS_GOOGLE_AUTH: `${API_URL}/api/customers/google-auth`,

  // Inventory
  INVENTORY: `${API_URL}/api/inventory`,
  INVENTORY_ITEM: (id) => `${API_URL}/api/inventory/${id}`,
  INVENTORY_LOW_STOCK: `${API_URL}/api/inventory/low-stock`,
  INVENTORY_MENU_STOCK_STATUS: `${API_URL}/api/inventory/menu-stock-status`,
  INVENTORY_TRANSACTIONS: `${API_URL}/api/inventory/transactions/history`,
  INVENTORY_RESTOCK: (id) => `${API_URL}/api/inventory/restock/${id}`,
  INVENTORY_ADJUST: (id) => `${API_URL}/api/inventory/adjust/${id}`,

  // Analytics
  ANALYTICS_SALES: `${API_URL}/api/analytics/sales`,
  ANALYTICS_EMPLOYEES: `${API_URL}/api/analytics/employees`,

  // Reports
  REPORTS_X: `${API_URL}/api/reports/x`,

  // Employees
  EMPLOYEES: `${API_URL}/api/employees`,
  EMPLOYEE: (id) => `${API_URL}/api/employees/${id}`,

  // Menu
  MENU: `${API_URL}/api/menu`,
  MENU_ITEM: (id) => `${API_URL}/api/menu/${id}`,
  MENU_DEPENDENCIES: (id) => `${API_URL}/api/menu/${id}/dependencies`,
  MENU_DEPENDENCY: (menuId, invId) => `${API_URL}/api/menu/${menuId}/dependencies/${invId}`,
  MENU_DEPENDENCIES_BATCH: `${API_URL}/api/menu/dependencies/batch`,
};

export default API_URL;
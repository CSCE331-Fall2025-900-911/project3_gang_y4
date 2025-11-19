import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CheckoutInterface from './CheckoutInterface';
import { API_ENDPOINTS } from '../config/api';
import '../styles/ManagerView.css';

function ManagerView({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('checkout');

  return (
    <div className="manager-view">
      <header className="manager-header">
        <h1>Manager Dashboard</h1>
        <div className="manager-user-info">
          <span>Welcome, {user?.name || user?.username}</span>
          <span className="user-level">{user?.level}</span>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <nav className="manager-tabs">
        <button
          className={`tab-btn ${activeTab === 'checkout' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkout')}
        >
          Checkout
        </button>
        <button
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory
        </button>
        <button
          className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          Employees
        </button>
        <button
          className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Menu Items
        </button>
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={`tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button
          className={`tab-btn ${activeTab === 'zreport' ? 'active' : ''}`}
          onClick={() => setActiveTab('zreport')}
        >
          Z-Report
        </button>
      </nav>

      <main className="manager-content">
        {activeTab === 'checkout' && <CheckoutInterface user={user} />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'employees' && <EmployeesTab />}
        {activeTab === 'menu' && <MenuTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'trends' && <TrendsTab />}
        {activeTab === 'zreport' && <ZReportTab />}
      </main>
    </div>
  );
}

// Inventory Management Tab
function InventoryTab() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ item_name: '', quantity: '' });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await fetch(`/api/inventory/${editing.ingredientid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setFormData({ item_name: '', quantity: '' });
      setEditing(null);
      fetchInventory();
    } catch (err) {
      console.error('Error saving inventory:', err);
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({ item_name: item.item_name, quantity: item.quantity });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      fetchInventory();
    } catch (err) {
      console.error('Error deleting inventory:', err);
    }
  };

  if (loading) return <div className="loading">Loading inventory...</div>;

  return (
    <div className="tab-content">
      <h2>Inventory Management</h2>
      <form onSubmit={handleSubmit} className="manager-form">
        <input
          type="text"
          placeholder="Item Name"
          value={formData.item_name}
          onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          required
        />
        <button type="submit">{editing ? 'Update' : 'Add'} Item</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setFormData({ item_name: '', quantity: '' }); }}>Cancel</button>}
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map(item => (
            <tr key={item.ingredientid}>
              <td>{item.ingredientid}</td>
              <td>{item.item_name}</td>
              <td>{item.quantity}</td>
              <td>
                <button onClick={() => handleEdit(item)} className="btn-edit">Edit</button>
                <button onClick={() => handleDelete(item.ingredientid)} className="btn-delete">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Employees Management Tab
function EmployeesTab() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', username: '', password: '', level: 'Employee' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await fetch(`/api/employees/${editing.employeeid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setFormData({ first_name: '', last_name: '', username: '', password: '', level: 'Employee' });
      setEditing(null);
      fetchEmployees();
    } catch (err) {
      console.error('Error saving employee:', err);
    }
  };

  const handleEdit = (emp) => {
    setEditing(emp);
    setFormData({ first_name: emp.first_name, last_name: emp.last_name, username: emp.username, password: '', level: emp.level });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this employee?')) return;
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      fetchEmployees();
    } catch (err) {
      console.error('Error deleting employee:', err);
    }
  };

  if (loading) return <div className="loading">Loading employees...</div>;

  return (
    <div className="tab-content">
      <h2>Employee Management</h2>
      <form onSubmit={handleSubmit} className="manager-form">
        <input type="text" placeholder="First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
        <input type="text" placeholder="Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
        <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
        <input type="password" placeholder={editing ? "Password (leave blank to keep)" : "Password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editing} />
        <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
          <option value="Employee">Employee</option>
          <option value="Manager">Manager</option>
          <option value="Owner">Owner</option>
        </select>
        <button type="submit">{editing ? 'Update' : 'Add'} Employee</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setFormData({ first_name: '', last_name: '', username: '', password: '', level: 'Employee' }); }}>Cancel</button>}
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Username</th>
            <th>Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.employeeid}>
              <td>{emp.employeeid}</td>
              <td>{emp.first_name} {emp.last_name}</td>
              <td>{emp.username}</td>
              <td>{emp.level}</td>
              <td>
                <button onClick={() => handleEdit(emp)} className="btn-edit">Edit</button>
                <button onClick={() => handleDelete(emp.employeeid)} className="btn-delete">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Menu Items Management Tab
function MenuTab() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ menu_name: '', price: '', item_type: 'Tea' });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenu(data);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await fetch(`/api/menu/${editing.menuid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setFormData({ menu_name: '', price: '', item_type: 'Tea' });
      setEditing(null);
      fetchMenu();
    } catch (err) {
      console.error('Error saving menu item:', err);
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({ menu_name: item.menu_name, price: item.price, item_type: item.item_type });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      fetchMenu();
    } catch (err) {
      console.error('Error deleting menu item:', err);
    }
  };

  if (loading) return <div className="loading">Loading menu...</div>;

  return (
    <div className="tab-content">
      <h2>Menu Items Management</h2>
      <form onSubmit={handleSubmit} className="manager-form">
        <input type="text" placeholder="Menu Name" value={formData.menu_name} onChange={(e) => setFormData({ ...formData, menu_name: e.target.value })} required />
        <input type="number" step="0.01" placeholder="Price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
        <select value={formData.item_type} onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}>
          <option value="Tea">Tea</option>
          <option value="Slush">Slush</option>
          <option value="Seasonal">Seasonal</option>
          <option value="Add-On">Add-On</option>
          <option value="Customization">Customization</option>
        </select>
        <button type="submit">{editing ? 'Update' : 'Add'} Item</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setFormData({ menu_name: '', price: '', item_type: 'Tea' }); }}>Cancel</button>}
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {menu.map(item => (
            <tr key={item.menuid}>
              <td>{item.menuid}</td>
              <td>{item.menu_name}</td>
              <td>${parseFloat(item.price).toFixed(2)}</td>
              <td>{item.item_type}</td>
              <td>
                <button onClick={() => handleEdit(item)} className="btn-edit">Edit</button>
                <button onClick={() => handleDelete(item.menuid)} className="btn-delete">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Orders View Tab with Search
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  console.log('🔍 OrdersTab rendering, orders count:', orders.length, 'loading:', loading);

  useEffect(() => {
    console.log('🔍 OrdersTab mounted, fetching orders...');
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching orders...');

      // If any search field has a value, use search endpoint
      if (searchOrderId || searchCustomer || searchEmployee) {
        const params = new URLSearchParams();
        if (searchOrderId) params.append('orderId', searchOrderId);
        if (searchCustomer) params.append('customerUsername', searchCustomer);
        if (searchEmployee) params.append('employeeUsername', searchEmployee);

        console.log('🔍 Using search endpoint with params:', params.toString());
        const res = await fetch(`${API_ENDPOINTS.ORDERS_SEARCH}?${params}`);

        if (!res.ok) {
          console.error('❌ Search API error:', res.status, res.statusText);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log('✅ Search returned', data.length, 'orders');
        setOrders(data);
      } else {
        // Default: show all recent orders
        console.log('🔍 Using recent orders endpoint');
        const res = await fetch(API_ENDPOINTS.ORDERS_RECENT);

        if (!res.ok) {
          console.error('❌ Recent orders API error:', res.status, res.statusText);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log('✅ Recent orders returned', data.length, 'orders');
        setOrders(data);
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
      console.log('🔍 Loading complete');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleClear = (field) => {
    if (field === 'orderId') setSearchOrderId('');
    if (field === 'customer') setSearchCustomer('');
    if (field === 'employee') setSearchEmployee('');
    // Trigger re-fetch after clearing
    setTimeout(() => fetchOrders(), 100);
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getCustomerDisplay = (order) => {
    if (order.customer_id === 0 || order.customer_id === '0') {
      return 'Guest';
    }
    return order.customer_username || `Customer #${order.customer_id}`;
  };

  const getEmployeeDisplay = (order) => {
    if (order.employee_id === 0 || order.employee_id === '0') {
      return 'Self-Service Kiosk';
    }
    if (!order.employee_id) {
      return 'N/A';
    }
    return order.employee_username || `Employee #${order.employee_id}`;
  };

  const getItemCount = (orderDetails) => {
    try {
      const details = typeof orderDetails === 'string'
        ? JSON.parse(orderDetails)
        : orderDetails;
      return details.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
    } catch {
      return 0;
    }
  };

  const getOrderItems = (orderDetails) => {
    try {
      const details = typeof orderDetails === 'string'
        ? JSON.parse(orderDetails)
        : orderDetails;
      return details.items || [];
    } catch {
      return [];
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' CST';
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="tab-content orders-tab">
      <h2>Orders Management</h2>

      {/* Search Interface */}
      <form onSubmit={handleSearch} className="orders-search">
        <div className="search-field">
          <label>Search by Order ID</label>
          <div className="search-input-group">
            <input
              type="number"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              placeholder="Enter order number..."
            />
            {searchOrderId && (
              <button type="button" className="clear-btn" onClick={() => handleClear('orderId')}>
                ×
              </button>
            )}
          </div>
        </div>

        <div className="search-field">
          <label>Search by Customer</label>
          <div className="search-input-group">
            <input
              type="text"
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              placeholder="Enter customer username..."
            />
            {searchCustomer && (
              <button type="button" className="clear-btn" onClick={() => handleClear('customer')}>
                ×
              </button>
            )}
          </div>
        </div>

        <div className="search-field">
          <label>Search by Employee</label>
          <div className="search-input-group">
            <input
              type="text"
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              placeholder="Enter employee username..."
            />
            {searchEmployee && (
              <button type="button" className="clear-btn" onClick={() => handleClear('employee')}>
                ×
              </button>
            )}
          </div>
        </div>

        <button type="submit" className="search-btn">Search</button>
      </form>

      {/* Orders List */}
      <div className="orders-list">
        <div className="orders-count">
          Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">No orders found</div>
        ) : (
          <div className="orders-table-container">
            {orders.map((order) => (
              <div key={order.order_id} className="order-row-container">
                {/* Compact View */}
                <div
                  className={`order-row ${expandedOrder === order.order_id ? 'expanded' : ''}`}
                  onClick={() => toggleOrderExpansion(order.order_id)}
                >
                  <div className="order-cell order-id">
                    <span className="cell-label">Order ID:</span>
                    <span className="cell-value">#{order.order_id}</span>
                  </div>
                  <div className="order-cell order-date">
                    <span className="cell-label">Date:</span>
                    <span className="cell-value" title={formatDateTime(order.order_date)}>{formatDateTime(order.order_date)}</span>
                  </div>
                  <div className="order-cell order-customer">
                    <span className="cell-label">Customer:</span>
                    <span className="cell-value" title={getCustomerDisplay(order)}>{getCustomerDisplay(order)}</span>
                  </div>
                  <div className="order-cell order-employee">
                    <span className="cell-label">Employee:</span>
                    <span className="cell-value" title={getEmployeeDisplay(order)}>{getEmployeeDisplay(order)}</span>
                  </div>
                  <div className="order-cell order-total">
                    <span className="cell-label">Total:</span>
                    <span className="cell-value total-amount">${parseFloat(order.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="order-cell order-items-count">
                    <span className="cell-label">Items:</span>
                    <span className="cell-value">{getItemCount(order.order_details)}</span>
                  </div>
                  <div className="order-cell order-payment">
                    <span className="cell-label">Payment:</span>
                    <span className="cell-value">{order.payment_method === 'cash' ? '💵 Cash' : '💳 Card'}</span>
                  </div>
                  <div className="order-cell order-expand">
                    <span className="expand-icon">{expandedOrder === order.order_id ? '▼' : '▶'}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.order_id && (
                  <div className="order-details">
                    <h3>Order #{order.order_id} Details</h3>
                    <div className="order-details-grid">
                      <div className="details-section">
                        <h4>Items</h4>
                        {getOrderItems(order.order_details).map((item, idx) => (
                          <div key={idx} className="detail-item">
                            <div className="item-header">
                              <span className="item-name">{item.name}</span>
                              <span className="item-price">${(item.item_total || 0).toFixed(2)}</span>
                            </div>
                            <div className="item-info">
                              <span>Qty: {item.quantity || 1}</span>
                              <span>Base: ${(item.base_price || 0).toFixed(2)}</span>
                            </div>
                            {item.customizations && item.customizations.length > 0 && (
                              <div className="item-customizations">
                                {item.customizations.map((custom, cidx) => (
                                  <div key={cidx} className="customization">
                                    <span>{custom.name}</span>
                                    {custom.price > 0 && <span>+${custom.price.toFixed(2)}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="details-section">
                        <h4>Order Summary</h4>
                        <div className="summary-row">
                          <span>Subtotal:</span>
                          <span>${parseFloat(order.subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Tax:</span>
                          <span>${parseFloat(order.tax || 0).toFixed(2)}</span>
                        </div>
                        <div className="summary-row total">
                          <span>Total:</span>
                          <span>${parseFloat(order.total || 0).toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Payment Method:</span>
                          <span>{order.payment_method === 'cash' ? '💵 Cash' : '💳 Card'}</span>
                        </div>
                        <div className="summary-row">
                          <span>Status:</span>
                          <span>{order.order_status || 'Completed'}</span>
                        </div>
                        {(() => {
                          try {
                            const details = typeof order.order_details === 'string'
                              ? JSON.parse(order.order_details)
                              : order.order_details;
                            const notes = details?.order_notes || '';
                            if (notes.trim()) {
                              return (
                                <div className="summary-row order-notes-display">
                                  <span>Order Notes:</span>
                                  <span className="notes-text">{notes}</span>
                                </div>
                              );
                            }
                          } catch {
                            return null;
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Trends/Analytics Tab
function TrendsTab() {
  // Date range state
  const today = new Date().toISOString().split('T')[0];
  const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(today);

  // Metric and scope state
  const [metric, setMetric] = useState('revenue');
  const [scope, setScope] = useState('store'); // 'store' or 'employee'
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Data state
  const [chartData, setChartData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyticsInfo, setAnalyticsInfo] = useState(null);

  // Fetch employees for scope selector
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/analytics/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate date range
      if (new Date(fromDate) > new Date(toDate)) {
        setError('From date must be before To date');
        setLoading(false);
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        metric: metric
      });

      if (scope === 'employee' && selectedEmployee) {
        params.append('employeeId', selectedEmployee);
      }

      const res = await fetch(`/api/analytics/sales?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await res.json();
      console.log('Analytics data:', data);

      setChartData(data.data || []);
      setAnalyticsInfo(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on initial load
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Get chart type based on metric
  const getChartType = () => {
    if (['payment', 'customers', 'items'].includes(metric)) {
      return 'pie';
    }
    return 'bar';
  };

  // Format value based on metric
  const formatValue = (value, metricType = metric) => {
    if (!value && value !== 0) return 'N/A';

    if (['revenue', 'avgOrder'].includes(metricType)) {
      return `$${parseFloat(value).toFixed(2)}`;
    }

    if (metricType === 'volume' || metricType === 'orders') {
      return Math.round(value).toLocaleString();
    }

    return parseFloat(value).toFixed(2);
  };

  // Format period label for display
  const formatPeriodLabel = (period) => {
    if (!analyticsInfo) return period;

    const { granularity } = analyticsInfo;

    // For pie chart metrics (items, payment, customers), period is a category name, not a date
    const pieMetrics = ['items', 'payment', 'customers'];
    if (pieMetrics.includes(metric)) {
      return period; // Return as-is for category names
    }

    // For hourly metric, format hours as AM/PM
    if (metric === 'hourly' || granularity === 'hour') {
      const hour = parseInt(period);
      if (isNaN(hour)) return period;
      if (hour === 0) return '12 AM';
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return '12 PM';
      return `${hour - 12} PM`;
    }

    if (granularity === 'day') {
      return new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (granularity === 'week') {
      return `Week of ${new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    if (granularity === 'month') {
      return new Date(period + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    return period;
  };

  // Get metric display name
  const getMetricName = () => {
    const names = {
      volume: 'Items Sold',
      revenue: 'Revenue ($)',
      orders: 'Number of Orders',
      avgOrder: 'Average Order Value ($)',
      items: 'Popular Items',
      payment: 'Payment Methods',
      hourly: 'Sales by Hour',
      customers: 'Customer Types'
    };
    return names[metric] || 'Value';
  };

  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#95E1D3'];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
            {formatPeriodLabel(payload[0].payload.period)}
          </p>
          <p style={{ margin: 0, color: payload[0].color }}>
            {getMetricName()}: {formatValue(payload[0].value)}
          </p>
          {payload[0].payload.count && (
            <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>
              Count: {payload[0].payload.count}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="tab-content trends-tab">
      <h2>Sales Analytics</h2>

      {/* Controls Section */}
      <div className="analytics-controls">
        {/* Date Range */}
        <div className="control-group">
          <label>From Date:</label>
          <input
            type="date"
            value={fromDate}
            max={today}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label>To Date:</label>
          <input
            type="date"
            value={toDate}
            max={today}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        {/* Metric Selector */}
        <div className="control-group">
          <label>View Type:</label>
          <select value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="volume">Volume of Items Sold</option>
            <option value="revenue">Dollar Amount of Sales</option>
            <option value="orders">Number of Sales/Orders</option>
            <option value="avgOrder">Average Order Value</option>
            <option value="items">Popular Menu Items</option>
            <option value="payment">Sales by Payment Method</option>
            <option value="hourly">Sales by Hour of Day</option>
            <option value="customers">Customer Type Breakdown</option>
          </select>
        </div>

        {/* Scope Selector */}
        <div className="control-group">
          <label>Scope:</label>
          <div className="scope-selector">
            <label className="radio-label">
              <input
                type="radio"
                value="store"
                checked={scope === 'store'}
                onChange={(e) => setScope(e.target.value)}
              />
              Entire Store
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="employee"
                checked={scope === 'employee'}
                onChange={(e) => setScope(e.target.value)}
              />
              By Employee
            </label>
          </div>
        </div>

        {/* Employee Selector (conditional) */}
        {scope === 'employee' && (
          <div className="control-group">
            <label>Employee:</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Select Employee...</option>
              {employees.map(emp => (
                <option key={emp.employeeid} value={emp.employeeid}>
                  {emp.display_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Generate Button */}
        <div className="control-group">
          <button
            className="generate-btn"
            onClick={fetchAnalytics}
            disabled={loading || (scope === 'employee' && !selectedEmployee)}
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message" style={{
          color: 'red',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          borderRadius: '4px',
          margin: '10px 0'
        }}>
          {error}
        </div>
      )}

      {/* Chart Section */}
      {loading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>
          Loading analytics data...
        </div>
      ) : chartData.length === 0 ? (
        <div className="no-data" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No data available for the selected criteria. Try adjusting your filters.
        </div>
      ) : (
        <div className="chart-container" style={{ width: '100%', height: '500px', marginTop: '20px' }}>
          {getChartType() === 'pie' ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="period"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label={(entry) => `${entry.period}: ${formatValue(entry.value)}`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatPeriodLabel}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tickFormatter={(value) => formatValue(value, metric)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#8884d8"
                  name={getMetricName()}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Summary Info */}
      {analyticsInfo && chartData.length > 0 && (
        <div className="analytics-summary" style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0 0 5px 0' }}>
            <strong>Date Range:</strong> {fromDate} to {toDate}
          </p>
          <p style={{ margin: '0 0 5px 0' }}>
            <strong>Granularity:</strong> {analyticsInfo.granularity}
          </p>
          <p style={{ margin: '0 0 5px 0' }}>
            <strong>Data Points:</strong> {chartData.length}
          </p>
          {scope === 'employee' && selectedEmployee && (
            <p style={{ margin: '0 0 5px 0' }}>
              <strong>Employee:</strong> {employees.find(e => e.employeeid == selectedEmployee)?.display_name}
            </p>
          )}
          <p style={{ margin: '0' }}>
            <strong>Total:</strong> {formatValue(chartData.reduce((sum, d) => sum + d.value, 0))}
          </p>
        </div>
      )}
    </div>
  );
}

// Z-Report Tab
function ZReportTab() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/zreport?date=${date}`);
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error('Error fetching Z-Report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [date]);

  const total = report.reduce((sum, r) => sum + parseFloat(r.total_sales || 0), 0);

  return (
    <div className="tab-content">
      <h2>Z-Report (End of Day)</h2>
      <div className="controls">
        <label>Date: </label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Sales Count</th>
                <th>Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {report.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.employeeid}</td>
                  <td>{row.sales_count}</td>
                  <td>${parseFloat(row.total_sales).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="report-summary">
            <strong>Total for Day: ${total.toFixed(2)}</strong>
          </div>
        </>
      )}
    </div>
  );
}

export default ManagerView;

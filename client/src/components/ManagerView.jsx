import React, { useState, useEffect } from 'react';
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
                    <span className="cell-value">{formatDateTime(order.order_date)}</span>
                  </div>
                  <div className="order-cell order-customer">
                    <span className="cell-label">Customer:</span>
                    <span className="cell-value">{getCustomerDisplay(order)}</span>
                  </div>
                  <div className="order-cell order-employee">
                    <span className="cell-label">Employee:</span>
                    <span className="cell-value">{getEmployeeDisplay(order)}</span>
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
  const [metric, setMetric] = useState('revenue');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, [metric]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/trends?metric=${metric}`);
      const data = await res.json();
      setData(data);
    } catch (err) {
      console.error('Error fetching trends:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>Sales Trends</h2>
      <div className="controls">
        <label>Metric: </label>
        <select value={metric} onChange={(e) => setMetric(e.target.value)}>
          <option value="revenue">Total Revenue</option>
          <option value="volume">Sales Volume</option>
          <option value="average">Average Sale Price</option>
        </select>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td>{new Date(row.date).toLocaleDateString()}</td>
                <td>{metric === 'volume' ? row.value : `$${parseFloat(row.value).toFixed(2)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

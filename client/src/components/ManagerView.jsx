import React, { useState, useEffect } from 'react';
import CheckoutInterface from './CheckoutInterface';
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

// Orders View Tab
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="tab-content">
      <h2>Orders History</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Sale ID</th>
            <th>Customer ID</th>
            <th>Employee ID</th>
            <th>Date</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.salesid}>
              <td>{order.salesid}</td>
              <td>{order.custid}</td>
              <td>{order.employeeid}</td>
              <td>{new Date(order.sale_date).toLocaleString()}</td>
              <td>${parseFloat(order.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

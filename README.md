#  Boba Kiosk - Self-Service Point of Sale System

A modern, full-stack kiosk application for boba tea shops featuring customer self-checkout, employee POS interface, manager dashboard, Google OAuth authentication, and integrated rewards system.

**CSCE 331 Project 3** - Team gang_y4

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql)
![Express](https://img.shields.io/badge/Express-4.21.2-000000?logo=express)
![Vite](https://img.shields.io/badge/Vite-6.0.3-646CFF?logo=vite)

### 🌐 Live Demo

**Frontend**: [https://react-frontend-zep1.onrender.com/](https://react-frontend-zep1.onrender.com/)  
**Backend API**: [https://express-backend-yvwj.onrender.com](https://express-backend-yvwj.onrender.com)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Setup](#-environment-setup)
- [Database](#-database)
- [API Documentation](#-api-documentation)
- [Development Guide](#-development-guide)
- [For Team Members](#-for-team-members)
- [Deployment](#-deployment)
- [Additional Documentation](#-additional-documentation)

## ✨ Features

### 🔐 Authentication & User Management
- **Google OAuth 2.0** - Seamless sign-in with Google accounts
- **Auto-Account Creation** - New Google users automatically get customer accounts with rewards
- **Employee Login** - Username/password authentication for staff
- **Manager Login** - Separate login for manager access with elevated permissions
- **Guest Checkout** - No account required for quick purchases
- **Role-Based Routing** - Automatic redirection based on user type

### 🛒 Customer Self-Service Kiosk
- **Dynamic Menu** - Real-time menu loading from PostgreSQL with category filtering
- **Category Navigation** - Browse Tea, Slush, and Seasonal items
- **Item Customization** - Complete customization modal with:
  - Add-ons (Boba, Lychee Jelly, Egg Pudding, etc.)
  - Ice levels (Regular, Less, None)
  - Sweetness levels (Regular, 75%, 50%, 25%, None)
  - Size options (Small, Medium, Large)
- **Shopping Cart** - Full cart management with quantity adjustments
- **Cart Editing** - Click items to modify customizations after adding
- **Duplicate Detection** - Automatically groups identical items
- **Tax Calculation** - 8.25% tax rate with subtotal breakdown
- **Payment Methods** - Touchscreen-friendly Cash/Card selection
- **Rewards Display** - Shows current points balance for authenticated users
- **Rewards Earning** - Earn 1 point per cent spent (100 points = $1)

### 💼 Employee Checkout Interface
- **Complete POS System** - Full checkout interface for staff-assisted orders
- **Customer Lookup** - Search customers by username for rewards
- **Order Processing** - Same menu and customization as customer kiosk
- **Employee Tracking** - Orders tagged with employee ID for accountability
- **Touchscreen Optimized** - Large buttons and clear layout for ease of use

### 📊 Manager Dashboard
- **Checkout Tab** - Managers can process orders directly from dashboard
- **Analytics Views** - Sales data and reporting (implemented in ManagerView)
- **Inventory Management** - Track and manage stock levels
- **Employee Management** - View and manage staff accounts
- **Order History** - View all orders with filtering options

### 🎁 Rewards System
- **Points Tracking** - 1 point = 1 cent spent (100 points = $1)
- **Auto-Crediting** - Points automatically added after each purchase
- **Balance Display** - Real-time points shown in customer kiosk header
- **Guest Protection** - Guest checkouts don't earn rewards

### 🔧 Backend Features
- **RESTful API** - Clean, documented endpoints
- **JSONB Order Storage** - Complete order details stored in flexible format
- **Race Condition Handling** - Prevents duplicate customer records
- **Sequence Management** - Database migrations for auto-increment fixes
- **Unique Constraints** - Email uniqueness enforced at database level
- **Connection Pooling** - Optimized PostgreSQL connections (max 20)
- **Error Handling** - Comprehensive error responses with logging
- **SQL Injection Protection** - Parameterized queries throughout

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library with hooks (useState, useEffect, useRef)
- **React Router 6.28.0** - Client-side routing with protected routes
- **Vite 6.0.3** - Build tool with Hot Module Replacement (HMR)
- **@react-oauth/google 0.12.2** - Google OAuth integration
- **CSS3** - Component-scoped stylesheets with flexbox layouts

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express 4.21.2** - Web framework with middleware
- **PostgreSQL** - Relational database (via pg 8.13.1)
- **pg 8.13.1** - PostgreSQL client with connection pooling
- **dotenv 16.4.7** - Environment variable management
- **CORS 2.8.5** - Cross-origin resource sharing
- **google-auth-library 10.5.0** - Google OAuth verification

### Database
- **PostgreSQL** - Hosted at `csce-315-db.engr.tamu.edu`
- **Database**: `gang_y4_db`
- **Key Features**: JSONB support, sequences, unique constraints

### Development Tools
- **Vite Dev Server** - Port 3000 with `/api` proxy
- **Node --watch** - Auto-reload backend on file changes
- **Postman** - API testing with collection included
- **Git** - Version control

## 📁 Project Structure

```
project3_gang_y4/
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx                  # Main app with routing (540 lines)
│   │   ├── main.jsx                 # React DOM entry point
│   │   ├── components/
│   │   │   ├── LoginScreen.jsx     # Authentication screen (297 lines)
│   │   │   ├── CustomerKiosk.jsx   # Customer interface (540 lines)
│   │   │   ├── CheckoutInterface.jsx # Reusable checkout (513 lines)
│   │   │   ├── CustomizationModal.jsx # Item customization (299 lines)
│   │   │   ├── ManagerView.jsx     # Manager dashboard (579 lines)
│   │   │   └── EmployeeView.jsx    # Employee wrapper (22 lines)
│   │   ├── config/
│   │   │   └── api.js              # API endpoint configuration
│   │   └── styles/
│   │       ├── CustomerKiosk.css   # Kiosk styling
│   │       ├── ManagerView.css     # Manager UI styling
│   │       ├── CheckoutInterface.css # Checkout styling
│   │       └── ...                 # Other component styles
│   ├── package.json                # Frontend dependencies
│   └── vite.config.js              # Vite config with /api proxy
│
├── server/                          # Express backend
│   ├── index.js                     # Main Express app (94 lines)
│   ├── db.js                        # PostgreSQL connection pool
│   ├── routes/
│   │   ├── menu.js                  # Menu CRUD (157 lines)
│   │   ├── auth.js                  # Authentication (262 lines)
│   │   ├── customers.js             # Customer management (158 lines)
│   │   ├── orders.js                # Order creation (149 lines)
│   │   ├── customizations.js        # Customization options (94 lines)
│   │   ├── inventory.js             # Inventory CRUD (107 lines)
│   │   ├── employees.js             # Employee CRUD (136 lines)
│   │   ├── analytics.js             # Sales analytics (129 lines)
│   │   └── sales.js                 # Sales data (71 lines)
│   ├── schema/
│   │   └── sales_orders.sql         # Database schema
│   ├── migrations/
│   │   ├── README.md                # Migration documentation
│   │   ├── run_fix_sequence.js      # Fix customer sequence
│   │   ├── run_add_unique_constraint.js # Add email uniqueness
│   │   └── ...                      # Other migration scripts
│   ├── package.json                 # Backend dependencies
│   └── .env                         # Environment variables (gitignored)
│
├── old_javafx_app/                  # Legacy JavaFX version
├── testing/                         # API testing resources
│   ├── POSTMAN_TESTING_GUIDE.md
│   └── Boba_Kiosk_API_Tests.postman_collection.json
│
├── README.md                        # This file
├── GOOGLE_AUTH_SETUP.md            # Google OAuth setup guide
├── GOOGLE_OAUTH_EXPLANATION.md     # OAuth flow documentation
├── SERVER_SETUP.md                 # Backend setup instructions
└── render.yaml                     # Render.com deployment config
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL** - Database access to TAMU server
- **Git** - Version control
- **TAMU VPN** (if accessing remotely)
- **Google Cloud Console** account (for OAuth setup)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/CSCE331-Fall2025-900-911/project3_gang_y4.git
cd project3_gang_y4
```

#### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory (see [Environment Setup](#-environment-setup) for details):

```env
# Database (TAMU PostgreSQL)
DB_HOST=csce-315-db.engr.tamu.edu
DB_USER=gang_y4
DB_PASSWORD=<your_password>
DB_NAME=gang_y4_db
DB_PORT=5432

# Server
PORT=5001
NODE_ENV=development
```

**Run Database Migrations** (if needed):

```bash
# Fix customer sequence (prevents duplicate key errors)
node migrations/run_fix_sequence.js

# Add unique email constraint (prevents duplicate customers)
node migrations/run_add_unique_constraint.js
```

Start the backend server:

```bash
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL database: gang_y4_db
🚀 Server running on port 5001
```

#### 3. Frontend Setup

In a new terminal:

```bash
cd client
npm install
```

Create a `.env.local` file in the `client/` directory:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Start the frontend:

```bash
npm run dev
```

Open your browser to: `http://localhost:3000`

### Verify Installation

1. **Backend Health Check**: Visit `http://localhost:5001/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Frontend**: Navigate to `http://localhost:3000`
   - Should see login screen with Google sign-in option

3. **API Proxy**: From frontend, API calls to `/api/*` automatically proxy to backend

## 🔐 Environment Setup

### Server Environment Variables (`.env`)

Create `server/.env` with:

```env
# Database Connection (TAMU PostgreSQL)
DB_HOST=csce-315-db.engr.tamu.edu
DB_USER=gang_y4
DB_PASSWORD=<your_password>
DB_NAME=gang_y4_db
DB_PORT=5432

# Server Configuration
PORT=5001
NODE_ENV=development

# Optional - Google OAuth (for backend verification)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Client Environment Variables (`.env.local`)

Create `client/.env.local` with:

```env
# Google OAuth (Required for Google Sign-In)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# API URL (optional - defaults to proxy in dev)
# VITE_API_URL=http://localhost:5001
```

### Getting Google OAuth Credentials

See [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md) for detailed instructions on:
1. Creating a Google Cloud project
2. Configuring OAuth consent screen
3. Creating OAuth 2.0 credentials
4. Setting authorized origins and redirect URIs

**Quick Setup**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - Your production domain
6. Copy Client ID to `.env.local`

## 💾 Database

### Connection Details

- **Host**: `csce-315-db.engr.tamu.edu`
- **Port**: `5432`
- **Database**: `gang_y4_db`
- **User**: `gang_y4`
- **Password**: Contact team lead

### Main Tables

#### `menu`
Menu items with pricing and categories
```sql
- menuid (SERIAL PRIMARY KEY)
- menu_name (VARCHAR)
- price (DECIMAL)
- item_type (VARCHAR) -- Tea, Slush, Seasonal, Add-On, Customization
```

#### `customers`
Customer accounts with rewards
```sql
- customerid (SERIAL PRIMARY KEY)
- username (VARCHAR UNIQUE) -- Email for Google OAuth users
- first_name (VARCHAR)
- last_name (VARCHAR)
- password (VARCHAR) -- Random for OAuth, hashed for regular users
- rewards_points (INTEGER DEFAULT 0)
```

#### `employees`
Employee accounts
```sql
- employeeid (SERIAL PRIMARY KEY)
- first_name (VARCHAR)
- last_name (VARCHAR)
- username (VARCHAR)
- password (VARCHAR)
- level (VARCHAR) -- Employee, Manager, Owner
```

#### `sales_orders`
Complete order records with JSONB details
```sql
- order_id (SERIAL PRIMARY KEY)
- customer_id (INTEGER) -- 0 for guest, >0 for registered
- employee_id (INTEGER) -- 0 for kiosk, >0 for employee
- order_date (TIMESTAMP DEFAULT NOW())
- order_details (JSONB) -- Complete order with items, customizations, transaction_time
- subtotal (DECIMAL)
- tax (DECIMAL)
- total (DECIMAL)
- payment_method (VARCHAR) -- 'cash' or 'credit_card'
- order_status (VARCHAR)
```

**JSONB Structure** (order_details):
```json
{
  "items": [
    {
      "id": 2,
      "name": "Cold Brew - Medium",
      "price": 4.35,
      "quantity": 1,
      "customizations": [
        {"name": "Boba", "price": 0.75},
        {"name": "Regular Ice", "price": 0},
        {"name": "50% Sweet", "price": 0}
      ],
      "item_total": 5.10
    }
  ],
  "order_notes": "",
  "transaction_time": "2025-11-18T12:34:56.789Z"
}
```

#### Other Tables
- `sales` - Legacy sales records
- `inventory` - Stock management
- `items_per_sales` - Order line items
- `menuinventory` - Menu-inventory relationships

### Important Conventions

1. **customer_id = 0**: Guest checkout (no rewards)
2. **customer_id > 0**: Registered customer (earns rewards)
3. **employee_id = 0**: Self-service kiosk order
4. **employee_id > 0**: Employee-assisted order
5. **Rewards Points**: 1 point = 1 cent spent (100 points = $1.00)
6. **Tax Rate**: 8.25% (0.0825)

### Database Migrations

Located in `server/migrations/`:

1. **Fix Customer Sequence** (`run_fix_sequence.js`)
   - Problem: Sequence out of sync with max customerid
   - Fix: `SELECT setval('customers_id_seq', MAX(customerid))`
   - Run when: "duplicate key" errors on customer creation

2. **Add Email Unique Constraint** (`run_add_unique_constraint.js`)
   - Problem: React Strict Mode causes duplicate API calls
   - Fix: `ALTER TABLE customers ADD CONSTRAINT customers_username_unique UNIQUE (username)`
   - Run when: Duplicate customer records appearing

3. **Backfill Transaction Time** (`run_backfill.js`)
   - Problem: Old orders missing transaction_time
   - Fix: Adds transaction_time to existing order_details JSONB

See [server/migrations/README.md](server/migrations/README.md) for detailed documentation.

## 📡 API Documentation

### Base URL

**Frontend**:
- **Development**: `http://localhost:3000`
- **Production**: `https://react-frontend-zep1.onrender.com/`

**Backend API**:
- **Development**: `http://localhost:5001/api`
- **Production**: `https://express-backend-yvwj.onrender.com/api`

### Health Check

```http
GET /health
```

Returns server status:
```json
{
  "status": "OK",
  "timestamp": "2025-11-18T12:00:00.000Z"
}
```

### Menu Endpoints

#### Get All Menu Items (Flat)
```http
GET /api/menu
```

Response:
```json
[
  {
    "menuid": 2,
    "menu_name": "Cold Brew - Medium",
    "price": "4.35",
    "item_type": "Tea"
  }
]
```

#### Get Grouped Menu (Recommended)
```http
GET /api/menu/grouped
```

Returns items organized by category:
```json
[
  {
    "category": "Tea",
    "items": [
      {
        "id": 2,
        "name": "Cold Brew - Medium",
        "price": 4.35,
        "type": "Tea"
      }
    ]
  },
  {
    "category": "Slush",
    "items": [...]
  }
]
```

#### Get Items by Category
```http
GET /api/menu/category/:type
```

Parameters: `type` = Tea, Slush, Seasonal

#### Get Single Item
```http
GET /api/menu/:id
```

#### Create Menu Item (Manager)
```http
POST /api/menu
Content-Type: application/json

{
  "menu_name": "New Drink",
  "price": 5.99,
  "item_type": "Tea"
}
```

### Authentication Endpoints

#### Google OAuth Sign-In
```http
POST /api/auth/google
Content-Type: application/json

{
  "googleId": "123456789",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://..."
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "123456789",
    "username": "user",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Employee Login
```http
POST /api/auth/employee
Content-Type: application/json

{
  "username": "employee1",
  "password": "password"
}
```

#### Manager Login
```http
POST /api/auth/manager
Content-Type: application/json

{
  "username": "manager1",
  "password": "password"
}
```

### Customer Endpoints

#### Find/Create Customer (Google OAuth)
```http
POST /api/customers/google-auth
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}
```

Response (existing customer):
```json
{
  "custid": 42,
  "username": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "rewards_points": 1250,
  "is_new": false
}
```

Response (new customer):
```json
{
  "custid": 76,
  "username": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "rewards_points": 0,
  "is_new": true
}
```

#### Lookup Customer by Username
```http
GET /api/customers/lookup/:username
```

#### Add Rewards Points
```http
POST /api/customers/:custid/rewards
Content-Type: application/json

{
  "points": 510
}
```

Response:
```json
{
  "success": true,
  "custid": 42,
  "new_rewards_balance": 1760,
  "points_added": 510
}
```

### Order Endpoints

#### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "customer_id": 42,
  "employee_id": 0,
  "items": [
    {
      "id": 2,
      "name": "Cold Brew - Medium",
      "price": 4.35,
      "quantity": 1,
      "customizations": [
        {"name": "Boba", "price": 0.75}
      ],
      "item_total": 5.10
    }
  ],
  "subtotal": "5.10",
  "tax": "0.42",
  "total": "5.52",
  "payment_method": "credit_card"
}
```

Response:
```json
{
  "success": true,
  "order_id": 123,
  "message": "Order created successfully"
}
```

#### Get Order by ID
```http
GET /api/orders/:order_id
```

### Customization Endpoints

#### Get Grouped Customizations
```http
GET /api/customizations/grouped
```

Returns:
```json
{
  "ice": [
    {"id": 15, "name": "Regular Ice", "price": 0, "type": "Customization"},
    {"id": 16, "name": "Less Ice", "price": 0, "type": "Customization"}
  ],
  "sweetness": [...],
  "size": [...],
  "addons": [
    {"id": 11, "name": "Boba", "price": 0.75, "type": "Add-On"}
  ]
}
```

### Complete API Endpoint List

See `client/src/config/api.js` for all configured endpoints:
- Menu: GET, POST, PUT, DELETE
- Auth: Google, Employee, Manager
- Customers: Google Auth, Lookup, Rewards
- Orders: Create, Retrieve
- Customizations: Grouped, Add-ons
- Inventory: CRUD operations
- Employees: CRUD operations
- Analytics: Sales, X-Report, Z-Report, Trends

## 💻 Development Guide

### Running in Development Mode

**Backend** (with auto-reload):
```bash
cd server
npm run dev        # Uses Node --watch flag
```

**Frontend** (with HMR):
```bash
cd client
npm run dev        # Vite dev server on port 3000
```

**Access**:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001/api`
- Backend Health: `http://localhost:5001/health`

### Building for Production

**Frontend**:
```bash
cd client
npm run build      # Outputs to client/dist/
npm run preview    # Preview build on port 3000
```

**Backend**:
```bash
cd server
npm start          # Runs node index.js
```

### Code Style & Conventions

#### React Components
- **Functional components** with hooks
- **useState** for component state
- **useEffect** for side effects
- **useRef** for preventing duplicate calls (React Strict Mode)
- **Component files**: PascalCase (e.g., `CustomerKiosk.jsx`)
- **CSS files**: Match component name (e.g., `CustomerKiosk.css`)

#### State Management
```javascript
// Good - descriptive state names
const [cart, setCart] = useState([]);
const [customerInfo, setCustomerInfo] = useState(null);

// Use refs to prevent duplicate API calls
const customerFetchInProgress = useRef(false);
```

#### API Calls
```javascript
// Always use try-catch
try {
  const response = await fetch(API_ENDPOINTS.ORDERS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    throw new Error('Failed to submit order');
  }

  const result = await response.json();
} catch (error) {
  console.error('Error:', error);
}
```

#### Backend Routes
```javascript
// Always use parameterized queries
router.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM customers WHERE customerid = $1',
      [id]  // Parameterized - prevents SQL injection
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});
```

#### Database Conventions
- **customer_id = 0**: Guest checkout
- **customer_id > 0**: Registered customer
- **employee_id = 0**: Self-service kiosk
- **employee_id > 0**: Employee-assisted
- **Rewards**: `points = Math.round(total * 100)`
- **Tax**: `tax = subtotal * 0.0825`

#### Naming Conventions
- **Components**: PascalCase (`CustomerKiosk`, `CheckoutInterface`)
- **Files**: Match component name
- **Functions**: camelCase (`fetchOrCreateCustomer`, `handleCheckout`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS`)
- **CSS Classes**: kebab-case (`customer-kiosk`, `cart-section`)

### Timezone Handling

The application handles timezones in a specific way to ensure consistent reporting across the stack:

1.  **Database (PostgreSQL)**:
    *   Timestamps (e.g., `order_date`) are stored as `timestamp without time zone`.
    *   **Convention**: All times stored are **CST/CDT (America/Chicago)** wall-clock time.
    *   *Example*: An order placed at 6:00 PM CST is stored as `2025-11-18 18:00:00`.

2.  **Backend (Node/Express)**:
    *   Queries should **not** apply timezone conversions (e.g., avoid `AT TIME ZONE 'America/Chicago'`) when filtering by date.
    *   Since the data is already in local time, applying a timezone conversion shifts it to UTC, causing "off-by-one-day" errors in reports.
    *   *Correct*: `WHERE order_date >= '2025-11-18'`
    *   *Incorrect*: `WHERE order_date AT TIME ZONE 'America/Chicago' >= ...`

3.  **Frontend (React)**:
    *   The API returns date strings like `"2025-11-18"`.
    *   **Parsing**: JavaScript parses date-only strings as **UTC Midnight** (`2025-11-18T00:00:00Z`).
    *   **Formatting**: To prevent the browser from converting this back to local time (which would shift it to the previous day, e.g., "Nov 17"), you must force UTC formatting.
    *   *Code Example*:
        ```javascript
        new Date(dateString).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC' // CRITICAL: Prevents shift to local time
        });
        ```

### Debugging

#### Frontend Debugging
Console logs are already in place for:
- Customer auto-creation flow (🔐 DEBUG)
- Checkout process (🛒 DEBUG)
- API responses (✅, ❌)

Check browser console for:
```
🔐 DEBUG: CustomerKiosk mounted with user prop: {email: "...", name: "..."}
🔐 DEBUG: Calling google-auth API with: {...}
✅ Customer account ready: {custid: 42, ...}
🛒 DEBUG: completeCheckout called with payment method: credit_card
```

#### Backend Debugging
Server logs show:
```
🔍 Google OAuth - Looking up customer by email: user@example.com
✅ Existing customer found: 42 - user@example.com
📝 Creating new customer for Google OAuth user: newuser@example.com
⚠️  Duplicate customer detected (race condition), fetching existing record...
```

#### Common Issues

**Issue**: "duplicate key value violates unique constraint customers_pkey"
**Fix**: Run `node server/migrations/run_fix_sequence.js`

**Issue**: Duplicate customer records created
**Fix**: Run `node server/migrations/run_add_unique_constraint.js`

**Issue**: API calls fail with CORS error
**Fix**: Ensure backend is running on port 5001, frontend proxies `/api/*`

**Issue**: Google sign-in doesn't work
**Fix**: Check `VITE_GOOGLE_CLIENT_ID` in `client/.env.local`

## 👥 For Team Members

### Adding New Menu Items

1. **Via Database**:
```sql
INSERT INTO menu (menu_name, price, item_type)
VALUES ('New Drink - Medium', 5.99, 'Tea');
```

2. **Via API** (Postman or code):
```http
POST http://localhost:5001/api/menu
Content-Type: application/json

{
  "menu_name": "New Drink - Medium",
  "price": 5.99,
  "item_type": "Tea"
}
```

Menu will appear immediately in customer kiosk (refreshes on mount).

### Modifying Checkout Flow

**Customer Kiosk**: `client/src/components/CustomerKiosk.jsx`
- Line 33-93: Customer auto-creation from Google OAuth
- Line 199-210: Payment method selection
- Line 212-301: Complete checkout with rewards

**Employee/Manager Checkout**: `client/src/components/CheckoutInterface.jsx`
- Line 50-100: Customer lookup
- Line 200-250: Cart management
- Line 300-400: Checkout process

### Component Locations

- **Login Screen**: `client/src/components/LoginScreen.jsx`
  - Google OAuth integration
  - Employee/Manager login forms
  - Guest checkout option

- **Customer View**: `client/src/components/CustomerKiosk.jsx`
  - Menu display
  - Shopping cart
  - Checkout

- **Employee View**: `client/src/components/EmployeeView.jsx`
  - Wrapper that uses CheckoutInterface

- **Manager View**: `client/src/components/ManagerView.jsx`
  - Tabs: Checkout, Dashboard, Analytics, etc.
  - Checkout tab uses CheckoutInterface

- **Shared Checkout**: `client/src/components/CheckoutInterface.jsx`
  - Reusable by Employee and Manager views
  - Customer lookup
  - Order processing

### Testing Different User Flows

1. **Guest Customer**:
   - Click "Continue as Guest" on login
   - Add items, checkout
   - No rewards earned, customer_id = 0

2. **Google OAuth Customer**:
   - Click "Sign in with Google"
   - First time: Auto-creates customer account
   - Add items, checkout with Cash or Card
   - Rewards: 100 points per $1 spent
   - See rewards balance in header

3. **Employee**:
   - Click "Employee/Manager Login" → "Employee Login"
   - Username/password from database
   - Access checkout interface
   - Can lookup customers for rewards

4. **Manager**:
   - Click "Employee/Manager Login" → "Manager Login"
   - Username/password from database
   - Access full dashboard
   - Checkout tab + analytics/inventory

### Database Access

Connect via psql:
```bash
psql -h csce-315-db.engr.tamu.edu -U gang_y4 -d gang_y4_db
```

Useful queries:
```sql
-- View recent orders
SELECT order_id, customer_id, employee_id, total, order_date
FROM sales_orders
ORDER BY order_date DESC
LIMIT 10;

-- View customer rewards
SELECT customerid, username, first_name, last_name, rewards_points
FROM customers
WHERE rewards_points > 0
ORDER BY rewards_points DESC;

-- View order details (JSONB)
SELECT order_id, order_details
FROM sales_orders
WHERE order_id = 123;
```

## 🚀 Deployment

### Render.com (Current Deployment)

Configuration in `render.yaml`:

- **Backend**: Express app on Node 18
  - URL: `https://express-backend-yvwj.onrender.com`
  - Auto-deploys from main branch
  - Environment variables configured in Render dashboard

- **Frontend**: React build served via Vite preview
  - URL: `https://react-frontend-zep1.onrender.com/`
  - Build command: `npm install && npm run build`
  - Start command: `npm run preview`
  - Auto-deploys from main branch

### Environment Variables in Production

Set in Render dashboard:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `NODE_ENV=production`
- `PORT=5001` (backend)
- `VITE_GOOGLE_CLIENT_ID` (frontend)
- `VITE_API_URL=https://express-backend-yvwj.onrender.com` (frontend)

### Manual Deployment

1. **Build frontend**:
```bash
cd client
npm run build
```

2. **Deploy backend**:
```bash
cd server
npm start
```

3. **Serve frontend** build from `client/dist/`

## 📚 Additional Documentation

### Included Documentation
- **[GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md)** - Google OAuth implementation guide
- **[GOOGLE_OAUTH_EXPLANATION.md](GOOGLE_OAUTH_EXPLANATION.md)** - OAuth flow documentation
- **[SERVER_SETUP.md](SERVER_SETUP.md)** - Backend setup instructions
- **[server/migrations/README.md](server/migrations/README.md)** - Database migration guide
- **[testing/POSTMAN_TESTING_GUIDE.md](testing/POSTMAN_TESTING_GUIDE.md)** - API testing guide

### Postman Collection
Import `testing/Boba_Kiosk_API_Tests.postman_collection.json` for:
- Pre-configured API requests
- Example request bodies
- Test scenarios

### Database Schema
See `server/schema/sales_orders.sql` for table definitions.

## 🧪 Testing

### API Testing with Postman

1. Import collection: `testing/Boba_Kiosk_API_Tests.postman_collection.json`
2. Set environment variables:
   - `base_url`: `http://localhost:5001`
3. Run tests in order:
   - Health check
   - Menu endpoints
   - Auth endpoints
   - Customer endpoints
   - Order creation

### Manual Testing Checklist

**Customer Flow**:
- [ ] Google sign-in creates/finds customer
- [ ] Menu loads and displays by category
- [ ] Can add items to cart
- [ ] Can customize items (add-ons, ice, sweetness, size)
- [ ] Can edit cart items
- [ ] Subtotal, tax, total calculate correctly
- [ ] Payment method selection works
- [ ] Checkout creates order
- [ ] Rewards points are added
- [ ] Rewards balance updates

**Employee Flow**:
- [ ] Employee login works
- [ ] Can access checkout interface
- [ ] Can lookup customers
- [ ] Orders tagged with employee_id

**Manager Flow**:
- [ ] Manager login works
- [ ] Dashboard loads
- [ ] Checkout tab works
- [ ] Analytics display

## 📊 Project Statistics

- **Total Lines of Code**: ~4,000+
- **Frontend Components**: 7 main components (~2,800 lines JSX)
- **Backend Routes**: 9 route files (~1,000 lines)
- **API Endpoints**: 30+ endpoints
- **Database Tables**: 7 main tables
- **Dependencies**: 15+ npm packages

## 🤝 Contributing

### Team Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit with descriptive messages
4. Push and create pull request
5. Request code review from team
6. Merge after approval

### Commit Message Format

```
Type: Brief description

Detailed explanation (if needed)

- Bullet points for changes
- Multiple items if applicable
```

Types: `Feature`, `Fix`, `Refactor`, `Docs`, `Style`, `Test`

Example:
```
Feature: Add payment method selection to checkout

Implemented Cash/Card selection modal for customer kiosk:
- Added payment modal component
- Created touchscreen-friendly buttons
- Integrated with checkout flow
- Added payment_method to order data
```

## 📄 License

This project is developed as part of CSCE 331 coursework at Texas A&M University.

## 👨‍💻 Team

**Team gang_y4** - CSCE 331 Fall 2025

For questions or issues, please contact the team lead or post in the team Discord channel.

---

**Built with ❤️ and ☕ by Team gang_y4**

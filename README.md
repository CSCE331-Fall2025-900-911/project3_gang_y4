# 🧋 Boba Kiosk - Self-Service Point of Sale System

A modern, full-stack kiosk application for boba tea shops featuring customer self-checkout, employee POS interface, and manager dashboard capabilities.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql)
![Express](https://img.shields.io/badge/Express-4.21.2-000000?logo=express)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Team](#team)

## ✨ Features

### Currently Implemented

#### 🔐 Authentication & Login
- Multiple login options: Google OAuth, Email/Phone, Guest checkout
- Dedicated manager login interface
- Role-based routing and access control

#### 🛒 Customer Self-Checkout
- **Dynamic Menu Display**: Real-time menu loading from PostgreSQL database
- **Category Navigation**: Browse items by Tea, Slush, and Seasonal categories
- **Shopping Cart**: Add/remove items with quantity controls
- **Live Total Calculation**: Real-time price updates as cart changes
- **Responsive Design**: Optimized for tablet and kiosk displays

#### 🔧 Backend API
- RESTful API with Express.js
- PostgreSQL database integration
- Secure credential management with environment variables
- Connection pooling for optimal performance
- Comprehensive error handling

### 🚧 Coming Soon
- Employee POS interface for manual checkout
- Manager dashboard with store metrics
- Order history and tracking
- Payment processing integration
- Inventory management
- Sales analytics and reporting

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library with hooks
- **React Router 6.28.0** - Client-side routing
- **Vite 6.0.3** - Build tool and dev server
- **CSS3** - Custom styling with modern layouts

### Backend
- **Node.js** - Runtime environment
- **Express 4.21.2** - Web framework
- **PostgreSQL** - Relational database
- **pg 8.13.1** - PostgreSQL client
- **dotenv 16.4.7** - Environment variable management
- **CORS** - Cross-origin resource sharing

### Development Tools
- **Postman** - API testing
- **Git** - Version control
- **npm** - Package management

## 📁 Project Structure

```
project3_gang_y4/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginScreen.jsx     # Authentication interface
│   │   │   └── CustomerKiosk.jsx   # Main customer checkout
│   │   ├── styles/                 # CSS modules
│   │   ├── App.jsx                 # Root component with routing
│   │   └── main.jsx                # React entry point
│   ├── index.html
│   ├── vite.config.js              # Vite configuration
│   └── package.json
│
├── server/                          # Express backend
│   ├── routes/
│   │   └── menu.js                 # Menu API endpoints
│   ├── db.js                       # Database connection pool
│   ├── index.js                    # Express server setup
│   ├── .env.example                # Environment template
│   └── package.json
│
├── .gitignore                       # Git ignore rules
├── README.md                        # This file
├── SERVER_SETUP.md                  # Backend setup guide
├── POSTMAN_TESTING_GUIDE.md        # API testing documentation
└── Boba_Kiosk_API_Tests.postman_collection.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database access
- **Git** for version control

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

Create a `.env` file in the `server/` directory:

```env
DB_HOST=csce-315-db.engr.tamu.edu
DB_USER=gang_y4
DB_PASSWORD=your_password_here
DB_NAME=gang_y4_db
DB_PORT=5432

PORT=5001
NODE_ENV=development
```

**⚠️ IMPORTANT:** Never commit the `.env` file. It's already in `.gitignore`.

Start the backend server:

```bash
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL database
🚀 Server running on port 5001
```

#### 3. Frontend Setup

In a new terminal:

```bash
cd client
npm install
npm run dev
```

Open your browser to: `http://localhost:3000`

### Database Schema

The application uses the following main tables:

- **menu** - Menu items with name, price, and type
- **customers** - Customer information
- **employees** - Employee records
- **sales** - Transaction history
- **inventory** - Stock management
- **items_per_sales** - Order line items
- **menuinventory** - Menu-inventory relationships

## 📡 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Endpoints

#### Health Check
```http
GET /health
```
Returns server status and timestamp.

#### Get All Menu Items
```http
GET /api/menu
```
Returns flat list of all menu items.

**Response:**
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

#### Get Grouped Menu (Recommended for Frontend)
```http
GET /api/menu/grouped
```
Returns menu items organized by category.

**Response:**
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
  },
  {
    "category": "Seasonal",
    "items": [...]
  }
]
```

#### Get Items by Category
```http
GET /api/menu/category/:type
```
Filter menu items by type (Tea, Slush, Seasonal).

#### Get Single Item
```http
GET /api/menu/:id
```
Retrieve a specific menu item by ID.

### Testing with Postman

Import `Boba_Kiosk_API_Tests.postman_collection.json` into Postman for a complete test suite with 9 requests and 35+ automated tests.

See `POSTMAN_TESTING_GUIDE.md` for detailed testing instructions.

## 💻 Development

### Running in Development Mode

**Backend** (with auto-reload):
```bash
cd server
npm run dev
```

**Frontend** (with hot module replacement):
```bash
cd client
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd client
npm run build
```
Outputs to `client/dist/`

**Backend:**
```bash
cd server
npm start
```

### Code Style

- **React**: Functional components with hooks
- **JavaScript**: ES6+ syntax with modules
- **CSS**: Component-scoped stylesheets
- **API**: RESTful conventions
- **Database**: Parameterized queries (SQL injection protection)

## 🔒 Security Features

✅ Environment variables for sensitive data  
✅ `.gitignore` prevents credential commits  
✅ SQL injection prevention (parameterized queries)  
✅ Connection pooling with timeout limits  
✅ CORS protection configured  
✅ Error handling without exposing internals  

## 🧪 Testing

### API Testing
- Comprehensive Postman collection included
- 9 endpoint tests with automated assertions
- Health checks, data validation, error handling

### Manual Testing Checklist
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] Health endpoint returns 200
- [ ] Menu loads from database
- [ ] Cart operations work correctly
- [ ] Login flow completes
- [ ] Category navigation scrolls properly

## 📝 Environment Variables

### Server (.env)
```env
DB_HOST=           # Database host
DB_USER=           # Database username
DB_PASSWORD=       # Database password
DB_NAME=           # Database name
DB_PORT=           # Database port (default: 5432)
PORT=              # Server port (default: 5001)
NODE_ENV=          # Environment (development/production)
```

## 🤝 Contributing

### For Team Members

1. **Never commit credentials**
   - `.env` is gitignored
   - Use `.env.example` as template
   - Each developer creates their own `.env`

2. **Branch naming convention**
   ```
   feature/description
   bugfix/description
   hotfix/description
   ```

3. **Commit messages**
   ```
   feat: Add customer checkout feature
   fix: Resolve cart calculation bug
   docs: Update API documentation
   style: Format code with prettier
   ```

4. **Pull Request process**
   - Create feature branch
   - Make changes
   - Test thoroughly
   - Submit PR with description
   - Request review from team member

## 🐛 Troubleshooting

### Backend Issues

**"Connection refused" or "ECONNREFUSED"**
- Ensure PostgreSQL database is accessible
- Check if you're on TAMU VPN (required for off-campus)
- Verify credentials in `.env`

**"Port already in use"**
- Change `PORT` in `.env` to another port (e.g., 5001, 5002)
- Update `client/vite.config.js` proxy target to match
- Kill existing process: `lsof -ti:5001 | xargs kill -9`

**"Authentication failed"**
- Double-check password in `.env`
- Ensure no extra spaces in `.env` values
- Verify database user has correct permissions

### Frontend Issues

**"Failed to load menu"**
- Ensure backend is running on correct port
- Check browser console (F12) for errors
- Verify proxy settings in `vite.config.js`
- Test API directly: `curl http://localhost:5001/api/menu`

**Blank screen after login**
- Check backend is returning data
- Open browser DevTools Network tab
- Look for failed API requests
- Check console for JavaScript errors

## 📚 Additional Documentation

- **[SERVER_SETUP.md](SERVER_SETUP.md)** - Detailed backend setup instructions
- **[POSTMAN_TESTING_GUIDE.md](POSTMAN_TESTING_GUIDE.md)** - API testing guide
- **Database Schema** - See project documentation for full schema

## 👥 Team

**Course:** CSCE 331 - Software Engineering  
**Semester:** Fall 2025  
**Section:** 900-911  
**Team:** gang_y4

## 📄 License

This project is part of a university course assignment. All rights reserved.

## 🎯 Project Status

**Current Phase:** Sprint 2 - Customer Interface Implementation  
**Next Phase:** Sprint 3 - Employee POS & Manager Dashboard

### Recent Updates
- ✅ Backend API with PostgreSQL integration
- ✅ Customer self-checkout interface
- ✅ Dynamic menu loading from database
- ✅ Shopping cart functionality
- ✅ Authentication flow (placeholder)
- ✅ API testing suite

### Upcoming Features
- 🔄 Employee POS interface
- 🔄 Manager dashboard with analytics
- 🔄 Real authentication (Google OAuth)
- 🔄 Payment processing
- 🔄 Order history
- 🔄 Inventory management

---

**Built with ❤️ by Team gang_y4 at Texas A&M University**

For questions or issues, please open a GitHub issue or contact the team.

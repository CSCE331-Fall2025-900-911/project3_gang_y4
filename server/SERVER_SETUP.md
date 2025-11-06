# Backend Setup Guide - Secure Database Integration

## 🔐 Security First

Your database credentials are now stored securely using environment variables and **will never be committed to GitHub**.

## 📋 Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

This installs:
- `express` - Web framework
- `pg` - PostgreSQL client
- `dotenv` - Environment variable management
- `cors` - Cross-origin resource sharing

### 2. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cp .env.example .env
```

Then edit `.env` and add your actual password:

```env
DB_HOST=csce-315-db.engr.tamu.edu
DB_USER=gang_y4
DB_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE
DB_NAME=gang_y4_db
DB_PORT=5432

PORT=5000
NODE_ENV=development
```

**⚠️ IMPORTANT:** 
- The `.env` file is already in `.gitignore` and will NOT be committed to GitHub
- Never share your `.env` file or commit it to version control
- Each team member needs to create their own `.env` file locally

### 3. Start the Server

```bash
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL database
Database connection test successful: { now: ... }
🚀 Server running on port 5000
📍 Health check: http://localhost:5000/health
📋 Menu API: http://localhost:5000/api/menu
```

## 🛣️ API Endpoints

### Get All Menu Items (Flat List)
```
GET http://localhost:5000/api/menu
```

Returns:
```json
[
  {
    "menuid": 2,
    "menu_name": "Cold Brew - Medium",
    "price": "4.35",
    "item_type": "Tea"
  },
  ...
]
```

### Get Menu Items Grouped by Category
```
GET http://localhost:5000/api/menu/grouped
```

Returns:
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
      },
      ...
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

### Get Items by Category
```
GET http://localhost:5000/api/menu/category/Tea
GET http://localhost:5000/api/menu/category/Slush
GET http://localhost:5000/api/menu/category/Seasonal
```

### Get Single Item by ID
```
GET http://localhost:5000/api/menu/4
```

## 🔗 Connecting Frontend to Backend

The frontend is already configured to proxy API requests. When running both:

1. Start backend: `cd server && npm run dev` (port 5000)
2. Start frontend: `cd client && npm run dev` (port 3000)

Frontend will automatically proxy `/api/*` requests to `http://localhost:5000`

## 🧪 Testing the API

### Using curl:
```bash
# Health check
curl http://localhost:5000/health

# Get all menu items
curl http://localhost:5000/api/menu

# Get grouped menu
curl http://localhost:5000/api/menu/grouped

# Get specific category
curl http://localhost:5000/api/menu/category/Tea
```

### Using your browser:
Just visit: `http://localhost:5000/api/menu/grouped`

## 📁 Project Structure

```
server/
├── index.js              # Main Express server
├── db.js                 # Database connection pool
├── routes/
│   └── menu.js          # Menu API routes
├── .env                 # YOUR credentials (NOT in git)
├── .env.example         # Template (safe to commit)
└── package.json
```

## 🔒 Security Features

✅ Environment variables for sensitive data  
✅ `.gitignore` prevents committing `.env`  
✅ Connection pooling for performance  
✅ SQL injection prevention (parameterized queries)  
✅ Error handling without exposing internals  
✅ CORS protection  

## 🚨 Common Issues

### "Connection refused"
- Check if the database is accessible from your network
- TAMU VPN may be required for off-campus access

### "Authentication failed"
- Double-check your password in `.env`
- Ensure no extra spaces in `.env` file

### "Cannot find module"
- Run `npm install` in the server directory
- Make sure you're using Node.js 16+

## 📝 Next Steps

1. Update `CustomerKiosk.jsx` to fetch from `/api/menu/grouped` instead of using mock data
2. Add error handling and loading states in the frontend
3. Implement order submission endpoints
4. Add employee and manager authentication routes

## 🤝 Team Collaboration

When sharing code with teammates:
1. ✅ Commit everything EXCEPT `.env`
2. ✅ Share `.env.example` so they know what variables to set
3. ✅ Each person creates their own `.env` with their credentials
4. ✅ Never commit actual passwords or connection strings

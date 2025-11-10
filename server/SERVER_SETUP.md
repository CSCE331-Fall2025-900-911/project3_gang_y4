# Backend Setup Guide 

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
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=5432

PORT=5001
NODE_ENV=development
```

### 3. Start the Server

```bash
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL database
Database connection test successful: { now: ... }
🚀 Server running on port 5001
📍 Health check: http://localhost:5001/health
📋 Menu API: http://localhost:5001/api/menu
```

## 🛣️ API Endpoints

### Get All Menu Items (Flat List)
```
GET http://localhost:5001/api/menu
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
GET http://localhost:5001/api/menu/grouped
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
GET http://localhost:5001/api/menu/category/Tea
GET http://localhost:5001/api/menu/category/Slush
GET http://localhost:5001/api/menu/category/Seasonal
```

### Get Single Item by ID
```
GET http://localhost:5001/api/menu/4
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
curl http://localhost:5001/health

# Get all menu items
curl http://localhost:5001/api/menu

# Get grouped menu
curl http://localhost:5001/api/menu/grouped

# Get specific category
curl http://localhost:5001/api/menu/category/Tea
```

### Using your browser:
Just visit: `http://localhost:5001/api/menu/grouped`

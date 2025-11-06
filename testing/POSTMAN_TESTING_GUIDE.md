# Postman API Testing Guide

## 🚀 Quick Import

I've created a complete Postman collection for you! Import `Boba_Kiosk_API_Tests.postman_collection.json` into Postman.

**To import:**
1. Open Postman
2. Click "Import" (top left)
3. Drag the JSON file or click "Upload Files"
4. Click "Import"
5. Run the entire collection with "Run Collection" button

---

## 📋 Manual Tests (If you prefer to create them yourself)

### 1. **Health Check** ✅
**Purpose:** Verify server is running

```
GET http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-06T03:00:00.000Z"
}
```

**Tests to add in Postman:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has status field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql('OK');
});

pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

---

### 2. **Get All Menu Items** 📋
**Purpose:** Fetch complete menu (flat list)

```
GET http://localhost:5000/api/menu
```

**Expected Response:**
```json
[
  {
    "menuid": 2,
    "menu_name": "Cold Brew - Medium",
    "price": "4.35",
    "item_type": "Tea"
  },
  {
    "menuid": 3,
    "menu_name": "Cold Brew Slush - Medium",
    "price": "6.35",
    "item_type": "Slush"
  }
  // ... more items
]
```

**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is an array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('array');
});

pm.test("Array is not empty", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.length).to.be.above(0);
});

pm.test("Each item has required fields", function () {
    var jsonData = pm.response.json();
    jsonData.forEach(function(item) {
        pm.expect(item).to.have.property('menuid');
        pm.expect(item).to.have.property('menu_name');
        pm.expect(item).to.have.property('price');
        pm.expect(item).to.have.property('item_type');
    });
});
```

---

### 3. **Get Grouped Menu** 🎯
**Purpose:** Fetch menu organized by categories (best for frontend)

```
GET http://localhost:5000/api/menu/grouped
```

**Expected Response:**
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

**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is an array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('array');
});

pm.test("Has Tea, Slush categories", function () {
    var jsonData = pm.response.json();
    var categories = jsonData.map(cat => cat.category);
    pm.expect(categories).to.include.members(['Tea', 'Slush']);
});

pm.test("Each category has items array", function () {
    var jsonData = pm.response.json();
    jsonData.forEach(function(category) {
        pm.expect(category).to.have.property('category');
        pm.expect(category).to.have.property('items');
        pm.expect(category.items).to.be.an('array');
    });
});

pm.test("Price is a number", function () {
    var jsonData = pm.response.json();
    var firstItem = jsonData[0].items[0];
    pm.expect(firstItem.price).to.be.a('number');
});
```

---

### 4. **Get Tea Category** 🍵
**Purpose:** Filter by specific category

```
GET http://localhost:5000/api/menu/category/Tea
```

**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("All items are Tea type", function () {
    var jsonData = pm.response.json();
    jsonData.forEach(function(item) {
        pm.expect(item.item_type).to.eql('Tea');
    });
});
```

---

### 5. **Get Slush Category** 🥤
```
GET http://localhost:5000/api/menu/category/Slush
```

**Tests:**
```javascript
pm.test("All items are Slush type", function () {
    var jsonData = pm.response.json();
    jsonData.forEach(function(item) {
        pm.expect(item.item_type).to.eql('Slush');
    });
});
```

---

### 6. **Get Seasonal Category** 🎃
```
GET http://localhost:5000/api/menu/category/Seasonal
```

**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("All items are Seasonal type", function () {
    var jsonData = pm.response.json();
    if (jsonData.length > 0) {
        jsonData.forEach(function(item) {
            pm.expect(item.item_type).to.eql('Seasonal');
        });
    }
});
```

---

### 7. **Get Specific Item by ID** 🔍
**Purpose:** Fetch single menu item

```
GET http://localhost:5000/api/menu/4
```

**Expected Response:**
```json
{
  "menuid": 4,
  "menu_name": "KF Milk Tea - Medium",
  "price": "4.75",
  "item_type": "Tea"
}
```

**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is an object", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('object');
});

pm.test("Has correct menu ID", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.menuid).to.eql(4);
});
```

---

### 8. **404 Test - Non-existent Item** ❌
**Purpose:** Verify error handling

```
GET http://localhost:5000/api/menu/99999
```

**Expected Response:**
```json
{
  "error": "Menu item not found"
}
```

**Tests:**
```javascript
pm.test("Status code is 404", function () {
    pm.response.to.have.status(404);
});

pm.test("Response has error message", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('error');
});
```

---

### 9. **404 Test - Invalid Route** ❌
```
GET http://localhost:5000/api/nonexistent
```

**Expected Response:**
```json
{
  "error": "Route not found"
}
```

---

## 🎯 Running All Tests Together

### Using Postman Collection Runner:
1. Import the collection
2. Click "Run" button on the collection
3. Select all requests
4. Click "Run Boba Kiosk API Tests"
5. View results dashboard

### Expected Results:
- ✅ 9 requests
- ✅ ~35 passing tests
- ✅ All responses < 500ms
- ✅ 0 failures

---

## 🔍 What Each Test Validates

| Test | Validates |
|------|-----------|
| Health Check | Server is running |
| Get All Menu | Database connection works |
| Grouped Menu | Data transformation logic |
| Category Filters | SQL WHERE clause works |
| Single Item | ID-based queries work |
| 404 Tests | Error handling works |

---

## 💡 Pro Tips

1. **Environment Variables**: Create a Postman environment with:
   ```
   BASE_URL = http://localhost:5000
   ```
   Then use `{{BASE_URL}}/api/menu` in requests

2. **Save Response Data**: In tests, save data for later use:
   ```javascript
   var jsonData = pm.response.json();
   pm.environment.set("first_item_id", jsonData[0].menuid);
   ```

3. **Chain Requests**: Use saved data in next request:
   ```
   GET {{BASE_URL}}/api/menu/{{first_item_id}}
   ```

---

## 🐛 Common Issues & Solutions

**Issue:** Connection refused
- **Fix:** Make sure server is running (`npm run dev`)

**Issue:** 500 Internal Server Error
- **Fix:** Check server logs, likely database connection issue

**Issue:** Empty array returned
- **Fix:** Check database has data: `SELECT COUNT(*) FROM menu;`

**Issue:** CORS error in browser but works in Postman
- **Fix:** This is normal - Postman bypasses CORS. Frontend needs proper CORS headers.

---

## ✅ Success Checklist

Run through these to verify everything works:

- [ ] Health check returns 200
- [ ] All menu endpoint returns array with items
- [ ] Grouped endpoint returns 3 categories (Tea, Slush, Seasonal)
- [ ] Each category endpoint filters correctly
- [ ] Single item lookup returns correct item
- [ ] Invalid ID returns 404
- [ ] Invalid route returns 404
- [ ] All tests pass in collection runner
- [ ] Response times under 500ms

If all checked ✅, your API is ready for frontend integration!

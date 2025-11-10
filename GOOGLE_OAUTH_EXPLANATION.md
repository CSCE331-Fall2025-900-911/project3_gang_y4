# Google OAuth Flow Explanation

## 🔄 Complete Flow Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Clicks "Sign in with Google"
       ▼
┌─────────────────────────┐
│   React App             │
│   (Your Frontend)       │
│                         │
│   - GoogleLogin button  │
│   - Opens Google popup  │
└──────┬──────────────────┘
       │
       │ 2. Redirects to Google
       ▼
┌─────────────────────────┐
│   Google OAuth Server   │
│                         │
│   - User signs in       │
│   - Shows consent       │
│   - Generates tokens    │
└──────┬──────────────────┘
       │
       │ 3. Returns ID Token + Access Token
       ▼
┌─────────────────────────┐
│   React App             │
│   (Your Frontend)       │
│                         │
│   - Receives tokens     │
│   - Decodes ID token    │
│   - Gets user info      │
└──────┬──────────────────┘
       │
       │ 4. (Optional) Send token to backend
       ▼
┌─────────────────────────┐
│   Express Server        │
│   (Your Backend)        │
│                         │
│   - Verifies token      │
│   - Creates/updates user│
│   - Returns user data   │
└──────┬──────────────────┘
       │
       │ 5. Store user in state
       ▼
┌─────────────────────────┐
│   React State           │
│                         │
│   - User logged in      │
│   - Can access app      │
└─────────────────────────┘
```

## 📋 What is an ID Token?

An **ID Token** is a JWT (JSON Web Token) that contains:
```json
{
  "sub": "123456789",           // Google user ID (unique)
  "email": "user@gmail.com",
  "name": "John Doe",
  "picture": "https://...",
  "email_verified": true,
  "iss": "https://accounts.google.com",
  "aud": "your-client-id",
  "exp": 1234567890,            // Expiration time
  "iat": 1234567890             // Issued at
}
```

**Important**: The ID token is **signed by Google**, so you can verify it's authentic.

## 🤔 Do You Need a Users Table?

### **Option 1: NO Users Table (Simple)**

**When to use:**
- Just need to identify users
- Don't need to track orders per user
- Guest checkout is fine
- No user management needed

**Flow:**
```
Google Login → Get user info from token → Store in React state → Done
```

**Pros:**
- ✅ Simple, fast to implement
- ✅ No database changes needed
- ✅ No backend verification needed

**Cons:**
- ❌ Can't link orders to users
- ❌ No order history
- ❌ User info lost on refresh (unless using localStorage)
- ❌ Can't manage users

---

### **Option 2: YES Users Table (Recommended for Kiosk)**

**When to use:**
- Need to track orders per user
- Want order history
- Need user management
- Want analytics per user

**Flow:**
```
Google Login → Get token → Send to backend → 
Backend verifies → Creates/updates user in DB → 
Returns user ID → Store in React state → Done
```

**Database Schema:**
```sql
CREATE TABLE users (
    userid SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,  -- Google's "sub" field
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture_url TEXT,
    user_type VARCHAR(50) DEFAULT 'customer', -- customer, employee, manager
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Then link orders to users:
CREATE TABLE orders (
    orderid SERIAL PRIMARY KEY,
    userid INTEGER REFERENCES users(userid),  -- NULL for guest orders
    total_amount DECIMAL(10, 2),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- ... other order fields
);
```

**Pros:**
- ✅ Track orders per user
- ✅ Order history
- ✅ User management
- ✅ Analytics
- ✅ Persistent user data

**Cons:**
- ❌ More complex
- ❌ Requires backend work
- ❌ Database setup needed

---

## 💻 Implementation Approaches

### **Approach A: Frontend Only (No Users Table)**

**LoginScreen.jsx:**
```jsx
import { useGoogleLogin } from '@react-oauth/google';

const handleGoogleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    // Get user info from Google
    const userInfo = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
    ).then(res => res.json());
    
    // Store in state (no backend call)
    onLogin({
      type: 'google',
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
      googleId: userInfo.sub
    });
    navigate('/customer');
  },
  onError: () => console.error('Login failed')
});
```

**Pros:** Simple, no backend needed  
**Cons:** No persistence, can't track orders

---

### **Approach B: With Backend + Users Table (Recommended)**

**LoginScreen.jsx:**
```jsx
import { useGoogleLogin } from '@react-oauth/google';

const handleGoogleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    // Send ID token to your backend
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: tokenResponse.id_token })
    });
    
    const userData = await response.json();
    
    // Backend returns user from database
    onLogin({
      id: userData.userid,
      type: 'google',
      name: userData.name,
      email: userData.email,
      picture: userData.picture_url
    });
    navigate('/customer');
  }
});
```

**Backend Route (server/routes/auth.js):**
```javascript
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../db.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    // Check if user exists
    let user = await query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );
    
    if (user.rows.length === 0) {
      // Create new user
      const result = await query(
        `INSERT INTO users (google_id, email, name, picture_url, last_login)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING *`,
        [googleId, email, name, picture]
      );
      user = result;
    } else {
      // Update last login
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE google_id = $1',
        [googleId]
      );
    }
    
    res.json({ user: user.rows[0] });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});
```

---

## 🎯 Recommendation for Your Boba Kiosk

**I recommend Option 2 (Users Table)** because:

1. **Order Tracking**: You'll want to link orders to users
2. **Order History**: Customers can see past orders
3. **Manager Features**: Managers need to see user data
4. **Analytics**: Track popular items per user, etc.

**Next Steps:**
1. Create users table in your database
2. Install `google-auth-library` on backend: `npm install google-auth-library`
3. Create `/api/auth/google` endpoint
4. Update LoginScreen to call backend
5. Store user ID (not just name) in React state

---

## 🔐 Security Notes

1. **Always verify tokens on backend** - Don't trust frontend tokens alone
2. **Use HTTPS in production** - Tokens are sensitive
3. **Store Google Client ID in environment variables** - Never commit to git
4. **Validate user data** - Sanitize before storing in database





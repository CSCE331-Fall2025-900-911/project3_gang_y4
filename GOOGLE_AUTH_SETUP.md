# Google OAuth Setup Guide

## ✅ What's Been Implemented

1. **Backend Auth Route** (`server/routes/auth.js`)
   - Handles Google OAuth authentication
   - Creates new users or links to existing users
   - Returns user data from your database

2. **Frontend Integration** (`client/src/components/LoginScreen.jsx`)
   - Google OAuth button with proper flow
   - Fetches user info from Google
   - Sends to backend for verification

3. **App Setup** (`client/src/App.jsx`)
   - Wrapped with `GoogleOAuthProvider`
   - Ready to use Google OAuth

## 📋 Setup Steps

### Step 1: Add `google_id` Column to Your Users Table

Run this SQL in your PostgreSQL database:

```sql
-- Add google_id column (nullable, unique)
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Add index for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);
```

**Important**: The column should be:
- `VARCHAR(255)` or `TEXT`
- `UNIQUE` (one Google account = one user)
- `NULLABLE` (allows regular username/password users)

### Step 2: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** or **Google Identity Services API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production domain (for production)
7. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - Your production domain (for production)
8. Copy the **Client ID**

### Step 3: Add Google Client ID to Environment Variables

**Frontend** (`client/.env` or `client/.env.local`):
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

**Backend** (`server/.env`):
```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

**Note**: The frontend uses `VITE_` prefix because Vite only exposes env vars that start with `VITE_`.

### Step 4: Update Database Schema in Code (if needed)

Check `server/routes/auth.js` around line 84-88. Make sure the INSERT statement matches your exact table schema:

```javascript
// Current implementation assumes:
// - id (auto-generated)
// - username
// - email
// - password (can be NULL for Google users)
// - google_id

// If your table has different columns, update the INSERT statement:
const insertResult = await query(
  `INSERT INTO users (username, email, google_id, password)
   VALUES ($1, $2, $3, NULL)
   RETURNING *`,
  [finalUsername, email, googleId]
);
```

**If your table has additional required columns**, add them to the INSERT statement.

## 🔄 How It Works

### Flow Diagram

```
1. User clicks "Sign in with Google"
   ↓
2. Google popup opens, user signs in
   ↓
3. Google returns access_token
   ↓
4. Frontend uses access_token to get user info from Google API
   ↓
5. Frontend sends { googleId, email, name, picture } to /api/auth/google
   ↓
6. Backend checks:
   - Does user exist with this google_id? → Return existing user
   - Does user exist with this email? → Link google_id to existing account
   - New user? → Create new user with google_id
   ↓
7. Backend returns user data from database
   ↓
8. Frontend stores user in React state
   ↓
9. User is logged in!
```

### Database Logic

The backend handles three scenarios:

1. **Existing Google User**: User has signed in with Google before
   - Finds user by `google_id`
   - Returns existing user record

2. **Linking Account**: User exists with same email but different auth method
   - Finds user by `email`
   - Updates `google_id` column
   - User can now sign in with either method

3. **New User**: First time signing in with Google
   - Creates new user record
   - Generates username from email
   - Sets `password` to NULL (they use Google to authenticate)

## 🧪 Testing

1. **Start your servers**:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

2. **Test Google Login**:
   - Go to `http://localhost:3000`
   - Click "Sign in with Google"
   - Sign in with a Google account
   - Should redirect to `/customer` page

3. **Check Database**:
   ```sql
   -- See all Google-authenticated users
   SELECT id, username, email, google_id FROM users WHERE google_id IS NOT NULL;
   ```

## 🔧 Customization

### If Your Users Table Has Different Columns

Edit `server/routes/auth.js`:

1. **Update the INSERT statement** (line ~84) to match your schema
2. **Update the SELECT statements** if column names differ
3. **Add any required columns** that your table needs

Example if you have a `user_type` column:
```javascript
const insertResult = await query(
  `INSERT INTO users (username, email, google_id, password, user_type)
   VALUES ($1, $2, $3, NULL, 'customer')
   RETURNING *`,
  [finalUsername, email, googleId]
);
```

### If You Want to Store Name and Picture

1. Add columns to your database:
   ```sql
   ALTER TABLE users ADD COLUMN name VARCHAR(255);
   ALTER TABLE users ADD COLUMN picture_url TEXT;
   ```

2. Update the INSERT statement in `auth.js`:
   ```javascript
   const insertResult = await query(
     `INSERT INTO users (username, email, google_id, password, name, picture_url)
      VALUES ($1, $2, $3, NULL, $4, $5)
      RETURNING *`,
     [finalUsername, email, googleId, name || null, picture || null]
   );
   ```

## 🐛 Troubleshooting

### "Google sign-in was cancelled or failed"
- User closed the popup or denied permission
- Check browser console for details

### "Authentication failed"
- Check backend logs for error details
- Verify `GOOGLE_CLIENT_ID` is set correctly
- Make sure `google_id` column exists in database

### "User with this email or Google ID already exists"
- Database constraint violation
- Check for duplicate `google_id` or `email` values

### Button doesn't open Google popup
- Check that `VITE_GOOGLE_CLIENT_ID` is set in frontend `.env`
- Restart the dev server after adding env vars
- Verify Google Client ID is correct

## 📝 Next Steps

- [ ] Add `google_id` column to database
- [ ] Get Google OAuth credentials
- [ ] Add Client ID to `.env` files
- [ ] Test Google login
- [ ] Customize INSERT statement if needed
- [ ] (Optional) Add name/picture columns if desired






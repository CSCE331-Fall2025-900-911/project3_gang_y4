# Database Migrations

This directory contains database migration scripts for the Boba POS system.

## Migration: Fix Data Issues and Add transaction_time

This migration performs data cleanup and adds the `transaction_time` field to all existing orders.

### Tasks Performed

**Task 1: Fix Orders 5 and 6 Data Issues**
- Fix `customer_id = 'Guest'` → `customer_id = 0` (integer for guest customers)
- Fix `employee_id = NULL` → `employee_id = 0` (self-service kiosk)
- Fix incorrect subtotal/tax/total for order 5

**Task 2 & 3: Backfill transaction_time**
- Add `transaction_time` field to `order_details` JSON for all orders 1-7
- Uses existing `order_date` value in ISO 8601 format

### Running the Migration

#### Option 1: Using Node.js (Recommended)

From the server directory:

```bash
cd server
node migrations/run_backfill.js
```

This will:
- Fix data issues in orders 5-6
- Backfill transaction_time for orders 1-7
- Display a verification table showing all updates

#### Option 2: Using psql

If you prefer to run SQL directly:

```bash
psql -h csce-315-db.engr.tamu.edu -U <username> -d gang_y4_db -f server/migrations/backfill_transaction_time.sql
```

### Expected Output

```
🔄 Starting migration for orders 1-7...

📝 Task 1: Fixing data issues in orders 5-6...
   ✓ Fixed customer_id for 1 order(s)
   ✓ Fixed employee_id for 2 order(s)
   ✓ Fixed subtotal/tax/total for 1 order(s)

📝 Task 2 & 3: Backfilling transaction_time...
   ✓ Added transaction_time to 7 order(s)

📋 Verifying migration results:

Order | Cust | Emp | Subtotal | Tax  | Total  | Transaction Time
------|------|-----|----------|------|--------|------------------
   1  |    X |   X | $   X.XX | $X.XX | $X.XX | "2025-11-18T..."
   ...

✅ Migration completed successfully!
```

### Prerequisites

- Database access to `csce-315-db.engr.tamu.edu`
- Valid credentials in `.env` file or environment variables
- Connection to TAMU network (VPN if remote)

### Notes

- This migration is **idempotent** - safe to run multiple times
- The script uses `WHERE` clauses to only update records that need fixing
- All new orders created after this migration will automatically include `transaction_time`

---

## Migration: Fix Customer Sequence (Required for Google OAuth)

This migration fixes the `customers_customerid_seq` sequence to prevent duplicate primary key errors when creating new customer accounts via Google OAuth.

### Problem

When the database sequence gets out of sync with the actual data (often from manual INSERTs or data imports), new customer creation attempts fail with:

```
ERROR: duplicate key value violates unique constraint "customers_pkey"
```

This causes all Google OAuth sign-ins to fall back to guest checkout (customer_id = 0) instead of creating/using their customer account.

### Solution

Reset the sequence to match the highest `customerid` currently in the table:

```sql
SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(customerid), 0) FROM customers));
```

### Running the Migration

#### Option 1: Using Node.js (Recommended)

From the server directory:

```bash
cd server
node migrations/run_fix_sequence.js
```

This will:
- Show current sequence value vs max customerid
- Reset sequence to correct value
- Verify the fix
- Display next customerid that will be used

#### Option 2: Using psql

```bash
psql -h csce-315-db.engr.tamu.edu -U <username> -d gang_y4_db -f server/migrations/fix_customer_sequence.sql
```

### Expected Output

```
🔄 Fixing customers table sequence...

📊 Current state:
   Sequence value: 5 (is_called: true)
   Max customerid: 12
   Total customers: 8

🔧 Resetting sequence...

✅ After fix:
   Sequence value: 12
   Next value will be: 13

✅ Sequence fixed successfully!
   New customer inserts will now use customerid starting from 13
```

### When to Run

Run this migration if you see:
- "duplicate key value violates unique constraint customers_pkey" errors in server logs
- Google OAuth customers being created as guest (customer_id = 0)
- Failed customer account creation despite valid email/name

### Notes

- **Run this BEFORE testing Google OAuth customer creation**
- Safe to run multiple times - will always sync to current max value
- Should be run after any manual data imports or customer table modifications
- This fix is automatic on modern PostgreSQL SERIAL columns, but may be needed if data was manually inserted

---

## Migration: Add Unique Constraint on Customer Email

This migration adds a unique constraint on the `customers.username` column to prevent duplicate customer records from Google OAuth sign-ins.

### Problem

React 18 Strict Mode (in development) runs useEffect hooks twice, causing duplicate API calls. Combined with race conditions, this can create multiple customer records with the same email:

```
customerid 79: jeffrey.baker@tamu.edu, password: %zpKDDtA&K
customerid 80: jeffrey.baker@tamu.edu, password: D79Evx*3g5
```

### Solution

Add a unique constraint so the database prevents duplicate emails:

```sql
ALTER TABLE customers ADD CONSTRAINT customers_username_unique UNIQUE (username);
```

The backend will handle duplicate key errors gracefully by:
1. Catching error code `23505` (unique violation)
2. Retrying the SELECT to fetch the existing customer
3. Returning the existing customer data

The frontend prevents duplicate calls using a ref flag:
- Checks if fetch is already in progress
- Skips duplicate calls from React Strict Mode
- Clears flag when fetch completes

### Running the Migration

#### Option 1: Using Node.js (Recommended)

From the server directory:

```bash
cd server
node migrations/run_add_unique_constraint.js
```

This will:
- Check if constraint already exists (skip if so)
- Check for existing duplicate usernames
- Add unique constraint if no duplicates exist
- Verify constraint was added successfully

#### Option 2: Using psql

```bash
psql -h csce-315-db.engr.tamu.edu -U <username> -d gang_y4_db -f server/migrations/add_customer_email_unique.sql
```

### Expected Output

```
🔄 Adding unique constraint on customers.username...

📊 Checking for existing constraint...
🔍 Checking for duplicate usernames...
✅ No duplicates found

🔧 Adding unique constraint...
✅ Unique constraint added successfully!

📋 Constraint details:
   Name: customers_username_unique
   Definition: UNIQUE (username)

✅ Migration completed successfully!
   Database will now prevent duplicate customer emails.
```

### If Duplicates Exist

If the migration finds duplicate usernames, you must resolve them manually:

```sql
-- Find all duplicates
SELECT * FROM customers
WHERE username IN (
  SELECT username FROM customers
  GROUP BY username
  HAVING COUNT(*) > 1
)
ORDER BY username, customerid;

-- Keep the first record, delete duplicates
DELETE FROM customers
WHERE customerid IN (
  SELECT customerid FROM (
    SELECT customerid,
           ROW_NUMBER() OVER (PARTITION BY username ORDER BY customerid) as rn
    FROM customers
  ) t
  WHERE rn > 1
);
```

After resolving duplicates, re-run the migration.

### Notes

- **Run this BEFORE allowing new Google OAuth sign-ins**
- Safe to run multiple times - checks if constraint exists
- Backend code handles race conditions gracefully
- Frontend code prevents duplicate calls with ref flag
- This prevents data integrity issues from React Strict Mode

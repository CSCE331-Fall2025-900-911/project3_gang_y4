// Migration script: Add unique constraint on customer username (email)
import { query } from '../db.js';

async function addUniqueConstraint() {
  try {
    console.log('🔄 Adding unique constraint on customers.username...\n');

    // Check if constraint already exists
    console.log('📊 Checking for existing constraint...');
    const checkConstraint = await query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'customers'::regclass
        AND conname = 'customers_username_unique'
    `);

    if (checkConstraint.rows.length > 0) {
      console.log('✅ Unique constraint already exists! No action needed.\n');
      process.exit(0);
    }

    // Check for duplicate usernames before adding constraint
    console.log('🔍 Checking for duplicate usernames...');
    const duplicates = await query(`
      SELECT username, COUNT(*) as count
      FROM customers
      GROUP BY username
      HAVING COUNT(*) > 1
    `);

    if (duplicates.rows.length > 0) {
      console.log('⚠️  Found duplicate usernames:');
      duplicates.rows.forEach(row => {
        console.log(`   - ${row.username}: ${row.count} records`);
      });
      console.log('\n❌ Cannot add unique constraint with existing duplicates.');
      console.log('   Please manually resolve duplicates first.\n');
      console.log('   Suggested SQL to find duplicates:');
      console.log('   SELECT * FROM customers WHERE username IN (');
      console.log('     SELECT username FROM customers GROUP BY username HAVING COUNT(*) > 1');
      console.log('   ) ORDER BY username, customerid;\n');
      process.exit(1);
    }

    console.log('✅ No duplicates found\n');

    // Add unique constraint
    console.log('🔧 Adding unique constraint...');
    await query(`
      ALTER TABLE customers
      ADD CONSTRAINT customers_username_unique UNIQUE (username)
    `);

    console.log('✅ Unique constraint added successfully!\n');

    // Verify
    const verify = await query(`
      SELECT
        conname as constraint_name,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'customers'::regclass
        AND conname = 'customers_username_unique'
    `);

    if (verify.rows.length > 0) {
      console.log('📋 Constraint details:');
      console.log(`   Name: ${verify.rows[0].constraint_name}`);
      console.log(`   Definition: ${verify.rows[0].definition}\n`);
    }

    console.log('✅ Migration completed successfully!');
    console.log('   Database will now prevent duplicate customer emails.\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error adding unique constraint:', error);

    if (error.code === '23505') {
      console.error('\n   Error: Duplicate key violation');
      console.error('   There are duplicate usernames in the table.');
      console.error('   Please resolve duplicates before adding constraint.\n');
    }

    process.exit(1);
  }
}

addUniqueConstraint();

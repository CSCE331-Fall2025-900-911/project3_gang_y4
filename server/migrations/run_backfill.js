// Migration script: Fix data issues and backfill transaction_time for orders 1-7
import { query } from '../db.js';

async function runMigration() {
  try {
    console.log('🔄 Starting migration for orders 1-7...\n');

    // Task 1: Fix orders 5 and 6 data issues
    console.log('📝 Task 1: Fixing data issues in orders 5-6...');

    // Fix customer_id = 'Guest' to customer_id = 0
    const fixCustomer = await query(
      `UPDATE sales_orders
       SET customer_id = 0
       WHERE order_id = 5 AND customer_id = 'Guest'`,
      []
    );
    console.log(`   ✓ Fixed customer_id for ${fixCustomer.rowCount} order(s)`);

    // Fix employee_id NULL to employee_id = 0
    const fixEmployee = await query(
      `UPDATE sales_orders
       SET employee_id = 0
       WHERE order_id IN (5, 6) AND employee_id IS NULL`,
      []
    );
    console.log(`   ✓ Fixed employee_id for ${fixEmployee.rowCount} order(s)`);

    // Fix incorrect subtotal/tax/total for order 5
    const fixAmounts = await query(
      `UPDATE sales_orders
       SET subtotal = 9.50, tax = 0.78, total = 10.28
       WHERE order_id = 5`,
      []
    );
    console.log(`   ✓ Fixed subtotal/tax/total for ${fixAmounts.rowCount} order(s)`);

    // Task 2 & 3: Backfill transaction_time
    console.log('\n📝 Task 2 & 3: Backfilling transaction_time...');
    const backfillResult = await query(
      `UPDATE sales_orders
       SET order_details = jsonb_set(
         order_details,
         '{transaction_time}',
         to_jsonb(order_date::text)
       )
       WHERE order_id <= 7`,
      []
    );
    console.log(`   ✓ Added transaction_time to ${backfillResult.rowCount} order(s)`);

    // Verify all updates
    console.log('\n📋 Verifying migration results:\n');
    const verifyResult = await query(
      `SELECT
         order_id,
         customer_id,
         employee_id,
         subtotal,
         tax,
         total,
         order_date,
         order_details->'transaction_time' as transaction_time
       FROM sales_orders
       WHERE order_id <= 7
       ORDER BY order_id`,
      []
    );

    console.log('Order | Cust | Emp | Subtotal | Tax  | Total  | Transaction Time');
    console.log('------|------|-----|----------|------|--------|------------------');
    verifyResult.rows.forEach(row => {
      console.log(
        `  ${String(row.order_id).padStart(2)}  | ` +
        `${String(row.customer_id).padStart(4)} | ` +
        `${String(row.employee_id).padStart(3)} | ` +
        `$${String(row.subtotal).padStart(7)} | ` +
        `$${String(row.tax).padStart(4)} | ` +
        `$${String(row.total).padStart(5)} | ` +
        `${row.transaction_time}`
      );
    });

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

runMigration();

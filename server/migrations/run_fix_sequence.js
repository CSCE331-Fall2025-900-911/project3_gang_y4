// Migration script: Fix customerid sequence to prevent duplicate key errors
import { query } from '../db.js';

async function fixSequence() {
  try {
    console.log('🔄 Fixing customers table sequence...\n');

    // Get current state before fix
    console.log('📊 Current state:');
    const beforeSeq = await query('SELECT last_value, is_called FROM customers_id_seq');
    const beforeMax = await query('SELECT COALESCE(MAX(customerid), 0) as max_id, COUNT(*) as total FROM customers');

    console.log(`   Sequence value: ${beforeSeq.rows[0].last_value} (is_called: ${beforeSeq.rows[0].is_called})`);
    console.log(`   Max customerid: ${beforeMax.rows[0].max_id}`);
    console.log(`   Total customers: ${beforeMax.rows[0].total}`);

    // Check if sequence is out of sync
    const sequenceValue = parseInt(beforeSeq.rows[0].last_value);
    const maxId = parseInt(beforeMax.rows[0].max_id);

    if (sequenceValue >= maxId) {
      console.log('\n✅ Sequence is already in sync! No fix needed.');
      console.log(`   Sequence (${sequenceValue}) >= Max ID (${maxId})`);
      console.log(`   Next customerid will be: ${sequenceValue + 1}`);
    } else {
      console.log(`\n⚠️  Sequence is OUT OF SYNC!`);
      console.log(`   Sequence: ${sequenceValue}, Max ID: ${maxId}`);
      console.log(`   Gap: ${maxId - sequenceValue} IDs behind`);

      // Reset sequence to max customerid
      console.log('\n🔧 Resetting sequence...');
      await query(`SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(customerid), 0) FROM customers))`);

      // Verify fix
      console.log('\n✅ After fix:');
      const afterSeq = await query('SELECT last_value, is_called FROM customers_id_seq');
      console.log(`   Sequence value: ${afterSeq.rows[0].last_value}`);
      console.log(`   Next value will be: ${afterSeq.rows[0].last_value + 1}`);

      console.log('\n✅ Sequence fixed successfully!');
      console.log('   New customer inserts will now use customerid starting from', afterSeq.rows[0].last_value + 1);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing sequence:', error);
    process.exit(1);
  }
}

fixSequence();

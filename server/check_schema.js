import { query } from './db.js';

async function checkSchema() {
    try {
        const res = await query(`
      SELECT data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'menuinventory' AND column_name = 'quantity'
    `);
        console.log('Schema for menuinventory.quantity:', res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();

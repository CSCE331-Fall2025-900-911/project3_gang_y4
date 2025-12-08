import { query } from './db.js';

async function verifyMenuDependencies() {
    console.log('🧪 Starting Menu Dependencies Verification...');

    try {
        // 1. Get a test menu item and inventory item
        const menuRes = await query('SELECT menuid, menu_name FROM menu LIMIT 1');
        const invRes = await query('SELECT ingredientid, item_name FROM inventory LIMIT 1');

        if (menuRes.rows.length === 0 || invRes.rows.length === 0) {
            console.error('❌ Error: Could not find a menu item or inventory item to test with.');
            process.exit(1);
        }

        const menuId = menuRes.rows[0].menuid;
        const menuName = menuRes.rows[0].menu_name;
        const invId = invRes.rows[0].ingredientid;
        const invName = invRes.rows[0].item_name;

        console.log(`📝 Testing with Menu Item: "${menuName}" (ID: ${menuId}) and Inventory Item: "${invName}" (ID: ${invId})`);

        // 2. Add Dependency (Upsert) - Initial Add
        console.log('🔹 Step 1: Adding dependency (Quantity: 10)...');
        await query(
            `INSERT INTO menuinventory (menuid, inventoryid, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (menuid, inventoryid)
       DO UPDATE SET quantity = $3`,
            [menuId, invId, 10]
        );

        // Verify
        let check = await query('SELECT quantity FROM menuinventory WHERE menuid = $1 AND inventoryid = $2', [menuId, invId]);
        if (check.rows.length > 0 && parseFloat(check.rows[0].quantity) === 10) {
            console.log('✅ Success: Dependency added with quantity 10.');
        } else {
            console.error('❌ Failed: Dependency not added correctly.', check.rows);
        }

        // 3. Update Dependency (Upsert) - Change Quantity
        console.log('🔹 Step 2: Updating dependency (Quantity: 20)...');
        await query(
            `INSERT INTO menuinventory (menuid, inventoryid, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (menuid, inventoryid)
       DO UPDATE SET quantity = $3`,
            [menuId, invId, 20]
        );

        // Verify
        check = await query('SELECT quantity FROM menuinventory WHERE menuid = $1 AND inventoryid = $2', [menuId, invId]);
        if (check.rows.length > 0 && parseFloat(check.rows[0].quantity) === 20) {
            console.log('✅ Success: Dependency updated to quantity 20.');
        } else {
            console.error('❌ Failed: Dependency not updated correctly.', check.rows);
        }

        // 4. Remove Dependency
        console.log('🔹 Step 3: Removing dependency...');
        await query('DELETE FROM menuinventory WHERE menuid = $1 AND inventoryid = $2', [menuId, invId]);

        // Verify
        check = await query('SELECT quantity FROM menuinventory WHERE menuid = $1 AND inventoryid = $2', [menuId, invId]);
        if (check.rows.length === 0) {
            console.log('✅ Success: Dependency removed.');
        } else {
            console.error('❌ Failed: Dependency still exists.', check.rows);
        }

        console.log('🎉 Verification Complete!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
        process.exit(1);
    }
}

verifyMenuDependencies();

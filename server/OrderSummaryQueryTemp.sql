-- Receipt-style view showing orders grouped together
SELECT 
    s.salesid as "Order #",
    TO_CHAR(s.sale_date, 'MM/DD/YYYY HH12:MI AM') as "Date & Time",
    STRING_AGG(
        m.menu_name || ' x' || ips.quantity || ' @ $' || m.price || ' = $' || (ips.quantity * m.price),
        E'\n        '
    ) as "Items",
    '$' || s.price as "Order Total"
FROM sales s
JOIN customers c ON s.custid = c.customerid
JOIN items_per_sales ips ON s.salesid = ips.saleid
JOIN menu m ON ips.itemid = m.menuid
WHERE c.username = 'JCake'
GROUP BY s.salesid, s.sale_date, s.price
ORDER BY s.sale_date DESC;

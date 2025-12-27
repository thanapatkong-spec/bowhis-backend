const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3005;

// ==========================================
// 🛡️ Security & Config
// ==========================================
const corsOptions = {
  origin: [
    'http://localhost:56646',                        // เครื่องคุณ (Localhost Flutter)
    'http://localhost:3000',                         // Web Browser Localhost
    'https://cheerful-hummingbird-de9e1f.netlify.app' // 👈 เว็บจริง Netlify
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const router = express.Router();
app.use('/api', router);

// ==========================================
// 🛠️ Master Data (Units & Roles)
// ==========================================
router.get('/units', async (req, res) => {
    try {
        const units = await prisma.masterUnit.findMany();
        res.json(units.map(u => u.name));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/units', async (req, res) => {
    if (!req.body.unit) return res.status(400).json({ error: "ชื่อหน่วยห้ามว่าง" });
    try {
        await prisma.masterUnit.create({ data: { name: req.body.unit } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/units', async (req, res) => {
    try {
        await prisma.masterUnit.deleteMany({ where: { name: req.body.unit } }); 
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/staff-roles', async (req, res) => {
    try {
        const roles = await prisma.staffRole.findMany();
        res.json(roles);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/staff-roles', async (req, res) => {
    if (!req.body.name) return res.status(400).json({ error: "ชื่อตำแหน่งห้ามว่าง" });
    try {
        await prisma.staffRole.create({ data: { name: req.body.name } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/staff-roles/:id', async (req, res) => {
    try {
        await prisma.staffRole.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 📦 Inventory & Stock
// ==========================================
router.get('/inventory', async (req, res) => {
    try {
        const items = await prisma.inventory.findMany({
            include: { ingredients: { include: { child: true } } }
        });
        const formatted = items.map(i => ({
            ...i,
            price: parseFloat(i.price),
            stock: i.stock,
            is_composite: i.isComposite,
            sale_deduct_qty: parseFloat(i.saleDeductQty || 1),
            ingredients: i.ingredients.map(ing => ({
                id: ing.childId,
                name: ing.child.name,
                qty_needed: ing.quantity
            }))
        }));
        res.json(formatted);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/inventory', async (req, res) => {
    try {
        const body = req.body;
        // Validation
        if (!body.name) return res.status(400).json({ success: false, message: "ชื่อสินค้าห้ามว่าง" });

        await prisma.inventory.create({
            data: {
                name: body.name, 
                sku: body.barcode || "", // Default empty string if null
                price: parseFloat(body.price || 0), 
                stock: parseInt(body.stock || 0),
                unitLevel1: body.unit_level1, 
                unitLevel2: body.unit_level2,
                ratio2: parseInt(body.unit_ratio_2 || 0),
                unitLevel3: body.unit_level3, 
                ratio3: parseInt(body.unit_ratio_3 || 0),
                saleDeductQty: parseFloat(body.sale_deduct_qty || 1),
                saleDeductUnit: body.sale_deduct_unit,
                isComposite: body.is_composite,
                ingredients: {
                    create: body.ingredients?.map(ing => ({
                        childId: parseInt(ing.id), 
                        quantity: parseFloat(ing.qty_needed)
                    })) || []
                }
            }
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/inventory/:id', async (req, res) => {
    try {
        const body = req.body;
        const id = parseInt(req.params.id);

        // ✅ Integrity: ใช้ Transaction เพื่อความปลอดภัยของข้อมูล
        await prisma.$transaction([
            // 1. ลบส่วนผสมเดิม
            prisma.inventoryIngredient.deleteMany({ where: { parentId: id } }),
            // 2. อัปเดตข้อมูลและสร้างส่วนผสมใหม่
            prisma.inventory.update({
                where: { id: id },
                data: {
                    name: body.name, 
                    sku: body.barcode,
                    price: parseFloat(body.price || 0), 
                    stock: parseInt(body.stock || 0),
                    unitLevel1: body.unit_level1, 
                    unitLevel2: body.unit_level2,
                    ratio2: parseInt(body.unit_ratio_2 || 0),
                    unitLevel3: body.unit_level3, 
                    ratio3: parseInt(body.unit_ratio_3 || 0),
                    saleDeductQty: parseFloat(body.saleDeductQty || 1), // ใช้ชื่อ field ให้ตรงกับ Prisma Schema
                    saleDeductUnit: body.saleDeductUnit,
                    isComposite: body.is_composite,
                    ingredients: {
                        create: body.ingredients?.map(ing => ({
                            childId: parseInt(ing.id), 
                            quantity: parseFloat(ing.qty_needed)
                        })) || []
                    }
                }
            })
        ]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/inventory/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.$transaction([
            prisma.inventoryIngredient.deleteMany({ where: { parentId: id } }),
            prisma.inventory.delete({ where: { id: id } })
        ]);
        res.json({success:true});
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 📜 Stock Logs
// ==========================================
router.post('/stock/in', async (req, res) => {
    const { product_id, qty, note } = req.body;
    try {
        await prisma.$transaction([
            prisma.inventory.update({ where: { id: parseInt(product_id) }, data: { stock: { increment: parseInt(qty) } } }),
            prisma.stockLog.create({ data: { action: 'IN', quantity: parseInt(qty), reason: note, inventoryId: parseInt(product_id) } })
        ]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/stock/out', async (req, res) => {
    const { product_id, qty, note } = req.body;
    try {
        await prisma.$transaction([
            prisma.inventory.update({ where: { id: parseInt(product_id) }, data: { stock: { decrement: parseInt(qty) } } }),
            prisma.stockLog.create({ data: { action: 'OUT', quantity: parseInt(qty), reason: note, inventoryId: parseInt(product_id) } })
        ]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stock-history', async (req, res) => {
    try {
        const logs = await prisma.stockLog.findMany({
            include: { inventory: true },
            orderBy: { createdAt: 'desc' }
        });
        const formatted = logs.map(log => ({
            id: log.id,
            type: log.action,
            qty: log.quantity,
            date: log.createdAt,
            product_name: log.inventory?.name || "Unknown",
            tx_id: log.reason, 
            note: log.reason
        }));
        res.json(formatted);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 👥 Customers (Fixed Mapping)
// ==========================================
router.get('/customers', async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({ include: { pets: true } });
        res.json(customers);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/customers', async (req, res) => {
    const body = req.body;
    if (!body.name) return res.status(400).json({ error: "ชื่อลูกค้าห้ามว่าง" });
    
    try {
        await prisma.customer.create({
            data: {
                name: body.name, 
                // ✅ Fix: รองรับทั้ง contactInfo (ใหม่) และ tel (เก่า) เพื่อความชัวร์
                contactInfo: body.contactInfo || body.tel || "", 
                points: parseInt(body.points || 0),
                birthDate: body.birthDate ? new Date(body.birthDate) : null,
                pets: { create: body.pets?.map(p => ({ 
                    name: p.name, 
                    species: p.species || 'Unknown', 
                    breed: p.breed, 
                    medical: p.medical, 
                    photoUrl: p.photoUrl 
                })) || [] }
            }
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/customers/:id', async (req, res) => {
    const body = req.body;
    try {
        await prisma.customer.update({ 
            where: { id: parseInt(req.params.id) }, 
            data: { 
                name: req.body.name, 
                // ✅ Fix: Mapping ให้ถูกต้องเหมือนขา create
                contactInfo: body.contactInfo || body.tel, 
                points: parseInt(body.points || 0)
            } 
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/customers/:id', async (req, res) => {
    try {
        await prisma.$transaction([
            prisma.pet.deleteMany({ where: { ownerId: parseInt(req.params.id) } }),
            prisma.customer.delete({ where: { id: parseInt(req.params.id) } })
        ]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/customers/:id/history', async (req, res) => {
    try {
        const txs = await prisma.transaction.findMany({
            where: { customerId: parseInt(req.params.id) },
            include: { items: { include: { inventory: true } } },
            orderBy: { timestamp: 'desc' }
        });
        const total = txs.reduce((sum, t) => sum + parseFloat(t.total), 0);
        res.json({ success: true, summary: { total_spent: total, total_orders: txs.length }, transactions: txs });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 🏥 Resources
// ==========================================
router.get('/resources', async (req, res) => {
    try {
        const resources = await prisma.resource.findMany();
        res.json(resources);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/resources', async (req, res) => {
    try {
        await prisma.resource.create({ data: { 
            name: req.body.name, type: req.body.type, roleId: req.body.roleId ? parseInt(req.body.roleId) : null 
        }});
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/resources/:id', async (req, res) => {
    try {
        await prisma.resource.update({ where: { id: parseInt(req.params.id) }, data: req.body });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/resources/:id', async (req, res) => {
    try {
        await prisma.resource.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 📅 Bookings
// ==========================================
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: { customer: true, pet: true, service: true, staff: true, room: true }
        });
        res.json(bookings);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/bookings', async (req, res) => {
    const body = req.body;
    const start = new Date(body.startTime);
    const end = new Date(body.endTime);

    try {
        // 1. Check Conflict
        const conflict = await prisma.booking.findFirst({
            where: {
                OR: [
                    { staffId: body.staffId ? parseInt(body.staffId) : undefined },
                    { roomId: body.roomId ? parseInt(body.roomId) : undefined }
                ],
                status: { not: 'Cancelled' },
                AND: [
                    { startTime: { lt: end } },
                    { endTime: { gt: start } }
                ]
            }
        });

        if (conflict) {
            return res.status(409).json({ success: false, message: 'ช่วงเวลาชนกับนัดหมายอื่น (พนักงานหรือห้องไม่ว่าง)' });
        }

        // 2. Save
        await prisma.booking.create({
            data: {
                customerId: parseInt(body.customerId), 
                petId: parseInt(body.petId), 
                serviceId: parseInt(body.serviceId),
                staffId: body.staffId ? parseInt(body.staffId) : null,
                roomId: body.roomId ? parseInt(body.roomId) : null,
                startTime: start, 
                endTime: end,
                status: body.status || 'Confirmed'
            }
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/bookings/:id', async (req, res) => {
    const body = req.body;
    try {
        const updateData = { status: body.status };
        if (body.actualStartTime) updateData.actualStart = new Date(body.actualStartTime);
        if (body.actualEndTime) updateData.actualEnd = new Date(body.actualEndTime);
        
        await prisma.booking.update({ where: { id: parseInt(req.params.id) }, data: updateData });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 🛒 POS & Checkout (Transaction Integrity)
// ==========================================
router.post('/orders', async (req, res) => {
    const { items, total, customerId, customerName, paymentType, receiptType, taxInfo } = req.body;
    
    // Validation
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: "ไม่มีสินค้าในตะกร้า" });

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction
            const newTx = await tx.transaction.create({
                data: {
                    total: parseFloat(total), 
                    paymentType, 
                    receiptType,
                    taxInfo: taxInfo ? JSON.stringify(taxInfo) : null,
                    customerId: customerId ? parseInt(customerId) : null,
                    customerName: customerName,
                    timestamp: new Date()
                }
            });

            // 2. Process Items & Deduct Stock
            for (const item of items) {
                const qtySold = parseInt(item.qty);
                const itemId = parseInt(item.id);

                await tx.transactionItem.create({
                    data: {
                        transactionId: newTx.id,
                        inventoryId: itemId,
                        name: item.name,
                        quantity: qtySold,
                        price: parseFloat(item.price),
                        petId: item.petId ? parseInt(item.petId) : null,
                        petName: item.petName,
                        staffId: item.staffId ? parseInt(item.staffId) : null,
                        roomId: item.roomId ? parseInt(item.roomId) : null,
                    }
                });

                // Stock Logic
                const product = await tx.inventory.findUnique({ where: { id: itemId }, include: { ingredients: true } });
                
                if (product) {
                    if (product.isComposite && product.ingredients.length > 0) {
                        for (const ing of product.ingredients) {
                            const totalDeduct = ing.quantity * qtySold;
                            await tx.inventory.update({ where: { id: ing.childId }, data: { stock: { decrement: totalDeduct } } });
                            
                            // Log Ingredient Deduction
                            await tx.stockLog.create({ 
                                data: { action: 'SALE', quantity: Math.round(totalDeduct), reason: `Sold via TX #${newTx.id}`, inventoryId: ing.childId } 
                            });
                        }
                    } else {
                        const deduct = parseFloat(product.saleDeductQty || 1) * qtySold;
                        await tx.inventory.update({ where: { id: itemId }, data: { stock: { decrement: deduct } } });
                        
                        // Log Item Deduction
                        await tx.stockLog.create({ 
                            data: { action: 'SALE', quantity: Math.round(deduct), reason: `Sold via TX #${newTx.id}`, inventoryId: itemId } 
                        });
                    }
                }
            }
            return newTx;
        });
        
        const fullTx = await prisma.transaction.findUnique({ where: { id: result.id }, include: { items: true } });
        res.json({ success: true, transaction: fullTx });
    } catch (e) {
        console.error("Order Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/transactions', async (req, res) => {
    try {
        const txs = await prisma.transaction.findMany({
            include: { items: { include: { inventory: true } } },
            orderBy: { timestamp: 'desc' }
        });
        res.json(txs);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', (req, res) => res.json({ success: true, user: { name: "Admin", token: "mock" } }));

// Start Server
app.listen(port, () => {
    console.log(`🚀 Professional Server running on port ${port}`);
});
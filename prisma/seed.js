const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Final Data (Idempotent Version)...')

  // 1. Master Units (ใช้ upsert เพื่อกัน error ข้อมูลซ้ำ)
  const units = ["ชิ้น", "กล่อง", "ขวด", "ml", "แพ็ค", "ครั้ง", "ผืน", "อัน"];
  for (const u of units) {
    await prisma.masterUnit.upsert({
      where: { name: u },
      update: {}, // ถ้ามีแล้ว ไม่ต้องทำอะไร
      create: { name: u } // ถ้ายังไม่มี ให้สร้างใหม่
    });
  }

  // 2. Staff Roles (ใช้ upsert)
  const roles = ['สัตวแพทย์ (Vet)', 'ช่างตัดขน (Groomer)', 'ผู้ช่วย/Admin'];
  for (const r of roles) {
    await prisma.staffRole.upsert({
      where: { name: r },
      update: {},
      create: { name: r }
    });
  }

  // 3. Resources (เช็คก่อนสร้าง)
  const vetRole = await prisma.staffRole.findUnique({ where: { name: 'สัตวแพทย์ (Vet)' } });
  const groomerRole = await prisma.staffRole.findUnique({ where: { name: 'ช่างตัดขน (Groomer)' } });
  
  // เช็คว่ามี 'หมอบี' หรือยัง
  const existingDr = await prisma.resource.findFirst({ where: { name: 'หมอบี' } });
  if (!existingDr && vetRole) {
    await prisma.resource.create({ data: { name: 'หมอบี', type: 'Staff', roleId: vetRole.id } });
  }

  const existingGroomer = await prisma.resource.findFirst({ where: { name: 'ช่างเอ' } });
  if (!existingGroomer && groomerRole) {
    await prisma.resource.create({ data: { name: 'ช่างเอ', type: 'Staff', roleId: groomerRole.id } });
  }

  const existingRoom = await prisma.resource.findFirst({ where: { name: 'ห้องตรวจ 1' } });
  if (!existingRoom) {
    await prisma.resource.create({ data: { name: 'ห้องตรวจ 1', type: 'Room' } });
    await prisma.resource.create({ data: { name: 'กรง A', type: 'Cage' } });
  }

  // 4. Products (เช็ค SKU ก่อนสร้าง)
  const existingShampoo = await prisma.inventory.findFirst({ where: { sku: 'RAW-001' } });
  if (!existingShampoo) {
    const shampoo = await prisma.inventory.create({
      data: { 
        name: 'แชมพูสุนัข (ml)', sku: 'RAW-001', type: 'PRODUCT',
        stock: 5000, unitLevel1: 'ml', price: 0.5, isSellable: false 
      }
    })

    // สร้าง Service ต่อเมื่อสร้าง Shampoo สำเร็จ
    const existingService = await prisma.inventory.findFirst({ where: { sku: 'SRV-001' } });
    if (!existingService) {
        const grooming = await prisma.inventory.create({
            data: { 
            name: 'อาบน้ำตัดขน (S)', sku: 'SRV-001', type: 'SERVICE',
            price: 350, unitLevel1: 'ครั้ง', isComposite: true
            }
        })
        
        // ผูกสูตร
        await prisma.inventoryIngredient.create({
            data: { parentId: grooming.id, childId: shampoo.id, quantity: 50 }
        })
    }
  }

  // 6. Customer (เช็คเบอร์โทรก่อนสร้าง)
  const existingCus = await prisma.customer.findFirst({ where: { contactInfo: '081-123-4567' } });
  if (!existingCus) {
    await prisma.customer.create({
      data: {
        name: 'คุณสมชาย ใจดี', contactInfo: '081-123-4567', points: 100,
        pets: { create: [ { name: 'บัดดี้', species: 'Dog', breed: 'Golden' } ] }
      }
    })
  }

  console.log('✅ Seed Finished (Safe & Clean)!')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
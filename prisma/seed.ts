import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@erp.com" },
    update: {},
    create: {
      email: "admin@erp.com",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create company
  await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: {
      id: "default-company",
      name: "My Trading Co., Ltd.",
      nameTh: "บริษัท ค้าขาย จำกัด",
      address: "123 Bangkok, Thailand",
      addressTh: "123 กรุงเทพฯ ประเทศไทย",
      taxId: "0123456789012",
      phone: "02-123-4567",
      email: "info@mytrading.com",
      vatRate: 7,
    },
  });

  console.log("Created company");

  // Create default warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: "default-warehouse" },
    update: {},
    create: {
      id: "default-warehouse",
      name: "Main Warehouse",
      nameTh: "คลังสินค้าหลัก",
      address: "123 Bangkok",
    },
  });

  console.log("Created warehouse");

  // Create categories
  const catElectronics = await prisma.category.create({
    data: { name: "Electronics", nameTh: "อิเล็กทรอนิกส์" },
  });
  const catOffice = await prisma.category.create({
    data: { name: "Office Supplies", nameTh: "อุปกรณ์สำนักงาน" },
  });
  const catFood = await prisma.category.create({
    data: { name: "Food & Beverage", nameTh: "อาหารและเครื่องดื่ม" },
  });

  console.log("Created categories");

  // Create units
  const unitPcs = await prisma.unit.create({
    data: { name: "Piece", nameTh: "ชิ้น", abbr: "pcs" },
  });
  const unitBox = await prisma.unit.create({
    data: { name: "Box", nameTh: "กล่อง", abbr: "box" },
  });
  const unitKg = await prisma.unit.create({
    data: { name: "Kilogram", nameTh: "กิโลกรัม", abbr: "kg" },
  });
  await prisma.unit.create({
    data: { name: "Dozen", nameTh: "โหล", abbr: "dz" },
  });

  console.log("Created units");

  // Create document sequences
  const sequences = [
    { prefix: "PO", lastNumber: 3, year: 2026 },
    { prefix: "SO", lastNumber: 3, year: 2026 },
    { prefix: "INV", lastNumber: 1, year: 2026 },
  ];

  for (const seq of sequences) {
    await prisma.documentSequence.upsert({
      where: { prefix: seq.prefix },
      update: {},
      create: seq,
    });
  }

  console.log("Created document sequences");

  // ==================== DEMO DATA ====================

  // Create suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      code: "SUP-001",
      name: "Tech Supply Co., Ltd.",
      nameTh: "บริษัท เทค ซัพพลาย จำกัด",
      contact: "Somchai",
      phone: "02-111-1111",
      email: "sales@techsupply.co.th",
      address: "456 Silom Road, Bangkok 10500",
      taxId: "0105500000001",
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      code: "SUP-002",
      name: "Office World Co., Ltd.",
      nameTh: "บริษัท ออฟฟิศ เวิลด์ จำกัด",
      contact: "Somporn",
      phone: "02-222-2222",
      email: "order@officeworld.co.th",
      address: "789 Sukhumvit Road, Bangkok 10110",
      taxId: "0105500000002",
    },
  });

  const supplier3 = await prisma.supplier.create({
    data: {
      code: "SUP-003",
      name: "Fresh Import Trading",
      nameTh: "บริษัท เฟรช อิมพอร์ต เทรดดิ้ง จำกัด",
      contact: "Wichai",
      phone: "02-333-3333",
      email: "info@freshimport.co.th",
      address: "321 Ratchada Road, Bangkok 10400",
      taxId: "0105500000003",
    },
  });

  console.log("Created 3 suppliers");

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      code: "CUS-001",
      name: "ABC Company Limited",
      nameTh: "บริษัท เอบีซี จำกัด",
      contact: "Pranee",
      phone: "02-444-4444",
      email: "purchase@abc.co.th",
      address: "100 Phahonyothin Road, Bangkok 10900",
      taxId: "0105500000010",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      code: "CUS-002",
      name: "XYZ Corporation",
      nameTh: "บริษัท เอ็กซ์วายแซด คอร์ปอเรชั่น จำกัด",
      contact: "Natthawut",
      phone: "02-555-5555",
      email: "admin@xyz-corp.co.th",
      address: "200 Rama IV Road, Bangkok 10500",
      taxId: "0105500000020",
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      code: "CUS-003",
      name: "Good Life Shop",
      nameTh: "ร้านกู้ดไลฟ์",
      contact: "Siriporn",
      phone: "081-999-9999",
      email: "goodlifeshop@gmail.com",
      address: "55 Ladprao Road, Bangkok 10230",
      taxId: "0105500000030",
    },
  });

  console.log("Created 3 customers");

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: "ELEC-001",
        name: "Wireless Mouse",
        nameTh: "เมาส์ไร้สาย",
        description: "2.4GHz wireless optical mouse",
        categoryId: catElectronics.id,
        unitId: unitPcs.id,
        buyPrice: 250,
        sellPrice: 450,
        minStock: 20,
      },
    }),
    prisma.product.create({
      data: {
        sku: "ELEC-002",
        name: "USB-C Hub 7-in-1",
        nameTh: "ฮับ USB-C 7-in-1",
        description: "USB-C multiport adapter with HDMI, USB-A, SD card",
        categoryId: catElectronics.id,
        unitId: unitPcs.id,
        buyPrice: 890,
        sellPrice: 1490,
        minStock: 10,
      },
    }),
    prisma.product.create({
      data: {
        sku: "ELEC-003",
        name: "Bluetooth Speaker",
        nameTh: "ลำโพงบลูทูธ",
        description: "Portable bluetooth speaker 10W",
        categoryId: catElectronics.id,
        unitId: unitPcs.id,
        buyPrice: 550,
        sellPrice: 990,
        minStock: 15,
      },
    }),
    prisma.product.create({
      data: {
        sku: "ELEC-004",
        name: "Webcam HD 1080p",
        nameTh: "เว็บแคม HD 1080p",
        description: "Full HD webcam with microphone",
        categoryId: catElectronics.id,
        unitId: unitPcs.id,
        buyPrice: 750,
        sellPrice: 1290,
        minStock: 10,
      },
    }),
    prisma.product.create({
      data: {
        sku: "OFF-001",
        name: "A4 Copy Paper",
        nameTh: "กระดาษ A4",
        description: "80gsm white copy paper, 500 sheets/ream",
        categoryId: catOffice.id,
        unitId: unitBox.id,
        buyPrice: 89,
        sellPrice: 129,
        minStock: 50,
      },
    }),
    prisma.product.create({
      data: {
        sku: "OFF-002",
        name: "Ballpoint Pen (Box of 12)",
        nameTh: "ปากกาลูกลื่น (กล่อง 12 ด้าม)",
        description: "Blue ink ballpoint pen, 0.7mm",
        categoryId: catOffice.id,
        unitId: unitBox.id,
        buyPrice: 45,
        sellPrice: 79,
        minStock: 30,
      },
    }),
    prisma.product.create({
      data: {
        sku: "OFF-003",
        name: "Sticky Notes Pack",
        nameTh: "กระดาษโน้ตกาว",
        description: "3x3 inch sticky notes, 5 colors, 100 sheets each",
        categoryId: catOffice.id,
        unitId: unitPcs.id,
        buyPrice: 35,
        sellPrice: 65,
        minStock: 40,
      },
    }),
    prisma.product.create({
      data: {
        sku: "FOOD-001",
        name: "Instant Coffee 3-in-1",
        nameTh: "กาแฟ 3-in-1",
        description: "Instant coffee mix, box of 30 sachets",
        categoryId: catFood.id,
        unitId: unitBox.id,
        buyPrice: 120,
        sellPrice: 189,
        minStock: 25,
      },
    }),
    prisma.product.create({
      data: {
        sku: "FOOD-002",
        name: "Green Tea Bottle 500ml",
        nameTh: "ชาเขียว ขวด 500ml",
        description: "Japanese green tea, 500ml PET bottle",
        categoryId: catFood.id,
        unitId: unitBox.id,
        buyPrice: 180,
        sellPrice: 288,
        minStock: 20,
      },
    }),
    prisma.product.create({
      data: {
        sku: "FOOD-003",
        name: "Premium Rice 5kg",
        nameTh: "ข้าวหอมมะลิ 5 กก.",
        description: "Thai Hom Mali jasmine rice 5kg bag",
        categoryId: catFood.id,
        unitId: unitKg.id,
        buyPrice: 160,
        sellPrice: 239,
        minStock: 30,
      },
    }),
  ]);

  console.log("Created 10 products");

  // Create inventory for all products
  for (const product of products) {
    const stockQty = Math.floor(Math.random() * 80) + 20; // 20-100
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: stockQty,
      },
    });
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        type: "IN",
        quantity: stockQty,
        reference: "Initial Stock",
        notes: "Opening balance",
      },
    });
  }

  console.log("Created initial inventory for all products");

  // Create sample Purchase Orders
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO26-00001",
      supplierId: supplier1.id,
      date: new Date("2026-02-01"),
      dueDate: new Date("2026-02-15"),
      status: "RECEIVED",
      subtotal: 25000,
      vatAmount: 1750,
      total: 26750,
      createdById: admin.id,
      items: {
        create: [
          {
            productId: products[0].id, // Wireless Mouse
            quantity: 50,
            unitPrice: 250,
            total: 12500,
            receivedQty: 50,
          },
          {
            productId: products[1].id, // USB-C Hub
            quantity: 10,
            unitPrice: 890,
            total: 8900,
            receivedQty: 10,
          },
          {
            productId: products[2].id, // Bluetooth Speaker
            quantity: 6,
            unitPrice: 550,
            total: 3300,
            receivedQty: 6,
          },
        ],
      },
    },
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO26-00002",
      supplierId: supplier2.id,
      date: new Date("2026-02-10"),
      dueDate: new Date("2026-02-25"),
      status: "CONFIRMED",
      subtotal: 8900,
      vatAmount: 623,
      total: 9523,
      createdById: admin.id,
      items: {
        create: [
          {
            productId: products[4].id, // A4 Paper
            quantity: 100,
            unitPrice: 89,
            total: 8900,
            receivedQty: 0,
          },
        ],
      },
    },
  });

  const po3 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO26-00003",
      supplierId: supplier3.id,
      date: new Date("2026-02-20"),
      status: "DRAFT",
      subtotal: 6800,
      vatAmount: 476,
      total: 7276,
      createdById: admin.id,
      items: {
        create: [
          {
            productId: products[7].id, // Coffee
            quantity: 20,
            unitPrice: 120,
            total: 2400,
          },
          {
            productId: products[8].id, // Green Tea
            quantity: 15,
            unitPrice: 180,
            total: 2700,
          },
          {
            productId: products[9].id, // Rice
            quantity: 10,
            unitPrice: 160,
            total: 1600,
          },
        ],
      },
    },
  });

  console.log("Created 3 purchase orders");

  // Create sample Sales Orders
  const so1 = await prisma.salesOrder.create({
    data: {
      soNumber: "SO26-00001",
      customerId: customer1.id,
      date: new Date("2026-02-05"),
      dueDate: new Date("2026-02-20"),
      status: "DELIVERED",
      subtotal: 22350,
      vatAmount: 1564.5,
      total: 23914.5,
      createdById: admin.id,
      items: {
        create: [
          {
            productId: products[0].id, // Wireless Mouse
            quantity: 30,
            unitPrice: 450,
            total: 13500,
            deliveredQty: 30,
          },
          {
            productId: products[1].id, // USB-C Hub
            quantity: 5,
            unitPrice: 1490,
            total: 7450,
            deliveredQty: 5,
          },
          {
            productId: products[6].id, // Sticky Notes
            quantity: 20,
            unitPrice: 65,
            total: 1300,
            deliveredQty: 20,
          },
        ],
      },
    },
  });

  const so2 = await prisma.salesOrder.create({
    data: {
      soNumber: "SO26-00002",
      customerId: customer2.id,
      date: new Date("2026-02-15"),
      dueDate: new Date("2026-03-01"),
      status: "CONFIRMED",
      subtotal: 15870,
      vatAmount: 1110.9,
      total: 16980.9,
      createdById: admin.id,
      items: {
        create: [
          {
            productId: products[2].id, // Bluetooth Speaker
            quantity: 10,
            unitPrice: 990,
            total: 9900,
            deliveredQty: 0,
          },
          {
            productId: products[3].id, // Webcam
            quantity: 3,
            unitPrice: 1290,
            total: 3870,
            deliveredQty: 0,
          },
          {
            productId: products[5].id, // Pen
            quantity: 20,
            unitPrice: 79,
            total: 1580,
            deliveredQty: 0,
          },
          {
            productId: products[6].id, // Sticky Notes
            quantity: 8,
            unitPrice: 65,
            total: 520,
            deliveredQty: 0,
          },
        ],
      },
    },
  });

  const so3 = await prisma.salesOrder.create({
    data: {
      soNumber: "SO26-00003",
      customerId: customer3.id,
      date: new Date("2026-02-22"),
      status: "DRAFT",
      subtotal: 7170,
      vatAmount: 501.9,
      total: 7671.9,
      createdById: admin.id,
      items: {
        create: [
          {
            productId: products[7].id, // Coffee
            quantity: 10,
            unitPrice: 189,
            total: 1890,
          },
          {
            productId: products[8].id, // Green Tea
            quantity: 10,
            unitPrice: 288,
            total: 2880,
          },
          {
            productId: products[9].id, // Rice
            quantity: 10,
            unitPrice: 239,
            total: 2390,
          },
        ],
      },
    },
  });

  console.log("Created 3 sales orders");

  // Create an invoice for the delivered SO
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV26-00001",
      customerId: so1.customerId,
      date: new Date("2026-02-05"),
      dueDate: new Date("2026-03-05"),
      status: "ISSUED",
      subtotal: 22350,
      vatAmount: 1564.5,
      total: 23914.5,
      salesOrders: { connect: [{ id: so1.id }] },
      items: {
        create: [
          { productId: products[0].id, quantity: 100, unitPrice: 125, total: 12500 },
          { productId: products[2].id, quantity: 50, unitPrice: 85, total: 4250 },
          { productId: products[4].id, quantity: 200, unitPrice: 28, total: 5600 },
        ],
      },
    },
  });

  // Update document sequence for INV
  await prisma.documentSequence.upsert({
    where: { prefix: "INV" },
    create: { prefix: "INV", lastNumber: 1, year: 2026 },
    update: { lastNumber: 1 },
  });

  console.log("Created 1 invoice");
  console.log("");
  console.log("=================================");
  console.log("  Seed completed successfully!");
  console.log("=================================");
  console.log("");
  console.log("Demo login:");
  console.log("  Email: admin@erp.com");
  console.log("  Password: password123");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

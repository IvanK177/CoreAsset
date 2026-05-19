import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with test data...");

  // ============================================
  // 1. Create Software Catalog entries
  // ============================================
  const windows11 = await prisma.softwareCatalog.create({
    data: {
      softwareName: "Windows 11 Pro",
      version: "23H2",
      publisher: "Microsoft",
      category: "OS",
    },
  });

  const office365 = await prisma.softwareCatalog.create({
    data: {
      softwareName: "Microsoft 365 Business",
      version: "2024",
      publisher: "Microsoft",
      category: "office",
    },
  });

  const vscode = await prisma.softwareCatalog.create({
    data: {
      softwareName: "Visual Studio Code",
      version: "1.95",
      publisher: "Microsoft",
      category: "development",
    },
  });

  const kaspersky = await prisma.softwareCatalog.create({
    data: {
      softwareName: "Kaspersky Endpoint Security",
      version: "12.6",
      publisher: "Kaspersky",
      category: "security",
    },
  });

  const slack = await prisma.softwareCatalog.create({
    data: {
      softwareName: "Slack",
      version: "4.40",
      publisher: "Slack Technologies",
      category: "utility",
    },
  });

  const figma = await prisma.softwareCatalog.create({
    data: {
      softwareName: "Figma",
      version: "2024.3",
      publisher: "Figma Inc.",
      category: "development",
    },
  });

  console.log(`✅ Created ${6} software catalog entries`);

  // ============================================
  // 2. Create Licenses with concurrency limits
  // ============================================
  const licenseWin = await prisma.license.create({
    data: {
      concurrencyLimit: 50,
      purchaseDate: new Date("2024-01-15"),
      expiryDate: new Date("2027-01-15"),
      price: 199.99,
      softwareId: windows11.id,
    },
  });

  const licenseOffice = await prisma.license.create({
    data: {
      concurrencyLimit: 30,
      purchaseDate: new Date("2024-03-01"),
      expiryDate: new Date("2025-03-01"),
      price: 12.50,
      softwareId: office365.id,
    },
  });

  const licenseVSCode = await prisma.license.create({
    data: {
      concurrencyLimit: 100,
      softwareId: vscode.id,
      price: 0,
    },
  });

  const licenseKaspersky = await prisma.license.create({
    data: {
      concurrencyLimit: 40,
      purchaseDate: new Date("2024-02-10"),
      expiryDate: new Date("2026-02-10"),
      price: 45.00,
      softwareId: kaspersky.id,
    },
  });

  const licenseSlack = await prisma.license.create({
    data: {
      concurrencyLimit: 25,
      purchaseDate: new Date("2024-06-01"),
      expiryDate: new Date("2025-06-01"),
      price: 8.50,
      softwareId: slack.id,
    },
  });

  const licenseFigma = await prisma.license.create({
    data: {
      concurrencyLimit: 5,
      purchaseDate: new Date("2024-04-01"),
      expiryDate: new Date("2025-04-01"),
      price: 15.00,
      softwareId: figma.id,
    },
  });

  console.log(`✅ Created ${6} license entries`);

  // ============================================
  // 3. Create Users (employees)
  // ============================================
  const users = await Promise.all([
    prisma.user.create({
      data: {
        employeeId: "EMP-001",
        fullName: "Иванов Алексей Петрович",
        email: "ivanov@coreasset.ru",
        department: "ИТ-отдел",
        position: "Системный администратор",
      },
    }),
    prisma.user.create({
      data: {
        employeeId: "EMP-002",
        fullName: "Петрова Мария Сергеевна",
        email: "petrova@coreasset.ru",
        department: "Бухгалтерия",
        position: "Главный бухгалтер",
      },
    }),
    prisma.user.create({
      data: {
        employeeId: "EMP-003",
        fullName: "Сидоров Дмитрий Николаевич",
        email: "sidorov@coreasset.ru",
        department: "Разработка",
        position: "Frontend-разработчик",
      },
    }),
    prisma.user.create({
      data: {
        employeeId: "EMP-004",
        fullName: "Козлова Анна Владимировна",
        email: "kozlova@coreasset.ru",
        department: "Маркетинг",
        position: "UX-дизайнер",
      },
    }),
    prisma.user.create({
      data: {
        employeeId: "EMP-005",
        fullName: "Морозов Игорь Александрович",
        email: "morozov@coreasset.ru",
        department: "Разработка",
        position: "Backend-разработчик",
      },
    }),
    prisma.user.create({
      data: {
        employeeId: "EMP-006",
        fullName: "Новикова Елена Дмитриевна",
        email: "novikova@coreasset.ru",
        department: "HR",
        position: "HR-менеджер",
      },
    }),
    prisma.user.create({
      data: {
        employeeId: "EMP-007",
        fullName: "Волков Сергей Павлович",
        email: "volkov@coreasset.ru",
        department: "ИТ-отдел",
        position: "DevOps-инженер",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} user entries`);

  // ============================================
  // 4. Create Hardware Assets
  // ============================================
  const hardware = await Promise.all([
    prisma.hardwareAsset.create({
      data: {
        serialNumber: "SN-DELL-001",
        name: "Dell OptiPlex 7090",
        type: "desktop",
        brand: "Dell",
        model: "OptiPlex 7090 SFF",
        lifecycleState: "active",
        purchaseDate: new Date("2023-06-15"),
        warrantyEndDate: new Date("2026-06-15"),
        discoveryMetadata: { cpu: "Intel i7-11700", ram: "16GB", storage: "512GB SSD" },
      },
    }),
    prisma.hardwareAsset.create({
      data: {
        serialNumber: "SN-HP-002",
        name: "HP EliteBook 840 G9",
        type: "laptop",
        brand: "HP",
        model: "EliteBook 840 G9",
        lifecycleState: "active",
        purchaseDate: new Date("2023-09-01"),
        warrantyEndDate: new Date("2026-09-01"),
        discoveryMetadata: { cpu: "Intel i5-1245U", ram: "8GB", storage: "256GB SSD" },
      },
    }),
    prisma.hardwareAsset.create({
      data: {
        serialNumber: "SN-LENOVO-003",
        name: "Lenovo ThinkPad T14s",
        type: "laptop",
        brand: "Lenovo",
        model: "ThinkPad T14s Gen 3",
        lifecycleState: "active",
        purchaseDate: new Date("2024-01-10"),
        warrantyEndDate: new Date("2027-01-10"),
        discoveryMetadata: { cpu: "AMD Ryzen 7 PRO 5850U", ram: "16GB", storage: "512GB SSD" },
      },
    }),
    prisma.hardwareAsset.create({
      data: {
        serialNumber: "SN-MAC-004",
        name: "MacBook Pro 14 M3",
        type: "laptop",
        brand: "Apple",
        model: "MacBook Pro 14 M3",
        lifecycleState: "active",
        purchaseDate: new Date("2024-03-20"),
        warrantyEndDate: new Date("2027-03-20"),
        discoveryMetadata: { cpu: "Apple M3 Pro", ram: "18GB", storage: "512GB SSD" },
      },
    }),
    prisma.hardwareAsset.create({
      data: {
        serialNumber: "SN-DELL-005",
        name: "Dell Latitude 5540",
        type: "laptop",
        brand: "Dell",
        model: "Latitude 5540",
        lifecycleState: "in_repair",
        purchaseDate: new Date("2022-11-05"),
        warrantyEndDate: new Date("2025-11-05"),
        discoveryMetadata: { cpu: "Intel i5-1335U", ram: "8GB", storage: "256GB SSD" },
      },
    }),
    prisma.hardwareAsset.create({
      data: {
        serialNumber: "SN-HP-006",
        name: "HP ProDesk 400 G7",
        type: "desktop",
        brand: "HP",
        model: "ProDesk 400 G7 SFF",
        lifecycleState: "active",
        purchaseDate: new Date("2023-03-15"),
        warrantyEndDate: new Date("2026-03-15"),
        discoveryMetadata: { cpu: "Intel i3-10100", ram: "4GB", storage: "256GB SSD" },
      },
    }),
    prisma.hardwareAsset.create({
      data: {
        serialNumber: "SN-LENOVO-007",
        name: "Lenovo IdeaCentre 5",
        type: "desktop",
        brand: "Lenovo",
        model: "IdeaCentre 5iA-7",
        lifecycleState: "in_storage",
        purchaseDate: new Date("2021-08-20"),
        warrantyEndDate: new Date("2024-08-20"),
        discoveryMetadata: { cpu: "Intel i5-10400", ram: "8GB", storage: "1TB HDD" },
      },
    }),
    prisma.hardwareAsset.create({
      data: {
        serialNumber: "SN-SAM-008",
        name: "Samsung 27\" Monitor",
        type: "monitor",
        brand: "Samsung",
        model: "S27A600U",
        lifecycleState: "active",
        purchaseDate: new Date("2023-07-01"),
        warrantyEndDate: new Date("2026-07-01"),
        discoveryMetadata: { resolution: "2560x1440", panelType: "IPS" },
      },
    }),
    prisma.hardwareAsset.create({
      data: {
        serialNumber: "SN-DELL-009",
        name: "Dell PowerEdge R640",
        type: "server",
        brand: "Dell",
        model: "PowerEdge R640",
        lifecycleState: "active",
        purchaseDate: new Date("2022-01-15"),
        warrantyEndDate: new Date("2025-01-15"),
        discoveryMetadata: { cpu: "Intel Xeon Gold 5218", ram: "64GB", storage: "2x 1TB SSD RAID1" },
      },
    }),
    prisma.hardwareAsset.create({
      data: {
        serialNumber: "SN-HP-010",
        name: "HP LaserJet Pro M404n",
        type: "printer",
        brand: "HP",
        model: "LaserJet Pro M404n",
        lifecycleState: "decommissioned",
        purchaseDate: new Date("2020-05-10"),
        warrantyEndDate: new Date("2023-05-10"),
        discoveryMetadata: { type: "laser", speed: "38ppm" },
      },
    }),
  ]);

  console.log(`✅ Created ${hardware.length} hardware asset entries`);

  // ============================================
  // 5. Create Workplaces (link users to hardware)
  // ============================================
  const workplaces = await Promise.all([
    prisma.workplace.create({
      data: {
        name: "Рабочее место ИТ-1",
        location: "Кабинет 101, 1 этаж",
        userId: users[0].id,
        hardwareId: hardware[0].id,
      },
    }),
    prisma.workplace.create({
      data: {
        name: "Рабочее место Бух-1",
        location: "Кабинет 205, 2 этаж",
        userId: users[1].id,
        hardwareId: hardware[1].id,
      },
    }),
    prisma.workplace.create({
      data: {
        name: "Рабочее место Dev-1",
        location: "Open Space A, 3 этаж",
        userId: users[2].id,
        hardwareId: hardware[2].id,
      },
    }),
    prisma.workplace.create({
      data: {
        name: "Рабочее место Design-1",
        location: "Open Space B, 3 этаж",
        userId: users[3].id,
        hardwareId: hardware[3].id,
      },
    }),
    prisma.workplace.create({
      data: {
        name: "Рабочее место Dev-2",
        location: "Open Space A, 3 этаж",
        userId: users[4].id,
        hardwareId: hardware[5].id,
      },
    }),
    prisma.workplace.create({
      data: {
        name: "Рабочее место HR-1",
        location: "Кабинет 302, 3 этаж",
        userId: users[5].id,
        hardwareId: hardware[7].id,
      },
    }),
  ]);

  console.log(`✅ Created ${workplaces.length} workplace entries`);

  // ============================================
  // 6. Create Software Installations (assign licenses to hardware)
  // ============================================
  const installations = await Promise.all([
    // Windows 11 on all active desktops/laptops
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[0].id, licenseId: licenseWin.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[1].id, licenseId: licenseWin.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[2].id, licenseId: licenseWin.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[3].id, licenseId: licenseWin.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[5].id, licenseId: licenseWin.id },
    }),
    // Microsoft 365 on office PCs
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[0].id, licenseId: licenseOffice.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[1].id, licenseId: licenseOffice.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[2].id, licenseId: licenseOffice.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[3].id, licenseId: licenseOffice.id },
    }),
    // VS Code on developer machines
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[2].id, licenseId: licenseVSCode.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[3].id, licenseId: licenseVSCode.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[5].id, licenseId: licenseVSCode.id },
    }),
    // Kaspersky on all active PCs
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[0].id, licenseId: licenseKaspersky.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[1].id, licenseId: licenseKaspersky.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[2].id, licenseId: licenseKaspersky.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[3].id, licenseId: licenseKaspersky.id },
    }),
    // Slack on office PCs
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[1].id, licenseId: licenseSlack.id },
    }),
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[2].id, licenseId: licenseSlack.id },
    }),
    // Figma on designer's MacBook
    prisma.softwareInstallation.create({
      data: { hardwareId: hardware[3].id, licenseId: licenseFigma.id },
    }),
  ]);

  console.log(`✅ Created ${installations.length} software installation entries`);

  // ============================================
  // 7. Create Fault History Incidents
  // ============================================
  const faults = await Promise.all([
    prisma.faultHistoryIncident.create({
      data: {
        hardwareId: hardware[4].id, // Dell Latitude in repair
        incidentDescription: "Не работает клавиатура — залипание клавиш после попадания жидкости. Требуется замена клавиатурного блока.",
        severity: "high",
        status: "in_progress",
        reportedAt: new Date("2024-11-20"),
      },
    }),
    prisma.faultHistoryIncident.create({
      data: {
        hardwareId: hardware[6].id, // Lenovo IdeaCentre in storage
        incidentDescription: "Выход из строя жесткого диска — SMART-ошибки, риск потери данных. Диск заменён на SSD, оборудование переведено в хранение.",
        severity: "critical",
        status: "resolved",
        reportedAt: new Date("2024-08-15"),
        resolvedAt: new Date("2024-09-01"),
      },
    }),
    prisma.faultHistoryIncident.create({
      data: {
        hardwareId: hardware[0].id, // Dell OptiPlex
        incidentDescription: "Периодическое зависание системы при интенсивной нагрузке. Возможная причина — недостаток оперативной памяти.",
        severity: "medium",
        status: "open",
        reportedAt: new Date("2024-12-01"),
      },
    }),
  ]);

  console.log(`✅ Created ${faults.length} fault history incident entries`);

  console.log("\n🎉 Seeding completed successfully!");
  console.log(`   Summary:`);
  console.log(`   - Software Catalog: 6 entries`);
  console.log(`   - Licenses: 6 entries`);
  console.log(`   - Users: ${users.length} entries`);
  console.log(`   - Hardware Assets: ${hardware.length} entries`);
  console.log(`   - Workplaces: ${workplaces.length} entries`);
  console.log(`   - Software Installations: ${installations.length} entries`);
  console.log(`   - Fault History Incidents: ${faults.length} entries`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
-- CoreAsset ITAM — Manual Migration SQL
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- This creates all 7 tables with indexes and foreign keys

-- Drop existing tables if they conflict (in dependency order)
DROP TABLE IF EXISTS "software_installations" CASCADE;
DROP TABLE IF EXISTS "fault_history_incidents" CASCADE;
DROP TABLE IF EXISTS "workplaces" CASCADE;
DROP TABLE IF EXISTS "licenses" CASCADE;
DROP TABLE IF EXISTS "software_catalog" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "hardware_assets" CASCADE;

-- CreateTable: Hardware Assets
CREATE TABLE "hardware_assets" (
    "id" TEXT NOT NULL,
    "serial_number" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "lifecycle_state" VARCHAR(20) NOT NULL DEFAULT 'active',
    "purchase_date" DATE,
    "warranty_end_date" DATE,
    "discovery_metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "hardware_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "employee_id" VARCHAR(50) NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "department" VARCHAR(100),
    "position" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Workplaces
CREATE TABLE "workplaces" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "location" VARCHAR(200),
    "user_id" TEXT NOT NULL,
    "hardware_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "workplaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Software Catalog
CREATE TABLE "software_catalog" (
    "id" TEXT NOT NULL,
    "software_name" VARCHAR(200) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "publisher" VARCHAR(200),
    "category" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "software_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Licenses
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "license_key" VARCHAR(500),
    "concurrency_limit" INTEGER NOT NULL DEFAULT 1,
    "purchase_date" DATE,
    "expiry_date" DATE,
    "price" DECIMAL(10,2),
    "software_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Software Installations
CREATE TABLE "software_installations" (
    "id" TEXT NOT NULL,
    "hardware_id" TEXT NOT NULL,
    "license_id" TEXT NOT NULL,
    "installed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "software_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Fault History Incidents
CREATE TABLE "fault_history_incidents" (
    "id" TEXT NOT NULL,
    "hardware_id" TEXT NOT NULL,
    "incident_description" TEXT NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "reported_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "fault_history_incidents_pkey" PRIMARY KEY ("id")
);

-- Indexes for hardware_assets
CREATE UNIQUE INDEX "hardware_assets_serial_number_key" ON "hardware_assets"("serial_number");
CREATE INDEX "idx_hardware_lifecycle" ON "hardware_assets"("lifecycle_state");
CREATE INDEX "idx_hardware_serial" ON "hardware_assets"("serial_number");
CREATE INDEX "idx_hardware_type" ON "hardware_assets"("type");

-- Indexes for users
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "idx_user_fullname" ON "users"("full_name");
CREATE INDEX "idx_user_email" ON "users"("email");
CREATE INDEX "idx_user_department" ON "users"("department");

-- Indexes for workplaces
CREATE INDEX "idx_workplace_user" ON "workplaces"("user_id");
CREATE INDEX "idx_workplace_hardware" ON "workplaces"("hardware_id");
CREATE INDEX "idx_workplace_location" ON "workplaces"("location");

-- Indexes for software_catalog
CREATE INDEX "idx_software_name" ON "software_catalog"("software_name");
CREATE INDEX "idx_software_category" ON "software_catalog"("category");
CREATE UNIQUE INDEX "uq_software_name_version" ON "software_catalog"("software_name", "version");

-- Indexes for licenses
CREATE UNIQUE INDEX "licenses_license_key_key" ON "licenses"("license_key");
CREATE INDEX "idx_license_software" ON "licenses"("software_id");
CREATE INDEX "idx_license_expiry" ON "licenses"("expiry_date");

-- Indexes for software_installations
CREATE INDEX "idx_installation_hardware" ON "software_installations"("hardware_id");
CREATE INDEX "idx_installation_license" ON "software_installations"("license_id");
CREATE INDEX "idx_installation_status" ON "software_installations"("status");
CREATE UNIQUE INDEX "uq_installation_hardware_license" ON "software_installations"("hardware_id", "license_id");

-- Indexes for fault_history_incidents
CREATE INDEX "idx_fault_hardware" ON "fault_history_incidents"("hardware_id");
CREATE INDEX "idx_fault_status" ON "fault_history_incidents"("status");
CREATE INDEX "idx_fault_severity" ON "fault_history_incidents"("severity");

-- Foreign Keys
ALTER TABLE "workplaces" ADD CONSTRAINT "fk_workplace_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "workplaces" ADD CONSTRAINT "fk_workplace_hardware" FOREIGN KEY ("hardware_id") REFERENCES "hardware_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "licenses" ADD CONSTRAINT "fk_license_software" FOREIGN KEY ("software_id") REFERENCES "software_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "software_installations" ADD CONSTRAINT "fk_installation_hardware" FOREIGN KEY ("hardware_id") REFERENCES "hardware_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "software_installations" ADD CONSTRAINT "fk_installation_license" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fault_history_incidents" ADD CONSTRAINT "fk_fault_hardware" FOREIGN KEY ("hardware_id") REFERENCES "hardware_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
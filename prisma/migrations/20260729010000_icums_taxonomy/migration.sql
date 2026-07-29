-- ICUMS coded vehicle taxonomy (make/model codes from the official used-vehicle
-- duty checker) + assessment columns for the per-row exchange rate and taxonomy
-- codes. Purely additive.

-- CreateTable
CREATE TABLE "IcumsMake" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IcumsMake_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "IcumsModel" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "makeCode" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IcumsModel_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "IcumsMake_name_idx" ON "IcumsMake"("name");

-- CreateIndex
CREATE INDEX "IcumsModel_makeCode_idx" ON "IcumsModel"("makeCode");

-- CreateIndex
CREATE INDEX "IcumsModel_name_idx" ON "IcumsModel"("name");

-- AddForeignKey
ALTER TABLE "IcumsModel" ADD CONSTRAINT "IcumsModel_makeCode_fkey" FOREIGN KEY ("makeCode") REFERENCES "IcumsMake"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "DutyAssessment" ADD COLUMN "exchangeRate" DECIMAL(10,4);
ALTER TABLE "DutyAssessment" ADD COLUMN "icumsMakeCode" TEXT;
ALTER TABLE "DutyAssessment" ADD COLUMN "icumsModelCode" TEXT;

-- Starter seed: codes read directly off the ICUMS checker's Make/Model popups
-- (verified 2026-07). The full catalogue (691 makes) loads via the admin
-- bulk import.
INSERT INTO "IcumsMake" ("code", "name") VALUES
  ('00000', 'Other Vehicle Make'),
  ('00001', 'Acura'),
  ('00002', 'Alfa Romeo'),
  ('00003', 'Audi'),
  ('00004', 'BMW'),
  ('00005', 'Chevrolet'),
  ('00006', 'Chrysler'),
  ('00007', 'Citroen'),
  ('00008', 'Dacia'),
  ('00009', 'Daewoo'),
  ('00042', 'Toyota')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "IcumsModel" ("code", "name", "makeCode") VALUES
  ('00000', 'Other Vehicle Model', '00000'),
  ('00849', '4-Runner', '00042'),
  ('00850', 'Auris', '00042'),
  ('00851', 'Avalon', '00042'),
  ('00852', 'Avensis', '00042'),
  ('00853', 'Avensis Combi', '00042'),
  ('00854', 'Avensis Van Verso', '00042'),
  ('00855', 'Aygo', '00042'),
  ('00856', 'Camry', '00042'),
  ('00857', 'Camry GL', '00042')
ON CONFLICT ("code") DO NOTHING;

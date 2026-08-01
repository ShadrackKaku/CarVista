-- Align DutyRate with the 2026 GRA levy stack.
--
-- Adds the three CIF-based levies the old model was missing (African Union,
-- EXIM, Special Import) and drops the withdrawn COVID-19 Health Recovery Levy.
-- The examination fee default moves to 1%, which is what ICUMS assesses on a
-- used vehicle.

ALTER TABLE "DutyRate" ADD COLUMN IF NOT EXISTS "auLevyRate" DOUBLE PRECISION NOT NULL DEFAULT 0.2;
ALTER TABLE "DutyRate" ADD COLUMN IF NOT EXISTS "eximLevyRate" DOUBLE PRECISION NOT NULL DEFAULT 0.75;
ALTER TABLE "DutyRate" ADD COLUMN IF NOT EXISTS "specialImportLevyRate" DOUBLE PRECISION NOT NULL DEFAULT 2;

ALTER TABLE "DutyRate" ALTER COLUMN "examinationFee" SET DEFAULT 1;

-- Existing rows were seeded before these levies were modelled, so they carry
-- the column defaults rather than a deliberate admin choice. Bring any row
-- still sitting at 0 up to the statutory rate.
UPDATE "DutyRate" SET "auLevyRate" = 0.2 WHERE "auLevyRate" = 0;
UPDATE "DutyRate" SET "eximLevyRate" = 0.75 WHERE "eximLevyRate" = 0;
UPDATE "DutyRate" SET "specialImportLevyRate" = 2 WHERE "specialImportLevyRate" = 0;
UPDATE "DutyRate" SET "examinationFee" = 1 WHERE "examinationFee" = 0.5;

ALTER TABLE "DutyRate" DROP COLUMN IF EXISTS "covidLevyRate";

-- Registration creates a plain USER; specialised roles are granted by approval.
--
-- CUSTOMER was always the base role in behaviour — this renames the value so the
-- name says so. A rename keeps every existing row and every foreign key intact;
-- adding a new value and migrating rows would not.
ALTER TYPE "UserRole" RENAME VALUE 'CUSTOMER' TO 'USER';

-- Roles the platform can grant but nobody can self-assign.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPPLIER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'IMPORTER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

CREATE TYPE "RoleApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

CREATE TABLE "RoleApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedRole" "UserRole" NOT NULL,
    "status" "RoleApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "businessName" TEXT,
    "businessRegNumber" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "region" TEXT,
    "message" TEXT,
    "documentUrls" TEXT[],
    "reviewerId" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoleApplication_status_submittedAt_idx" ON "RoleApplication"("status", "submittedAt");
CREATE INDEX "RoleApplication_userId_idx" ON "RoleApplication"("userId");

-- One open application at a time, enforced by the database rather than by a
-- read-then-write in the route: two simultaneous submissions would both pass a
-- "do you already have one?" check and both insert.
CREATE UNIQUE INDEX "RoleApplication_one_pending_per_user"
    ON "RoleApplication"("userId")
    WHERE "status" = 'PENDING';

ALTER TABLE "RoleApplication" ADD CONSTRAINT "RoleApplication_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoleApplication" ADD CONSTRAINT "RoleApplication_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

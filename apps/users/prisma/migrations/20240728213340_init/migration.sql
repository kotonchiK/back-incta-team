/*
  Warnings:

  - A unique constraint covering the columns `[providerLocalId,sub]` on the table `UsersProvider` will be added. If there are existing duplicate values, this will fail.
  - Made the column `sub` on table `UsersProvider` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UsersProvider" ALTER COLUMN "sub" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UsersProvider_providerLocalId_sub_key" ON "UsersProvider"("providerLocalId", "sub");

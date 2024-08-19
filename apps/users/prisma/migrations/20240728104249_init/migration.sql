/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "password",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsersProvider" (
    "id" TEXT NOT NULL,
    "userLocalId" TEXT NOT NULL,
    "providerLocalId" TEXT NOT NULL,
    "sub" TEXT,
    "email" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "name" TEXT,
    "surname" TEXT,
    "password" TEXT NOT NULL,
    "image" TEXT,
    "emailIsValidated" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsersProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UsersProvider_sub_key" ON "UsersProvider"("sub");

-- CreateIndex
CREATE UNIQUE INDEX "UsersProvider_providerLocalId_email_key" ON "UsersProvider"("providerLocalId", "email");

-- AddForeignKey
ALTER TABLE "UsersProvider" ADD CONSTRAINT "UsersProvider_userLocalId_fkey" FOREIGN KEY ("userLocalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersProvider" ADD CONSTRAINT "UsersProvider_providerLocalId_fkey" FOREIGN KEY ("providerLocalId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

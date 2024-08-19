/*
  Warnings:

  - You are about to drop the column `image` on the `UsersProvider` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UsersProvider" DROP COLUMN "image",
ADD COLUMN     "avatar" TEXT;

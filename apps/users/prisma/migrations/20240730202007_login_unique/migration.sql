/*
  Warnings:

  - A unique constraint covering the columns `[login]` on the table `UsersProvider` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UsersProvider_login_key" ON "UsersProvider"("login");

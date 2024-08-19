-- DropForeignKey
ALTER TABLE "UsersProvider" DROP CONSTRAINT "UsersProvider_userLocalId_fkey";

-- AddForeignKey
ALTER TABLE "UsersProvider" ADD CONSTRAINT "UsersProvider_userLocalId_fkey" FOREIGN KEY ("userLocalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

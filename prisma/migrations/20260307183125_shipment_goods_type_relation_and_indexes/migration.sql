/*
  Warnings:

  - You are about to drop the column `goodsType` on the `Shipment` table. All the data in the column will be lost.
  - Added the required column `goodsTypeId` to the `Shipment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Party_name_key";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "partyId" TEXT NOT NULL,
    "goodsTypeId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "deliveryCity" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shipment_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Shipment_goodsTypeId_fkey" FOREIGN KEY ("goodsTypeId") REFERENCES "GoodsType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Shipment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Shipment" ("createdAt", "customId", "date", "deliveryCity", "id", "notes", "partyId", "price", "size", "updatedAt", "vehicleId", "weight") SELECT "createdAt", "customId", "date", "deliveryCity", "id", "notes", "partyId", "price", "size", "updatedAt", "vehicleId", "weight" FROM "Shipment";
DROP TABLE "Shipment";
ALTER TABLE "new_Shipment" RENAME TO "Shipment";
CREATE UNIQUE INDEX "Shipment_customId_key" ON "Shipment"("customId");
CREATE INDEX "Shipment_date_idx" ON "Shipment"("date");
CREATE INDEX "Shipment_partyId_idx" ON "Shipment"("partyId");
CREATE INDEX "Shipment_vehicleId_idx" ON "Shipment"("vehicleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Party_name_idx" ON "Party"("name");

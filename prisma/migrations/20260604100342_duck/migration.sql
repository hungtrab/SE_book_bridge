/*
  Warnings:

  - You are about to drop the column `search_vector` on the `Listing` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Listing_search_vector_idx";

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "search_vector";

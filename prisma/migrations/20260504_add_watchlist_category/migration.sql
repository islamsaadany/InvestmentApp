-- CreateEnum
CREATE TYPE "WatchlistCategory" AS ENUM ('options', 'us_stocks', 'crypto');

-- AlterTable
ALTER TABLE "watchlist" ADD COLUMN "category" "WatchlistCategory" NOT NULL DEFAULT 'options';

-- DropIndex
DROP INDEX "watchlist_symbol_key";

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_symbol_category_key" ON "watchlist"("symbol", "category");

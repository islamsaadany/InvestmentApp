-- CreateTable
CREATE TABLE "asset_price_history" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "asset_type" "AssetType" NOT NULL,
    "price_usd" DOUBLE PRECISION NOT NULL,
    "recorded_date" DATE NOT NULL,

    CONSTRAINT "asset_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_price_history_recorded_date_idx" ON "asset_price_history"("recorded_date");

-- CreateIndex
CREATE INDEX "asset_price_history_symbol_idx" ON "asset_price_history"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "asset_price_history_symbol_recorded_date_key" ON "asset_price_history"("symbol", "recorded_date");

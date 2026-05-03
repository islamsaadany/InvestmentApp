-- CreateEnum
CREATE TYPE "SplitAction" AS ENUM ('applied', 'skipped');

-- CreateTable
CREATE TABLE "applied_splits" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "split_date" DATE NOT NULL,
    "ratio" VARCHAR(20) NOT NULL,
    "numerator" DOUBLE PRECISION NOT NULL,
    "denominator" DOUBLE PRECISION NOT NULL,
    "action" "SplitAction" NOT NULL,
    "investment_id" INTEGER,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applied_splits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "applied_splits_symbol_split_date_investment_id_key" ON "applied_splits"("symbol", "split_date", "investment_id");

-- CreateIndex
CREATE INDEX "applied_splits_symbol_idx" ON "applied_splits"("symbol");

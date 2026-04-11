const fs = require('fs');
const path = require('path');

const data = fs.readFileSync(path.join(__dirname, 'crypto-data.tsv'), 'utf8');
const lines = data.trim().split('\n').slice(1); // skip header

const symbolMap = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  XRP: 'ripple',
  SOL: 'solana',
  MNT: 'mantle',
};

let sql = `-- Crypto investment transactions\n-- Generated from exchange export data\n-- Each row = one BUY transaction, quantity is net after fees\n-- id is autoincrement, no need to specify\n\n`;

lines.forEach((line, i) => {
  const [currency, contract, type, direction, qty, fee, price, date] = line.split('\t');
  const netQty = parseFloat(qty) + parseFloat(fee); // fee is negative
  const symbol = symbolMap[currency];
  const name = `${currency} Buy #${i + 1}`;
  const isoDate = new Date(date).toISOString();

  sql += `INSERT INTO investments (name, symbol, asset_type, quantity, purchase_price, purchase_currency, purchase_date, notes, valuation_mode, created_at, updated_at)
VALUES ('${name}', '${symbol}', 'crypto', ${netQty}, ${parseFloat(price)}, 'USD', '${isoDate}', '${contract} @ ${price}', 'live', NOW(), NOW());\n\n`;
});

fs.writeFileSync(path.join(__dirname, 'crypto-inserts.sql'), sql);
console.log(`Generated ${lines.length} INSERT statements`);

/**
 * MongoDB Index Creation Script for Transfer Collection
 * 
 * This script creates optimized indexes for the transfer queries in the 
 * reporting-hub-bop-api-svc to improve performance when dealing with 
 * millions of transfers per day.
 * 
 * Run this script using:
 * mongosh <database_name> --file create-transfer-indexes.js
 * 
 * Or connect to your database and run:
 * mongosh "mongodb://username:password@host:port/database_name" --file create-transfer-indexes.js
 */

print("=== MongoDB Transfer Collection Index Creation Script ===");
print("Starting index creation for transaction collection...\n");

const collection = db.transaction;

// Check if collection exists
const collections = db.runCommand("listCollections", {filter: {name: "transaction"}});
if (collections.cursor.firstBatch.length === 0) {
  print("❌ ERROR: 'transaction' collection does not exist!");
  print("Make sure the reporting-aggregator-svc has run and created the collection.");
  quit(1);
}

// Get current document count
const docCount = collection.countDocuments();
print(`📊 Current document count in transaction collection: ${docCount}`);

// Function to create index with error handling
function createIndexSafe(indexSpec, options) {
  try {
    const result = collection.createIndex(indexSpec, options);
    print(`✅ Created: ${options.name}`);
    return result;
  } catch (error) {
    if (error.code === 85) { // Index already exists
      print(`⚠️  Already exists: ${options.name}`);
    } else {
      print(`❌ Failed to create ${options.name}: ${error.message}`);
    }
    return null;
  }
}

print("\n🔧 Creating indexes...\n");

// 1. Primary compound index for date range queries with sorting
print("1. Creating primary date + sort index...");
createIndexSafe(
  { createdAt: -1 },
  { 
    name: "idx_createdAt_desc",
    background: true 
  }
);

// 2. Compound index for date range with common filters
print("2. Creating compound date + state + DFSP index...");
createIndexSafe(
  { 
    createdAt: -1, 
    transferStateEnum: 1, 
    payerDFSP: 1, 
    payeeDFSP: 1 
  },
  { 
    name: "idx_date_state_dfsp",
    background: true 
  }
);

// 3. Index for currency-based queries
print("3. Creating currency index...");
createIndexSafe(
  { 
    sourceCurrency: 1, 
    targetCurrency: 1, 
    createdAt: -1 
  },
  { 
    name: "idx_currency_date",
    background: true 
  }
);

// 4. Index for transaction type queries
print("4. Creating transaction type index...");
createIndexSafe(
  { 
    transactionType: 1, 
    createdAt: -1 
  },
  { 
    name: "idx_transactionType_date",
    background: true 
  }
);

// 5. Index for transferId lookups (exact match queries)
print("5. Creating transferId index...");
createIndexSafe(
  { transferId: 1 },
  { 
    name: "idx_transferId_unique",
    background: true,
    unique: true 
  }
);

// 6. Index for payer party information
print("6. Creating payer party index...");
createIndexSafe(
  { 
    "payerParty.partyIdType": 1, 
    "payerParty.partyIdentifier": 1, 
    createdAt: -1 
  },
  { 
    name: "idx_payer_party_date",
    background: true 
  }
);

// 7. Index for payee party information
print("7. Creating payee party index...");
createIndexSafe(
  { 
    "payeeParty.partyIdType": 1, 
    "payeeParty.partyIdentifier": 1, 
    createdAt: -1 
  },
  { 
    name: "idx_payee_party_date",
    background: true 
  }
);

// 8. Index for conversion state queries (supports $or queries)
print("8. Creating conversion state indexes...");
createIndexSafe(
  { 
    "conversions.payer.conversionState": 1, 
    createdAt: -1 
  },
  { 
    name: "idx_payer_conversion_state",
    background: true 
  }
);

createIndexSafe(
  { 
    "conversions.payee.conversionState": 1, 
    createdAt: -1 
  },
  { 
    name: "idx_payee_conversion_state",
    background: true 
  }
);

// 9. Compound index for settlement window lookups
print("9. Creating settlement window index...");
createIndexSafe(
  { 
    transferSettlementWindowId: 1, 
    createdAt: -1 
  },
  { 
    name: "idx_settlement_window_date",
    background: true 
  }
);

// 10. Sparse index for transactionId (only when present)
print("10. Creating transactionId index...");
createIndexSafe(
  { transactionId: 1 },
  { 
    name: "idx_transactionId",
    background: true,
    sparse: true 
  }
);

print("\n✅ Index creation completed!");

// Display the created indexes
print("\n📋 Current indexes on the transaction collection:");
const indexes = collection.getIndexes();
indexes.forEach(function(index) {
  const keyStr = JSON.stringify(index.key);
  const size = index.unique ? " (UNIQUE)" : "";
  print(`   • ${index.name}: ${keyStr}${size}`);
});

print(`\n📈 Total indexes: ${indexes.length}`);
print("\n🎉 All done! Your transfer queries should now be much faster.");
print("💡 Tip: Monitor query performance using db.transaction.explain('executionStats')");
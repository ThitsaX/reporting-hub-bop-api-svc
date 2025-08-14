import { createTransactionClient } from './clients';
import Logger from '@mojaloop/central-services-logger';

export const initializeTransferIndexes = async (): Promise<void> => {
  const collection = createTransactionClient();
  Logger.info('Starting transfer collection index initialization...');

  const indexes = [
    {
      spec: { createdAt: -1 },
      options: { name: 'idx_createdAt_desc', background: true },
    },
    {
      spec: { transferId: 1 },
      options: { name: 'idx_transferId_unique', background: true, unique: true },
    },
    {
      spec: { createdAt: -1, transferStateEnum: 1, payerDFSP: 1, payeeDFSP: 1 },
      options: { name: 'idx_date_state_dfsp', background: true },
    },
    {
      spec: { sourceCurrency: 1, targetCurrency: 1, createdAt: -1 },
      options: { name: 'idx_currency_date', background: true },
    },
    {
      spec: { transactionType: 1, createdAt: -1 },
      options: { name: 'idx_transactionType_date', background: true },
    },
    {
      spec: { 'payerParty.partyIdType': 1, 'payerParty.partyIdentifier': 1, createdAt: -1 },
      options: { name: 'idx_payer_party_date', background: true },
    },
    {
      spec: { 'payeeParty.partyIdType': 1, 'payeeParty.partyIdentifier': 1, createdAt: -1 },
      options: { name: 'idx_payee_party_date', background: true },
    },
    {
      spec: { 'conversions.payer.conversionState': 1, createdAt: -1 },
      options: { name: 'idx_payer_conversion_state', background: true },
    },
    {
      spec: { 'conversions.payee.conversionState': 1, createdAt: -1 },
      options: { name: 'idx_payee_conversion_state', background: true },
    },
    {
      spec: { transferSettlementWindowId: 1, createdAt: -1 },
      options: { name: 'idx_settlement_window_date', background: true },
    },
    {
      spec: { transactionId: 1 },
      options: { name: 'idx_transactionId', background: true, sparse: true },
    },
  ];

  let createdCount = 0;
  let existingCount = 0;

  for (const index of indexes) {
    try {
      collection.createIndex(index.spec, index.options);
      Logger.info(`✅ Created index: ${index.options.name}`);
      createdCount++;
    } catch (error: any) {
      if (error.code === 85) {
        // Index already exists
        Logger.info(`⚠️  Index already exists: ${index.options.name}`);
        existingCount++;
      } else {
        Logger.error(`❌ Failed to create index ${index.options.name}:`, error);
        throw error;
      }
    }
  }

  Logger.info(`Index initialization completed. Created: ${createdCount}, Existing: ${existingCount}`);
};

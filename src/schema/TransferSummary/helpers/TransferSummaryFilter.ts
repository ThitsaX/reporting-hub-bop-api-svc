// Helper function to create where condition
export const createWhereCondition = (filter: any) => {
  const whereCondition: any = { createdAt: {} };

  if (filter?.startDate) {
    whereCondition.createdAt = { ...(whereCondition.createdAt || {}), $gte: new Date(filter.startDate) };
  }

  if (filter?.endDate) {
    whereCondition.createdAt = { ...(whereCondition.createdAt || {}), $lte: new Date(filter.endDate) };
  }

  if (filter?.transferState) {
    whereCondition.transferState = filter.transferState;
  }
  return whereCondition;

};

// Helper function to create groupBy condition
export const createGroupByCondition = (
  filter: any
): ('sourceCurrency' | 'targetCurrency' | 'payerDFSP' | 'payeeDFSP' | 'errorCode' | 'transferState')[] => {
  const groupByCondition: ('sourceCurrency' | 'targetCurrency' | 'payerDFSP' | 'payeeDFSP' | 'errorCode' | 'transferState')[] = [];
  if (filter?.sourceCurrency) groupByCondition.push('sourceCurrency');
  if (filter?.targetCurrency) groupByCondition.push('targetCurrency');
  if (filter?.payerDFSP) groupByCondition.push('payerDFSP');
  if (filter?.payeeDFSP) groupByCondition.push('payeeDFSP');
  if (filter?.errorCode) groupByCondition.push('errorCode');
  if (filter?.transferState) groupByCondition.push('transferState');
  groupByCondition.push('payerDFSP');
  groupByCondition.push('payeeDFSP');

  return groupByCondition;
};

/**************************************************************************
 *  (C) Copyright Mojaloop Foundation 2020                                *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha <yevhen.kyriukha@modusbox.com>                   *
 **************************************************************************/

import { list, stringArg, extendType, intArg, inputObjectType } from 'nexus';

// Define input type for TransferSummaryFilter
const TransferSummaryFilter = inputObjectType({
  name: 'TransferSummaryFilter',
  definition(t) {
    t.dateTimeFlex('startDate');
    t.dateTimeFlex('endDate');
    t.string('transferState');
  },
});

const Query = extendType({
  type: 'Query',
  definition(t) {
    // Define a field to fetch transfer summaries
    t.nonNull.list.field('transferSummary', {
      type: 'TransferSummary',
      args: {
        limit: intArg(),
        offset: intArg(),
        filter: TransferSummaryFilter,
        groupBy: list(stringArg()),
      },
      resolve: async (parent, args, ctx) => {
        const { limit = 100, offset = 0, filter = {}, groupBy = [] } = args;
        const groupByFields = groupBy && groupBy.length > 0 ? groupBy : null;

        let aggregateResult;

        try {
          const matchFilter: any = {};
          if (filter?.startDate || filter?.endDate) {
            matchFilter.createdAt = {};
            if (filter.startDate) matchFilter.createdAt.$gte = new Date(filter.startDate);
            if (filter.endDate) matchFilter.createdAt.$lte = new Date(filter.endDate);
          }
          if (filter?.transferState) {
            matchFilter.transferState = filter.transferState;
          }
          if (!groupByFields) {
            // Aggregate results without grouping when no group by fields are provided
            const pipeline: any[] = [
              { $match: matchFilter },
            ];
            pipeline.push({
              $group: {
                _id: null,
                _count: { $sum: 1 },
                _sumSourceAmount: { $sum: '$sourceAmount' },
                _sumTargetAmount: { $sum: '$targetAmount' },
              },
            });

            if (offset && offset > 0) pipeline.push({ $skip: offset });
            if (limit && limit > 0) pipeline.push({ $limit: limit });

            const rows = await ctx.transaction.aggregate(pipeline).toArray();
            const r = rows[0] || { _count: 0, _sumSourceAmount: 0, _sumTargetAmount: 0 };

            return [
              {
                group: {
                  errorCode: null,
                  sourceCurrency: null,
                  targetCurrency: null,
                  payerDFSP: null,
                  payeeDFSP: null,
                },
                count: r._count || 0,
                sum: {
                  sourceAmount: r._sumSourceAmount || 0,
                  targetAmount: r._sumTargetAmount || 0,
                },
              },
            ];
          } else {

            // Aggregate results with grouping when group by fields are provided
            const pipeline: any[] = [
              { $match: matchFilter },
              {
                $group: {
                  _id: groupByFields.reduce((acc, field) => {
                    if (field) acc[field] = `$${field}`;
                    return acc;
                  }, {}),
                  _count: { $sum: 1 },
                  _sumSourceAmount: { $sum: '$sourceAmount' },
                  _sumTargetAmount: { $sum: '$targetAmount' },
                },
              },
              { $sort: { _count: -1 } },
            ];

            if (offset > 0) pipeline.push({ $skip: offset });
            if (limit && limit > 0) pipeline.push({ $limit: limit });
            aggregateResult = await ctx.transaction.aggregate(pipeline).toArray();
            const transfersSummary = aggregateResult.map((group) => ({
              group: {
                errorCode: group._id.errorCode || null,
                sourceCurrency: group._id.sourceCurrency || null,
                targetCurrency: group._id.targetCurrency || null,
                payerDFSP: group._id.payerDFSP || null,
                payeeDFSP: group._id.payeeDFSP || null,
                transferState: group._id.transferState || null,
              },
              count: group._count || 0,
              sum: {
                sourceAmount: group._sumSourceAmount || 0,
                targetAmount: group._sumTargetAmount || 0,
              },
            }));
            return transfersSummary;
          }
        } catch (error) {
          console.error('Error fetching transfers:', error);
          throw new Error('Error fetching transfers data');
        } finally {
          aggregateResult = null;
        }
      },
    });
  },
});

export default [Query, TransferSummaryFilter];

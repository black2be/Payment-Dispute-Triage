import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { validate } from './engine/validation.js';
import { triage } from './engine/triage.js';
import type { TriageInput } from './engine/types.js';

export function createRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // Health
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Customers
  router.get('/customers', async (_req, res) => {
    const customers = await prisma.customer.findMany();
    res.json({ customers, total: customers.length });
  });

  router.get('/customers/:id', async (req, res) => {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  });

  // Transactions
  router.get('/transactions', async (req, res) => {
    const where = req.query.customerId ? { customerId: req.query.customerId as string } : {};
    const transactions = await prisma.transaction.findMany({ where });
    res.json({ transactions, total: transactions.length });
  });

  router.get('/transactions/:reference', async (req, res) => {
    const txn = await prisma.transaction.findUnique({ where: { reference: req.params.reference } });
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    res.json(txn);
  });

  // Disputes
  router.post('/disputes', async (req, res) => {
    const errors = validate(req.body);
    if (errors.length > 0) return res.status(400).json({ errors });

    const { customerId, transactionId, paymentType, issueCategory, amount, transactionDate, description } = req.body;

    const today = new Date().toISOString().split('T')[0]!;

    // Look up the transaction to get status
    const txn = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    const input: TriageInput = {
      paymentType,
      issueCategory,
      transactionStatus: txn.status as TriageInput['transactionStatus'],
      amount,
      transactionDate,
    };

    const result = triage(input, today);

    const dispute = await prisma.disputeCase.create({
      data: {
        customerId,
        transactionId,
        paymentType,
        issueCategory,
        amount,
        description: description || null,
        ageDays: result.ageDays,
        ageBand: result.ageBand,
        priority: result.priority,
        recommendedAction: result.action,
        triggeredRuleId: result.triggeredRuleId,
        ruleEvaluations: JSON.stringify(result.ruleEvaluations),
        status: 'OPEN',
      },
    });

    res.status(201).json(dispute);
  });

  router.get('/disputes', async (req, res) => {
    const where: Record<string, string> = {};
    if (req.query.status) where.status = req.query.status as string;
    if (req.query.priority) where.priority = req.query.priority as string;
    if (req.query.paymentType) where.paymentType = req.query.paymentType as string;

    const disputes = await prisma.disputeCase.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { reportedAt: 'asc' }],
    });
    res.json({ disputes, total: disputes.length });
  });

  router.get('/disputes/:id', async (req, res) => {
    const dispute = await prisma.disputeCase.findUnique({ where: { id: req.params.id } });
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    res.json({
      ...dispute,
      ruleEvaluations: JSON.parse(dispute.ruleEvaluations),
    });
  });

  router.get('/disputes/:id/recommendation', async (req, res) => {
    const dispute = await prisma.disputeCase.findUnique({ where: { id: req.params.id } });
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    const txn = await prisma.transaction.findUnique({ where: { id: dispute.transactionId } });
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    const today = new Date().toISOString().split('T')[0]!;
    const input: TriageInput = {
      paymentType: dispute.paymentType as TriageInput['paymentType'],
      issueCategory: dispute.issueCategory as TriageInput['issueCategory'],
      transactionStatus: txn.status as TriageInput['transactionStatus'],
      amount: dispute.amount,
      transactionDate: txn.transactionDate.toISOString().split('T')[0]!,
    };

    const result = triage(input, today);

    res.json({
      disputeId: dispute.id,
      action: result.action,
      reason: result.reason,
      triggeredRuleId: result.triggeredRuleId,
      ruleEvaluations: result.ruleEvaluations,
      priority: result.priority,
      ageBand: result.ageBand,
      generatedAt: new Date().toISOString(),
    });
  });

  router.patch('/disputes/:id/status', async (req, res) => {
    const validStatuses = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'];
    const { status } = req.body;
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }
    const dispute = await prisma.disputeCase.findUnique({ where: { id: req.params.id } });
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    const updated = await prisma.disputeCase.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(updated);
  });

  return router;
}

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import { createRoutes } from '../src/routes.js';

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:./test.db' } },
});

const app = express();
app.use(express.json());
app.use('/api', createRoutes(prisma));

let customerId: string;
let transactionId: string;

beforeAll(async () => {
  await prisma.$executeRaw`DROP TABLE IF EXISTS DisputeCase`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS "Transaction"`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS Customer`;

  // Push schema
  const { execSync } = await import('child_process');
  execSync('npx prisma db push --force-reset', {
    cwd: import.meta.dirname + '/..',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });

  // Seed test data
  const customer = await prisma.customer.create({
    data: { id: 'test-cust-1', name: 'Test Customer', accountNumber: 'ACC-TEST-001' },
  });
  customerId = customer.id;

  const txn = await prisma.transaction.create({
    data: {
      id: 'test-txn-1',
      customerId: customer.id,
      reference: 'REF-TEST-001',
      paymentType: 'EFT',
      amount: 8000,
      status: 'FAILED',
      transactionDate: new Date('2026-06-21'),
    },
  });
  transactionId = txn.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('API — Reference data', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/transactions/:reference hit returns the record', async () => {
    const res = await request(app).get('/api/transactions/REF-TEST-001');
    expect(res.status).toBe(200);
    expect(res.body.reference).toBe('REF-TEST-001');
  });

  it('GET /api/transactions/:reference miss returns 404', async () => {
    const res = await request(app).get('/api/transactions/NONEXISTENT');
    expect(res.status).toBe(404);
  });
});

describe('API — Disputes', () => {
  let disputeId: string;

  it('POST /api/disputes creates dispute with correct triage', async () => {
    const res = await request(app).post('/api/disputes').send({
      customerId,
      transactionId,
      paymentType: 'EFT',
      issueCategory: 'FAILED_TRANSFER',
      amount: 8000,
      transactionDate: '2026-06-21',
    });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('MEDIUM');
    expect(res.body.recommendedAction).toBe('RESOLVE_IMMEDIATELY');
    expect(res.body.triggeredRuleId).toBe('R1-FAILED-RECENT');
    disputeId = res.body.id;
  });

  it('GET /api/disputes/:id returns the stored case with ruleEvaluations', async () => {
    const res = await request(app).get(`/api/disputes/${disputeId}`);
    expect(res.status).toBe(200);
    expect(res.body.ruleEvaluations).toBeInstanceOf(Array);
    expect(res.body.ruleEvaluations.length).toBe(6);
  });

  it('GET /api/disputes/:id/recommendation returns correct action for case B', async () => {
    const res = await request(app).get(`/api/disputes/${disputeId}/recommendation`);
    expect(res.status).toBe(200);
    expect(res.body.action).toBe('RESOLVE_IMMEDIATELY');
    expect(res.body.triggeredRuleId).toBe('R1-FAILED-RECENT');
    expect(res.body.ruleEvaluations).toBeInstanceOf(Array);
  });

  it('POST /api/disputes with future date returns 400', async () => {
    const res = await request(app).post('/api/disputes').send({
      customerId,
      transactionId,
      paymentType: 'EFT',
      issueCategory: 'FAILED_TRANSFER',
      amount: 1000,
      transactionDate: '2030-01-01',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e: { field: string }) => e.field === 'transactionDate')).toBe(true);
  });

  it('POST /api/disputes with invalid enum returns 400 naming the field', async () => {
    const res = await request(app).post('/api/disputes').send({
      customerId,
      transactionId,
      paymentType: 'INVALID_TYPE',
      issueCategory: 'FAILED_TRANSFER',
      amount: 1000,
      transactionDate: '2026-06-20',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e: { field: string }) => e.field === 'paymentType')).toBe(true);
  });

  it('PATCH /api/disputes/:id/status updates lifecycle status', async () => {
    const res = await request(app).patch(`/api/disputes/${disputeId}/status`).send({ status: 'IN_REVIEW' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_REVIEW');
  });
});

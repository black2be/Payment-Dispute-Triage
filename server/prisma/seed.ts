import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean
  await prisma.disputeCase.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();

  // Customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { id: 'cust-001', name: 'Customer Alpha', accountNumber: 'ACC-MOCK-001' } }),
    prisma.customer.create({ data: { id: 'cust-002', name: 'Customer Beta', accountNumber: 'ACC-MOCK-002' } }),
    prisma.customer.create({ data: { id: 'cust-003', name: 'Customer Gamma', accountNumber: 'ACC-MOCK-003' } }),
    prisma.customer.create({ data: { id: 'cust-004', name: 'Customer Delta', accountNumber: 'ACC-MOCK-004' } }),
    prisma.customer.create({ data: { id: 'cust-005', name: 'Customer Epsilon', accountNumber: 'ACC-MOCK-005' } }),
  ]);

  // Transactions
  await Promise.all([
    prisma.transaction.create({ data: { id: 'txn-001', customerId: customers[0]!.id, reference: 'TXN-001', paymentType: 'CARD_PAYMENT', amount: 12500, status: 'COMPLETED', transactionDate: new Date('2026-06-20') } }),
    prisma.transaction.create({ data: { id: 'txn-002', customerId: customers[1]!.id, reference: 'TXN-002', paymentType: 'EFT', amount: 3200, status: 'FAILED', transactionDate: new Date('2026-06-21') } }),
    prisma.transaction.create({ data: { id: 'txn-003', customerId: customers[2]!.id, reference: 'TXN-003', paymentType: 'INTERNAL_TRANSFER', amount: 250, status: 'COMPLETED', transactionDate: new Date('2026-06-22') } }),
    prisma.transaction.create({ data: { id: 'txn-004', customerId: customers[3]!.id, reference: 'TXN-004', paymentType: 'CARD_PAYMENT', amount: 780, status: 'PENDING', transactionDate: new Date('2026-06-10') } }),
    prisma.transaction.create({ data: { id: 'txn-005', customerId: customers[4]!.id, reference: 'TXN-005', paymentType: 'EFT', amount: 6800, status: 'COMPLETED', transactionDate: new Date('2026-05-15') } }),
    prisma.transaction.create({ data: { id: 'txn-006', customerId: customers[0]!.id, reference: 'TXN-006', paymentType: 'CARD_PAYMENT', amount: 150, status: 'COMPLETED', transactionDate: new Date('2026-06-23') } }),
    prisma.transaction.create({ data: { id: 'txn-007', customerId: customers[1]!.id, reference: 'TXN-007', paymentType: 'INTERNAL_TRANSFER', amount: 4500, status: 'FAILED', transactionDate: new Date('2026-06-18') } }),
    prisma.transaction.create({ data: { id: 'txn-008', customerId: customers[2]!.id, reference: 'TXN-008', paymentType: 'EFT', amount: 9200, status: 'PENDING', transactionDate: new Date('2026-05-01') } }),
    prisma.transaction.create({ data: { id: 'txn-009', customerId: customers[3]!.id, reference: 'TXN-009', paymentType: 'CARD_PAYMENT', amount: 320, status: 'REVERSED', transactionDate: new Date('2026-06-19') } }),
    prisma.transaction.create({ data: { id: 'txn-010', customerId: customers[4]!.id, reference: 'TXN-010', paymentType: 'INTERNAL_TRANSFER', amount: 1500, status: 'COMPLETED', transactionDate: new Date('2026-06-12') } }),
    prisma.transaction.create({ data: { id: 'txn-011', customerId: customers[0]!.id, reference: 'TXN-011', paymentType: 'EFT', amount: 50, status: 'FAILED', transactionDate: new Date('2026-06-22') } }),
    prisma.transaction.create({ data: { id: 'txn-012', customerId: customers[1]!.id, reference: 'TXN-012', paymentType: 'CARD_PAYMENT', amount: 2100, status: 'COMPLETED', transactionDate: new Date('2026-06-05') } }),
    prisma.transaction.create({ data: { id: 'txn-013', customerId: customers[2]!.id, reference: 'TXN-013', paymentType: 'INTERNAL_TRANSFER', amount: 7500, status: 'COMPLETED', transactionDate: new Date('2026-06-01') } }),
    prisma.transaction.create({ data: { id: 'txn-014', customerId: customers[3]!.id, reference: 'TXN-014', paymentType: 'EFT', amount: 430, status: 'PENDING', transactionDate: new Date('2026-06-20') } }),
    prisma.transaction.create({ data: { id: 'txn-015', customerId: customers[4]!.id, reference: 'TXN-015', paymentType: 'CARD_PAYMENT', amount: 1800, status: 'FAILED', transactionDate: new Date('2026-04-15') } }),
  ]);

  console.log('Seeded 5 customers and 15 transactions.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

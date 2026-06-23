import { test, expect } from '@playwright/test';

test.describe('Payment Dispute Triage — E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with heading and form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Payment Dispute Triage' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Triage Dispute' })).toBeVisible();
  });

  test('TC-001: all required fields are enterable', async ({ page }) => {
    // Customer name
    await page.locator('#customerName').fill('Test Customer');
    await expect(page.locator('#customerName')).toHaveValue('Test Customer');
    // Transaction reference
    await page.locator('#transactionId').fill('REF-123');
    await expect(page.locator('#transactionId')).toHaveValue('REF-123');
    // Transaction date
    await page.locator('#disputeDate').fill('2026-06-01');
    await expect(page.locator('#disputeDate')).toHaveValue('2026-06-01');
    // Amount
    await page.locator('#amount').fill('1500');
    await expect(page.locator('#amount')).toHaveValue('1500');
    // Payment Type
    await page.locator('#paymentType').selectOption('Card Payment');
    await expect(page.locator('#paymentType')).toHaveValue('Card Payment');
    // Issue Category
    await page.locator('#issueCategory').selectOption('Duplicate Debit');
    await expect(page.locator('#issueCategory')).toHaveValue('Duplicate Debit');
    // Transaction Status
    await page.locator('#transactionStatus').selectOption('Completed');
    await expect(page.locator('#transactionStatus')).toHaveValue('Completed');
    // Description (optional)
    await page.locator('#description').fill('Test dispute description');
    await expect(page.locator('#description')).toHaveValue('Test dispute description');
  });

  test('TC-002: valid form submits successfully and shows triage result', async ({ page }) => {
    await page.locator('#customerName').fill('Valid Customer');
    await page.locator('#transactionId').fill('REF-VALID');
    await page.locator('#paymentType').selectOption('Card Payment');
    await page.locator('#issueCategory').selectOption('Duplicate Debit');
    await page.locator('#transactionStatus').selectOption('Completed');
    await page.locator('#amount').fill('600');
    await page.locator('#disputeDate').fill('2026-06-20');

    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    // No validation errors
    await expect(page.getByRole('alert')).not.toBeVisible();
    // Triage result appears
    await expect(page.getByText('Triage Result')).toBeVisible();
    await expect(page.getByText('Rule Evaluations')).toBeVisible();
  });

  test('TC-003: shows customer name required on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Triage Dispute' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Customer name is required')).toBeVisible();
    await expect(page.getByText('Transaction ID is required')).toBeVisible();
  });

  test('selecting mock transaction fills the form', async ({ page }) => {
    await page.getByLabel('Load from mock data').selectOption('TXN-001');
    await expect(page.locator('#transactionId')).toHaveValue('TXN-001');
    await expect(page.locator('#amount')).toHaveValue('12500');
  });

  test('triaging an unauthorized transaction shows Escalate', async ({ page }) => {
    await page.getByLabel('Load from mock data').selectOption('TXN-001');
    await page.locator('#customerName').fill('Customer Alpha');
    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByText('Escalate', { exact: true })).toBeVisible();
    await expect(page.getByText('Priority: High')).toBeVisible();
    await expect(page.getByText('R3-UNAUTH-HIGHVAL').first()).toBeVisible();
  });

  test('triaging a low-value duplicate shows Investigate Further', async ({ page }) => {
    await page.getByLabel('Load from mock data').selectOption('TXN-003');
    await page.locator('#customerName').fill('Customer Gamma');
    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByText('Investigate Further', { exact: true })).toBeVisible();
    await expect(page.getByText('R2-DUP-COMPLETED').first()).toBeVisible();
  });

  test('triaging a recent failed transaction shows Resolve Immediately', async ({ page }) => {
    await page.getByLabel('Load from mock data').selectOption('TXN-002');
    await page.locator('#customerName').fill('Customer Beta');
    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByText('Resolve Immediately', { exact: true })).toBeVisible();
    await expect(page.getByText('R1-FAILED-RECENT').first()).toBeVisible();
  });

  test('rule evaluations panel shows all rules', async ({ page }) => {
    await page.getByLabel('Load from mock data').selectOption('TXN-004');
    await page.locator('#customerName').fill('Customer Delta');
    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByText('Rule Evaluations')).toBeVisible();
    await expect(page.getByText('R6-DEFAULT').first()).toBeVisible();
  });

  test('TC-040: dispute summary shows all required fields', async ({ page }) => {
    await page.getByLabel('Load from mock data').selectOption('TXN-002');
    await page.locator('#customerName').fill('Summary Customer');
    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByText('Dispute Summary')).toBeVisible();
    await expect(page.getByText('Summary Customer')).toBeVisible();
    // Verify key fields are in the summary (use role definitions to avoid dropdown conflicts)
    const summary = page.locator('dl');
    await expect(summary.getByText('TXN-002')).toBeVisible();
    await expect(summary.getByText('EFT')).toBeVisible();
    await expect(summary.getByText('Failed Transfer')).toBeVisible();
  });

  test('manual form entry works end-to-end', async ({ page }) => {
    await page.locator('#customerName').fill('Manual Customer');
    await page.locator('#transactionId').fill('TXN-MANUAL');
    await page.locator('#paymentType').selectOption('Internal Transfer');
    await page.locator('#issueCategory').selectOption('Failed Transfer');
    await page.locator('#transactionStatus').selectOption('Completed');
    await page.locator('#amount').fill('5000');
    await page.locator('#disputeDate').fill('2026-06-08');

    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByText('Refer to Another Team', { exact: true })).toBeVisible();
  });

  test('TC-036: pre-populate transaction status for valid reference', async ({ page }) => {
    await page.locator('#transactionId').fill('TXN-001');
    await page.locator('#transactionId').blur();

    await expect(page.getByText('Transaction found')).toBeVisible();
    await expect(page.locator('#transactionStatus')).toHaveValue('Completed');
    await expect(page.getByText('(from lookup)')).toBeVisible();
  });

  test('TC-012: rejects future transaction date with error message', async ({ page }) => {
    await page.locator('#customerName').fill('Future Customer');
    await page.locator('#transactionId').fill('TXN-FUTURE');
    await page.locator('#paymentType').selectOption('Card Payment');
    await page.locator('#issueCategory').selectOption('Duplicate Debit');
    await page.locator('#transactionStatus').selectOption('Completed');
    await page.locator('#amount').fill('500');
    await page.locator('#disputeDate').fill('2030-01-01');

    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Transaction date cannot be a future date')).toBeVisible();
    await expect(page.getByText('Triage Result')).not.toBeVisible();
  });
});

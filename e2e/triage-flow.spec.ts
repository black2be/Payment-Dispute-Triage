import { test, expect } from '@playwright/test';

test.describe('Payment Dispute Triage — E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with heading and form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Payment Dispute Triage' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Triage Dispute' })).toBeVisible();
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Triage Dispute' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Transaction ID is required')).toBeVisible();
  });

  test('selecting mock transaction fills the form', async ({ page }) => {
    await page.getByLabel('Load from mock data').selectOption('TXN-001');
    await expect(page.locator('#transactionId')).toHaveValue('TXN-001');
    await expect(page.locator('#amount')).toHaveValue('12500');
  });

  test('triaging an unauthorized transaction shows Escalate', async ({ page }) => {
    await page.getByLabel('Load from mock data').selectOption('TXN-001');
    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByText('Escalate', { exact: true })).toBeVisible();
    await expect(page.getByText('Priority: High')).toBeVisible();
    await expect(page.getByText('R3-UNAUTH').first()).toBeVisible();
  });

  test('triaging a low-value duplicate shows Resolve Immediately', async ({ page }) => {
    await page.getByLabel('Load from mock data').selectOption('TXN-003');
    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByText('Resolve Immediately', { exact: true })).toBeVisible();
    await expect(page.getByText('R2-LOW-DUP-COMPLETE').first()).toBeVisible();
  });

  test('triaging a recent failed transaction shows Resolve Immediately', async ({ page }) => {
    await page.getByLabel('Load from mock data').selectOption('TXN-002');
    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByText('Resolve Immediately', { exact: true })).toBeVisible();
    await expect(page.getByText('R1-FAILED-RECENT').first()).toBeVisible();
  });

  test('rule evaluations panel shows all rules', async ({ page }) => {
    await page.getByLabel('Load from mock data').selectOption('TXN-004');
    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByText('Rule Evaluations')).toBeVisible();
    await expect(page.getByText('R6-DEFAULT').first()).toBeVisible();
  });

  test('manual form entry works end-to-end', async ({ page }) => {
    await page.locator('#transactionId').fill('TXN-MANUAL');
    await page.locator('#paymentType').selectOption('EFT');
    await page.locator('#issueCategory').selectOption('Missing Payment');
    await page.locator('#transactionStatus').selectOption('Pending');
    await page.locator('#amount').fill('800');
    await page.locator('#disputeDate').fill('2026-06-20');

    await page.getByRole('button', { name: 'Triage Dispute' }).click();

    await expect(page.getByText('Refer to Another Team', { exact: true })).toBeVisible();
  });
});

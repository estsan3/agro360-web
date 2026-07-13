import { expect, test } from '@playwright/test';

/**
 * Flujo crítico end-to-end: login → crear despacho con viaje →
 * verlo reflejado en gestión operativa → cerrar sesión.
 * Corre contra el mock de API (environment.mockApi).
 */
test('login → crear despacho → gestión operativa → logout', async ({ page }) => {
  // --- Login ---
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@agro360.com');
  await page.fill('input[type="password"]', 'demo12345');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/despachos/);

  // --- Crear despacho con un viaje ---
  await page.fill('input[placeholder="Campaña Soja 2026"]', 'Campaña E2E');
  const selects = page.locator('select');
  await selects.nth(0).selectOption({ label: 'Agro SA' });
  await selects.nth(1).selectOption({ label: 'Campo Norte' });
  await page.fill('input[placeholder="Rosario, Santa Fe"]', 'Rosario, Santa Fe');
  await selects.nth(2).selectOption({ label: 'Soja' });
  await selects.nth(3).selectOption({ index: 1 });
  await selects.nth(4).selectOption({ index: 1 });
  await page.locator('input[type="date"]').first().fill('2026-09-01');

  await selects.nth(5).selectOption({ index: 1 });
  await page.fill('input[placeholder="Buenos Aires - Puerto"]', 'Buenos Aires - Puerto');
  await page.fill('input[type="number"]', '28.5');
  await page.getByRole('button', { name: /Agregar viaje/ }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);

  await page.getByRole('button', { name: /Enviar Despacho/ }).click();
  await expect(page.getByText('creado correctamente')).toBeVisible();

  // --- Verlo en gestión operativa (comunicación vía store + recarga) ---
  await page.click('button[aria-label="Gestión operativa"]');
  await expect(page.getByText('Campaña E2E')).toBeVisible();

  // --- Logout desde configuración ---
  await page.click('button[aria-label="Configuración"]');
  await page.getByRole('tab', { name: 'Mi cuenta' }).click();
  await page.getByRole('button', { name: /Cerrar sesión/ }).click();
  await expect(page).toHaveURL(/\/login/);
});

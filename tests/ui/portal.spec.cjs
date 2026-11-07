const { test, expect } = require("@playwright/test");
const fs = require("fs");
fs.mkdirSync("qa-artifacts", { recursive: true });
async function login(page, admin = false) {
  await page.goto("/");
  await page
    .getByLabel("Alamat email", { exact: true })
    .fill(admin ? "admin@otban1.id" : "magang@otban1.id");
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill(admin ? "AdminOtban2026!" : "MagangOtban2026!");
  await page.getByRole("button", { name: "Masuk ke dashboard" }).click();
  await expect(page.getByRole("button", { name: "Keluar akun" })).toBeVisible();
}
async function overflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
}
test("Login dan seluruh halaman admin", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.screenshot({
    path: "qa-artifacts/login-desktop.png",
    fullPage: true, animations: "disabled",
  });
  await login(page, true);
  await expect(page.getByText("Perjalanan magang yang")).toBeVisible();
  await page.screenshot({
    path: "qa-artifacts/admin-desktop.png",
    fullPage: true, animations: "disabled",
  });
  await overflow(page);
  for (const name of [
    "Peserta magang",
    "Presensi & izin",
    "Ulasan logbook",
    "Rekap & laporan",
    "Pengumuman",
    "Pengaturan kantor",
    "Profil & keamanan",
  ]) {
    await page.getByRole("button", { name, exact: true }).first().click();
    await expect(page.locator("main")).toBeVisible();
    await overflow(page);
  }
  expect(errors).toEqual([]);
});
test("Pergantian akun admin ke peserta mereset halaman", async ({ page }) => {
  await login(page, true);
  await page
    .getByRole("button", { name: "Pengaturan kantor", exact: true })
    .click();
  await page.getByRole("button", { name: "Keluar akun" }).click();
  await login(page, false);
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pengaturan kantor", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "qa-artifacts/peserta-desktop.png",
    fullPage: true, animations: "disabled",
  });
  for (const name of [
    "Riwayat presensi",
    "Izin & sakit",
    "Logbook harian",
    "Pengumuman",
    "Profil & keamanan",
  ]) {
    await page.getByRole("button", { name, exact: true }).first().click();
    await overflow(page);
  }
});
test("Logbook ditinjau lalu terbaca peserta", async ({ page }) => {
  await login(page, true);
  await page
    .getByRole("button", { name: "Ulasan logbook", exact: true })
    .click();
  await page.getByRole("button", { name: "Lihat detail" }).first().click();
  await page
    .getByLabel("Catatan ulasan")
    .fill("Dokumentasi sudah baik. Pertahankan.");
  await page.getByRole("button", { name: "Setujui", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("tbody").getByText("Disetujui")).toBeVisible();
});
test("Navigasi mobile kedua peran tanpa overflow", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, false);
  await overflow(page);
  await page.screenshot({
    path: "qa-artifacts/peserta-mobile.png",
    fullPage: true, animations: "disabled",
  });
  for (const name of [
    "Riwayat presensi",
    "Izin & sakit",
    "Logbook harian",
    "Pengumuman",
    "Profil & keamanan",
  ]) {
    await page.getByRole("button", { name: "Buka menu", exact: true }).click();
    await page.getByRole("button", { name, exact: true }).first().click();
    await overflow(page);
  }
  await page.getByRole("button", { name: "Buka menu", exact: true }).click();
  await page.getByRole("button", { name: "Keluar akun" }).click();
  await login(page, true);
  await overflow(page);
  await page.screenshot({
    path: "qa-artifacts/admin-mobile.png",
    fullPage: true, animations: "disabled",
  });
  for (const name of [
    "Peserta magang",
    "Presensi & izin",
    "Ulasan logbook",
    "Rekap & laporan",
    "Pengumuman",
    "Pengaturan kantor",
    "Profil & keamanan",
  ]) {
    await page.getByRole("button", { name: "Buka menu", exact: true }).click();
    await page.getByRole("button", { name, exact: true }).first().click();
    await overflow(page);
  }
  expect(errors).toEqual([]);
});

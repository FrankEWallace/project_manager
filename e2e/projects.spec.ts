import { test, expect, type Page } from "@playwright/test";

// Shared sign-in helper — reused across tests in this file
async function signIn(page: Page) {
  const email = process.env["E2E_USER_EMAIL"] ?? "test@example.com";
  const password = process.env["E2E_USER_PASSWORD"] ?? "testpassword123";

  await page.goto("/sign-in");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Wait for redirect to /projects
  await page.waitForURL(/projects/, { timeout: 10_000 });
}

test.describe("Projects page", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("renders page heading and New project button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
    await expect(page.getByRole("link", { name: /new project/i })).toBeVisible();
  });

  test("shows status filter tabs", async ({ page }) => {
    for (const label of ["All", "Active", "On hold", "Completed", "Draft"]) {
      await expect(page.getByRole("button", { name: new RegExp(label, "i") }).first()).toBeVisible();
    }
  });

  test("empty state shows create prompt when no projects", async ({ page }) => {
    // Only runs correctly on a fresh workspace — skip if table has rows
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    if (count > 0) test.skip();

    await expect(page.getByText("No projects yet")).toBeVisible();
    await expect(page.getByRole("link", { name: /create project/i })).toBeVisible();
  });
});

test.describe("Create project flow", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("New project button navigates to /projects/new", async ({ page }) => {
    await page.getByRole("link", { name: /new project/i }).first().click();
    await expect(page).toHaveURL(/projects\/new/);
  });
});

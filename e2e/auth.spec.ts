import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("unauthenticated root redirects to sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated /projects redirects to sign-in", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("sign-in page renders form fields", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("sign-in with invalid credentials shows error", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill("#email", "nobody@example.com");
    await page.fill("#password", "wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("p.text-destructive, [class*='destructive']")).toBeVisible({ timeout: 5000 });
  });

  test("sign-up link navigates to sign-up page", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: /create one/i }).click();
    await expect(page).toHaveURL(/sign-up/);
  });
});

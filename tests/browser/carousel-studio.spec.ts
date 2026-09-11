import { test, expect } from "@playwright/test";

test.describe("Carousel Studio responsive surfaces", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([
      { name: "pp_session", value: "playwright-carousel", domain: "localhost", path: "/" },
    ]);
    await page.route("https://identitytoolkit.googleapis.com/**", (route) =>
      route.fulfill({ json: { users: [{ localId: "carousel-test-user", email: "carousel@example.test", emailVerified: true, providerUserInfo: [] }] } }),
    );
    await page.goto("/login");
    await page.evaluate(async () => {
      const request = indexedDB.open("firebaseLocalStorageDb", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" });
      await new Promise<void>((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("firebaseLocalStorage", "readwrite");
          const token = [btoa(JSON.stringify({ alg: "none" })), btoa(JSON.stringify({ sub: "carousel-test-user", user_id: "carousel-test-user", aud: "postplanify-best", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })), "test"].join(".");
          tx.objectStore("firebaseLocalStorage").put({ fbase_key: "firebase:authUser:AIzaSyDUuJypP-JqfOZ7s6swLDemSZS9eTCRcOQ:[DEFAULT]", value: { uid: "carousel-test-user", email: "carousel@example.test", emailVerified: true, isAnonymous: false, providerData: [], stsTokenManager: { refreshToken: "test", accessToken: token, expirationTime: Date.now() + 3600000 }, createdAt: "1", lastLoginAt: "1", apiKey: "AIzaSyDUuJypP-JqfOZ7s6swLDemSZS9eTCRcOQ", appName: "[DEFAULT]" } });
          tx.oncomplete = () => { db.close(); resolve(); };
        };
      });
    });
    await page.route("**/api/carousels/folders", (route) =>
      route.fulfill({ json: { folders: [] } }),
    );
    await page.route("**/api/carousels/brand-kits", (route) =>
      route.fulfill({ json: { brandKits: [] } }),
    );
    await page.route("**/api/carousels/list**", (route) =>
      route.fulfill({ json: { items: [], counts: {}, total: 0, nextOffset: null } }),
    );
    await page.route("**/api/carousels/templates", (route) =>
      route.fulfill({ json: { templates: [] } }),
    );
  });

  test("hub stays usable on mobile and exposes the empty state", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard/carousels");
    await expect(page.getByRole("heading", { name: "Carousel Studio" })).toBeVisible();
    await expect(page.getByText("Your first carousel starts here")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });

  test("templates keep a keyboard-accessible responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1112 });
    await page.goto("/dashboard/carousels/templates");
    await expect(page.getByRole("heading", { name: "Carousel Templates" })).toBeVisible();
    await expect(page.getByLabel("Search templates")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
});

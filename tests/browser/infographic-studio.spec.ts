import { test, expect } from "@playwright/test";
import {
  newDocument,
  sampleDocument,
} from "../../src/lib/infographic-studio/document";
test("studio flows preserve content, save manually, and show desktop/mobile previews", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "pp_session",
      value: "local-studio-test",
      domain: "localhost",
      path: "/",
    },
  ]);
  // Seed only this isolated browser's Firebase persistence; all HTTP APIs are mocked below.
  await page.route("https://identitytoolkit.googleapis.com/**", (route) =>
    route.fulfill({
      json: {
        users: [
          {
            localId: "studio-test-user",
            email: "studio@example.test",
            emailVerified: true,
            providerUserInfo: [],
          },
        ],
      },
    }),
  );
  await page.goto("/login");
  await page.evaluate(async () => {
    const request = indexedDB.open("firebaseLocalStorageDb", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("firebaseLocalStorage", {
        keyPath: "fbase_key",
      });
    await new Promise<void>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const tx = request.result.transaction(
          "firebaseLocalStorage",
          "readwrite",
        );
        const key =
          "firebase:authUser:AIzaSyDUuJypP-JqfOZ7s6swLDemSZS9eTCRcOQ:[DEFAULT]";
        const token = [
          btoa(JSON.stringify({ alg: "none" })),
          btoa(
            JSON.stringify({
              sub: "studio-test-user",
              user_id: "studio-test-user",
              aud: "postplanify-best",
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + 3600,
            }),
          ),
          "test",
        ].join(".");
        tx.objectStore("firebaseLocalStorage").put({
          fbase_key: key,
          value: {
            uid: "studio-test-user",
            email: "studio@example.test",
            emailVerified: true,
            isAnonymous: false,
            providerData: [],
            stsTokenManager: {
              refreshToken: "test",
              accessToken: token,
              expirationTime: Date.now() + 3600000,
            },
            createdAt: "1",
            lastLoginAt: "1",
            apiKey: "AIzaSyDUuJypP-JqfOZ7s6swLDemSZS9eTCRcOQ",
            appName: "[DEFAULT]",
          },
        });
        tx.oncomplete = () => {
          request.result.close();
          resolve();
        };
      };
    });
  });
  let saves = 0;
  let reads = 0;
  let project = {
    id: "project-one",
    revision: 1,
    mode: "structured",
    title: "Existing project",
    document: sampleDocument("checklist"),
    updatedAt: "2026-09-11T10:00:00.000Z",
    createdAt: "2026-09-11T10:00:00.000Z",
    ownerUid: "test",
  };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/infographics/fonts") return route.continue();
    if (path.endsWith("/export")) return route.fulfill({ contentType: "image/svg+xml", headers: { "Content-Disposition": 'attachment; filename="infographic.svg"' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><text x="64" y="100">Test handoff</text></svg>' });
    if (path === "/api/infographics/brands")
      return route.fulfill({
        json: {
          presets: [],
          defaultId: "",
          workspaceBrand: newDocument().brand,
        },
      });
    if (path.startsWith("/api/infographics/projects")) {
      if (route.request().method() === "GET") {
        reads++;
        return route.fulfill({
          json: path.endsWith("projects")
            ? { items: [project], nextCursor: null }
            : { project },
        });
      }
      saves++;
      const data = route.request().postDataJSON();
      project = {
        ...project,
        document: data.document,
        title: data.document.title,
        revision: project.revision + 1,
      };
      return route.fulfill({ json: { project } });
    }
    return route.fulfill({
      json: { ok: true, items: [], workspaces: [], accounts: [], profiles: [] },
    });
  });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/dashboard/infographics");
  await expect(
    page.getByRole("heading", { name: "A strong starting point" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Existing project" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await page.screenshot({
    path: "test-results/infographic-home.png",
    fullPage: true,
  });
  const initialReads = reads;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect.poll(() => reads).toBe(initialReads + 1);
  await page
    .getByRole("link", { name: "Create infographic", exact: true })
    .click();
  await page
    .getByLabel("Headline / offer title")
    .fill("A better creative workflow");
  await page
    .getByLabel("Your facts and supporting details")
    .fill("Prepare your content\nReview the details\nShare your work");
  await page
    .getByRole("button", { name: "Prepare outline", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Content sections" }),
  ).toBeVisible();
  expect(saves).toBe(0);
  await page
    .getByRole("button", { name: "3. Design and edit", exact: true })
    .click();
  await page
    .getByLabel("Text", { exact: true })
    .fill("Prepare a clear creative brief");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByLabel("Text", { exact: true })).toHaveValue(
    "Prepare your content",
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.getByLabel("Text", { exact: true })).toHaveValue(
    "Prepare a clear creative brief",
  );
  expect(saves).toBe(0);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved successfully" }),
  ).toBeVisible();
  expect(saves).toBe(1);
  await page.screenshot({
    path: "test-results/infographic-editor.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "canvas", exact: true }).click();
  await page.screenshot({
    path: "test-results/infographic-mobile.png",
    fullPage: true,
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
  await page.getByRole("button", { name: "4. Export or create post", exact: true }).click();
  await page.getByRole("checkbox", { name: "I reviewed the content and confirmed its claims." }).check();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG", exact: true }).click();
  expect((await download).suggestedFilename()).toContain(".svg");
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.getByRole("link", { name: "All infographics" }).click();
  await page.getByRole("link", { name: /Bring an offer or URL/ }).click();
  await expect(page.getByLabel("Starting point")).toHaveValue("offer");
  await page.getByLabel("Headline / offer title").fill("A supplied offer");
  await page.getByLabel("Your facts and supporting details").fill("Includes a planning session\nIncludes a written summary");
  await page.getByRole("button", { name: "Prepare outline", exact: true }).click();
  await page.getByRole("button", { name: "1. Brief", exact: true }).click();
  await expect(page.getByLabel("Headline / offer title")).toHaveValue("A supplied offer");
  await page.getByRole("button", { name: "4. Export or create post", exact: true }).click();
  await page.getByRole("checkbox", { name: "I reviewed the content and confirmed its claims." }).check();
  const offerDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG", exact: true }).click();
  expect((await offerDownload).suggestedFilename()).toContain(".svg");
});

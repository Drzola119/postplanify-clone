"use server";

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getCurrentUser } from "@/lib/firebase/admin";
import { isAdminUser } from "@/lib/firebase/admin-auth";
import { logAdminAudit, revalidateHelper } from "@/app/admin/actions";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user)) {
    throw new Error("Unauthorized: Admin privileges required.");
  }
  return user;
}

const LOCALES = ["en", "fr", "ar"] as const;
type Locale = (typeof LOCALES)[number];

function localePath(locale: string) {
  return join(process.cwd(), "messages", `${locale}.json`);
}

type JsonRecord = { [key: string]: string | JsonRecord };

function readLocale(locale: string): JsonRecord {
  const file = localePath(locale);
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, "utf8"));
}

function flatten(obj: JsonRecord, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = typeof v === "string" ? v : JSON.stringify(v);
    }
  }
  return out;
}

export interface TranslationRow {
  key: string;
  values: Record<string, string>;
  missingIn: string[];
  extraIn: string[];
  hasPlaceholders: boolean;
}

export async function getTranslationsOverview(): Promise<{
  rows: TranslationRow[];
  locales: string[];
  namespaces: string[];
  totalKeys: number;
}> {
  await requireAdmin();
  const data: Record<string, Record<string, string>> = {};
  for (const loc of LOCALES) data[loc] = flatten(readLocale(loc));

  const base = data.en ?? {};
  const allKeys = new Set<string>();
  for (const loc of LOCALES) Object.keys(data[loc]).forEach((k) => allKeys.add(k));

  const enKeys = new Set(Object.keys(base));
  const rows: TranslationRow[] = Array.from(allKeys)
    .sort()
    .map((key) => {
      const values: Record<string, string> = {};
      const missingIn: string[] = [];
      const extraIn: string[] = [];
      for (const loc of LOCALES) {
        if (data[loc][key] !== undefined) values[loc] = data[loc][key];
        else missingIn.push(loc);
      }
      if (enKeys.has(key)) {
        for (const loc of LOCALES) {
          if (loc !== "en" && !Object.keys(data[loc]).includes(key)) missingIn.push(loc);
        }
      } else {
        extraIn.push("en");
      }
      const enVal = base[key] ?? values.en ?? "";
      const hasPlaceholders = /\{[^}]+\}/.test(enVal);
      return { key, values, missingIn: Array.from(new Set(missingIn)), extraIn, hasPlaceholders };
    });

  const namespaces = Array.from(
    new Set(rows.map((r) => r.key.split(".")[0]))
  ).sort();

  return { rows, locales: [...LOCALES], namespaces, totalKeys: enKeys.size };
}

export async function updateTranslationAction(key: string, locale: string, value: string) {
  await requireAdmin();
  if (!LOCALES.includes(locale as Locale)) throw new Error("Invalid locale");
  const file = localePath(locale);
  if (!existsSync(file)) throw new Error(`Locale file ${locale} not found`);
  const json: JsonRecord = JSON.parse(readFileSync(file, "utf8"));

  const parts = key.split(".");
  let node: JsonRecord = json;
  for (let i = 0; i < parts.length - 1; i++) {
    const segment = parts[i];
    if (typeof node[segment] !== "object" || node[segment] === null) node[segment] = {};
    node = node[segment] as JsonRecord;
  }
  node[parts[parts.length - 1]] = value;

  writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  await logAdminAudit("translation_update", key, { locale, value });
  revalidateHelper("/admin/content/translations");
}

export async function addTranslationKeyAction(key: string, enValue: string) {
  await requireAdmin();
  const file = localePath("en");
  if (!existsSync(file)) throw new Error("en locale file not found");
  const json: JsonRecord = JSON.parse(readFileSync(file, "utf8"));
  const parts = key.split(".");
  let node: JsonRecord = json;
  for (let i = 0; i < parts.length - 1; i++) {
    const segment = parts[i];
    if (typeof node[segment] !== "object" || node[segment] === null) node[segment] = {};
    node = node[segment] as JsonRecord;
  }
  if (node[parts[parts.length - 1]] !== undefined) throw new Error("Key already exists");
  node[parts[parts.length - 1]] = enValue;
  writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  await logAdminAudit("translation_key_add", key, { enValue });
  revalidateHelper("/admin/content/translations");
}

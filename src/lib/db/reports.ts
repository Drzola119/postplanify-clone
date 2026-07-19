import "server-only";
import { toIso } from "@/lib/db/date-utils";
import { adminDb } from "@/lib/db";
import type { ReportDoc, ReportScheduleDoc } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function reportsCollection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/reports`);
}

function schedulesCollection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/reportSchedules`);
}

export interface ReportItem {
  id: string;
  name: string;
  template: string;
  dateRange: { from: string; to: string };
  status: "pending" | "ready" | "failed";
  downloadUrl?: string;
  generatedAt?: string;
  createdAt: string;
}

export interface ReportScheduleItem {
  id: string;
  name: string;
  cron: string;
  recipients: string[];
  reportId?: string;
  paused: boolean;
  createdAt: string;
}

export async function listReports(workspaceId: string): Promise<ReportItem[]> {
  const snap = await reportsCollection(workspaceId).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => serializeReport(d.id, d.data() as ReportDoc));
}

export async function getReport(workspaceId: string, id: string): Promise<ReportItem | null> {
  const snap = await reportsCollection(workspaceId).doc(id).get();
  if (!snap.exists) return null;
  return serializeReport(snap.id, snap.data() as ReportDoc);
}

export async function createReport(
  workspaceId: string,
  input: { name: string; template: string; dateRange: { from: Date | string; to: Date | string } }
): Promise<string> {
  const ref = reportsCollection(workspaceId).doc();
  await ref.set({
    name: input.name,
    template: input.template,
    dateRange: {
      from: toDate(input.dateRange.from),
      to: toDate(input.dateRange.to),
    },
    status: "pending",
    createdAt: SERVER_TIMESTAMP,
  });
  return ref.id;
}

export async function updateReport(
  workspaceId: string,
  id: string,
  patch: { status?: "pending" | "ready" | "failed"; downloadUrl?: string }
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (patch.status) {
    data.status = patch.status;
    if (patch.status === "ready") data.generatedAt = SERVER_TIMESTAMP;
  }
  if (patch.downloadUrl !== undefined) data.downloadUrl = patch.downloadUrl;
  if (Object.keys(data).length === 0) return;
  await reportsCollection(workspaceId).doc(id).update(data);
}

export async function deleteReport(workspaceId: string, id: string): Promise<void> {
  await reportsCollection(workspaceId).doc(id).delete();
}

export async function listSchedules(workspaceId: string): Promise<ReportScheduleItem[]> {
  const snap = await schedulesCollection(workspaceId).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => serializeSchedule(d.id, d.data() as ReportScheduleDoc));
}

export async function createSchedule(
  workspaceId: string,
  input: { name: string; cron: string; recipients: string[]; reportId?: string; paused?: boolean }
): Promise<string> {
  const ref = schedulesCollection(workspaceId).doc();
  await ref.set({
    name: input.name,
    cron: input.cron,
    recipients: input.recipients,
    reportId: input.reportId,
    paused: input.paused ?? false,
    createdAt: SERVER_TIMESTAMP,
  });
  return ref.id;
}

export async function updateSchedule(
  workspaceId: string,
  id: string,
  patch: { name?: string; cron?: string; recipients?: string[]; paused?: boolean }
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.cron !== undefined) data.cron = patch.cron;
  if (patch.recipients !== undefined) data.recipients = patch.recipients;
  if (patch.paused !== undefined) data.paused = patch.paused;
  if (Object.keys(data).length === 0) return;
  await schedulesCollection(workspaceId).doc(id).update(data);
}

export async function pauseSchedule(workspaceId: string, id: string, paused: boolean): Promise<void> {
  await schedulesCollection(workspaceId).doc(id).update({ paused });
}

export async function deleteSchedule(workspaceId: string, id: string): Promise<void> {
  await schedulesCollection(workspaceId).doc(id).delete();
}

function serializeReport(id: string, data: ReportDoc): ReportItem {
  return {
    id,
    name: data.name,
    template: data.template,
    dateRange: {
      from: toIso(data.dateRange?.from),
      to: toIso(data.dateRange?.to),
    },
    status: data.status ?? "pending",
    downloadUrl: data.downloadUrl,
    generatedAt: data.generatedAt ? toIso(data.generatedAt) : undefined,
    createdAt: toIso(data.createdAt),
  };
}

function serializeSchedule(id: string, data: ReportScheduleDoc): ReportScheduleItem {
  return {
    id,
    name: data.name,
    cron: data.cron,
    recipients: data.recipients ?? [],
    reportId: data.reportId,
    paused: data.paused ?? false,
    createdAt: toIso(data.createdAt),
  };
}



function toDate(v: Date | string): Date {
  if (v instanceof Date) return v;
  return new Date(v);
}

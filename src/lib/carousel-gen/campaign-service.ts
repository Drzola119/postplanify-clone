/**
 * Campaign and Folder service for Carousel Studio
 */
import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { createLogger } from "@/lib/log";
import type { CarouselFolder } from "@/lib/carousel-gen/types";

const log = createLogger("lib:carousel-gen:campaign-service");

export async function listFolders(workspaceId: string): Promise<CarouselFolder[]> {
  if (!adminDb) return [];

  const snap = await adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("carouselFolders")
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      workspaceId,
      name: data.name || "Untitled Folder",
      color: data.color || "#3b82f6",
      icon: data.icon || "folder",
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
      itemCount: typeof data.itemCount === "number" ? data.itemCount : 0,
    };
  });
}

export async function createOrUpdateFolder(
  workspaceId: string,
  folder: { id?: string; name: string; color?: string; icon?: string }
): Promise<CarouselFolder> {
  if (!adminDb) throw new Error("Database not configured");

  const foldersRef = adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("carouselFolders");

  const folderId = folder.id || "fld_" + Math.random().toString(36).substring(2, 9);
  const now = Date.now();

  const fullFolder: CarouselFolder = {
    id: folderId,
    workspaceId,
    name: folder.name,
    color: folder.color || "#3b82f6",
    icon: folder.icon || "folder",
    createdAt: now,
  };

  await foldersRef.doc(folderId).set({
    ...fullFolder,
    updatedAt: FieldValue.serverTimestamp(),
    ...(folder.id ? {} : { createdAt: FieldValue.serverTimestamp() }),
  }, { merge: true });

  log.info("Carousel folder saved", { workspaceId, folderId, name: folder.name });
  return fullFolder;
}

export async function deleteFolder(workspaceId: string, folderId: string): Promise<void> {
  if (!adminDb) return;

  // Unlink folder from carousels first so nothing gets orphaned
  const carouselsSnap = await adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("carousels")
    .where("folderId", "==", folderId)
    .get();

  for(let i=0;i<carouselsSnap.size;i+=400){
    const batch=adminDb.batch();
    carouselsSnap.docs.slice(i,i+400).forEach(doc=>batch.update(doc.ref,{folderId:null,updatedAt:FieldValue.serverTimestamp()}));
    await batch.commit();
  }

  const folderRef = adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("carouselFolders")
    .doc(folderId);

  await folderRef.delete();

  log.info("Folder deleted and carousels unlinked", { workspaceId, folderId });
}

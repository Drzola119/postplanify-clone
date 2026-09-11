import { Suspense } from "react";
import { StudioEditor } from "@/components/dashboard/infographic-studio/editor";
export default function Page() { return <Suspense fallback={<p className="p-8">Loading studio…</p>}><StudioEditor /></Suspense>; }

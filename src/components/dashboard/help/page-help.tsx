"use client";

import * as React from "react";
import type { PageHelpConfig, HelpTopic } from "@/lib/help/content";
import { LearnTrigger } from "@/components/dashboard/help/learn-trigger";
import { HelpDrawer } from "@/components/dashboard/help/help-drawer";

interface PageHelpProps {
  config: PageHelpConfig;
  align?: "left" | "right";
  className?: string;
  buttonClassName?: string;
}

interface OpenState {
  triggerLabel: string;
  topic: HelpTopic;
}

export function PageHelp({ config, align, className, buttonClassName }: PageHelpProps) {
  const [open, setOpen] = React.useState<OpenState | null>(null);

  return (
    <>
      <LearnTrigger
        config={config}
        align={align}
        className={className}
        buttonClassName={buttonClassName}
        onOpenTopic={(triggerLabel, topic) => setOpen({ triggerLabel, topic })}
      />
      <HelpDrawer
        open={!!open}
        onClose={() => setOpen(null)}
        triggerLabel={open?.triggerLabel ?? ""}
        topic={open?.topic ?? null}
      />
    </>
  );
}
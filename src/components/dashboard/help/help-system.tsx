"use client";

import * as React from "react";
import { HelpDrawer } from "@/components/dashboard/help/help-drawer";
import { LearnPanel, type LearnSectionId } from "@/components/dashboard/learn-panel";
import type { HelpTopic } from "@/lib/help/content";

interface HelpSystemState {
  learnOpen: boolean;
  openLearn: (initial?: LearnSectionId) => void;
  closeLearn: () => void;
  openHelp: (triggerLabel: string, topic: HelpTopic) => void;
  closeHelp: () => void;
}

const HelpSystemContext = React.createContext<HelpSystemState | null>(null);

export function useHelpSystem(): HelpSystemState {
  const ctx = React.useContext(HelpSystemContext);
  if (!ctx) {
    throw new Error("useHelpSystem must be used within <HelpSystemProvider>");
  }
  return ctx;
}

export function HelpSystemProvider({ children }: { children: React.ReactNode }) {
  const [learnOpen, setLearnOpen] = React.useState(false);
  const [learnSection, setLearnSection] = React.useState<LearnSectionId | undefined>(undefined);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [helpTopic, setHelpTopic] = React.useState<HelpTopic | null>(null);
  const [helpTriggerLabel, setHelpTriggerLabel] = React.useState("Help");

  const openLearn = React.useCallback((initial?: LearnSectionId) => {
    setLearnSection(initial);
    setLearnOpen(true);
  }, []);
  const closeLearn = React.useCallback(() => setLearnOpen(false), []);
  const openHelp = React.useCallback((label: string, topic: HelpTopic) => {
    setHelpTriggerLabel(label);
    setHelpTopic(topic);
    setHelpOpen(true);
  }, []);
  const closeHelp = React.useCallback(() => setHelpOpen(false), []);

  const value = React.useMemo(
    () => ({ learnOpen, openLearn, closeLearn, openHelp, closeHelp }),
    [learnOpen, openLearn, closeLearn, openHelp, closeHelp],
  );

  return (
    <HelpSystemContext.Provider value={value}>
      {children}
      <LearnPanel
        open={learnOpen}
        onClose={closeLearn}
        initialSection={learnSection}
      />
      <HelpDrawer
        open={helpOpen}
        onClose={closeHelp}
        triggerLabel={helpTriggerLabel}
        topic={helpTopic}
      />
    </HelpSystemContext.Provider>
  );
}

import { scopeThreadRef } from "@t3tools/client-runtime/environment";
import type {
  EditorId,
  EnvironmentId,
  ProjectScript,
  ResolvedKeybindingsConfig,
  ThreadId,
} from "@t3tools/contracts";
import { EllipsisIcon, PanelBottomIcon, PanelRightIcon } from "lucide-react";
import { useState } from "react";

import GitActionsControl from "~/components/GitActionsControl";
import ProjectScriptsControl, {
  type NewProjectScriptInput,
  type ProjectScriptActionResult,
} from "~/components/ProjectScriptsControl";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { OpenInPicker } from "~/components/chat/OpenInPicker";
import type { DraftId } from "~/composerDraftStore";
import { useT3ProjectFileScripts } from "~/hooks/useT3ProjectFileScripts";
import { PhoneSheetPopup } from "./PhoneSheetPopup";

export interface PhoneChatHeaderActionsProps {
  activeThreadEnvironmentId: EnvironmentId;
  activeThreadId: ThreadId;
  draftId?: DraftId;
  activeProjectName: string | undefined;
  activeProjectCwd: string | null;
  openInCwd: string | null;
  activeProjectScripts: ReadonlyArray<ProjectScript> | undefined;
  preferredScriptId: string | null;
  keybindings: ResolvedKeybindingsConfig;
  availableEditors: ReadonlyArray<EditorId>;
  showOpenInPicker: boolean;
  terminalAvailable: boolean;
  terminalOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelAvailable: boolean;
  gitCwd: string | null;
  onToggleTerminal: () => void;
  onToggleRightPanel: () => void;
  onRunProjectScript: (script: ProjectScript) => void;
  onAddProjectScript: (input: NewProjectScriptInput) => Promise<ProjectScriptActionResult>;
  onUpdateProjectScript: (
    scriptId: string,
    input: NewProjectScriptInput,
  ) => Promise<ProjectScriptActionResult>;
  onDeleteProjectScript: (scriptId: string) => Promise<ProjectScriptActionResult>;
}

export function PhoneChatHeaderActions({
  activeThreadEnvironmentId,
  activeThreadId,
  draftId,
  activeProjectName,
  activeProjectCwd,
  openInCwd,
  activeProjectScripts,
  preferredScriptId,
  keybindings,
  availableEditors,
  showOpenInPicker,
  terminalAvailable,
  terminalOpen,
  rightPanelOpen,
  rightPanelAvailable,
  gitCwd,
  onToggleTerminal,
  onToggleRightPanel,
  onRunProjectScript,
  onAddProjectScript,
  onUpdateProjectScript,
  onDeleteProjectScript,
}: PhoneChatHeaderActionsProps) {
  const [open, setOpen] = useState(false);
  const fileScripts = useT3ProjectFileScripts(
    activeThreadEnvironmentId,
    activeProjectScripts ? activeProjectCwd : null,
  );

  return (
    <>
      {activeProjectName ? (
        <GitActionsControl
          gitCwd={gitCwd}
          activeThreadRef={scopeThreadRef(activeThreadEnvironmentId, activeThreadId)}
          {...(draftId ? { draftId } : {})}
        />
      ) : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open chat tools"
              className="rounded-full"
            />
          }
        >
          <EllipsisIcon className="size-4.5" />
        </SheetTrigger>
        <PhoneSheetPopup open={open} onDismiss={() => setOpen(false)}>
          <SheetHeader className="gap-1 px-5 pt-1 pb-3">
            <SheetTitle className="text-lg">Chat tools</SheetTitle>
            <SheetDescription>Panels, project actions, and external tools.</SheetDescription>
          </SheetHeader>
          <SheetPanel className="space-y-2 px-3 pt-1 pb-5">
            <button
              type="button"
              aria-pressed={terminalOpen}
              disabled={!terminalAvailable}
              className="flex min-h-13 w-full items-center gap-3 rounded-2xl border border-border/60 bg-background/35 px-4 text-left outline-none active:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              onClick={() => {
                setOpen(false);
                onToggleTerminal();
              }}
            >
              <PanelBottomIcon className="size-4.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 text-sm font-medium">Terminal</span>
              <span className="text-xs text-muted-foreground">
                {terminalOpen ? "Close" : "Open"}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={rightPanelOpen}
              disabled={!rightPanelAvailable}
              className="flex min-h-13 w-full items-center gap-3 rounded-2xl border border-border/60 bg-background/35 px-4 text-left outline-none active:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              onClick={() => {
                setOpen(false);
                onToggleRightPanel();
              }}
            >
              <PanelRightIcon className="size-4.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 text-sm font-medium">Side panel</span>
              <span className="text-xs text-muted-foreground">
                {rightPanelOpen ? "Close" : "Open"}
              </span>
            </button>
            {activeProjectScripts ? (
              <div className="flex min-h-13 w-full items-center gap-3 rounded-2xl border border-border/60 bg-background/35 px-4">
                <span className="min-w-0 flex-1 text-sm font-medium">Project actions</span>
                <ProjectScriptsControl
                  scripts={activeProjectScripts}
                  fileScripts={fileScripts}
                  keybindings={keybindings}
                  preferredScriptId={preferredScriptId}
                  onRunScript={onRunProjectScript}
                  onAddScript={onAddProjectScript}
                  onUpdateScript={onUpdateProjectScript}
                  onDeleteScript={onDeleteProjectScript}
                />
              </div>
            ) : null}
            {showOpenInPicker ? (
              <div className="flex min-h-13 w-full items-center gap-3 rounded-2xl border border-border/60 bg-background/35 px-4">
                <span className="min-w-0 flex-1 text-sm font-medium">Open project</span>
                <OpenInPicker
                  environmentId={activeThreadEnvironmentId}
                  keybindings={keybindings}
                  availableEditors={availableEditors}
                  openInCwd={openInCwd}
                  compact
                />
              </div>
            ) : null}
          </SheetPanel>
        </PhoneSheetPopup>
      </Sheet>
    </>
  );
}

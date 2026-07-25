import type { EnvironmentId } from "@t3tools/contracts";
import {
  CheckIcon,
  CloudIcon,
  FolderGit2Icon,
  FolderGitIcon,
  FolderIcon,
  HistoryIcon,
  MonitorIcon,
} from "lucide-react";
import { memo, useMemo } from "react";

import {
  type EnvMode,
  type EnvironmentOption,
  resolveCurrentWorkspaceLabel,
  resolveEnvModeLabel,
} from "~/components/BranchToolbar.logic";
import { cn } from "~/lib/utils";

export interface PhoneRunContextPanelProps {
  envLocked: boolean;
  envModeLocked: boolean;
  environmentId: EnvironmentId;
  availableEnvironments: readonly EnvironmentOption[] | undefined;
  showEnvironmentIndicator: boolean;
  onEnvironmentChange: ((environmentId: EnvironmentId) => void) | undefined;
  effectiveEnvMode: EnvMode;
  activeWorktreePath: string | null;
  onEnvModeChange: (mode: EnvMode) => void;
  previousWorktreeLabel: string | null;
  onUsePreviousWorktree: () => void;
}

export const PhoneRunContextPanel = memo(function PhoneRunContextPanel({
  envLocked,
  envModeLocked,
  environmentId,
  availableEnvironments,
  showEnvironmentIndicator,
  onEnvironmentChange,
  effectiveEnvMode,
  activeWorktreePath,
  onEnvModeChange,
  previousWorktreeLabel,
  onUsePreviousWorktree,
}: PhoneRunContextPanelProps) {
  const activeEnvironment = useMemo(
    () => availableEnvironments?.find((env) => env.environmentId === environmentId) ?? null,
    [availableEnvironments, environmentId],
  );
  const environmentOptions =
    availableEnvironments ?? (activeEnvironment ? [activeEnvironment] : []);

  function choiceClass(selected: boolean) {
    return cn(
      "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
      selected ? "bg-accent/70 text-foreground" : "text-muted-foreground active:bg-accent/55",
      "disabled:pointer-events-none disabled:opacity-55",
    );
  }

  return (
    <div className="space-y-5">
      {showEnvironmentIndicator && environmentOptions.length > 0 ? (
        <section aria-labelledby="phone-run-on-label">
          <h3
            id="phone-run-on-label"
            className="mb-1 px-3 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase"
          >
            Run on
          </h3>
          <div className="rounded-2xl border border-border/60 bg-background/35 p-1">
            {environmentOptions.map((env) => {
              const Icon = env.isPrimary ? MonitorIcon : CloudIcon;
              const selected = env.environmentId === environmentId;
              return (
                <button
                  key={env.environmentId}
                  type="button"
                  aria-pressed={selected}
                  className={choiceClass(selected)}
                  disabled={envLocked || !onEnvironmentChange}
                  onClick={() => onEnvironmentChange?.(env.environmentId)}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-medium">{env.label}</span>
                  {selected ? <CheckIcon className="size-4 shrink-0 text-primary" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="phone-workspace-label">
        <h3
          id="phone-workspace-label"
          className="mb-1 px-3 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase"
        >
          Workspace
        </h3>
        <div className="rounded-2xl border border-border/60 bg-background/35 p-1">
          <button
            type="button"
            aria-pressed={effectiveEnvMode === "local"}
            className={choiceClass(effectiveEnvMode === "local")}
            disabled={envModeLocked}
            onClick={() => onEnvModeChange("local")}
          >
            {activeWorktreePath ? (
              <FolderGitIcon className="size-4 shrink-0" />
            ) : (
              <FolderIcon className="size-4 shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate font-medium">
              {resolveCurrentWorkspaceLabel(activeWorktreePath)}
            </span>
            {effectiveEnvMode === "local" ? (
              <CheckIcon className="size-4 shrink-0 text-primary" />
            ) : null}
          </button>
          <button
            type="button"
            aria-pressed={effectiveEnvMode === "worktree"}
            className={choiceClass(effectiveEnvMode === "worktree")}
            disabled={envModeLocked}
            onClick={() => onEnvModeChange("worktree")}
          >
            <FolderGit2Icon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate font-medium">
              {resolveEnvModeLabel("worktree")}
            </span>
            {effectiveEnvMode === "worktree" ? (
              <CheckIcon className="size-4 shrink-0 text-primary" />
            ) : null}
          </button>
          {previousWorktreeLabel ? (
            <button
              type="button"
              className={choiceClass(false)}
              disabled={envModeLocked}
              onClick={onUsePreviousWorktree}
            >
              <HistoryIcon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-medium">{previousWorktreeLabel}</span>
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
});

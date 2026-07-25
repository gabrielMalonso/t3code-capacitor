import type { VcsRef } from "@t3tools/contracts";
import { LegendList, type LegendListRef } from "@legendapp/list/react";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import {
  type ElementType,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
  useRef,
  useState,
} from "react";

import { ChangeRequestStatusIcon } from "~/components/ThreadStatusIndicators";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from "~/components/ui/sheet";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";
import { PhoneSheetPopup } from "./PhoneSheetPopup";

interface PhoneBranchSelectorProps {
  className?: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneContextContent?: ReactNode;
  triggerLabel: string;
  disabled: boolean;
  branchPr: {
    number: number;
    state: string;
    colorClass: string;
  } | null;
  sourceControlSingular: string;
  SourceControlIcon: ElementType<{ className?: string }>;
  onOpenPr?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  items: readonly string[];
  checkoutPullRequestItemValue: string | null;
  createBranchItemValue: string | null;
  prReference: string | null;
  trimmedBranchQuery: string;
  branchByName: ReadonlyMap<string, VcsRef>;
  activeProjectCwd: string | null;
  resolvedActiveBranch: string | null;
  onSelectBranch: (refName: VcsRef) => void;
  onCreateRef: (name: string) => void;
  onCheckoutPullRequest?: () => void;
  branchQuery: string;
  onBranchQueryChange: (query: string) => void;
  branchListRef: RefObject<LegendListRef | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onFetchNextPage: () => void;
  onListLayout: () => void;
  onListScroll: () => void;
  showTopBranchScrollFade: boolean;
  showBottomBranchScrollFade: boolean;
  isSelectingWorktreeBase: boolean;
  startFromOriginSwitchId: string;
  startFromOrigin: boolean;
  onStartFromOriginChange: (startFromOrigin: boolean) => void;
  branchStatusText: string | null;
}

export function PhoneBranchSelector({
  className,
  open,
  onOpenChange,
  phoneContextContent,
  triggerLabel,
  disabled,
  branchPr,
  sourceControlSingular,
  SourceControlIcon,
  onOpenPr,
  items,
  checkoutPullRequestItemValue,
  createBranchItemValue,
  prReference,
  trimmedBranchQuery,
  branchByName,
  activeProjectCwd,
  resolvedActiveBranch,
  onSelectBranch,
  onCreateRef,
  onCheckoutPullRequest,
  branchQuery,
  onBranchQueryChange,
  branchListRef,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  onListLayout,
  onListScroll,
  showTopBranchScrollFade,
  showBottomBranchScrollFade,
  isSelectingWorktreeBase,
  startFromOriginSwitchId,
  startFromOrigin,
  onStartFromOriginChange,
  branchStatusText,
}: PhoneBranchSelectorProps) {
  const [contextOpen, setContextOpen] = useState(false);
  const returnToContextRef = useRef(false);

  const setPickerOpen = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen && returnToContextRef.current) {
      returnToContextRef.current = false;
      setContextOpen(true);
    }
  };

  const openPicker = (returnToContext: boolean) => {
    returnToContextRef.current = returnToContext;
    setContextOpen(false);
    onOpenChange(true);
  };

  const closePicker = () => {
    returnToContextRef.current = false;
    onOpenChange(false);
  };

  const renderPickerItem = (itemValue: string) => {
    if (checkoutPullRequestItemValue && itemValue === checkoutPullRequestItemValue) {
      return (
        <button
          key={itemValue}
          type="button"
          className="flex min-h-13 w-full items-center gap-3 rounded-xl px-3 text-left outline-none active:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {
            closePicker();
            onCheckoutPullRequest?.();
          }}
        >
          <SourceControlIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">Checkout {sourceControlSingular}</span>
            <span className="truncate text-xs text-muted-foreground">{prReference}</span>
          </span>
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/55" />
        </button>
      );
    }

    if (createBranchItemValue && itemValue === createBranchItemValue) {
      return (
        <button
          key={itemValue}
          type="button"
          className="flex min-h-13 w-full items-center gap-3 rounded-xl px-3 text-left outline-none active:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {
            closePicker();
            onCreateRef(trimmedBranchQuery);
          }}
        >
          <GitBranchIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            Create new ref &quot;{trimmedBranchQuery}&quot;
          </span>
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/55" />
        </button>
      );
    }

    const refName = branchByName.get(itemValue);
    if (!refName) return null;

    const hasSecondaryWorktree =
      refName.worktreePath && activeProjectCwd && refName.worktreePath !== activeProjectCwd;
    const badge = refName.current
      ? "current"
      : hasSecondaryWorktree
        ? "worktree"
        : refName.isRemote
          ? "remote"
          : refName.isDefault
            ? "default"
            : null;
    const selected = itemValue === resolvedActiveBranch;

    return (
      <button
        key={itemValue}
        type="button"
        aria-pressed={selected}
        className={cn(
          "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left outline-none active:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring",
          selected && "bg-accent/55",
        )}
        onClick={() => {
          closePicker();
          onSelectBranch(refName);
        }}
      >
        <GitBranchIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{itemValue}</span>
        {badge ? (
          <span className="shrink-0 text-[10px] text-muted-foreground/55">{badge}</span>
        ) : null}
        {selected ? <CheckIcon className="size-4 shrink-0 text-primary" /> : null}
      </button>
    );
  };

  return (
    <>
      <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
        <button
          type="button"
          aria-label={`Change branch. Current branch: ${triggerLabel}`}
          className="flex min-w-0 flex-1 items-center justify-end gap-1.5 rounded-lg px-2 py-1 text-sm text-muted-foreground outline-none active:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring"
          disabled={disabled}
          onClick={() => openPicker(false)}
        >
          <GitBranchIcon className="size-3.5 shrink-0 opacity-70" />
          <span className="min-w-0 truncate font-medium">{triggerLabel}</span>
          {branchPr ? (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium tabular-nums",
                branchPr.colorClass,
              )}
            >
              <ChangeRequestStatusIcon className="size-3" />
              <span>#{branchPr.number}</span>
            </span>
          ) : null}
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open work context"
          className="rounded-full text-muted-foreground"
          onClick={() => setContextOpen(true)}
        >
          <EllipsisIcon className="size-4.5" />
        </Button>
      </div>

      <Sheet open={contextOpen} onOpenChange={setContextOpen}>
        <PhoneSheetPopup open={contextOpen} onDismiss={() => setContextOpen(false)}>
          <SheetHeader className="gap-1 px-5 pt-1 pb-3">
            <SheetTitle className="text-lg">Work context</SheetTitle>
            <SheetDescription>
              Choose where this thread runs and what it checks out.
            </SheetDescription>
          </SheetHeader>
          <SheetPanel className="space-y-5 px-3 pt-1 pb-5">
            {phoneContextContent}
            <section aria-labelledby="phone-source-control-label">
              <h3
                id="phone-source-control-label"
                className="mb-1 px-3 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase"
              >
                Source control
              </h3>
              <div className="rounded-2xl border border-border/60 bg-background/35 p-1">
                <button
                  type="button"
                  aria-label="Change branch or ref"
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left outline-none active:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-55"
                  disabled={disabled}
                  onClick={() => openPicker(true)}
                >
                  <GitBranchIcon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground">Branch / ref</span>
                    <span className="block truncate text-sm font-medium">{triggerLabel}</span>
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/55" />
                </button>
                {branchPr && onOpenPr ? (
                  <button
                    type="button"
                    aria-label={`Open ${sourceControlSingular} #${branchPr.number} (${branchPr.state}) in browser`}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left outline-none active:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={(event) => {
                      setContextOpen(false);
                      onOpenPr(event);
                    }}
                  >
                    <ChangeRequestStatusIcon
                      className={cn("size-4 shrink-0", branchPr.colorClass)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-muted-foreground">
                        {sourceControlSingular}
                      </span>
                      <span className="block truncate text-sm font-medium">
                        #{branchPr.number} · {branchPr.state}
                      </span>
                    </span>
                    <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground/55" />
                  </button>
                ) : null}
              </div>
            </section>
          </SheetPanel>
        </PhoneSheetPopup>
      </Sheet>

      <Sheet open={open} onOpenChange={setPickerOpen}>
        <PhoneSheetPopup
          open={open}
          onDismiss={() => setPickerOpen(false)}
          initialSnap="full"
          allowMediumSnap={false}
        >
          <SheetHeader className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-1 px-3 pt-0 pb-2 text-center">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Back"
              className="rounded-full"
              onClick={() => setPickerOpen(false)}
            >
              <ArrowLeftIcon />
            </Button>
            <div className="min-w-0">
              <SheetTitle className="truncate text-base">Branch / ref</SheetTitle>
              <SheetDescription className="truncate text-xs">{triggerLabel}</SheetDescription>
            </div>
            <span aria-hidden="true" />
          </SheetHeader>
          <div className="shrink-0 px-4 pb-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground/55" />
              <Input
                nativeInput
                autoFocus
                type="search"
                aria-label="Search refs"
                className="rounded-xl [&_input]:ps-9"
                placeholder="Search refs..."
                value={branchQuery}
                onChange={(event) => onBranchQueryChange(event.target.value)}
              />
            </div>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden px-2">
            {items.length > 0 ? (
              <LegendList<string>
                ref={branchListRef}
                data={items}
                keyExtractor={(item) => item}
                getItemType={(item) =>
                  item === checkoutPullRequestItemValue
                    ? "checkout-pull-request"
                    : item === createBranchItemValue
                      ? "create-branch"
                      : "branch"
                }
                renderItem={({ item }) => renderPickerItem(item)}
                estimatedItemSize={48}
                drawDistance={480}
                recycleItems={false}
                onEndReached={() => {
                  if (hasNextPage && !isFetchingNextPage) onFetchNextPage();
                }}
                onLayout={onListLayout}
                onScroll={onListScroll}
                className={cn(
                  "size-full overflow-x-hidden overscroll-y-contain pb-2 [--fade-size:1.5rem]",
                  showTopBranchScrollFade && "mask-t-from-[calc(100%-var(--fade-size))]",
                  showBottomBranchScrollFade && "mask-b-from-[calc(100%-var(--fade-size))]",
                )}
              />
            ) : (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No refs found.
              </div>
            )}
          </div>
          {isSelectingWorktreeBase ? (
            <label
              htmlFor={`${startFromOriginSwitchId}-phone`}
              className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 px-5 py-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 font-medium text-muted-foreground">
                <RefreshCwIcon className="size-4 shrink-0 opacity-70" />
                <span className="truncate">Start from origin</span>
              </span>
              <Switch
                id={`${startFromOriginSwitchId}-phone`}
                checked={startFromOrigin}
                aria-label="Start worktree from origin"
                onCheckedChange={(checked) => onStartFromOriginChange(Boolean(checked))}
              />
            </label>
          ) : null}
          {branchStatusText ? (
            <div className="shrink-0 border-t border-border/60 px-5 py-2 text-center text-xs text-muted-foreground">
              {branchStatusText}
            </div>
          ) : null}
        </PhoneSheetPopup>
      </Sheet>
    </>
  );
}

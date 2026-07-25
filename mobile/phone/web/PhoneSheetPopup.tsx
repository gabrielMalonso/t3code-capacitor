import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { SheetPopup } from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import { resolvePhoneSheetGesture, type PhoneSheetSnap } from "./phone-sheet.logic";

interface PhoneSheetPopupProps {
  children: ReactNode;
  className?: string;
  open: boolean;
  onDismiss: () => void;
  initialSnap?: PhoneSheetSnap;
  allowMediumSnap?: boolean;
}

interface DragState {
  pointerId: number;
  startY: number;
  startHeight: number;
  startedAt: number;
  snap: PhoneSheetSnap;
}

export function PhoneSheetPopup({
  children,
  className,
  open,
  onDismiss,
  initialSnap = "medium",
  allowMediumSnap = true,
}: PhoneSheetPopupProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [snap, setSnap] = useState<PhoneSheetSnap>(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setSnap(initialSnap);
    setIsDragging(false);
    setDragOffset(0);
    setDragHeight(null);
    dragStateRef.current = null;
    suppressClickRef.current = false;
  }, [initialSnap, open]);

  const resetDrag = () => {
    dragStateRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
    setDragHeight(null);
  };

  const cancelDrag = () => {
    suppressClickRef.current = false;
    resetDrag();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const popup = popupRef.current;
    if (!popup) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: popup.getBoundingClientRect().height,
      startedAt: performance.now(),
      snap,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaY) > 5) suppressClickRef.current = true;

    if (dragState.snap === "medium" && deltaY < 0 && allowMediumSnap) {
      const viewport = popupRef.current?.parentElement;
      const maxHeight = viewport?.clientHeight || Math.round(window.innerHeight * 0.92);
      setDragHeight(Math.min(maxHeight, dragState.startHeight + Math.abs(deltaY)));
      setDragOffset(0);
      return;
    }

    setDragHeight(null);
    setDragOffset(Math.max(0, deltaY));
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const result = resolvePhoneSheetGesture({
      snap: dragState.snap,
      deltaY: event.clientY - dragState.startY,
      elapsedMs: performance.now() - dragState.startedAt,
      allowMediumSnap,
    });

    resetDrag();
    if (result === "dismiss") {
      onDismiss();
      return;
    }
    setSnap(result);
  };

  const style: CSSProperties = {
    ...(dragHeight !== null ? { height: dragHeight } : {}),
    ...(dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : {}),
  };

  return (
    <SheetPopup
      ref={popupRef}
      side="bottom"
      showCloseButton={false}
      style={style}
      data-phone-sheet-snap={snap}
      className={cn(
        "max-h-full min-h-0 rounded-t-3xl border-x border-border/60 pb-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))] transition-[height,opacity,translate,transform] duration-200 ease-out",
        snap === "full" ? "h-full" : "h-[min(60dvh,34rem)] max-h-full",
        isDragging && "transition-none",
        className,
      )}
    >
      <button
        type="button"
        aria-label={allowMediumSnap ? "Resize or close sheet" : "Swipe down to close sheet"}
        className="flex h-8 w-full shrink-0 touch-none items-center justify-center rounded-t-3xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          if (allowMediumSnap) setSnap((current) => (current === "medium" ? "full" : "medium"));
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
      >
        <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </button>
      {children}
    </SheetPopup>
  );
}

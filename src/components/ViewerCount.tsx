import { useEffect, useState, useRef } from "react";
import { upsertViewer, removeViewer, getActiveViewerCount } from "@/lib/analytics";
import { Eye } from "lucide-react";

export function ViewerCount({ matchId }: { matchId: string }) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Register presence
    upsertViewer(matchId);

    // Heartbeat every 15s
    intervalRef.current = setInterval(() => {
      upsertViewer(matchId);
    }, 15000);

    // Poll viewer count every 10s
    const countInterval = setInterval(async () => {
      const c = await getActiveViewerCount(matchId);
      setCount(c);
    }, 10000);

    // Initial count
    getActiveViewerCount(matchId).then(setCount);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countInterval);
      removeViewer(matchId);
    };
  }, [matchId]);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-live/20 px-3 py-1 text-sm text-live">
      <Eye className="h-4 w-4" />
      <span className="font-medium">{count}</span>
      <span className="text-xs text-muted-foreground">watching</span>
    </div>
  );
}

import { useState } from "react";
import { chatCoach } from "../api";

export default function EcoFoxChat({ context }: { context: any }) {
  const [msg, setMsg] = useState("Help me cut 10% this week.");
  const [reply, setReply] = useState<string>("");
  const [absurd, setAbsurd] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      const data = await chatCoach({ message: msg, mode: absurd ? "absurd" : "normal", context });
      setReply(data.reply);
    } catch (e: any) {
      setReply(e?.message ?? "Chat failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-lg font-medium">EcoFox Coach</h3>

      <div className="mb-2 flex items-center gap-2">
        <input
          className="w-full rounded-md border p-2"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Ask for a weekly plan or explain a charge…"
        />
        <button
          onClick={send}
          disabled={busy}
          className="rounded-md border bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "Thinking…" : "Send"}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={absurd} onChange={(e) => setAbsurd(e.target.checked)} />
        Absurd mode (for fun)
      </label>

      {reply && (
        <div className="mt-3 whitespace-pre-wrap rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
          {reply}
        </div>
      )}
    </div>
  );
}

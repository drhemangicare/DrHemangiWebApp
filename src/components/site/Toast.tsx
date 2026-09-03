"use client";
import { useEffect, useState } from "react";

// Module-level pub/sub rather than React context: the original design has a
// single global toast() that any part of the page can call, and several call
// sites live inside deeply nested callbacks (Razorpay handler, fetch catch
// blocks). Keeping it callable as a plain function avoids threading a context
// through every one of them.
type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

export function toast(message: string) {
  listeners.forEach((l) => l(message));
}

export function Toaster() {
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const listener: Listener = (m) => {
      setMsg(m);
      setOn(true);
      clearTimeout(timer);
      timer = setTimeout(() => setOn(false), 3200);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`toast${on ? " on" : ""}`} role="status" aria-live="polite">
      <svg aria-hidden="true"><use href="#i-check" /></svg>
      <span>{msg}</span>
    </div>
  );
}

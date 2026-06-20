"use client";
import { useState, useEffect } from "react";

export default function MiniAvatar({ name, className }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initial = mounted ? (name || "A").charAt(0).toUpperCase() : "?";

  return <div className={className}>{initial}</div>;
}
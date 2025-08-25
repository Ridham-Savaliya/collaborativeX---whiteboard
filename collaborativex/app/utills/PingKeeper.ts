"use client";
import { useEffect } from "react";

export default function PingKeeper() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("https://your-backend.onrender.com/api/healthcheck", {
        cache: "no-store",
      })
        .then(res => res.json())
        .then(data => console.log("Pinged backend ✅:", data))
        .catch(err => console.error("Ping failed ❌:", err));
    }, 10 * 60 * 1000); // every 10 minutes

    return () => clearInterval(interval);
  }, []);

  return null;
}

"use client";

import { announcementMessage } from "@/lib/announcement";
import { useDemoStore } from "@/store/demo-store";

export function AnnouncementBar() {
  const modules = useDemoStore((s) => s.config.modules);
  const message = announcementMessage(modules);
  if (!message) return null;
  return (
    <p
      data-testid="announcement-bar"
      className="bg-announcement-bg px-md py-sm text-center text-sm font-medium text-announcement-text"
    >
      {message}
    </p>
  );
}

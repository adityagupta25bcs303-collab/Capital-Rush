import React from 'react';
import { Megaphone } from 'lucide-react';

export default function AnnouncementBanner({ announcement }) {
  if (!announcement || !announcement.trim()) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border-b border-amber-500/30 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 text-xs sm:text-sm text-amber-200">
        <Megaphone className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
        <span className="font-semibold">{announcement}</span>
      </div>
    </div>
  );
}

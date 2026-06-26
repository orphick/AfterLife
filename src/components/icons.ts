import {
  BookOpen,
  Gamepad2,
  HeartHandshake,
  Home,
  Images,
  Library,
  ListTodo,
  Lock,
  Music2,
  Play,
  Send,
  StickyNote,
  Trash2,
  Upload,
  type LucideIcon
} from "lucide-react";
import type { ActivityId, TabId } from "../types/domain";

export const tabIcons: Record<TabId, LucideIcon> = {
  home: Home,
  together: HeartHandshake,
  memories: Images,
  library: Library
};

export const activityIcons: Record<ActivityId, LucideIcon> = {
  read: BookOpen,
  watch: Play,
  listen: Music2,
  play: Gamepad2,
  lists: ListTodo,
  spicy: Lock
};

export const actionIcons = {
  send: Send,
  note: StickyNote,
  lock: Lock,
  trash: Trash2,
  upload: Upload,
  book: BookOpen
};

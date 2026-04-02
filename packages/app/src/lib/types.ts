import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Compass,
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Archive,
  Palette,
} from 'lucide-react';

export type WorkbenchId = 'work' | 'explore' | 'review' | 'pm' | 'settings' | 'archive' | 'studio';

export interface WorkbenchMeta {
  id: WorkbenchId;
  label: string;
  icon: LucideIcon;
}

export const WORKBENCHES: readonly WorkbenchMeta[] = [
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'review', label: 'Review', icon: ShieldCheck },
  { id: 'pm', label: 'PM', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'studio', label: 'Studio', icon: Palette },
] as const;

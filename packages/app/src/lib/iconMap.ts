import {
  Briefcase, Compass, FlaskConical, Brain, Book, Code, Database, Globe,
  Heart, Lightbulb, Rocket, Shield, Terminal, Wrench, Zap, Music, Camera,
  Palette, Users, Star, Bookmark, MessageSquare, Search, FileText, Settings,
  Activity, Coffee, Gamepad2, GraduationCap, Microscope,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Shared icon lookup map for custom workbenches.
 * Used by both CustomWorkbenchCard and Sidebar to resolve
 * icon names to lucide-react components.
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  compass: Compass,
  flask: FlaskConical,
  brain: Brain,
  book: Book,
  code: Code,
  database: Database,
  globe: Globe,
  heart: Heart,
  lightbulb: Lightbulb,
  rocket: Rocket,
  shield: Shield,
  terminal: Terminal,
  wrench: Wrench,
  zap: Zap,
  music: Music,
  camera: Camera,
  palette: Palette,
  users: Users,
  star: Star,
  bookmark: Bookmark,
  'message-square': MessageSquare,
  search: Search,
  'file-text': FileText,
  settings: Settings,
  activity: Activity,
  coffee: Coffee,
  gamepad: Gamepad2,
  'graduation-cap': GraduationCap,
  microscope: Microscope,
};

export const ICON_NAMES = Object.keys(ICON_MAP);
export const DEFAULT_ICON = Briefcase;

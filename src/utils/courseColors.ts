/**
 * A fixed colour per course, the way Google Calendar colours each
 * calendar - so a glance at the grid tells you which subject a block
 * belongs to. Event *type* is conveyed by an icon instead.
 *
 * Colours are assigned by the course's position in the list, so a given
 * course keeps its colour for as long as the list order is stable.
 */
export interface CourseColor {
  /** Solid fill for blocks in the time grid. */
  block: string;
  /** Softer treatment for chips/list rows. */
  chip: string;
  /** Small colour swatch (legend, month-view dots). */
  dot: string;
}

const PALETTE: CourseColor[] = [
  {
    block: "bg-blue-500/85 text-white border-blue-600/40 hover:bg-blue-500",
    chip: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    dot: "bg-blue-500",
  },
  {
    block: "bg-emerald-500/85 text-white border-emerald-600/40 hover:bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  {
    block: "bg-violet-500/85 text-white border-violet-600/40 hover:bg-violet-500",
    chip: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
    dot: "bg-violet-500",
  },
  {
    block: "bg-amber-500/85 text-white border-amber-600/40 hover:bg-amber-500",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dot: "bg-amber-500",
  },
  {
    block: "bg-rose-500/85 text-white border-rose-600/40 hover:bg-rose-500",
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    dot: "bg-rose-500",
  },
  {
    block: "bg-cyan-600/85 text-white border-cyan-700/40 hover:bg-cyan-600",
    chip: "bg-cyan-600/10 text-cyan-700 dark:text-cyan-300 border-cyan-600/30",
    dot: "bg-cyan-600",
  },
  {
    block: "bg-orange-500/85 text-white border-orange-600/40 hover:bg-orange-500",
    chip: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",
    dot: "bg-orange-500",
  },
  {
    block: "bg-teal-600/85 text-white border-teal-700/40 hover:bg-teal-600",
    chip: "bg-teal-600/10 text-teal-700 dark:text-teal-300 border-teal-600/30",
    dot: "bg-teal-600",
  },
];

export const buildCourseColorMap = (courseIds: string[]): Record<string, CourseColor> => {
  const map: Record<string, CourseColor> = {};
  courseIds.forEach((id, index) => {
    map[id] = PALETTE[index % PALETTE.length];
  });
  return map;
};

export const FALLBACK_COURSE_COLOR: CourseColor = {
  block: "bg-slate-500/85 text-white border-slate-600/40 hover:bg-slate-500",
  chip: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
  dot: "bg-slate-500",
};

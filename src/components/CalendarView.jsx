import React, { useMemo } from "react";
import { Calendar } from "lucide-react";
import { Card } from "./UIComponents";
import { getMonthGrid, toDateKey, isCompletedForDay, getLevel, DAYS } from "../utils/habitUtils";

export default function CalendarView({ activeHabits }) {
  const monthHeatmap = useMemo(() => {
    const now = new Date();
    return getMonthGrid(now.getFullYear(), now.getMonth()).map((d) => {
      if (!d) return null;
      const key = toDateKey(d);
      const count = activeHabits.filter((h) => isCompletedForDay(h, key)).length;
      return { date: d, count };
    });
  }, [activeHabits]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="text-lg font-semibold">Monthly heatmap</h2></div>
          <Calendar className="h-5 w-5 text-slate-400" />
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {DAYS.map((day) => (<div key={day} className="py-2 font-medium">{day}</div>))}
          {monthHeatmap.map((cell, idx) => (
            <div key={idx} className="aspect-square p-0.5">
              {cell ? (
                <div className={`flex h-full flex-col items-center justify-center rounded-2xl ${getLevel(cell.count)}`}>
                  <span className="text-sm font-semibold leading-none">{cell.date.getDate()}</span>
                  {cell.count > 0 && <span className="mt-1 text-[10px] font-medium leading-none opacity-90">{cell.count}</span>}
                </div>
              ) : (<div className="h-full rounded-2xl bg-transparent" />)}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
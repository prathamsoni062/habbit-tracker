import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Archive, Edit3, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Card, Input, Select, AppButton } from "./UIComponents";
import { CATEGORY_OPTIONS, calculateCurrentStreak, calculateBestStreak, countCompletedDays, getCompletionValue, todayKey, isCompletedForDay, getIsScheduledToday, formatDate } from "../utils/habitUtils";

export default function HabitsView({ activeHabits, archivedHabits, updateHabitProgress, toggleComplete, setEditingHabit, setFormOpen, toggleArchive, deleteHabit }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("priority");
  const [showArchived, setShowArchived] = useState(false);

  const filteredHabits = useMemo(() => {
    const source = showArchived ? archivedHabits : activeHabits;
    let data = source.filter((habit) => {
      const q = search.toLowerCase();
      const matchesSearch = [habit.name, habit.category, habit.notes].join(" ").toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "All" || habit.category === categoryFilter;
      const completed = isCompletedForDay(habit);
      const matchesStatus = statusFilter === "All" || (statusFilter === "Completed" && completed) || (statusFilter === "Pending" && !completed) || (statusFilter === "Scheduled Today" && getIsScheduledToday(habit));
      return matchesSearch && matchesCategory && matchesStatus;
    });

    if (sortBy === "name") data.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "streak") data.sort((a, b) => calculateCurrentStreak(b) - calculateCurrentStreak(a));
    if (sortBy === "completion") data.sort((a, b) => countCompletedDays(b) - countCompletedDays(a));
    if (sortBy === "priority") {
      data.sort((a, b) => {
        return (getIsScheduledToday(b) ? 1 : 0) - (getIsScheduledToday(a) ? 1 : 0) || (isCompletedForDay(a) ? 1 : 0) - (isCompletedForDay(b) ? 1 : 0);
      });
    }
    return data;
  }, [activeHabits, archivedHabits, showArchived, search, categoryFilter, statusFilter, sortBy]);

  return (
    <div className="grid gap-6">
      <Card>
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search habits..." className="pl-10" />
          </div>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option>All</option>
            {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {["All", "Completed", "Pending", "Scheduled Today"].map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {[["priority", "Sort: Priority"], ["name", "Sort: Name"], ["streak", "Sort: Streak"], ["completion", "Sort: Completion"]].map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </Select>
          <AppButton onClick={() => setShowArchived((p) => !p)} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Archive className="h-4 w-4" /> {showArchived ? "Show Active" : "Archived"}
          </AppButton>
        </div>
      </Card>

      <div className="grid gap-4">
        {filteredHabits.length ? (
          filteredHabits.map((habit) => {
            const streak = calculateCurrentStreak(habit);
            const best = calculateBestStreak(habit);
            const doneToday = isCompletedForDay(habit);
            const progress = Math.min(100, Math.round((getCompletionValue(habit, todayKey()) / Number(habit.target || 1)) * 100));

            return (
              <motion.div key={habit._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden">
                  <div className={`mb-4 h-2 rounded-full bg-gradient-to-r ${habit.color}`} />
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr_0.8fr_auto] lg:items-center">
                    <div>
                      <h3 className="text-xl font-semibold">{habit.name}</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-xs">Streak</p><p className="mt-1 text-lg font-semibold">{streak}</p></div>
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-xs">Best</p><p className="mt-1 text-lg font-semibold">{best}</p></div>
                      </div>
                    </div>
                    <div>
                      <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/60">
                        <div className="mb-2 flex items-center justify-between"><p className="text-sm">Today</p></div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                          <div className={`h-2 rounded-full bg-gradient-to-r ${habit.color}`} style={{ width: `${progress}%` }} />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <AppButton onClick={() => updateHabitProgress(habit._id, -1)}>-1</AppButton>
                          <AppButton onClick={() => updateHabitProgress(habit._id, 1)}>+1</AppButton>
                          <AppButton onClick={() => toggleComplete(habit._id)} className={doneToday ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"}>
                            {doneToday ? "Completed" : "Complete"}
                          </AppButton>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                       <div className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60"><p>Target</p><p className="font-medium">{habit.target} {habit.unit}</p></div>
                    </div>
                    <div className="flex flex-row gap-2 lg:flex-col">
                      <AppButton onClick={() => { setEditingHabit(habit); setFormOpen(true); }}><Edit3 className="h-4 w-4" /> Edit</AppButton>
                      <AppButton onClick={() => toggleArchive(habit._id)}><Archive className="h-4 w-4" /> {habit.archived ? "Restore" : "Archive"}</AppButton>
                      <AppButton onClick={() => deleteHabit(habit._id)} className="bg-red-600 text-white"><Trash2 className="h-4 w-4" /> Delete</AppButton>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <Card className="py-16 text-center">
            <h3 className="text-xl font-semibold">No habits match your filters</h3>
          </Card>
        )}
      </div>
    </div>
  );
}
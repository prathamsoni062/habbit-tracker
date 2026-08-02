import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AppButton, Input, Select, Textarea } from "./UIComponents";
import { CATEGORY_OPTIONS, FREQUENCIES, DAYS } from "../utils/habitUtils";

export default function HabitForm({ initialHabit, onSave, onClose }) {
  const [form, setForm] = useState(
    initialHabit || {
      name: "", category: "Health", frequency: "Daily", customDays: [],
      target: 1, unit: "times", preferredTime: "08:00", color: "from-indigo-500 to-purple-500", notes: "",
    }
  );

  const gradients = ["from-indigo-500 to-purple-500", "from-emerald-500 to-lime-500", "from-sky-500 to-cyan-500", "from-pink-500 to-rose-500", "from-amber-500 to-orange-500", "from-violet-500 to-fuchsia-500"];

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      customDays: prev.customDays.includes(day) ? prev.customDays.filter((d) => d !== day) : [...prev.customDays, day].sort(),
    }));
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Habit name</label>
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ex: Walk 8,000 steps" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Category</label>
          <Select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
            {CATEGORY_OPTIONS.map((c) => (<option key={c}>{c}</option>))}
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Frequency</label>
          <Select value={form.frequency} onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))}>
            {FREQUENCIES.map((f) => (<option key={f}>{f}</option>))}
          </Select>
        </div>
        {form.frequency === "Custom" && (
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Custom days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day, idx) => (
                <button key={day} type="button" onClick={() => toggleDay(idx)} className={`rounded-full px-3 py-2 text-sm ${form.customDays.includes(idx) ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800"}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium">Target</label>
          <Input type="number" min="1" value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: Number(e.target.value) || 1 }))} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Unit</label>
          <Input value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} placeholder="times, pages, mins" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Preferred time</label>
          <Input type="time" value={form.preferredTime} onChange={(e) => setForm((p) => ({ ...p, preferredTime: e.target.value }))} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Color theme</label>
          <div className="flex flex-wrap gap-2">
            {gradients.map((g) => (
              <button key={g} type="button" onClick={() => setForm((p) => ({ ...p, color: g }))} className={`h-10 w-10 rounded-2xl bg-gradient-to-r ${g} ${form.color === g ? "ring-4 ring-slate-300 dark:ring-slate-700" : ""}`} />
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Notes</label>
          <Textarea rows={4} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Motivation, cue, reward, or extra guidance" />
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <AppButton onClick={onClose} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Cancel</AppButton>
        <AppButton onClick={() => { if (!form.name.trim()) return; onSave(form); }} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
          <CheckCircle2 className="h-4 w-4" /> Save habit
        </AppButton>
      </div>
    </div>
  );
}
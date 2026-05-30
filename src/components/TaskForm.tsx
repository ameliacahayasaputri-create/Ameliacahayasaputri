/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Bell, Calendar, Flame, Layers, Clock, Tag } from 'lucide-react';
import { Task, TaskPriority, Category } from '../types';

interface TaskFormProps {
  categories: Category[];
  onAddTask: (task: Omit<Task, 'id' | 'isCompleted' | 'notified'>) => void;
}

export default function TaskForm({ categories, onAddTask }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.SEDANG);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');

  // Set default due date to +10 minutes from now (formatted as YYYY-MM-DDTHH:MM)
  useEffect(() => {
    resetTime();
  }, []);

  const resetTime = () => {
    const defaultDate = new Date();
    defaultDate.setMinutes(defaultDate.getMinutes() + 10);
    
    // Format to local date string matching datetime-local input
    const year = defaultDate.getFullYear();
    const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const day = String(defaultDate.getDate()).padStart(2, '0');
    const hours = String(defaultDate.getHours()).padStart(2, '0');
    const minutes = String(defaultDate.getMinutes()).padStart(2, '0');
    
    setDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  // Quick helper to add minutes/hours/days to current time
  const applyQuickTime = (minutesToAdd: number) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutesToAdd);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    setDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Nama tugas tidak boleh kosong');
      return;
    }
    if (!dueDate) {
      setError('Silakan tentukan waktu pengingat');
      return;
    }

    onAddTask({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
      priority,
      soundEnabled,
      categoryId: categoryId || undefined,
    });

    // Reset fields, except priority & sound choice for user persistence
    setTitle('');
    setDescription('');
    setCategoryId('');
    resetTime();
    setError('');
  };

  return (
    <div id="add-task-card" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs transition-all">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
          <Clock className="w-5 h-5" id="task-form-icon" />
        </div>
        <div>
          <h2 id="form-heading" className="text-lg font-semibold text-gray-900 leading-tight">Buat Tugas & Pengingat Baru</h2>
          <p className="text-xs text-gray-500">Sistem akan memantau waktu secara otomatis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div id="form-error-msg" className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg animate-fadeIn">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="task-title" className="text-xs font-medium text-gray-700 block">Nama Tugas <span className="text-rose-500">*</span></label>
          <input
            id="task-title"
            type="text"
            placeholder="Contoh: Rapat kerja harian bersama tim pemasaran"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 placeholder-gray-400 bg-gray-50/50"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="task-desc" className="text-xs font-medium text-gray-700 block">Deskripsi Tugas <span className="text-gray-400 text-[10px]">(Opsional)</span></label>
          <textarea
            id="task-desc"
            placeholder="Tuliskan detail tambahan atau link rapat di sini..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 placeholder-gray-400 bg-gray-50/50 resize-none"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="task-category" className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-gray-400" /> Tentukan Kategori
          </label>
          <select
            id="task-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-gray-50/50 cursor-pointer"
          >
            <option value="">-- Tanpa Kategori --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="task-due" className="text-xs font-medium text-gray-700 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Atur Pengingat</label>
            <input
              id="task-due"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-gray-50/50"
            />
            {/* Quick time pills */}
            <div className="flex gap-1.5 mt-1.5 overflow-x-auto py-0.5 no-scrollbar">
              <button
                id="pills-5m"
                type="button"
                onClick={() => applyQuickTime(5)}
                className="text-[10px] bg-gray-100 text-gray-600 hover:bg-gray-200/80 px-2 py-1 rounded-md font-medium shrink-0 transition"
              >
                +5 Mnt
              </button>
              <button
                id="pills-15m"
                type="button"
                onClick={() => applyQuickTime(15)}
                className="text-[10px] bg-gray-100 text-gray-600 hover:bg-gray-200/80 px-2 py-1 rounded-md font-medium shrink-0 transition"
              >
                +15 Mnt
              </button>
              <button
                id="pills-1h"
                type="button"
                onClick={() => applyQuickTime(60)}
                className="text-[10px] bg-gray-100 text-gray-600 hover:bg-gray-200/80 px-2 py-1 rounded-md font-medium shrink-0 transition"
              >
                +1 Jm
              </button>
              <button
                id="pills-tomorrow"
                type="button"
                onClick={() => applyQuickTime(24 * 60)}
                className="text-[10px] bg-gray-100 text-gray-600 hover:bg-gray-200/80 px-2 py-1 rounded-md font-medium shrink-0 transition"
              >
                Besok
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-gray-400" /> Prioritas Tugas</label>
            <div className="grid grid-cols-3 gap-1.5 h-9">
              <button
                id="btn-priority-low"
                type="button"
                onClick={() => setPriority(TaskPriority.RENDAH)}
                className={`text-xs font-medium rounded-xl flex items-center justify-center border transition-all ${
                  priority === TaskPriority.RENDAH
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-2xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Rendah
              </button>
              <button
                id="btn-priority-medium"
                type="button"
                onClick={() => setPriority(TaskPriority.SEDANG)}
                className={`text-xs font-medium rounded-xl flex items-center justify-center border transition-all ${
                  priority === TaskPriority.SEDANG
                    ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-2xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Sedang
              </button>
              <button
                id="btn-priority-high"
                type="button"
                onClick={() => setPriority(TaskPriority.TINGGI)}
                className={`text-xs font-medium rounded-xl flex items-center justify-center border transition-all ${
                  priority === TaskPriority.TINGGI
                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-2xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Tinggi
              </button>
            </div>

            {/* Custom sound notification toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                <Bell className="w-3 h-3 text-indigo-500" /> Aktifkan Alarm Suara
              </span>
              <button
                id="toggle-sound-form"
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  soundEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    soundEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <button
          id="btn-submit-task"
          type="submit"
          className="w-full mt-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-indigo-100"
        >
          <Plus className="w-4 h-4" /> Simpan Tugas & Pengingat
        </button>
      </form>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Calendar, Trash2, CheckCircle2, Circle, AlertTriangle, ShieldCheck, Volume2, VolumeX, Sparkles, Tag } from 'lucide-react';
import { Task, TaskPriority, Category } from '../types';

interface TaskListProps {
  tasks: Task[];
  categories: Category[];
  currentTime: Date;
  onToggleComplete: (id: string) => void;
  onToggleSound: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onTriggerAlarmSound: () => void;
}

type FilterType = 'SEMUA' | 'AKTIF' | 'SELESAI' | 'TERLAMBAT';

export default function TaskList({ 
  tasks, 
  categories,
  currentTime, 
  onToggleComplete, 
  onToggleSound, 
  onDeleteTask,
  onTriggerAlarmSound
}: TaskListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('SEMUA');
  const [categoryFilter, setCategoryFilter] = useState('');

  const formatIDDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(d);
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to format remaining or overdue duration
  const getRemainingTimeText = (dueDateStr: string, isCompleted: boolean) => {
    if (isCompleted) {
      return { text: 'Sudah Selesai', colorClass: 'text-gray-400 bg-gray-50' };
    }

    const diffMs = new Date(dueDateStr).getTime() - currentTime.getTime();
    const absDiffMs = Math.abs(diffMs);
    const secs = Math.floor(absDiffMs / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (diffMs > 0) {
      // In the future
      if (mins < 1) {
        return { text: 'Segera tiba (< 1m)', colorClass: 'text-indigo-600 bg-indigo-50 font-bold animate-pulse' };
      }
      if (mins < 60) {
        return { text: `Sisa ${mins} menit`, colorClass: 'text-indigo-600 bg-indigo-50/80 font-medium' };
      }
      if (hours < 24) {
        return { text: `Sisa ${hours}j ${mins % 60}m`, colorClass: 'text-teal-600 bg-teal-50' };
      }
      return { text: `Sisa ${days} hari`, colorClass: 'text-slate-600 bg-slate-50' };
    } else {
      // Overdue
      if (mins < 1) {
        return { text: 'Lewat jadwal (< 1m)', colorClass: 'text-rose-600 bg-rose-50 font-bold animate-pulse' };
      }
      if (mins < 60) {
        return { text: `Lewat ${mins} menit`, colorClass: 'text-rose-600 bg-rose-50 font-medium animate-pulse' };
      }
      if (hours < 24) {
        return { text: `Lewat ${hours}j ${mins % 60}m`, colorClass: 'text-rose-600 bg-rose-50' };
      }
      return { text: `Lewat ${days} hari`, colorClass: 'text-rose-700 bg-rose-50' };
    }
  };

  // Clean tag badge helper
  const getPriorityBadge = (prio: TaskPriority) => {
    switch (prio) {
      case TaskPriority.TINGGI:
        return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-md px-2 py-0.5">Tinggi</span>;
      case TaskPriority.SEDANG:
        return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-0.5">Sedang</span>;
      case TaskPriority.RENDAH:
        return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5">Rendah</span>;
    }
  };

  const isOverdue = (dueDateStr: string, isCompleted: boolean) => {
    if (isCompleted) return false;
    return new Date(dueDateStr).getTime() < currentTime.getTime();
  };

  // Filter and Search logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (categoryFilter && task.categoryId !== categoryFilter) {
      return false;
    }

    switch (filter) {
      case 'AKTIF':
        return !task.isCompleted;
      case 'SELESAI':
        return task.isCompleted;
      case 'TERLAMBAT':
        return isOverdue(task.dueDate, task.isCompleted);
      case 'SEMUA':
      default:
        return true;
    }
  });

  // Sort: Overdue first, then upcoming soonest first, then completed last
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div id="master-task-container" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
      {/* Controls & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-6">
        <h2 id="task-list-title" className="text-lg font-semibold text-gray-900 self-start md:self-center">Daftar Agenda & Alarm</h2>
        
        {/* Search bar */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Cari agenda tugas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 placeholder-gray-400 bg-gray-50/30"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 border-b border-gray-100 pb-4 mb-4 overflow-x-auto no-scrollbar">
        {(['SEMUA', 'AKTIF', 'SELESAI', 'TERLAMBAT'] as FilterType[]).map((tab) => {
          const count = tasks.filter(t => {
            if (tab === 'AKTIF') return !t.isCompleted;
            if (tab === 'SELESAI') return t.isCompleted;
            if (tab === 'TERLAMBAT') return isOverdue(t.dueDate, t.isCompleted);
            return true;
          }).length;

          return (
            <button
              id={`tab-filter-${tab.toLowerCase()}`}
              key={tab}
              onClick={() => setFilter(tab)}
              className={`text-xs px-3 py-1.5 font-medium rounded-xl cursor-pointer transition-all shrink-0 ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/50'
              }`}
            >
              {tab === 'SEMUA' && 'Semua Agenda'}
              {tab === 'AKTIF' && 'Menunggu'}
              {tab === 'SELESAI' && 'Selesai'}
              {tab === 'TERLAMBAT' && 'Terlambat'}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                filter === tab ? 'bg-indigo-700 text-indigo-50' : 'bg-gray-200 text-gray-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div className="flex gap-1.5 pb-4 mb-4 overflow-x-auto no-scrollbar items-center">
          <span className="text-[10px] uppercase font-bold text-gray-400 shrink-0 mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-secondary-text text-gray-400" /> Kategori:
          </span>
          <button
            id="btn-cat-filter-all"
            onClick={() => setCategoryFilter('')}
            className={`text-xs px-3 py-1 rounded-xl cursor-pointer transition shrink-0 ${
              categoryFilter === ''
                ? 'bg-slate-800 text-white border border-slate-800 shadow-2xs'
                : 'bg-gray-100/70 text-gray-600 hover:bg-gray-200 border border-transparent'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                id={`btn-cat-filter-${cat.id}`}
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`text-xs px-3 py-1 rounded-xl cursor-pointer transition shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs border border-indigo-600'
                    : 'bg-gray-100/70 text-gray-600 hover:bg-gray-200 border border-transparent'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Task List Rendering */}
      {sortedTasks.length === 0 ? (
        <div id="empty-state" className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-3 border border-gray-100">
            <Calendar className="w-7 h-7 text-gray-300" />
          </div>
          <p id="empty-state-text" className="text-sm font-medium text-gray-900">Tidak ada tugas ditemukan</p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            {search ? 'Cobalah gunakan kata kunci pencarian alternatif' : 'Buat jadwal tugas baru untuk menjajal pengingat otomatis'}
          </p>
          {!search && (
            <button
              id="btn-play-sound-test"
              onClick={onTriggerAlarmSound}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Jajal Bunyi Speaker Saya
            </button>
          )}
        </div>
      ) : (
        <div id="tasks-grid" className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
          {sortedTasks.map((task) => {
            const timeCalc = getRemainingTimeText(task.dueDate, task.isCompleted);
            const isTaskOverdue = isOverdue(task.dueDate, task.isCompleted);
            const taskCategory = categories.find(c => c.id === task.categoryId);

            return (
              <div
                id={`task-item-${task.id}`}
                key={task.id}
                className={`group p-4 rounded-xl border transition-all ${
                  task.isCompleted
                    ? 'bg-gray-50/60 border-gray-200/60 opacity-70'
                    : isTaskOverdue
                    ? 'bg-rose-50/20 border-rose-100/80 hover:border-rose-200/90'
                    : 'bg-white border-gray-100 hover:border-indigo-100/80'
                } flex gap-3.5 items-start justify-between`}
              >
                <div className="flex gap-3 items-start flex-1 min-w-0">
                  {/* Custom Checkbox */}
                  <button
                    id={`btn-complete-${task.id}`}
                    onClick={() => onToggleComplete(task.id)}
                    className="mt-0.5 text-gray-400 hover:text-indigo-600 transition shrink-0 cursor-pointer"
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Circle className={`w-5 h-5 ${isTaskOverdue ? 'text-rose-400 hover:text-rose-500' : 'text-gray-300'}`} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {getPriorityBadge(task.priority)}
                      {taskCategory && (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold border rounded-md px-2 py-0.5 ${taskCategory.color}`}>
                          {taskCategory.name}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold font-mono ${timeCalc.colorClass}`}>
                        {timeCalc.text}
                      </span>
                    </div>

                    <h3
                      id={`title-task-${task.id}`}
                      className={`text-sm font-semibold text-gray-900 break-words leading-tight ${
                        task.isCompleted ? 'line-through text-gray-400 font-normal' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p
                        id={`desc-task-${task.id}`}
                        className={`text-xs text-gray-500 mt-1 break-words line-clamp-2 ${
                          task.isCompleted ? 'text-gray-400/80' : ''
                        }`}
                      >
                        {task.description}
                      </p>
                    )}

                    {/* Date Time Indicator with icon */}
                    <div className="flex items-center gap-1.5 mt-2.5 text-gray-400">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] font-medium font-mono">
                        {formatIDDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Left/Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-center">
                  {/* Alarm Speaker Mute Button */}
                  {!task.isCompleted && (
                    <button
                      id={`btn-mute-task-${task.id}`}
                      onClick={() => onToggleSound(task.id)}
                      title={task.soundEnabled ? 'Matikan Suara Pengingat' : 'Aktifkan Suara Pengingat'}
                      className={`p-2 rounded-lg transition cursor-pointer border ${
                        task.soundEnabled
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100/80'
                          : 'bg-amber-50/50 border-amber-100/50 text-amber-500 hover:bg-amber-50'
                      }`}
                    >
                      {task.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    id={`btn-delete-task-${task.id}`}
                    onClick={() => onDeleteTask(task.id)}
                    title="Hapus Agenda"
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

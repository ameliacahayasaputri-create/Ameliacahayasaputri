/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Flame, Check, Clock, Volume2, X } from 'lucide-react';
import { AlarmInstance } from '../types';

interface NotificationToastProps {
  alarms: AlarmInstance[];
  onDismiss: (taskId: string) => void;
  onSnooze: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

export default function NotificationToast({ 
  alarms, 
  onDismiss, 
  onSnooze, 
  onComplete 
}: NotificationToastProps) {
  if (alarms.length === 0) return null;

  return (
    <div 
      id="global-alarms-overlay" 
      className="fixed inset-0 bg-gray-950/45 dark:bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
    >
      <div 
        id="alarm-modal-box" 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden transform scale-100 transition-all max-h-[90vh] flex flex-col"
      >
        {/* Glowing Head */}
        <div className="bg-amber-500 text-white p-5 flex items-center gap-3.5 relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-linear-to-r from-amber-500 to-indigo-600 opacity-90" />
          
          {/* Animated pulsing rings */}
          <div className="relative flex items-center justify-center w-12 h-12 bg-white/20 rounded-full animate-bounce shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white/30 opacity-75 animate-ping" />
            <Bell className="w-6 h-6 text-white animate-wiggle" />
          </div>

          <div className="relative z-10 flex-1">
            <h2 className="text-base font-bold tracking-tight">Pengingat Waktu Tiba!</h2>
            <p className="text-xs text-white/80">Sistem mendeteksi agenda yang memerlukan perhatian Anda</p>
          </div>
        </div>

        {/* Scrollable pending alarms list */}
        <div className="divide-y divide-gray-100 overflow-y-auto flex-1 max-h-[50vh] p-4 space-y-3">
          {alarms.map((alarm) => (
            <div 
              id={`alarm-triggered-${alarm.taskId}`}
              key={alarm.taskId} 
              className="p-4 bg-amber-50/40 rounded-xl border border-amber-100/60 space-y-3 animate-slideUp"
            >
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-amber-600 font-mono bg-amber-100/50 px-2 py-0.5 rounded-sm">
                  Alarm Aktif
                </span>
                <h3 className="text-sm font-bold text-gray-900 mt-1.5 leading-tight">{alarm.taskTitle}</h3>
                {alarm.taskDescription && (
                  <p className="text-xs text-secondary-text text-gray-600 mt-1 leading-relaxed break-words line-clamp-3">
                    {alarm.taskDescription}
                  </p>
                )}
              </div>

              {/* Action buttons list */}
              <div className="grid grid-cols-3 gap-2 pt-1.5">
                <button
                  id={`btn-complete-alarm-${alarm.taskId}`}
                  onClick={() => onComplete(alarm.taskId)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Selesai
                </button>
                <button
                  id={`btn-snooze-alarm-${alarm.taskId}`}
                  onClick={() => onSnooze(alarm.taskId)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 px-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> +5 Mnt
                </button>
                <button
                  id={`btn-dismiss-alarm-${alarm.taskId}`}
                  onClick={() => onDismiss(alarm.taskId)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs py-2 px-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Matikan
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-gray-400" /> Suara alarm diproduksi langsung
          </span>
          <span className="font-medium">Tekan tombol aksi di atas</span>
        </div>
      </div>
    </div>
  );
}

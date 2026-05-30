/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tag, Plus, Trash2, Edit2, Check, X, Folder, Layers } from 'lucide-react';
import { Category } from '../types';
import { playTickSound } from '../utils/audio';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

// Preset color options with beautiful accessible styling
export const COLOR_PRESETS = [
  { name: 'Indigo', color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/60', colorHex: '#6366f1' },
  { name: 'Emerald', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/60', colorHex: '#10b981' },
  { name: 'Rose', color: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/60', colorHex: '#f43f5e' },
  { name: 'Amber', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/60', colorHex: '#f59e0b' },
  { name: 'Purple', color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100/60', colorHex: '#a855f7' },
  { name: 'Sky', color: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100/60', colorHex: '#0ea5e9' },
];

export default function CategoryManager({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [isManaging, setIsManaging] = useState(false);
  const [name, setName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColorIdx, setEditingColorIdx] = useState(0);
  const [error, setError] = useState('');

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama kategori tidak boleh kosong.');
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('Nama kategori ini sudah terdaftar.');
      return;
    }

    const colorPreset = COLOR_PRESETS[selectedColorIdx];
    onAddCategory({
      name: name.trim(),
      color: colorPreset.color,
      colorHex: colorPreset.colorHex,
    });

    setName('');
    setError('');
    playTickSound();
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    
    // Find color index dynamically
    const idx = COLOR_PRESETS.findIndex((preset) => preset.colorHex === cat.colorHex);
    setEditingColorIdx(idx !== -1 ? idx : 0);
    setError('');
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) {
      setError('Nama kategori tidak boleh kosong.');
      return;
    }

    const isDuplicate = categories.some(
      (c) => c.id !== id && c.name.toLowerCase() === editingName.trim().toLowerCase()
    );
    if (isDuplicate) {
      setError('Kategori lain memiliki nama yang sama.');
      return;
    }

    const chosenPreset = COLOR_PRESETS[editingColorIdx];
    onUpdateCategory({
      id,
      name: editingName.trim(),
      color: chosenPreset.color,
      colorHex: chosenPreset.colorHex,
    });

    setEditingId(null);
    setError('');
    playTickSound();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setError('');
  };

  return (
    <div id="category-manager-card" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">Kelola Kategori Kustom</h3>
            <p className="text-[11px] text-gray-500">Merapikan agenda dan alur fokus harian</p>
          </div>
        </div>

        <button
          id="btn-toggle-manage-categories"
          onClick={() => setIsManaging(!isManaging)}
          className={`text-xs px-3 py-1.5 font-medium rounded-xl cursor-pointer transition ${
            isManaging 
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100/80 border border-rose-200/50' 
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100/35'
          }`}
        >
          {isManaging ? 'Selesai' : 'Urus Kategori'}
        </button>
      </div>

      {isManaging ? (
        <div className="space-y-4 animate-fadeIn">
          {error && (
            <div className="p-2 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] rounded-lg">
              {error}
            </div>
          )}

          {/* New Category creation form */}
          <form onSubmit={handleAddNew} className="space-y-3 p-3.5 bg-gray-50/50 rounded-xl border border-gray-200/30">
            <span className="text-[10px] uppercase font-bold text-gray-500">Kategori Baru</span>
            <div className="flex gap-2">
              <input
                id="category-name-input"
                type="text"
                placeholder="cth: Kuliah, Belanjaan, Gym..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
              />
              <button
                id="btn-add-category"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Color Swatch circle picker */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 font-medium block">Pilih Warna Label:</span>
              <div className="flex gap-2">
                {COLOR_PRESETS.map((p, idx) => (
                  <button
                    id={`preset-${p.name.toLowerCase()}`}
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedColorIdx(idx)}
                    className={`w-5 h-5 rounded-full border-2 transition ${
                      selectedColorIdx === idx ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: p.colorHex }}
                    title={p.name}
                  />
                ))}
              </div>
            </div>
          </form>

          {/* List of current editable categories */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-gray-500">Kategori Terdaftar ({categories.length})</span>
            {categories.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic">Belum ada kategori yang dibuat.</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between py-2 gap-2">
                    {editingId === cat.id ? (
                      // Editing block
                      <div className="flex flex-col gap-1.5 w-full bg-indigo-50/20 p-2 rounded-lg border border-indigo-100/50">
                        <input
                          id={`edit-cat-name-${cat.id}`}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none"
                        />
                        <div className="flex items-center justify-between gap-2">
                          {/* Color picker for edit */}
                          <div className="flex gap-1.5">
                            {COLOR_PRESETS.map((p, pIdx) => (
                              <button
                                key={p.name}
                                type="button"
                                onClick={() => setEditingColorIdx(pIdx)}
                                className={`w-4 h-4 rounded-full border transition ${
                                  editingColorIdx === pIdx ? 'ring-2 ring-indigo-500 border-white' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: p.colorHex }}
                              />
                            ))}
                          </div>

                          <div className="flex gap-1">
                            <button
                              id={`save-edit-cat-${cat.id}`}
                              onClick={() => handleSaveEdit(cat.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`cancel-edit-cat-${cat.id}`}
                              onClick={handleCancelEdit}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Default row view
                      <>
                        <span className={`text-[11px] px-2.5 py-1 rounded-xl border font-medium font-sans ${cat.color}`}>
                          {cat.name}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            id={`btn-edit-cat-${cat.id}`}
                            onClick={() => startEdit(cat)}
                            title="Edit Kategori"
                            className="p-1 px-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition duration-150"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            id={`btn-delete-cat-${cat.id}`}
                            onClick={() => {
                              onDeleteCategory(cat.id);
                              playTickSound();
                            }}
                            title="Hapus Kategori"
                            className="p-1 px-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition duration-150"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Quick viewing summary mode
        <div className="flex flex-wrap gap-1.5">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-2 w-full text-center">
              <p className="text-xs text-gray-400 italic">Belum ada kategori kustom.</p>
            </div>
          ) : (
            categories.map((cat) => (
              <span
                key={cat.id}
                className={`text-[11px] px-2.5 py-1 rounded-xl border font-medium ${cat.color} truncate max-w-[120px] transition`}
              >
                {cat.name}
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
}

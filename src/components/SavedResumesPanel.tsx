import React, { useRef, useState } from 'react';
import {
  Copy,
  FilePlus2,
  Trash2,
  Download,
  Upload,
  Check,
  Pencil,
} from 'lucide-react';
import { SavedResume } from '../types/resume';

interface SavedResumesPanelProps {
  resumes: SavedResume[];
  activeResumeId: string;
  onSelectResume: (id: string) => void;
  onCreateBlank: () => void;
  onLoadSampleIse: () => void;
  onDuplicateResume: (id: string) => void;
  onRenameResume: (id: string, newName: string) => void;
  onDeleteResume: (id: string) => void;
  onImportResumeJson: (imported: SavedResume) => void;
}

export const SavedResumesPanel: React.FC<SavedResumesPanelProps> = ({
  resumes,
  activeResumeId,
  onSelectResume,
  onCreateBlank,
  onLoadSampleIse,
  onDuplicateResume,
  onRenameResume,
  onDeleteResume,
  onImportResumeJson,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = (resume: SavedResume) => {
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.name.replace(/[^a-zA-Z0-9_-]+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed?.data?.personal || !parsed?.config?.templateId) {
        throw new Error('Invalid resume backup JSON format.');
      }
      onImportResumeJson({
        ...parsed,
        id: `resume-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not import JSON file.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Saved Resumes</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain tailored resume versions for different internship roles and campus drives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            Import JSON
          </button>
          <button
            type="button"
            onClick={onCreateBlank}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
          >
            <FilePlus2 className="w-3.5 h-3.5" aria-hidden="true" />
            New Blank Resume
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto studio-scroll p-6 space-y-5">
        {importError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
            {importError}
          </div>
        )}

        <div className="space-y-3">
          {resumes.map((resume) => {
            const isActive = resume.id === activeResumeId;
            const isEditing = editingId === resume.id;
            const formattedDate = new Date(resume.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={resume.id}
                className={`p-4 rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-blue-50/40 border-blue-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && draftName.trim()) {
                              onRenameResume(resume.id, draftName.trim());
                              setEditingId(null);
                            }
                          }}
                          className="px-2.5 py-1 text-sm bg-white border border-blue-600 rounded-md focus:outline-none flex-1"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (draftName.trim()) {
                              onRenameResume(resume.id, draftName.trim());
                            }
                            setEditingId(null);
                          }}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Check className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectResume(resume.id)}
                          className="text-sm font-semibold text-slate-900 hover:text-blue-700 text-left truncate cursor-pointer"
                        >
                          {resume.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(resume.id);
                            setDraftName(resume.name);
                          }}
                          aria-label="Rename resume"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{resume.data.personal.fullName || 'Untitled Student'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{resume.data.personal.targetRole || 'General Role'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">Updated {formattedDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => onSelectResume(resume.id)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                      >
                        Open
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDuplicateResume(resume.id)}
                      title="Duplicate for another role"
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportJson(resume)}
                      title="Export JSON backup"
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    {resumes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteResume(resume.id)}
                        title="Delete resume"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-900">Need a starting example?</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Load a pre-filled Information Science & Engineering student profile to test templates and AI features.
            </p>
          </div>
          <button
            type="button"
            onClick={onLoadSampleIse}
            className="px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Add Sample Profile
          </button>
        </div>
      </div>
    </div>
  );
};

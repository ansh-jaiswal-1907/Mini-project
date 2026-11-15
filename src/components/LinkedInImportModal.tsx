import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  ExternalLink,
  Link2,
  Loader2,
  X,
} from 'lucide-react';
import { LinkedInImportResult, ResumeData } from '../types/resume';

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: ResumeData;
  onApplyImportedData: (nextData: ResumeData, message: string) => void;
}

type MergeMode = 'replace' | 'merge';

type SelectableSection =
  | 'personal'
  | 'education'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'certifications'
  | 'achievements';

export const LinkedInImportModal: React.FC<LinkedInImportModalProps> = ({
  isOpen,
  onClose,
  currentData,
  onApplyImportedData,
}) => {
  const [url, setUrl] = useState(
    currentData.personal.linkedin
      ? currentData.personal.linkedin.startsWith('http')
        ? currentData.personal.linkedin
        : `https://www.${currentData.personal.linkedin}`
      : ''
  );
  const [fallbackText, setFallbackText] = useState('');
  const [showFallbackInput, setShowFallbackInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkedInImportResult | null>(null);
  const [mergeMode, setMergeMode] = useState<MergeMode>('replace');
  const [selectedSections, setSelectedSections] = useState<Record<SelectableSection, boolean>>({
    personal: true,
    education: true,
    skills: true,
    projects: true,
    experience: true,
    certifications: true,
    achievements: true,
  });

  if (!isOpen) return null;

  const runFetchAgent = async (useFallbackText: boolean) => {
    setError(null);
    if (!useFallbackText && !url.trim()) {
      setError('Enter a LinkedIn public profile URL such as https://www.linkedin.com/in/username.');
      return;
    }
    if (useFallbackText && fallbackText.trim().length < 20) {
      setError('Paste at least a few lines of profile text to parse.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/import-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          fallbackText: useFallbackText ? fallbackText.trim() : undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Could not fetch LinkedIn profile.');
      }

      const parsed = json as LinkedInImportResult;
      setResult(parsed);
      if (parsed.status === 'not_found') {
        setShowFallbackInput(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse LinkedIn profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (key: SelectableSection) => {
    setSelectedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApplyToEditor = () => {
    if (!result) return;
    const ext = result.extracted;
    const ts = Date.now();

    const nextData: ResumeData = structuredClone(currentData);

    if (selectedSections.personal) {
      if (mergeMode === 'replace') {
        nextData.personal = {
          ...nextData.personal,
          fullName: ext.personal.fullName || nextData.personal.fullName,
          targetRole: ext.personal.targetRole || nextData.personal.targetRole,
          location: ext.personal.location || nextData.personal.location,
          linkedin: ext.personal.linkedin || nextData.personal.linkedin,
          github: ext.personal.github || nextData.personal.github,
          portfolio: ext.personal.portfolio || nextData.personal.portfolio,
          careerInterests: ext.personal.careerInterests || nextData.personal.careerInterests,
          summary: ext.personal.summary || nextData.personal.summary,
        };
      } else {
        nextData.personal = {
          ...nextData.personal,
          fullName: nextData.personal.fullName || ext.personal.fullName || '',
          targetRole: nextData.personal.targetRole || ext.personal.targetRole || '',
          location: nextData.personal.location || ext.personal.location || '',
          linkedin: nextData.personal.linkedin || ext.personal.linkedin || '',
          github: nextData.personal.github || ext.personal.github || '',
          portfolio: nextData.personal.portfolio || ext.personal.portfolio || '',
          careerInterests: nextData.personal.careerInterests || ext.personal.careerInterests || '',
          summary: nextData.personal.summary || ext.personal.summary || '',
        };
      }
    }

    if (selectedSections.education && ext.education.length > 0) {
      const mapped = ext.education.map((edu, idx) => ({
        id: `li-edu-${ts}-${idx}`,
        degree: edu.degree || '',
        institution: edu.institution || '',
        location: edu.location || '',
        startYear: edu.startYear || '',
        endYear: edu.endYear || '',
        gradeLabel: edu.gradeLabel || 'CGPA',
        gradeValue: edu.gradeValue || '',
        coursework: edu.coursework || '',
      }));
      nextData.education = mergeMode === 'replace' ? mapped : [...nextData.education, ...mapped];
    }

    if (selectedSections.skills && ext.skills.length > 0) {
      const mapped = ext.skills.map((sk, idx) => ({
        id: `li-sk-${ts}-${idx}`,
        category: sk.category || 'Technical Skills',
        items: Array.isArray(sk.items) ? sk.items : [],
      }));
      nextData.skills = mergeMode === 'replace' ? mapped : [...nextData.skills, ...mapped];
    }

    if (selectedSections.projects && ext.projects.length > 0) {
      const mapped = ext.projects.map((p, idx) => ({
        id: `li-proj-${ts}-${idx}`,
        title: p.title || '',
        techStack: p.techStack || '',
        duration: p.duration || '',
        link: p.link || '',
        rawNotes: p.rawNotes || '',
        bullets: Array.isArray(p.bullets) ? p.bullets : [],
      }));
      nextData.projects = mergeMode === 'replace' ? mapped : [...nextData.projects, ...mapped];
    }

    if (selectedSections.experience && ext.experience.length > 0) {
      const mapped = ext.experience.map((ex, idx) => ({
        id: `li-exp-${ts}-${idx}`,
        role: ex.role || '',
        organization: ex.organization || '',
        location: ex.location || '',
        duration: ex.duration || '',
        rawNotes: ex.rawNotes || '',
        bullets: Array.isArray(ex.bullets) ? ex.bullets : [],
      }));
      nextData.experience = mergeMode === 'replace' ? mapped : [...nextData.experience, ...mapped];
    }

    if (selectedSections.certifications && ext.certifications.length > 0) {
      const mapped = ext.certifications.map((c, idx) => ({
        id: `li-cert-${ts}-${idx}`,
        title: c.title || '',
        issuer: c.issuer || '',
        date: c.date || '',
        credentialId: c.credentialId || '',
      }));
      nextData.certifications =
        mergeMode === 'replace' ? mapped : [...nextData.certifications, ...mapped];
    }

    if (selectedSections.achievements && ext.achievements.length > 0) {
      const mapped = ext.achievements.map((a, idx) => ({
        id: `li-ach-${ts}-${idx}`,
        title: a.title || '',
        context: a.context || '',
        date: a.date || '',
        description: a.description || '',
      }));
      nextData.achievements =
        mergeMode === 'replace' ? mapped : [...nextData.achievements, ...mapped];
    }

    const label = ext.personal.fullName ? ` for ${ext.personal.fullName}` : '';
    onApplyImportedData(nextData, `Imported LinkedIn profile data${label} into the resume editor.`);
    onClose();
  };

  const hasAnyExtracted =
    result &&
    (Boolean(result.extracted.personal.fullName) ||
      result.extracted.education.length > 0 ||
      result.extracted.experience.length > 0 ||
      result.extracted.skills.length > 0 ||
      result.extracted.projects.length > 0 ||
      result.extracted.certifications.length > 0 ||
      result.extracted.achievements.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="linkedin-modal-title"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="linkedin-modal-title" className="text-base font-semibold text-slate-900">
              Import Public LinkedIn Profile
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste a public LinkedIn URL and our AI agent will fetch indexed profile details into your resume.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto studio-scroll p-6 space-y-5">
          {/* URL Input */}
          <div className="space-y-2">
            <label htmlFor="linkedin-url-input" className="block text-xs font-medium text-slate-700">
              LinkedIn Public Profile URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Link2
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="linkedin-url-input"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void runFetchAgent(false);
                    }
                  }}
                  placeholder="https://www.linkedin.com/in/username"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void runFetchAgent(false)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    Fetching Profile...
                  </>
                ) : (
                  'Fetch & Parse'
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Works best when the profile is set to Public visibility.</span>
              <button
                type="button"
                onClick={() => setShowFallbackInput((v) => !v)}
                className="text-blue-700 hover:underline font-medium cursor-pointer"
              >
                {showFallbackInput ? 'Hide manual text paste' : 'Profile private? Paste text instead'}
              </button>
            </div>
          </div>

          {/* Optional Manual Profile Text Fallback */}
          {showFallbackInput && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
              <label htmlFor="linkedin-fallback-text" className="block text-xs font-medium text-slate-700">
                Paste Public Profile or LinkedIn PDF Text
              </label>
              <textarea
                id="linkedin-fallback-text"
                rows={4}
                value={fallbackText}
                onChange={(e) => setFallbackText(e.target.value)}
                placeholder="Copy your About, Experience, Education, and Skills from LinkedIn and paste them here..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void runFetchAgent(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  Parse Pasted Text
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Result Preview */}
          {result && (
            <div className="space-y-4 pt-3 border-t border-slate-200">
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  result.status === 'not_found'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {result.status === 'not_found' ? (
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <span>{result.statusMessage}</span>
              </div>

              {hasAnyExtracted && (
                <>
                  {/* Selectable Parsed Sections */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">
                        Parsed Sections Ready to Import
                      </span>
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md text-xs">
                        <button
                          type="button"
                          onClick={() => setMergeMode('replace')}
                          className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                            mergeMode === 'replace'
                              ? 'bg-white text-slate-900 font-medium shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          Replace Sections
                        </button>
                        <button
                          type="button"
                          onClick={() => setMergeMode('merge')}
                          className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                            mergeMode === 'merge'
                              ? 'bg-white text-slate-900 font-medium shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          Merge & Append
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
                      <label className="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedSections.personal}
                          onChange={() => toggleSection('personal')}
                          className="mt-0.5 accent-blue-700"
                        />
                        <div className="text-xs space-y-0.5">
                          <div className="font-semibold text-slate-900">
                            Personal & Headline
                          </div>
                          <div className="text-slate-600">
                            {[
                              result.extracted.personal.fullName,
                              result.extracted.personal.targetRole,
                              result.extracted.personal.location,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'No personal fields extracted'}
                          </div>
                          {result.extracted.personal.summary && (
                            <p className="text-slate-500 line-clamp-2">
                              {result.extracted.personal.summary}
                            </p>
                          )}
                        </div>
                      </label>

                      {(
                        [
                          {
                            key: 'education',
                            label: 'Education',
                            count: result.extracted.education.length,
                            preview: result.extracted.education
                              .map((e) => [e.degree, e.institution].filter(Boolean).join(' — '))
                              .join('; '),
                          },
                          {
                            key: 'experience',
                            label: 'Experience & Internships',
                            count: result.extracted.experience.length,
                            preview: result.extracted.experience
                              .map((e) => [e.role, e.organization].filter(Boolean).join(' at '))
                              .join('; '),
                          },
                          {
                            key: 'skills',
                            label: 'Technical Skills',
                            count: result.extracted.skills.reduce((acc, g) => acc + g.items.length, 0),
                            preview: result.extracted.skills
                              .flatMap((g) => g.items)
                              .slice(0, 10)
                              .join(', '),
                          },
                          {
                            key: 'projects',
                            label: 'Projects',
                            count: result.extracted.projects.length,
                            preview: result.extracted.projects.map((p) => p.title).join('; '),
                          },
                          {
                            key: 'certifications',
                            label: 'Certifications',
                            count: result.extracted.certifications.length,
                            preview: result.extracted.certifications.map((c) => c.title).join('; '),
                          },
                          {
                            key: 'achievements',
                            label: 'Achievements',
                            count: result.extracted.achievements.length,
                            preview: result.extracted.achievements.map((a) => a.title).join('; '),
                          },
                        ] as {
                          key: SelectableSection;
                          label: string;
                          count: number;
                          preview: string;
                        }[]
                      ).map((row) => {
                        if (row.count === 0) return null;
                        return (
                          <label
                            key={row.key}
                            className="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSections[row.key]}
                              onChange={() => toggleSection(row.key)}
                              className="mt-0.5 accent-blue-700"
                            />
                            <div className="text-xs space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{row.label}</span>
                                <span className="text-slate-500 tabular-nums">({row.count})</span>
                              </div>
                              <p className="text-slate-600 truncate">{row.preview}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grounding Sources */}
                  {result.sources.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-slate-500">
                        Public Sources Consulted
                      </span>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {result.sources.map((src) => (
                          <a
                            key={src.uri}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:underline max-w-[260px] truncate"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!hasAnyExtracted}
            onClick={handleApplyToEditor}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
          >
            Import Into Resume Editor
          </button>
        </div>
      </div>
    </div>
  );
};

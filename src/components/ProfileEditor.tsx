import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Wand2,
  Loader2,
  RotateCcw,
  Check,
  AlertCircle,
  Link2,
} from 'lucide-react';
import {
  AchievementEntry,
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeData,
  SkillGroup,
} from '../types/resume';
import { LinkedInImportModal } from './LinkedInImportModal';

type EditorSection =
  | 'personal'
  | 'education'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'certifications'
  | 'achievements';

interface ProfileEditorProps {
  data: ResumeData;
  onChange: (updated: ResumeData) => void;
  onGenerateFullResume: () => Promise<void>;
  isGeneratingFull: boolean;
  aiFeedback: string | null;
  aiError: string | null;
  onClearFeedback: () => void;
}

const SECTION_TABS: { id: EditorSection; label: string }[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'achievements', label: 'Achievements' },
];

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  data,
  onChange,
  onGenerateFullResume,
  isGeneratingFull,
  aiFeedback,
  aiError,
  onClearFeedback,
}) => {
  const [activeSection, setActiveSection] = useState<EditorSection>('personal');
  const [refiningId, setRefiningId] = useState<string | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({});
  const [undoSnapshot, setUndoSnapshot] = useState<ResumeData | null>(null);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const updatePersonal = (field: keyof ResumeData['personal'], value: string) => {
    onChange({
      ...data,
      personal: {
        ...data.personal,
        [field]: value,
      },
    });
  };

  const handleFullGenerate = async () => {
    setUndoSnapshot(structuredClone(data));
    await onGenerateFullResume();
  };

  const handleUndoAi = () => {
    if (!undoSnapshot) return;
    onChange(undoSnapshot);
    setUndoSnapshot(null);
    setImportNotice(null);
    onClearFeedback();
  };

  const refineSingleItem = async (params: {
    id: string;
    itemType: 'summary' | 'project' | 'experience' | 'achievement';
    title?: string;
    context?: string;
    rawText: string;
    onApply: (result: { refinedText: string; refinedBullets: string[] }) => void;
  }) => {
    setRefineError(null);
    if (!params.rawText.trim()) {
      setRefineError('Enter notes or text first so AI has your facts to polish.');
      return;
    }

    setRefiningId(params.id);
    setUndoSnapshot(structuredClone(data));
    try {
      const response = await fetch('/api/ai/refine-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: params.itemType,
          title: params.title,
          context: params.context,
          rawText: params.rawText,
          targetRole: data.personal.targetRole,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Could not refine text.');
      }
      params.onApply({
        refinedText: json.refinedText || '',
        refinedBullets: Array.isArray(json.refinedBullets) ? json.refinedBullets : [],
      });
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : 'Failed to refine item.');
    } finally {
      setRefiningId(null);
    }
  };

  // Education helpers
  const addEducation = () => {
    const next: EducationEntry = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      location: '',
      startYear: '',
      endYear: '',
      gradeLabel: 'CGPA',
      gradeValue: '',
      coursework: '',
    };
    onChange({ ...data, education: [...data.education, next] });
  };

  const updateEducation = (id: string, field: keyof EducationEntry, value: string) => {
    onChange({
      ...data,
      education: data.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    });
  };

  const removeEducation = (id: string) => {
    onChange({ ...data, education: data.education.filter((e) => e.id !== id) });
  };

  // Skills helpers
  const addSkillGroup = () => {
    const next: SkillGroup = {
      id: `sk-${Date.now()}`,
      category: 'New Category',
      items: [],
    };
    onChange({ ...data, skills: [...data.skills, next] });
  };

  const updateSkillCategory = (id: string, category: string) => {
    onChange({
      ...data,
      skills: data.skills.map((s) => (s.id === id ? { ...s, category } : s)),
    });
  };

  const addSkillItems = (groupId: string) => {
    const raw = (skillInputs[groupId] || '').trim();
    if (!raw) return;
    const newTokens = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (newTokens.length === 0) return;

    onChange({
      ...data,
      skills: data.skills.map((group) => {
        if (group.id !== groupId) return group;
        const merged = Array.from(new Set([...group.items, ...newTokens]));
        return { ...group, items: merged };
      }),
    });
    setSkillInputs((prev) => ({ ...prev, [groupId]: '' }));
  };

  const removeSkillItem = (groupId: string, itemToRemove: string) => {
    onChange({
      ...data,
      skills: data.skills.map((group) =>
        group.id === groupId
          ? { ...group, items: group.items.filter((item) => item !== itemToRemove) }
          : group
      ),
    });
  };

  const removeSkillGroup = (id: string) => {
    onChange({ ...data, skills: data.skills.filter((s) => s.id !== id) });
  };

  // Project helpers
  const addProject = () => {
    const next: ProjectEntry = {
      id: `proj-${Date.now()}`,
      title: '',
      techStack: '',
      duration: '',
      link: '',
      rawNotes: '',
      bullets: [],
    };
    onChange({ ...data, projects: [...data.projects, next] });
  };

  const updateProject = (id: string, patch: Partial<ProjectEntry>) => {
    onChange({
      ...data,
      projects: data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const removeProject = (id: string) => {
    onChange({ ...data, projects: data.projects.filter((p) => p.id !== id) });
  };

  // Experience helpers
  const addExperience = () => {
    const next: ExperienceEntry = {
      id: `exp-${Date.now()}`,
      role: '',
      organization: '',
      location: '',
      duration: '',
      rawNotes: '',
      bullets: [],
    };
    onChange({ ...data, experience: [...data.experience, next] });
  };

  const updateExperience = (id: string, patch: Partial<ExperienceEntry>) => {
    onChange({
      ...data,
      experience: data.experience.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)),
    });
  };

  const removeExperience = (id: string) => {
    onChange({ ...data, experience: data.experience.filter((ex) => ex.id !== id) });
  };

  // Certifications helpers
  const addCertification = () => {
    const next: CertificationEntry = {
      id: `cert-${Date.now()}`,
      title: '',
      issuer: '',
      date: '',
      credentialId: '',
    };
    onChange({ ...data, certifications: [...data.certifications, next] });
  };

  const updateCertification = (id: string, field: keyof CertificationEntry, value: string) => {
    onChange({
      ...data,
      certifications: data.certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    });
  };

  const removeCertification = (id: string) => {
    onChange({ ...data, certifications: data.certifications.filter((c) => c.id !== id) });
  };

  // Achievements helpers
  const addAchievement = () => {
    const next: AchievementEntry = {
      id: `ach-${Date.now()}`,
      title: '',
      context: '',
      date: '',
      description: '',
    };
    onChange({ ...data, achievements: [...data.achievements, next] });
  };

  const updateAchievement = (id: string, field: keyof AchievementEntry, value: string) => {
    onChange({
      ...data,
      achievements: data.achievements.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    });
  };

  const removeAchievement = (id: string) => {
    onChange({ ...data, achievements: data.achievements.filter((a) => a.id !== id) });
  };

  const inputClass =
    'w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors';
  const labelClass = 'block text-xs font-medium text-slate-700 mb-1.5';

  return (
    <div className="flex flex-col h-full">
      {/* Studio Action Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Student Profile & Content</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter your academic details and rough notes, then refine with AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {undoSnapshot && (
            <button
              type="button"
              onClick={handleUndoAi}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Undo Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsLinkedInModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
            Import LinkedIn
          </button>
          <button
            type="button"
            onClick={handleFullGenerate}
            disabled={isGeneratingFull}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isGeneratingFull ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {isGeneratingFull ? 'Generating Resume...' : 'Generate Resume Content'}
          </button>
        </div>
      </div>

      {/* Section Segmented Strip */}
      <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {SECTION_TABS.map((tab) => {
          const active = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Feedback / Error Banner */}
      {(aiFeedback || importNotice || aiError || refineError) && (
        <div className="px-6 pt-4 space-y-2">
          {(aiFeedback || importNotice) && (
            <div className="flex items-start justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{importNotice || aiFeedback}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setImportNotice(null);
                  onClearFeedback();
                }}
                className="text-emerald-700 hover:text-emerald-900 font-medium shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
          {(aiError || refineError) && (
            <div className="flex items-start justify-between gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{aiError || refineError}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRefineError(null);
                  onClearFeedback();
                }}
                className="text-red-700 hover:text-red-900 font-medium shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Form Body */}
      <div className="flex-1 overflow-y-auto studio-scroll p-6 space-y-6">
        {activeSection === 'personal' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={data.personal.fullName}
                  onChange={(e) => updatePersonal('fullName', e.target.value)}
                  placeholder="e.g., Ayush Kumar Shaw"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="usn">University Seat Number (Optional)</label>
                <input
                  id="usn"
                  type="text"
                  value={data.personal.usn}
                  onChange={(e) => updatePersonal('usn', e.target.value)}
                  placeholder="e.g., 1DA24IS013"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="targetRole">Target Role / Internship Title</label>
                <input
                  id="targetRole"
                  type="text"
                  value={data.personal.targetRole}
                  onChange={(e) => updatePersonal('targetRole', e.target.value)}
                  placeholder="e.g., Software Engineering Intern"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="location">City & State</label>
                <input
                  id="location"
                  type="text"
                  value={data.personal.location}
                  onChange={(e) => updatePersonal('location', e.target.value)}
                  placeholder="e.g., Bengaluru, Karnataka"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={data.personal.email}
                  onChange={(e) => updatePersonal('email', e.target.value)}
                  placeholder="student@college.edu"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  value={data.personal.phone}
                  onChange={(e) => updatePersonal('phone', e.target.value)}
                  placeholder="+91 98450 00000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="linkedin">LinkedIn URL</label>
                <input
                  id="linkedin"
                  type="text"
                  value={data.personal.linkedin}
                  onChange={(e) => updatePersonal('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="github">GitHub URL</label>
                <input
                  id="github"
                  type="text"
                  value={data.personal.github}
                  onChange={(e) => updatePersonal('github', e.target.value)}
                  placeholder="github.com/username"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="portfolio">Portfolio / Website (Optional)</label>
              <input
                id="portfolio"
                type="text"
                value={data.personal.portfolio}
                onChange={(e) => updatePersonal('portfolio', e.target.value)}
                placeholder="yourportfolio.dev"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="careerInterests">Career Interests & Focus Areas</label>
              <input
                id="careerInterests"
                type="text"
                value={data.personal.careerInterests}
                onChange={(e) => updatePersonal('careerInterests', e.target.value)}
                placeholder="e.g., Backend Engineering, Cloud Infrastructure, Applied NLP"
                className={inputClass}
              />
            </div>

            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700" htmlFor="summary">
                  Professional Summary
                </label>
                <button
                  type="button"
                  disabled={refiningId === 'summary'}
                  onClick={() =>
                    refineSingleItem({
                      id: 'summary',
                      itemType: 'summary',
                      rawText:
                        data.personal.summary ||
                        `Student targeting ${data.personal.targetRole || 'entry-level engineering'} with interests in ${data.personal.careerInterests}`,
                      onApply: ({ refinedText }) => {
                        if (refinedText) updatePersonal('summary', refinedText);
                      },
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                >
                  {refiningId === 'summary' ? (
                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <Wand2 className="w-3 h-3" aria-hidden="true" />
                  )}
                  Polish with AI
                </button>
              </div>
              <textarea
                id="summary"
                rows={4}
                value={data.personal.summary}
                onChange={(e) => updatePersonal('summary', e.target.value)}
                placeholder="Write a 2-3 sentence summary or click 'Generate Resume Content' to draft one from your profile..."
                className={inputClass}
              />
            </div>
          </div>
        )}

        {activeSection === 'education' && (
          <div className="space-y-5">
            {data.education.map((edu, index) => (
              <div key={edu.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    Education Entry {index + 1}
                  </span>
                  {data.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      className="text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Degree / Program</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      placeholder="e.g., B.E. in Information Science and Engineering"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      placeholder="e.g., Dr. Ambedkar Institute of Technology"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Location</label>
                    <input
                      type="text"
                      value={edu.location}
                      onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                      placeholder="e.g., Bengaluru"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Start Year</label>
                      <input
                        type="text"
                        value={edu.startYear}
                        onChange={(e) => updateEducation(edu.id, 'startYear', e.target.value)}
                        placeholder="2024"
                        className={`${inputClass} tabular-nums`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>End / Expected</label>
                      <input
                        type="text"
                        value={edu.endYear}
                        onChange={(e) => updateEducation(edu.id, 'endYear', e.target.value)}
                        placeholder="2028"
                        className={`${inputClass} tabular-nums`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Score Label</label>
                      <input
                        type="text"
                        value={edu.gradeLabel}
                        onChange={(e) => updateEducation(edu.id, 'gradeLabel', e.target.value)}
                        placeholder="CGPA"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Score Value</label>
                      <input
                        type="text"
                        value={edu.gradeValue}
                        onChange={(e) => updateEducation(edu.id, 'gradeValue', e.target.value)}
                        placeholder="8.9 / 10.0"
                        className={`${inputClass} tabular-nums`}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Relevant Coursework</label>
                    <input
                      type="text"
                      value={edu.coursework}
                      onChange={(e) => updateEducation(edu.id, 'coursework', e.target.value)}
                      placeholder="Data Structures, DBMS, Operating Systems, Computer Networks"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addEducation}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Education
            </button>
          </div>
        )}

        {activeSection === 'skills' && (
          <div className="space-y-5">
            {data.skills.map((group) => (
              <div key={group.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={group.category}
                    onChange={(e) => updateSkillCategory(group.id, e.target.value)}
                    placeholder="Category name (e.g., Programming Languages)"
                    className="text-sm font-semibold text-slate-900 bg-transparent border-b border-transparent focus:border-blue-600 focus:outline-none py-0.5 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeSkillGroup(group.id)}
                    className="text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 rounded-md"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeSkillItem(group.id, item)}
                        aria-label={`Remove ${item}`}
                        className="text-slate-400 hover:text-slate-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {group.items.length === 0 && (
                    <span className="text-xs text-slate-400">No skills added yet.</span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={skillInputs[group.id] || ''}
                    onChange={(e) =>
                      setSkillInputs((prev) => ({ ...prev, [group.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkillItems(group.id);
                      }
                    }}
                    placeholder="Add skills separated by commas (e.g., Python, React, SQL)"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => addSkillItems(group.id)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addSkillGroup}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Skill Category
            </button>
          </div>
        )}

        {activeSection === 'projects' && (
          <div className="space-y-5">
            {data.projects.map((proj, index) => (
              <div key={proj.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    Project {index + 1}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={refiningId === proj.id}
                      onClick={() =>
                        refineSingleItem({
                          id: proj.id,
                          itemType: 'project',
                          title: proj.title,
                          context: proj.techStack,
                          rawText:
                            proj.rawNotes.trim() || proj.bullets.join('\n'),
                          onApply: ({ refinedBullets }) => {
                            if (refinedBullets.length > 0) {
                              updateProject(proj.id, { bullets: refinedBullets });
                            }
                          },
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 cursor-pointer"
                    >
                      {refiningId === proj.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      ) : (
                        <Wand2 className="w-3 h-3" aria-hidden="true" />
                      )}
                      Polish Bullets with AI
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProject(proj.id)}
                      className="text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Project Title</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                      placeholder="e.g., CampusSync — Smart Placement Portal"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Technologies Used</label>
                    <input
                      type="text"
                      value={proj.techStack}
                      onChange={(e) => updateProject(proj.id, { techStack: e.target.value })}
                      placeholder="React, FastAPI, PostgreSQL"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Duration</label>
                    <input
                      type="text"
                      value={proj.duration}
                      onChange={(e) => updateProject(proj.id, { duration: e.target.value })}
                      placeholder="Jan 2026 – Apr 2026"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Repository or Live Link (Optional)</label>
                    <input
                      type="text"
                      value={proj.link}
                      onChange={(e) => updateProject(proj.id, { link: e.target.value })}
                      placeholder="github.com/username/project"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Rough Notes (What you built & your contribution)</label>
                    <textarea
                      rows={2}
                      value={proj.rawNotes}
                      onChange={(e) => updateProject(proj.id, { rawNotes: e.target.value })}
                      placeholder="Describe briefly what the project does and what you implemented..."
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Resume Bullet Points (One bullet per line)</label>
                    <textarea
                      rows={4}
                      value={proj.bullets.join('\n')}
                      onChange={(e) =>
                        updateProject(proj.id, {
                          bullets: e.target.value.split('\n'),
                        })
                      }
                      placeholder="Click 'Polish Bullets with AI' or write one bullet point per line..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addProject}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Project
            </button>
          </div>
        )}

        {activeSection === 'experience' && (
          <div className="space-y-5">
            {data.experience.length === 0 && (
              <div className="p-6 bg-white border border-slate-200 rounded-lg text-center space-y-2">
                <p className="text-sm font-medium text-slate-800">No internships or work experience added</p>
                <p className="text-xs text-slate-500">
                  Freshers can keep this empty (it will stay hidden on your resume) or add campus leadership / internships.
                </p>
              </div>
            )}

            {data.experience.map((exp, index) => (
              <div key={exp.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    Experience {index + 1}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={refiningId === exp.id}
                      onClick={() =>
                        refineSingleItem({
                          id: exp.id,
                          itemType: 'experience',
                          title: `${exp.role} at ${exp.organization}`,
                          rawText: exp.rawNotes.trim() || exp.bullets.join('\n'),
                          onApply: ({ refinedBullets }) => {
                            if (refinedBullets.length > 0) {
                              updateExperience(exp.id, { bullets: refinedBullets });
                            }
                          },
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 cursor-pointer"
                    >
                      {refiningId === exp.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      ) : (
                        <Wand2 className="w-3 h-3" aria-hidden="true" />
                      )}
                      Polish Bullets with AI
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>Role Title</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                      placeholder="e.g., Web Development Intern"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Organization / Company</label>
                    <input
                      type="text"
                      value={exp.organization}
                      onChange={(e) => updateExperience(exp.id, { organization: e.target.value })}
                      placeholder="e.g., Acme Software Pvt. Ltd."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Location</label>
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                      placeholder="Bengaluru / Remote"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Duration</label>
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => updateExperience(exp.id, { duration: e.target.value })}
                      placeholder="Jun 2025 – Aug 2025"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Rough Notes</label>
                    <textarea
                      rows={2}
                      value={exp.rawNotes}
                      onChange={(e) => updateExperience(exp.id, { rawNotes: e.target.value })}
                      placeholder="Describe tasks and tools you worked with..."
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Resume Bullet Points (One bullet per line)</label>
                    <textarea
                      rows={3}
                      value={exp.bullets.join('\n')}
                      onChange={(e) =>
                        updateExperience(exp.id, { bullets: e.target.value.split('\n') })
                      }
                      placeholder="One bullet per line..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addExperience}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Internship / Experience
            </button>
          </div>
        )}

        {activeSection === 'certifications' && (
          <div className="space-y-4">
            {data.certifications.length === 0 && (
              <div className="p-6 bg-white border border-slate-200 rounded-lg text-center">
                <p className="text-sm font-medium text-slate-800">No certifications added yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Add NPTEL, Coursera, AWS, or technical skill certifications.
                </p>
              </div>
            )}

            {data.certifications.map((cert, index) => (
              <div key={cert.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">Certification {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeCertification(cert.id)}
                    className="text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Certification Title</label>
                    <input
                      type="text"
                      value={cert.title}
                      onChange={(e) => updateCertification(cert.id, 'title', e.target.value)}
                      placeholder="e.g., AWS Certified Cloud Practitioner"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Issuing Organization</label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                      placeholder="Coursera / NPTEL / AWS"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Date</label>
                      <input
                        type="text"
                        value={cert.date}
                        onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                        placeholder="Feb 2026"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Credential ID</label>
                      <input
                        type="text"
                        value={cert.credentialId}
                        onChange={(e) => updateCertification(cert.id, 'credentialId', e.target.value)}
                        placeholder="Optional"
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addCertification}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Certification
            </button>
          </div>
        )}

        {activeSection === 'achievements' && (
          <div className="space-y-4">
            {data.achievements.length === 0 && (
              <div className="p-6 bg-white border border-slate-200 rounded-lg text-center">
                <p className="text-sm font-medium text-slate-800">No achievements or extracurriculars yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Include hackathons, coding contest ranks, clubs, or paper presentations.
                </p>
              </div>
            )}

            {data.achievements.map((ach, index) => (
              <div key={ach.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">Achievement {index + 1}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={refiningId === ach.id}
                      onClick={() =>
                        refineSingleItem({
                          id: ach.id,
                          itemType: 'achievement',
                          title: ach.title,
                          context: ach.context,
                          rawText: ach.description || ach.title,
                          onApply: ({ refinedText }) => {
                            if (refinedText) {
                              updateAchievement(ach.id, 'description', refinedText);
                            }
                          },
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 cursor-pointer"
                    >
                      {refiningId === ach.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      ) : (
                        <Wand2 className="w-3 h-3" aria-hidden="true" />
                      )}
                      Polish with AI
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAchievement(ach.id)}
                      className="text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Title / Recognition</label>
                    <input
                      type="text"
                      value={ach.title}
                      onChange={(e) => updateAchievement(ach.id, 'title', e.target.value)}
                      placeholder="e.g., Finalist — VTU State Hackathon"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Context / Organization</label>
                    <input
                      type="text"
                      value={ach.context}
                      onChange={(e) => updateAchievement(ach.id, 'context', e.target.value)}
                      placeholder="e.g., Team Lead · 120+ Teams"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Date</label>
                    <input
                      type="text"
                      value={ach.date}
                      onChange={(e) => updateAchievement(ach.id, 'date', e.target.value)}
                      placeholder="Mar 2026"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Brief Description</label>
                    <textarea
                      rows={2}
                      value={ach.description}
                      onChange={(e) => updateAchievement(ach.id, 'description', e.target.value)}
                      placeholder="Concise summary of the accomplishment..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addAchievement}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Achievement
            </button>
          </div>
        )}
      </div>

      <LinkedInImportModal
        isOpen={isLinkedInModalOpen}
        onClose={() => setIsLinkedInModalOpen(false)}
        currentData={data}
        onApplyImportedData={(nextData, message) => {
          setUndoSnapshot(structuredClone(data));
          onChange(nextData);
          setImportNotice(message);
        }}
      />
    </div>
  );
};

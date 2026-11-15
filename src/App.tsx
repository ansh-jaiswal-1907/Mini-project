import { useEffect, useMemo, useState } from 'react';
import { TopBar, WorkspaceTab } from './components/TopBar';
import { ProfileEditor } from './components/ProfileEditor';
import { JDAnalyzerPanel } from './components/JDAnalyzerPanel';
import { TemplateCustomizer } from './components/TemplateCustomizer';
import { SavedResumesPanel } from './components/SavedResumesPanel';
import { ResumePreview } from './components/ResumePreview';
import {
  createBlankResumeData,
  createDefaultSavedResumes,
  DEFAULT_CONFIG,
  SAMPLE_ISE_STUDENT,
} from './data/sampleProfiles';
import {
  JDAnalysisResult,
  JDSuggestion,
  ResumeConfig,
  ResumeData,
  SavedResume,
} from './types/resume';
import { downloadResumePdf } from './utils/pdfExport';

const STORAGE_KEY = 'folioprep_saved_resumes_v1';
const ACTIVE_ID_KEY = 'folioprep_active_resume_id_v1';

function loadInitialResumes(): SavedResume[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to defaults if storage is unavailable or corrupted
  }
  return createDefaultSavedResumes();
}

export default function App() {
  const [resumes, setResumes] = useState<SavedResume[]>(loadInitialResumes);
  const [activeResumeId, setActiveResumeId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_ID_KEY);
      if (savedId) return savedId;
    } catch {
      // ignore
    }
    return 'resume-ise-swe';
  });

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('editor');
  const [mobilePane, setMobilePane] = useState<'workbench' | 'preview'>('workbench');
  const [isGeneratingFull, setIsGeneratingFull] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const activeResume = useMemo(() => {
    return resumes.find((r) => r.id === activeResumeId) ?? resumes[0];
  }, [resumes, activeResumeId]);

  useEffect(() => {
    if (activeResume && activeResume.id !== activeResumeId) {
      setActiveResumeId(activeResume.id);
    }
  }, [activeResume, activeResumeId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
    } catch {
      // ignore storage quota errors
    }
  }, [resumes]);

  useEffect(() => {
    try {
      if (activeResumeId) {
        localStorage.setItem(ACTIVE_ID_KEY, activeResumeId);
      }
    } catch {
      // ignore
    }
  }, [activeResumeId]);

  const updateActiveResume = (updater: (current: SavedResume) => SavedResume) => {
    setResumes((prev) =>
      prev.map((item) =>
        item.id === activeResume.id
          ? { ...updater(item), updatedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const handleDataChange = (updatedData: ResumeData) => {
    updateActiveResume((cur) => ({ ...cur, data: updatedData }));
  };

  const handleConfigChange = (updatedConfig: ResumeConfig) => {
    updateActiveResume((cur) => ({ ...cur, config: updatedConfig }));
  };

  const handleGenerateFullResume = async () => {
    setAiError(null);
    setAiFeedback(null);
    setIsGeneratingFull(true);

    try {
      const response = await fetch('/api/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: activeResume.data }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Could not generate resume content.');
      }

      const projectMap = new Map<string, string[]>(
        Array.isArray(json.projects)
          ? json.projects.map((p: { id: string; bullets: string[] }) => [p.id, p.bullets])
          : []
      );
      const expMap = new Map<string, string[]>(
        Array.isArray(json.experience)
          ? json.experience.map((e: { id: string; bullets: string[] }) => [e.id, e.bullets])
          : []
      );

      updateActiveResume((cur) => ({
        ...cur,
        data: {
          ...cur.data,
          personal: {
            ...cur.data.personal,
            summary: typeof json.summary === 'string' && json.summary.trim() ? json.summary : cur.data.personal.summary,
          },
          projects: cur.data.projects.map((p) => {
            const generated = projectMap.get(p.id);
            return generated && generated.length > 0 ? { ...p, bullets: generated } : p;
          }),
          experience: cur.data.experience.map((ex) => {
            const generated = expMap.get(ex.id);
            return generated && generated.length > 0 ? { ...ex, bullets: generated } : ex;
          }),
        },
      }));

      setAiFeedback(
        typeof json.notes === 'string' && json.notes.trim()
          ? json.notes
          : 'Generated summary and refined project/experience bullets from your profile facts.'
      );
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate resume content.');
    } finally {
      setIsGeneratingFull(false);
    }
  };

  const handleApplySkillFromJD = (skill: string) => {
    updateActiveResume((cur) => {
      const groups = cur.data.skills;
      if (groups.length === 0) {
        return {
          ...cur,
          data: {
            ...cur.data,
            skills: [{ id: `sk-${Date.now()}`, category: 'Technical Skills', items: [skill] }],
          },
        };
      }
      const first = groups[0];
      if (first.items.some((i) => i.toLowerCase() === skill.toLowerCase())) {
        return cur;
      }
      return {
        ...cur,
        data: {
          ...cur.data,
          skills: groups.map((g, idx) =>
            idx === 0 ? { ...g, items: [...g.items, skill] } : g
          ),
        },
      };
    });
  };

  const handleApplyJDSuggestion = (suggestion: JDSuggestion) => {
    updateActiveResume((cur) => {
      if (suggestion.targetSection === 'summary') {
        return {
          ...cur,
          data: {
            ...cur.data,
            personal: {
              ...cur.data.personal,
              summary: suggestion.suggestedText,
            },
          },
        };
      }

      if (suggestion.targetSection === 'project' && cur.data.projects.length > 0) {
        const targetIndex = suggestion.itemTitle
          ? cur.data.projects.findIndex((p) =>
              p.title.toLowerCase().includes(suggestion.itemTitle!.toLowerCase())
            )
          : 0;
        const idx = targetIndex >= 0 ? targetIndex : 0;
        const nextProjects = cur.data.projects.map((p, i) =>
          i === idx
            ? {
                ...p,
                bullets: Array.from(new Set([...p.bullets.filter(Boolean), suggestion.suggestedText])),
              }
            : p
        );
        return { ...cur, data: { ...cur.data, projects: nextProjects } };
      }

      if (suggestion.targetSection === 'experience' && cur.data.experience.length > 0) {
        const nextExp = cur.data.experience.map((ex, i) =>
          i === 0
            ? {
                ...ex,
                bullets: Array.from(new Set([...ex.bullets.filter(Boolean), suggestion.suggestedText])),
              }
            : ex
        );
        return { ...cur, data: { ...cur.data, experience: nextExp } };
      }

      return cur;
    });
  };

  const handleCreateBlank = () => {
    const id = `resume-${Date.now()}`;
    const newResume: SavedResume = {
      id,
      name: 'Untitled Student Resume',
      updatedAt: new Date().toISOString(),
      data: createBlankResumeData(),
      config: structuredClone(DEFAULT_CONFIG),
    };
    setResumes((prev) => [newResume, ...prev]);
    setActiveResumeId(id);
    setActiveTab('editor');
  };

  const handleLoadSampleIse = () => {
    const id = `resume-${Date.now()}`;
    const sample: SavedResume = {
      id,
      name: 'Sample ISE Student Profile',
      updatedAt: new Date().toISOString(),
      data: structuredClone(SAMPLE_ISE_STUDENT),
      config: structuredClone(DEFAULT_CONFIG),
    };
    setResumes((prev) => [sample, ...prev]);
    setActiveResumeId(id);
    setActiveTab('editor');
  };

  const handleDuplicateResume = (id: string) => {
    const source = resumes.find((r) => r.id === id);
    if (!source) return;
    const copyId = `resume-${Date.now()}`;
    const duplicate: SavedResume = {
      ...structuredClone(source),
      id: copyId,
      name: `${source.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    setResumes((prev) => [duplicate, ...prev]);
    setActiveResumeId(copyId);
  };

  const handleRenameResume = (id: string, newName: string) => {
    setResumes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: newName, updatedAt: new Date().toISOString() } : r))
    );
  };

  const handleDeleteResume = (id: string) => {
    setResumes((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (id === activeResumeId && next.length > 0) {
        setActiveResumeId(next[0].id);
      }
      return next;
    });
  };

  const handleImportResumeJson = (imported: SavedResume) => {
    setResumes((prev) => [imported, ...prev]);
    setActiveResumeId(imported.id);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobilePane('workbench');
        }}
        onDownloadPdf={() => downloadResumePdf(activeResume.data, activeResume.config)}
      />

      {/* Mobile Pane Switcher */}
      <div className="no-print lg:hidden px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobilePane('workbench')}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
            mobilePane === 'workbench'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          Workspace
        </button>
        <button
          type="button"
          onClick={() => setMobilePane('preview')}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
            mobilePane === 'preview'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          Live Resume Preview
        </button>
      </div>

      {/* Main Split Studio */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">
        {/* Left Workbench */}
        <section
          className={`no-print lg:col-span-6 xl:col-span-5 bg-slate-50 border-r border-slate-200 flex flex-col lg:h-full lg:overflow-hidden ${
            mobilePane === 'workbench' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {activeTab === 'editor' && (
            <ProfileEditor
              data={activeResume.data}
              onChange={handleDataChange}
              onGenerateFullResume={handleGenerateFullResume}
              isGeneratingFull={isGeneratingFull}
              aiFeedback={aiFeedback}
              aiError={aiError}
              onClearFeedback={() => {
                setAiFeedback(null);
                setAiError(null);
              }}
            />
          )}

          {activeTab === 'jd-match' && (
            <JDAnalyzerPanel
              resumeData={activeResume.data}
              jobDescription={activeResume.lastJobDescription || ''}
              analysis={activeResume.lastAnalysis}
              onJobDescriptionChange={(jd) =>
                updateActiveResume((cur) => ({ ...cur, lastJobDescription: jd }))
              }
              onAnalysisComplete={(result: JDAnalysisResult) =>
                updateActiveResume((cur) => ({ ...cur, lastAnalysis: result }))
              }
              onApplySkill={handleApplySkillFromJD}
              onApplySuggestion={handleApplyJDSuggestion}
            />
          )}

          {activeTab === 'templates' && (
            <TemplateCustomizer
              config={activeResume.config}
              onChange={handleConfigChange}
            />
          )}

          {activeTab === 'saved' && (
            <SavedResumesPanel
              resumes={resumes}
              activeResumeId={activeResume.id}
              onSelectResume={(id) => {
                setActiveResumeId(id);
                setActiveTab('editor');
              }}
              onCreateBlank={handleCreateBlank}
              onLoadSampleIse={handleLoadSampleIse}
              onDuplicateResume={handleDuplicateResume}
              onRenameResume={handleRenameResume}
              onDeleteResume={handleDeleteResume}
              onImportResumeJson={handleImportResumeJson}
            />
          )}
        </section>

        {/* Right Live A4 Preview */}
        <section
          className={`lg:col-span-6 xl:col-span-7 flex flex-col lg:h-full lg:overflow-hidden ${
            mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <ResumePreview
            data={activeResume.data}
            config={activeResume.config}
            onPrintSheet={() => window.print()}
          />
        </section>
      </main>
    </div>
  );
}

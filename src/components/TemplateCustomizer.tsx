import React from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff } from 'lucide-react';
import {
  DensityMode,
  FontPairing,
  ResumeConfig,
  SectionKey,
  TemplateId,
} from '../types/resume';

interface TemplateCustomizerProps {
  config: ResumeConfig;
  onChange: (updated: ResumeConfig) => void;
}

const TEMPLATES: {
  id: TemplateId;
  name: string;
  description: string;
}[] = [
  {
    id: 'classic-academic',
    name: 'Classic Academic',
    description: 'Centered header with crisp rules; ideal for campus placements and engineering roles.',
  },
  {
    id: 'modern-technical',
    name: 'Modern Technical',
    description: 'Left-aligned header with bold section accents for SWE and data roles.',
  },
  {
    id: 'executive-minimal',
    name: 'Executive Minimal',
    description: 'Quiet editorial spacing and hairline dividers for clean readability.',
  },
  {
    id: 'compact-two-column',
    name: 'Compact Two-Column',
    description: 'Sidebar for education, skills, and certifications; main column for projects.',
  },
];

const FONT_PAIRINGS: { id: FontPairing; label: string; sample: string }[] = [
  { id: 'serif-sans', label: 'Classic Serif + Sans', sample: 'Source Serif 4 & DM Sans' },
  { id: 'clean-sans', label: 'Clean Sans-Serif', sample: 'Plus Jakarta & DM Sans' },
  { id: 'technical', label: 'Technical Mono Accent', sample: 'Plus Jakarta & JetBrains' },
];

const ACCENT_COLORS: { hex: string; label: string }[] = [
  { hex: '#1E293B', label: 'Slate Ink' },
  { hex: '#1D4ED8', label: 'Royal Cobalt' },
  { hex: '#0F766E', label: 'Deep Teal' },
  { hex: '#7F1D1D', label: 'Academic Burgundy' },
];

const DENSITIES: { id: DensityMode; label: string }[] = [
  { id: 'compact', label: 'Compact (1-Page Fit)' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'airy', label: 'Airy' },
];

const SECTION_LABELS: Record<SectionKey, string> = {
  summary: 'Professional Summary',
  education: 'Education',
  skills: 'Technical Skills',
  projects: 'Academic & Technical Projects',
  experience: 'Internships & Experience',
  certifications: 'Certifications',
  achievements: 'Achievements & Extracurriculars',
};

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  config,
  onChange,
}) => {
  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= config.sectionOrder.length) return;
    const nextOrder = [...config.sectionOrder];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(target, 0, moved);
    onChange({ ...config, sectionOrder: nextOrder });
  };

  const toggleSectionVisibility = (section: SectionKey) => {
    const isHidden = config.hiddenSections.includes(section);
    const nextHidden = isHidden
      ? config.hiddenSections.filter((s) => s !== section)
      : [...config.hiddenSections, section];
    onChange({ ...config, hiddenSections: nextHidden });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-base font-semibold text-slate-900">Templates & Layout</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Customize your resume layout, typography, accent ink, density, and section order.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto studio-scroll p-6 space-y-8">
        {/* Template Gallery */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900">Resume Template</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {TEMPLATES.map((tpl) => {
              const selected = config.templateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onChange({ ...config, templateId: tpl.id })}
                  className={`text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-blue-50/50 border-blue-700 ring-1 ring-blue-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Miniature Layout Schematic */}
                  <div className="h-16 mb-3 p-2 bg-slate-50 border border-slate-200 rounded flex flex-col gap-1.5">
                    {tpl.id === 'compact-two-column' ? (
                      <div className="flex gap-1.5 h-full">
                        <div className="w-1/3 bg-slate-200/80 rounded-xs p-1 space-y-1">
                          <div className="h-1.5 w-full bg-slate-400/70 rounded-xs" />
                          <div className="h-1 w-3/4 bg-slate-300 rounded-xs" />
                          <div className="h-1 w-5/6 bg-slate-300 rounded-xs" />
                        </div>
                        <div className="flex-1 space-y-1 p-0.5">
                          <div className="h-2 w-2/3 bg-slate-700/70 rounded-xs" />
                          <div className="h-1 w-full bg-slate-300 rounded-xs" />
                          <div className="h-1 w-4/5 bg-slate-300 rounded-xs" />
                          <div className="h-1 w-full bg-slate-300 rounded-xs" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`h-2 w-1/2 bg-slate-700/75 rounded-xs ${
                            tpl.id === 'classic-academic' || tpl.id === 'executive-minimal'
                              ? 'mx-auto'
                              : ''
                          }`}
                        />
                        <div
                          className={`h-1 w-2/3 bg-slate-300 rounded-xs ${
                            tpl.id === 'classic-academic' || tpl.id === 'executive-minimal'
                              ? 'mx-auto'
                              : ''
                          }`}
                        />
                        <div className="h-px w-full bg-slate-300 my-0.5" />
                        <div className="h-1 w-full bg-slate-200 rounded-xs" />
                        <div className="h-1 w-5/6 bg-slate-200 rounded-xs" />
                      </>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{tpl.name}</div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tpl.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-3 pt-4 border-t border-slate-200">
          <h2 className="text-xs font-semibold text-slate-900">Typography Pairing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {FONT_PAIRINGS.map((font) => {
              const selected = config.fontPairing === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => onChange({ ...config, fontPairing: font.id })}
                  className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-blue-50/50 border-blue-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-900">{font.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{font.sample}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Accent Ink & Density */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-900">Accent Ink</h2>
            <div className="grid grid-cols-2 gap-2">
              {ACCENT_COLORS.map((swatch) => {
                const selected = config.accentColor === swatch.hex;
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => onChange({ ...config, accentColor: swatch.hex })}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-blue-50/50 border-blue-700 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-sm shrink-0"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className="truncate">{swatch.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-900">Spacing Density</h2>
            <div className="flex flex-col gap-2">
              {DENSITIES.map((d) => {
                const selected = config.density === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onChange({ ...config, density: d.id })}
                    className={`text-left px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-blue-50/50 border-blue-700 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Section Order & Visibility */}
        <section className="space-y-3 pt-4 border-t border-slate-200">
          <div>
            <h2 className="text-xs font-semibold text-slate-900">Section Order & Visibility</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Reorder sections to prioritize Education or Projects, or hide optional sections.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            {config.sectionOrder.map((section, idx) => {
              const hidden = config.hiddenSections.includes(section);
              return (
                <div
                  key={section}
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                >
                  <span className={`font-medium ${hidden ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {SECTION_LABELS[section]}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, -1)}
                      aria-label={`Move ${SECTION_LABELS[section]} up`}
                      className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === config.sectionOrder.length - 1}
                      onClick={() => moveSection(idx, 1)}
                      aria-label={`Move ${SECTION_LABELS[section]} down`}
                      className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(section)}
                      aria-label={hidden ? `Show ${SECTION_LABELS[section]}` : `Hide ${SECTION_LABELS[section]}`}
                      className={`p-1.5 rounded hover:bg-slate-100 cursor-pointer ${
                        hidden ? 'text-slate-400' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {hidden ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

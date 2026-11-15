import React, { useState } from 'react';
import { Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { ResumeConfig, ResumeData, SectionKey } from '../types/resume';

interface ResumePreviewProps {
  data: ResumeData;
  config: ResumeConfig;
  onPrintSheet: () => void;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  data,
  config,
  onPrintSheet,
}) => {
  const [zoom, setZoom] = useState(0.78);

  const { personal } = data;
  const isTwoCol = config.templateId === 'compact-two-column';
  const isCenteredHeader =
    config.templateId === 'classic-academic' || config.templateId === 'executive-minimal';

  const headingFontClass =
    config.fontPairing === 'serif-sans'
      ? 'font-[family-name:var(--font-serif-resume)]'
      : config.fontPairing === 'technical'
        ? 'font-[family-name:var(--font-display)]'
        : 'font-[family-name:var(--font-display)]';

  const bodyFontClass =
    config.fontPairing === 'technical'
      ? 'font-[family-name:var(--font-body)]'
      : 'font-[family-name:var(--font-body)]';

  const densityStyles =
    config.density === 'compact'
      ? { pagePad: 'p-[11mm]', sectionGap: 'space-y-2.5', textSize: 'text-[10px] leading-[1.38]', titleSize: 'text-[11px]' }
      : config.density === 'airy'
        ? { pagePad: 'p-[16mm]', sectionGap: 'space-y-4.5', textSize: 'text-[11px] leading-[1.52]', titleSize: 'text-[12px]' }
        : { pagePad: 'p-[13.5mm]', sectionGap: 'space-y-3.5', textSize: 'text-[10.5px] leading-[1.45]', titleSize: 'text-[11.5px]' };

  const contactTokens = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.portfolio,
  ]
    .map((v) => v.trim())
    .filter(Boolean);

  const renderSectionHeader = (label: string) => (
    <div
      className={`pb-0.5 mb-1.5 ${
        config.templateId === 'executive-minimal' ? 'border-b border-slate-300' : 'border-b-[1.5px]'
      }`}
      style={{
        borderColor: config.templateId === 'executive-minimal' ? undefined : config.accentColor,
      }}
    >
      <h2
        className={`${headingFontClass} ${densityStyles.titleSize} font-bold tracking-wider uppercase`}
        style={{ color: config.accentColor }}
      >
        {label}
      </h2>
    </div>
  );

  const renderSectionBody = (section: SectionKey) => {
    if (config.hiddenSections.includes(section)) return null;

    if (section === 'summary') {
      if (!personal.summary.trim()) return null;
      return (
        <section key="summary">
          {renderSectionHeader('Professional Summary')}
          <p className={`${densityStyles.textSize} text-slate-800`}>{personal.summary}</p>
        </section>
      );
    }

    if (section === 'education') {
      const valid = data.education.filter((e) => e.degree.trim() || e.institution.trim());
      if (valid.length === 0) return null;
      return (
        <section key="education">
          {renderSectionHeader('Education')}
          <div className="space-y-2">
            {valid.map((edu) => (
              <div key={edu.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`${densityStyles.textSize} font-bold text-slate-900`}>
                    {edu.degree || 'Degree'}
                  </span>
                  <span className="text-[9.5px] text-slate-600 tabular-nums shrink-0">
                    {[edu.startYear, edu.endYear].filter(Boolean).join(' – ')}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`${densityStyles.textSize} text-slate-700`}>
                    {[edu.institution, edu.location].filter(Boolean).join(', ')}
                  </span>
                  {edu.gradeValue.trim() && (
                    <span className="text-[9.5px] font-semibold text-slate-800 tabular-nums shrink-0">
                      {edu.gradeLabel || 'CGPA'}: {edu.gradeValue}
                    </span>
                  )}
                </div>
                {edu.coursework.trim() && (
                  <p className="text-[9.5px] text-slate-600 mt-0.5">
                    <span className="font-medium text-slate-700">Coursework:</span> {edu.coursework}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (section === 'skills') {
      const valid = data.skills.filter((s) => s.items.length > 0);
      if (valid.length === 0) return null;
      return (
        <section key="skills">
          {renderSectionHeader('Technical Skills')}
          <div className="space-y-1">
            {valid.map((group) => (
              <div key={group.id} className={`${densityStyles.textSize} text-slate-800`}>
                {group.category.trim() && (
                  <span className="font-semibold text-slate-900">{group.category}: </span>
                )}
                <span>{group.items.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (section === 'projects') {
      const valid = data.projects.filter((p) => p.title.trim());
      if (valid.length === 0) return null;
      return (
        <section key="projects">
          {renderSectionHeader('Academic & Technical Projects')}
          <div className="space-y-2.5">
            {valid.map((proj) => {
              const bullets =
                proj.bullets.filter((b) => b.trim()).length > 0
                  ? proj.bullets.filter((b) => b.trim())
                  : proj.rawNotes.trim()
                    ? [proj.rawNotes.trim()]
                    : [];
              return (
                <div key={proj.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`${densityStyles.textSize} font-bold text-slate-900`}>
                      {proj.title}
                    </span>
                    {proj.duration.trim() && (
                      <span className="text-[9.5px] text-slate-600 tabular-nums shrink-0">
                        {proj.duration}
                      </span>
                    )}
                  </div>
                  {(proj.techStack.trim() || proj.link.trim()) && (
                    <div className="text-[9.5px] italic text-slate-600 mb-0.5">
                      {[proj.techStack ? `Stack: ${proj.techStack}` : '', proj.link]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5">
                      {bullets.map((b, i) => (
                        <li key={i} className={`${densityStyles.textSize} text-slate-800`}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (section === 'experience') {
      const valid = data.experience.filter((ex) => ex.role.trim() || ex.organization.trim());
      if (valid.length === 0) return null;
      return (
        <section key="experience">
          {renderSectionHeader('Internships & Experience')}
          <div className="space-y-2.5">
            {valid.map((exp) => {
              const bullets =
                exp.bullets.filter((b) => b.trim()).length > 0
                  ? exp.bullets.filter((b) => b.trim())
                  : exp.rawNotes.trim()
                    ? [exp.rawNotes.trim()]
                    : [];
              return (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`${densityStyles.textSize} font-bold text-slate-900`}>
                      {[exp.role, exp.organization].filter(Boolean).join(' — ')}
                    </span>
                    {exp.duration.trim() && (
                      <span className="text-[9.5px] text-slate-600 tabular-nums shrink-0">
                        {exp.duration}
                      </span>
                    )}
                  </div>
                  {exp.location.trim() && (
                    <div className="text-[9.5px] italic text-slate-600 mb-0.5">{exp.location}</div>
                  )}
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5">
                      {bullets.map((b, i) => (
                        <li key={i} className={`${densityStyles.textSize} text-slate-800`}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (section === 'certifications') {
      const valid = data.certifications.filter((c) => c.title.trim());
      if (valid.length === 0) return null;
      return (
        <section key="certifications">
          {renderSectionHeader('Certifications')}
          <ul className="list-disc pl-4 space-y-0.5">
            {valid.map((cert) => (
              <li key={cert.id} className={`${densityStyles.textSize} text-slate-800`}>
                <span className="font-semibold text-slate-900">{cert.title}</span>
                {[cert.issuer, cert.date, cert.credentialId ? `ID: ${cert.credentialId}` : '']
                  .filter(Boolean)
                  .length > 0 && (
                  <span className="text-slate-600">
                    {' '}
                    —{' '}
                    {[cert.issuer, cert.date, cert.credentialId ? `ID: ${cert.credentialId}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      );
    }

    if (section === 'achievements') {
      const valid = data.achievements.filter((a) => a.title.trim());
      if (valid.length === 0) return null;
      return (
        <section key="achievements">
          {renderSectionHeader('Achievements & Extracurriculars')}
          <ul className="list-disc pl-4 space-y-1">
            {valid.map((ach) => (
              <li key={ach.id} className={`${densityStyles.textSize} text-slate-800`}>
                <span className="font-semibold text-slate-900">{ach.title}</span>
                {(ach.context || ach.date) && (
                  <span className="text-slate-600">
                    {' '}
                    ({[ach.context, ach.date].filter(Boolean).join(' · ')})
                  </span>
                )}
                {ach.description.trim() && <span> — {ach.description}</span>}
              </li>
            ))}
          </ul>
        </section>
      );
    }

    return null;
  };

  const sidebarKeys: SectionKey[] = ['education', 'skills', 'certifications'];
  const mainKeys = config.sectionOrder.filter((k) => !sidebarKeys.includes(k));
  const orderedSidebarKeys = config.sectionOrder.filter((k) => sidebarKeys.includes(k));

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Preview Toolbar */}
      <div className="no-print px-5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-800">Live A4 Preview</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.08).toFixed(2))))}
            aria-label="Zoom out"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(0.78)}
            className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.15, Number((z + 0.08).toFixed(2))))}
            aria-label="Zoom in"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" aria-hidden="true" />
          </button>
          <span className="h-4 w-px bg-slate-200 mx-1" aria-hidden="true" />
          <button
            type="button"
            onClick={onPrintSheet}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            Print
          </button>
        </div>
      </div>

      {/* Scrollable Drafting Mat */}
      <div className="print-only-container flex-1 overflow-auto studio-scroll p-6 flex justify-center items-start">
        <div
          style={{
            width: `${210 * zoom}mm`,
            minHeight: `${297 * zoom}mm`,
          }}
          className="relative shrink-0"
        >
          <article
            id="resume-print-sheet"
            style={{
              width: '210mm',
              minHeight: '297mm',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            className={`bg-white text-slate-900 shadow-sm border border-slate-200 ${bodyFontClass} ${densityStyles.pagePad}`}
          >
            {/* Header Block */}
            <header
              className={`pb-3 mb-3 border-b border-slate-200 ${
                isCenteredHeader ? 'text-center' : 'text-left'
              }`}
            >
              <h1
                className={`${headingFontClass} text-[22px] font-bold tracking-tight text-slate-950`}
              >
                {personal.fullName.trim() || 'Your Full Name'}
              </h1>

              {(personal.targetRole.trim() || personal.usn.trim()) && (
                <div
                  className="text-[11px] font-semibold mt-0.5"
                  style={{ color: config.accentColor }}
                >
                  {[personal.targetRole.trim(), personal.usn.trim() ? `USN: ${personal.usn.trim()}` : '']
                    .filter(Boolean)
                    .join('  ·  ')}
                </div>
              )}

              {contactTokens.length > 0 && (
                <div
                  className={`flex flex-wrap gap-x-2 gap-y-0.5 text-[9.5px] text-slate-600 mt-1.5 ${
                    isCenteredHeader ? 'justify-center' : 'justify-start'
                  }`}
                >
                  {contactTokens.map((token, idx) => (
                    <React.Fragment key={`${token}-${idx}`}>
                      {idx > 0 && <span aria-hidden="true">•</span>}
                      <span>{token}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </header>

            {/* Body Layout */}
            {isTwoCol ? (
              <div className="grid grid-cols-12 gap-5 items-start">
                <aside className={`col-span-4 bg-slate-50/80 p-3 rounded-sm border border-slate-100 ${densityStyles.sectionGap}`}>
                  {orderedSidebarKeys.map((k) => renderSectionBody(k))}
                </aside>
                <div className={`col-span-8 ${densityStyles.sectionGap}`}>
                  {mainKeys.map((k) => renderSectionBody(k))}
                </div>
              </div>
            ) : (
              <div className={densityStyles.sectionGap}>
                {config.sectionOrder.map((k) => renderSectionBody(k))}
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
};

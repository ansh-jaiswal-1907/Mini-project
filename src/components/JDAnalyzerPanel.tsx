import React, { useState } from 'react';
import {
  Search,
  Loader2,
  CheckCircle2,
  Plus,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { JDAnalysisResult, JDSuggestion, ResumeData } from '../types/resume';

interface JDAnalyzerPanelProps {
  resumeData: ResumeData;
  jobDescription: string;
  analysis: JDAnalysisResult | undefined;
  onJobDescriptionChange: (jd: string) => void;
  onAnalysisComplete: (result: JDAnalysisResult) => void;
  onApplySkill: (skill: string) => void;
  onApplySuggestion: (suggestion: JDSuggestion) => void;
}

const SAMPLE_JDS: { label: string; text: string }[] = [
  {
    label: 'Full-Stack SWE Intern',
    text: `Role: Software Engineering Intern (Full-Stack)
Responsibilities:
- Build responsive web interfaces using React, TypeScript, and modern CSS.
- Develop RESTful backend APIs with Node.js/Express or Python/FastAPI.
- Design relational database schemas and write SQL queries in PostgreSQL or MySQL.
- Collaborate using Git, GitHub pull requests, and unit testing.
Qualifications:
- Pursuing B.E./B.Tech in Computer Science, Information Science, or related branch.
- Strong foundation in Data Structures, Algorithms, OOP, and DBMS.`,
  },
  {
    label: 'Data Analyst Intern',
    text: `Role: Data Analyst Intern
Responsibilities:
- Extract, clean, and analyze structured datasets using SQL and Python (Pandas, NumPy).
- Build executive dashboards and weekly reports in Power BI or Tableau.
- Identify trends, anomalies, and actionable metrics across product operations.
Qualifications:
- Undergraduate student in CS, ISE, Statistics, or Mathematics.
- Experience with Excel, SQL joins/window functions, and exploratory data analysis.`,
  },
];

export const JDAnalyzerPanel: React.FC<JDAnalyzerPanelProps> = ({
  resumeData,
  jobDescription,
  analysis,
  onJobDescriptionChange,
  onAnalysisComplete,
  onApplySkill,
  onApplySuggestion,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedIndices, setAppliedIndices] = useState<number[]>([]);
  const [addedSkills, setAddedSkills] = useState<string[]>([]);

  const handleAnalyze = async () => {
    setError(null);
    if (jobDescription.trim().length < 20) {
      setError('Paste a complete job description (at least 20 characters) to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAppliedIndices([]);
    setAddedSkills([]);
    try {
      const response = await fetch('/api/ai/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          resumeData,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to analyze job description.');
      }
      onAnalysisComplete(json as JDAnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze job description.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const allProfileSkillsLower = new Set(
    resumeData.skills.flatMap((g) => g.items.map((i) => i.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-base font-semibold text-slate-900">Job Description Analysis</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Extract required skills and keywords from a target role and align your real qualifications without fabricating experience.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto studio-scroll p-6 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="jd-input" className="text-xs font-medium text-slate-700">
              Target Job Description
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Load sample:</span>
              {SAMPLE_JDS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => onJobDescriptionChange(sample.text)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="jd-input"
            rows={7}
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            placeholder="Paste an internship or entry-level job description here..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {isAnalyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {isAnalyzing ? 'Analyzing Keywords...' : 'Analyze Job Description'}
            </button>
          </div>
        </div>

        {analysis ? (
          <div className="space-y-6 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {analysis.roleTitle || 'Target Role Breakdown'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  {analysis.matchedKeywords.length} matched · {analysis.missingKeywords.length} not yet listed in profile
                </p>
              </div>
            </div>

            {/* Honesty Notice */}
            {analysis.honestyNotice && (
              <div className="flex items-start gap-2.5 p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700">
                <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{analysis.honestyNotice}</span>
              </div>
            )}

            {/* Matched vs Missing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2.5">
                <h3 className="text-xs font-semibold text-emerald-800">
                  Matched Keywords in Your Profile ({analysis.matchedKeywords.length})
                </h3>
                {analysis.matchedKeywords.length > 0 ? (
                  <p className="text-xs leading-relaxed text-slate-700">
                    {analysis.matchedKeywords.join(' · ')}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">No direct keyword matches found yet.</p>
                )}
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                <h3 className="text-xs font-semibold text-amber-800">
                  Recommended Keywords to Highlight ({analysis.missingKeywords.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Only add skills below if you genuinely have experience with them:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingKeywords.map((kw) => {
                    const alreadyInProfile =
                      allProfileSkillsLower.has(kw.toLowerCase()) || addedSkills.includes(kw);
                    return (
                      <button
                        key={kw}
                        type="button"
                        disabled={alreadyInProfile}
                        onClick={() => {
                          onApplySkill(kw);
                          setAddedSkills((prev) => [...prev, kw]);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                          alreadyInProfile
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 cursor-default'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-700 cursor-pointer'
                        }`}
                      >
                        {alreadyInProfile ? (
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        ) : (
                          <Plus className="w-3 h-3" aria-hidden="true" />
                        )}
                        {kw}
                      </button>
                    );
                  })}
                  {analysis.missingKeywords.length === 0 && (
                    <span className="text-xs text-emerald-700">
                      Your profile covers all extracted keywords.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tailored Phrasing Suggestions */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-900">
                Tailored Content Suggestions
              </h3>
              {analysis.improvementSuggestions.map((item, idx) => {
                const isApplied = appliedIndices.includes(idx);
                return (
                  <div
                    key={`${item.targetSection}-${idx}`}
                    className="p-4 bg-white border border-slate-200 rounded-lg space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-800 capitalize">
                        {item.targetSection}
                        {item.itemTitle ? ` · ${item.itemTitle}` : ''}
                      </span>
                      <button
                        type="button"
                        disabled={isApplied}
                        onClick={() => {
                          onApplySuggestion(item);
                          setAppliedIndices((prev) => [...prev, idx]);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors shrink-0 ${
                          isApplied
                            ? 'bg-emerald-50 text-emerald-800 cursor-default'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            Applied to Resume
                          </>
                        ) : (
                          <>
                            Apply to Resume
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-md border border-slate-200 leading-relaxed">
                      {item.suggestedText}
                    </p>
                    <p className="text-xs text-slate-500">{item.rationale}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white border border-slate-200 rounded-lg text-center space-y-1.5">
            <p className="text-sm font-medium text-slate-800">Ready to match a job description</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Paste any internship or entry-level job posting above to see which skills already match your profile and get truthful tailoring suggestions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

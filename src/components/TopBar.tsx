import React from 'react';
import { Download } from 'lucide-react';

export type WorkspaceTab = 'editor' | 'jd-match' | 'templates' | 'saved';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onDownloadPdf: () => void;
}

const NAV_ITEMS: { id: WorkspaceTab; label: string }[] = [
  { id: 'editor', label: 'Profile Editor' },
  { id: 'jd-match', label: 'JD Matcher' },
  { id: 'templates', label: 'Templates' },
  { id: 'saved', label: 'Saved Resumes' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onDownloadPdf,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-8">
      <button
        type="button"
        onClick={() => onSelectTab('editor')}
        className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
      >
        FolioPrep
      </button>

      <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar" aria-label="Workspace navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative py-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                isActive
                  ? 'text-blue-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-700" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0">
        <button
          type="button"
          onClick={onDownloadPdf}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          Download PDF
        </button>
      </div>
    </header>
  );
};

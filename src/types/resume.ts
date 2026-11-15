export type TemplateId =
  | 'classic-academic'
  | 'modern-technical'
  | 'executive-minimal'
  | 'compact-two-column';

export type FontPairing = 'serif-sans' | 'clean-sans' | 'technical';

export type DensityMode = 'compact' | 'balanced' | 'airy';

export type SectionKey =
  | 'summary'
  | 'education'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'certifications'
  | 'achievements';

export interface PersonalInfo {
  fullName: string;
  usn: string;
  targetRole: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  careerInterests: string;
  summary: string;
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startYear: string;
  endYear: string;
  gradeLabel: string;
  gradeValue: string;
  coursework: string;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface ProjectEntry {
  id: string;
  title: string;
  techStack: string;
  duration: string;
  link: string;
  rawNotes: string;
  bullets: string[];
}

export interface ExperienceEntry {
  id: string;
  role: string;
  organization: string;
  location: string;
  duration: string;
  rawNotes: string;
  bullets: string[];
}

export interface CertificationEntry {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialId: string;
}

export interface AchievementEntry {
  id: string;
  title: string;
  context: string;
  date: string;
  description: string;
}

export interface ResumeData {
  personal: PersonalInfo;
  education: EducationEntry[];
  skills: SkillGroup[];
  projects: ProjectEntry[];
  experience: ExperienceEntry[];
  certifications: CertificationEntry[];
  achievements: AchievementEntry[];
}

export interface ResumeConfig {
  templateId: TemplateId;
  fontPairing: FontPairing;
  accentColor: string;
  density: DensityMode;
  sectionOrder: SectionKey[];
  hiddenSections: SectionKey[];
}

export interface JDSuggestion {
  targetSection: 'summary' | 'project' | 'experience' | 'skills';
  itemTitle?: string;
  suggestedText: string;
  rationale: string;
}

export interface JDAnalysisResult {
  roleTitle: string;
  requiredSkills: string[];
  extractedKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  improvementSuggestions: JDSuggestion[];
  honestyNotice: string;
  analyzedAt: string;
}

export interface SavedResume {
  id: string;
  name: string;
  updatedAt: string;
  data: ResumeData;
  config: ResumeConfig;
  lastJobDescription?: string;
  lastAnalysis?: JDAnalysisResult;
}

export interface LinkedInSource {
  title: string;
  uri: string;
}

export interface LinkedInImportResult {
  status: 'success' | 'partial' | 'not_found';
  statusMessage: string;
  normalizedUrl: string;
  sources: LinkedInSource[];
  extracted: {
    personal: Partial<PersonalInfo>;
    education: Omit<EducationEntry, 'id'>[];
    skills: { category: string; items: string[] }[];
    projects: Omit<ProjectEntry, 'id'>[];
    experience: Omit<ExperienceEntry, 'id'>[];
    certifications: Omit<CertificationEntry, 'id'>[];
    achievements: Omit<AchievementEntry, 'id'>[];
  };
}


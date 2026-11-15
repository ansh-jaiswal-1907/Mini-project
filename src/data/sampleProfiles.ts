import { ResumeConfig, ResumeData, SavedResume, SectionKey } from '../types/resume';

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'summary',
  'education',
  'skills',
  'projects',
  'experience',
  'certifications',
  'achievements',
];

export const DEFAULT_CONFIG: ResumeConfig = {
  templateId: 'classic-academic',
  fontPairing: 'serif-sans',
  accentColor: '#1E293B',
  density: 'balanced',
  sectionOrder: DEFAULT_SECTION_ORDER,
  hiddenSections: [],
};

export const SAMPLE_ISE_STUDENT: ResumeData = {
  personal: {
    fullName: 'Aarav Kulkarni',
    usn: '1DA24IS018',
    targetRole: 'Software Engineering Intern',
    email: 'aarav.kulkarni@example.edu',
    phone: '+91 98450 11234',
    location: 'Bengaluru, Karnataka',
    linkedin: 'linkedin.com/in/aarav-kulkarni',
    github: 'github.com/aaravk-dev',
    portfolio: 'aaravk.dev',
    careerInterests: 'Full-Stack Web Development, Backend APIs, Applied NLP & Developer Tools',
    summary:
      'Information Science and Engineering undergraduate (CGPA 8.92) with hands-on experience building full-stack TypeScript web applications, RESTful APIs, and NLP-assisted workflows. Seeking a Software Engineering Internship to contribute to scalable backend services and user-facing product engineering.',
  },
  education: [
    {
      id: 'edu-1',
      degree: 'B.E. in Information Science and Engineering',
      institution: 'Dr. Ambedkar Institute of Technology (VTU)',
      location: 'Bengaluru',
      startYear: '2024',
      endYear: '2028',
      gradeLabel: 'CGPA',
      gradeValue: '8.92 / 10.0',
      coursework: 'Data Structures & Algorithms, DBMS, Operating Systems, Computer Networks, Web Technologies',
    },
    {
      id: 'edu-2',
      degree: 'Class XII (PCMC — Pre-University)',
      institution: 'National Public School',
      location: 'Bengaluru',
      startYear: '2022',
      endYear: '2024',
      gradeLabel: 'Percentage',
      gradeValue: '94.6%',
      coursework: 'Computer Science (Python & SQL), Mathematics, Physics, Chemistry',
    },
  ],
  skills: [
    {
      id: 'sk-1',
      category: 'Programming Languages',
      items: ['TypeScript', 'JavaScript', 'Python', 'Java', 'C', 'SQL'],
    },
    {
      id: 'sk-2',
      category: 'Frameworks & Libraries',
      items: ['React', 'Node.js', 'Express', 'FastAPI', 'Tailwind CSS'],
    },
    {
      id: 'sk-3',
      category: 'Databases & Tools',
      items: ['PostgreSQL', 'MySQL', 'Git', 'GitHub', 'Docker', 'REST APIs'],
    },
    {
      id: 'sk-4',
      category: 'Core Fundamentals',
      items: ['Data Structures & Algorithms', 'OOP', 'DBMS', 'System Design Basics'],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'CampusSync — Smart Placement & Resume Preparation Portal',
      techStack: 'React, TypeScript, Express, PostgreSQL, Gemini API',
      duration: 'Jan 2026 – Apr 2026',
      link: 'github.com/aaravk-dev/campussync',
      rawNotes: 'Built a web portal for college students to format resumes, analyze job descriptions, and export clean PDFs.',
      bullets: [
        'Engineered a full-stack student resume builder using React, TypeScript, and Express with live A4 preview and PDF export.',
        'Integrated an LLM-powered job description analyzer to surface matched and missing role keywords without fabricating skills.',
        'Designed a normalized relational schema for storing student academic records, projects, and multiple tailored resume versions.',
      ],
    },
    {
      id: 'proj-2',
      title: 'QueryLite — Natural Language to SQL Explorer for Academic Datasets',
      techStack: 'Python, FastAPI, SQLite, React',
      duration: 'Aug 2025 – Nov 2025',
      link: 'github.com/aaravk-dev/querylite',
      rawNotes: 'Made a tool that lets students type English questions and get safe read-only SQL queries on sample tables.',
      bullets: [
        'Developed a FastAPI backend that translates natural-language queries into validated read-only SQL statements.',
        'Implemented schema inspection and query execution safeguards to block mutating operations on student datasets.',
        'Built an interactive tabular results view with query history and CSV export support.',
      ],
    },
  ],
  experience: [
    {
      id: 'exp-1',
      role: 'Web Development Intern',
      organization: 'CodeCraft Labs (Campus Innovation Cell)',
      location: 'Bengaluru',
      duration: 'Jun 2025 – Aug 2025',
      rawNotes: 'Worked on department event registration site and fixed responsive layout bugs.',
      bullets: [
        'Built responsive registration and schedule modules in React and Tailwind CSS for an inter-collegiate tech symposium with 600+ participants.',
        'Collaborated with a 4-member student team using Git feature branches and pull-request reviews to resolve UI layout issues.',
      ],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      title: 'Supervised Machine Learning: Regression and Classification',
      issuer: 'DeepLearning.AI / Coursera',
      date: 'Feb 2026',
      credentialId: 'DL-ML-88412',
    },
    {
      id: 'cert-2',
      title: 'SQL (Intermediate) Skill Certification',
      issuer: 'HackerRank',
      date: 'Nov 2025',
      credentialId: 'HR-SQL-49201',
    },
  ],
  achievements: [
    {
      id: 'ach-1',
      title: 'Finalist — VTU State-Level Smart Campus Hackathon',
      context: 'Team Lead (3 members)',
      date: 'Mar 2026',
      description: 'Shortlisted among top 10 of 120+ engineering teams for building an accessible student placement readiness tool.',
    },
    {
      id: 'ach-2',
      title: '250+ Algorithmic Problems Solved',
      context: 'LeetCode & GeeksforGeeks',
      date: 'Ongoing',
      description: 'Consistent practice across arrays, trees, graphs, dynamic programming, and sliding-window patterns.',
    },
  ],
};

export const SAMPLE_DATA_ANALYST_STUDENT: ResumeData = {
  personal: {
    fullName: 'Meera Nair',
    usn: '1DA24CS042',
    targetRole: 'Data Analyst Intern',
    email: 'meera.nair@example.edu',
    phone: '+91 97410 88210',
    location: 'Bengaluru, Karnataka',
    linkedin: 'linkedin.com/in/meera-nair-data',
    github: 'github.com/meeranair-analytics',
    portfolio: '',
    careerInterests: 'Data Analytics, Business Intelligence, Applied Statistics, SQL Reporting',
    summary:
      'Computer Science undergraduate (CGPA 9.10) skilled in SQL, Python (Pandas, NumPy), and interactive data visualization. Experienced in cleaning multi-table academic datasets and translating trends into clear dashboard reports for decision-making.',
  },
  education: [
    {
      id: 'da-edu-1',
      degree: 'B.E. in Computer Science and Engineering',
      institution: 'Dr. Ambedkar Institute of Technology (VTU)',
      location: 'Bengaluru',
      startYear: '2024',
      endYear: '2028',
      gradeLabel: 'CGPA',
      gradeValue: '9.10 / 10.0',
      coursework: 'Probability & Statistics, Database Management Systems, Data Mining, Python Programming',
    },
  ],
  skills: [
    {
      id: 'da-sk-1',
      category: 'Analytics & Querying',
      items: ['SQL (PostgreSQL, MySQL)', 'Python', 'Pandas', 'NumPy', 'Excel (Pivot Tables, VLOOKUP)'],
    },
    {
      id: 'da-sk-2',
      category: 'Visualization & BI',
      items: ['Power BI', 'Tableau', 'Matplotlib', 'Seaborn'],
    },
    {
      id: 'da-sk-3',
      category: 'Statistical & Engineering Tools',
      items: ['Exploratory Data Analysis', 'A/B Testing Basics', 'Git', 'Jupyter Notebook'],
    },
  ],
  projects: [
    {
      id: 'da-proj-1',
      title: 'Campus Placement Trend & Skill Gap Dashboard',
      techStack: 'Python, Pandas, PostgreSQL, Power BI',
      duration: 'Jan 2026 – Mar 2026',
      link: 'github.com/meeranair-analytics/placement-insights',
      rawNotes: 'Analyzed 4 years of anonymized campus placement records using SQL and Power BI.',
      bullets: [
        'Cleaned and normalized 2,400+ anonymized campus placement records in Python (Pandas) and PostgreSQL.',
        'Authored SQL window-function queries to track year-over-year hiring trends across branch, CGPA bands, and core skills.',
        'Built an interactive Power BI dashboard highlighting high-demand skill clusters for pre-final-year students.',
      ],
    },
    {
      id: 'da-proj-2',
      title: 'Retail Demand & Inventory Anomaly Notebook',
      techStack: 'Python, NumPy, Seaborn, SQLite',
      duration: 'Sep 2025 – Nov 2025',
      link: 'github.com/meeranair-analytics/retail-eda',
      rawNotes: 'Explored open retail sales dataset to detect seasonal stockouts.',
      bullets: [
        'Conducted exploratory data analysis on 50,000+ transaction rows to identify seasonal demand spikes and slow-moving SKUs.',
        'Automated weekly summary reporting scripts reducing manual spreadsheet aggregation steps.',
      ],
    },
  ],
  experience: [],
  certifications: [
    {
      id: 'da-cert-1',
      title: 'Google Data Analytics Professional Certificate',
      issuer: 'Coursera',
      date: 'Jan 2026',
      credentialId: 'GDA-91023',
    },
  ],
  achievements: [
    {
      id: 'da-ach-1',
      title: '1st Runner-Up — Department Data Storytelling Challenge',
      context: 'Dept. of CSE & ISE',
      date: 'Feb 2026',
      description: 'Presented actionable insights on urban transit ridership patterns using SQL and visual storytelling.',
    },
  ],
};

export function createBlankResumeData(): ResumeData {
  return {
    personal: {
      fullName: '',
      usn: '',
      targetRole: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: '',
      careerInterests: '',
      summary: '',
    },
    education: [
      {
        id: `edu-${Date.now()}`,
        degree: '',
        institution: '',
        location: '',
        startYear: '',
        endYear: '',
        gradeLabel: 'CGPA',
        gradeValue: '',
        coursework: '',
      },
    ],
    skills: [
      {
        id: `sk-${Date.now()}-1`,
        category: 'Programming Languages',
        items: [],
      },
      {
        id: `sk-${Date.now()}-2`,
        category: 'Frameworks & Tools',
        items: [],
      },
    ],
    projects: [
      {
        id: `proj-${Date.now()}`,
        title: '',
        techStack: '',
        duration: '',
        link: '',
        rawNotes: '',
        bullets: [],
      },
    ],
    experience: [],
    certifications: [],
    achievements: [],
  };
}

export function createDefaultSavedResumes(): SavedResume[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'resume-ise-swe',
      name: 'SWE Internship — Campus Placement',
      updatedAt: now,
      data: structuredClone(SAMPLE_ISE_STUDENT),
      config: structuredClone(DEFAULT_CONFIG),
    },
    {
      id: 'resume-data-analyst',
      name: 'Data Analyst Intern — Analytics',
      updatedAt: now,
      data: structuredClone(SAMPLE_DATA_ANALYST_STUDENT),
      config: {
        ...structuredClone(DEFAULT_CONFIG),
        templateId: 'modern-technical',
        fontPairing: 'clean-sans',
        accentColor: '#1D4ED8',
      },
    },
  ];
}

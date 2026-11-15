import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function handleAiError(res: Response, error: unknown, fallbackMessage: string) {
  console.error('[Gemini API Error]', error);
  const message = error instanceof Error ? error.message : fallbackMessage;
  const statusCode =
    message.includes('API_KEY_INVALID') || message.includes('400')
      ? 400
      : message.includes('PERMISSION_DENIED') || message.includes('403')
        ? 403
        : message.includes('RESOURCE_EXHAUSTED') || message.includes('429')
          ? 429
          : 500;

  res.status(statusCode).json({
    error: message || fallbackMessage,
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // 1. Full AI Resume Content Generation (Summary, Project Bullets, Experience Bullets, Refined Skills)
  app.post('/api/ai/generate-resume', async (req: Request, res: Response) => {
    try {
      const { resumeData } = req.body ?? {};
      if (!resumeData || typeof resumeData !== 'object') {
        res.status(400).json({ error: 'Missing resumeData in request body.' });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate polished, ATS-friendly student resume content from this student profile JSON:\n${JSON.stringify(resumeData)}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are an expert academic career advisor helping university students and fresh graduates write clear, concise, ATS-friendly resumes. ' +
            'CRITICAL HONESTY RULE: Strictly preserve all factual details supplied by the student. NEVER invent companies, degrees, percentages, metrics, awards, tools, or skills that are not present in the student profile. ' +
            'Write a crisp 2-3 sentence Professional Summary tailored to their target role and career interests. ' +
            'For each project and experience item, convert raw notes or existing bullets into 2-3 strong, action-verb-led bullet points with clean grammar and technical clarity. Keep every project and experience ID exactly matching the input ID.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: '2-3 sentence professional summary grounded in the student profile.',
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['id', 'bullets'],
                },
              },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['id', 'bullets'],
                },
              },
              notes: {
                type: Type.STRING,
                description: 'Brief 1-sentence summary of clarity and grammar improvements made.',
              },
            },
            required: ['summary', 'projects', 'experience', 'notes'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error) {
      handleAiError(res, error, 'Failed to generate resume content.');
    }
  });

  // 2. Refine Single Item (Summary, Project, Experience, or Achievement)
  app.post('/api/ai/refine-item', async (req: Request, res: Response) => {
    try {
      const { itemType, title, context, rawText, targetRole } = req.body ?? {};
      if (!itemType || typeof rawText !== 'string' || !rawText.trim()) {
        res.status(400).json({ error: 'Please enter notes or description text before refining.' });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: JSON.stringify({ itemType, title, context, rawText, targetRole }),
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You improve clarity, grammar, action verbs, and conciseness for student resume sections. ' +
            'Strictly preserve all facts provided by the student—never invent metrics, technologies, or claims. ' +
            'If itemType is "project" or "experience", return 2-3 crisp bullet points in refinedBullets and a brief summary of changes. ' +
            'If itemType is "summary" or "achievement", return polished prose in refinedText (and empty refinedBullets).',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refinedText: {
                type: Type.STRING,
                description: 'Polished paragraph text for summary or achievement.',
              },
              refinedBullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3 polished resume bullet points for project or experience.',
              },
              improvementsMade: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Short list of 1-3 concrete writing improvements applied.',
              },
            },
            required: ['refinedText', 'refinedBullets', 'improvementsMade'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error) {
      handleAiError(res, error, 'Failed to refine item text.');
    }
  });

  // 3. Job Description Analysis & Honest Keyword Alignment
  app.post('/api/ai/analyze-jd', async (req: Request, res: Response) => {
    try {
      const { jobDescription, resumeData } = req.body ?? {};
      if (typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
        res.status(400).json({ error: 'Please paste a job description (at least 20 characters).' });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: JSON.stringify({ jobDescription, studentProfile: resumeData }),
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a Job Description Analyzer for university students and fresh graduates. ' +
            'Extract important required skills, tools, and domain keywords from the jobDescription. ' +
            'Compare them carefully against the studentProfile. ' +
            'matchedKeywords: keywords/skills from the JD that are clearly evidenced in the studentProfile. ' +
            'missingKeywords: keywords/skills from the JD that are NOT currently present in the studentProfile. ' +
            'improvementSuggestions: 2-4 concrete, truthful suggestions to better highlight the student\'s EXISTING projects, coursework, or summary for this role. ' +
            'CRITICAL RULE: Never advise inventing qualifications, fake internships, or skills the student does not actually have. Explicitly state in honestyNotice that missing keywords should only be added if the student genuinely possesses them.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roleTitle: { type: Type.STRING },
              requiredSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              extractedKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              matchedKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              missingKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              improvementSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    targetSection: {
                      type: Type.STRING,
                      description: 'One of: summary, project, experience, skills',
                    },
                    itemTitle: { type: Type.STRING },
                    suggestedText: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                  },
                  required: ['targetSection', 'suggestedText', 'rationale'],
                },
              },
              honestyNotice: { type: Type.STRING },
            },
            required: [
              'roleTitle',
              'requiredSkills',
              'extractedKeywords',
              'matchedKeywords',
              'missingKeywords',
              'improvementSuggestions',
              'honestyNotice',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        ...parsed,
        analyzedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleAiError(res, error, 'Failed to analyze job description.');
    }
  });

  // 4. LinkedIn Public Profile AI Agent (Fetch + Grounded Search + Structured Parse)
  app.post('/api/ai/import-linkedin', async (req: Request, res: Response) => {
    try {
      const { url, fallbackText } = req.body ?? {};
      const rawUrl = typeof url === 'string' ? url.trim() : '';
      const rawFallback = typeof fallbackText === 'string' ? fallbackText.trim() : '';

      if (!rawUrl && !rawFallback) {
        res.status(400).json({ error: 'Please paste a LinkedIn public profile URL.' });
        return;
      }

      let normalizedUrl = rawUrl;
      let profileSlug = '';

      if (rawUrl) {
        const candidate = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
          ? rawUrl
          : `https://${rawUrl}`;
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(candidate);
        } catch {
          res.status(400).json({ error: 'Enter a valid URL such as https://www.linkedin.com/in/username' });
          return;
        }

        if (!parsedUrl.hostname.toLowerCase().includes('linkedin.com')) {
          res.status(400).json({ error: 'URL must be a linkedin.com public profile link.' });
          return;
        }

        const match = parsedUrl.pathname.match(/\/in\/([^/?#]+)/i);
        if (!match) {
          res.status(400).json({
            error: 'Please use a public LinkedIn profile URL formatted like linkedin.com/in/username.',
          });
          return;
        }
        profileSlug = decodeURIComponent(match[1]);
        normalizedUrl = `https://www.linkedin.com/in/${profileSlug}`;
      }

      // Phase 1a: Safe server-side metadata probe (respects LinkedIn authwalls gracefully)
      let directProbeSnippet = '';
      if (normalizedUrl && !rawFallback) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4500);
          const probeRes = await fetch(normalizedUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (compatible; FolioPrepProfileProbe/1.0)',
              Accept: 'text/html,application/xhtml+xml',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          });
          clearTimeout(timer);

          if (probeRes.ok) {
            const html = await probeRes.text();
            const isAuthWall =
              html.includes('authwall') ||
              html.includes('Sign In | LinkedIn') ||
              html.includes('Join LinkedIn');

            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const ogDescMatch = html.match(
              /<meta[^>]+(?:property=["']og:description["']|name=["']description["'])[^>]+content=["']([^"']+)["']/i
            );
            const ldJsonMatches = Array.from(
              html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
            ).map((m) => m[1]?.trim()).filter(Boolean);

            if (!isAuthWall || ogDescMatch?.[1] || ldJsonMatches.length > 0) {
              directProbeSnippet = [
                titleMatch?.[1] ? `Page Title: ${titleMatch[1].trim()}` : '',
                ogDescMatch?.[1] ? `Meta Description: ${ogDescMatch[1].trim()}` : '',
                ldJsonMatches.length > 0 ? `Structured JSON-LD: ${ldJsonMatches.join('\n').slice(0, 4000)}` : '',
              ]
                .filter(Boolean)
                .join('\n');
            }
          }
        } catch {
          // Probe timeout or blocked request; rely on AI agent search & URL context
        }
      }

      const ai = getGeminiClient();
      const sourcesMap = new Map<string, { title: string; uri: string }>();

      // Phase 1b: Grounded AI Retrieval Agent (Google Search + URL Context)
      let gatheredAgentNotes = '';
      if (rawFallback) {
        gatheredAgentNotes = `USER-PROVIDED PROFILE TEXT:\n${rawFallback}`;
      } else {
        const readableSlugHint = profileSlug.replace(/[-_0-9]+/g, ' ').trim();
        const retrievalResponse = await ai.models.generateContent({
          model: MODEL_NAME,
          contents:
            `Retrieve all publicly available career, academic, project, skill, and certification details for this LinkedIn public profile:\n` +
            `Profile URL: ${normalizedUrl}\n` +
            `Profile Slug Hint: ${profileSlug} (${readableSlugHint})\n` +
            (directProbeSnippet
              ? `\nDirect Public HTML Metadata Retrieved:\n${directProbeSnippet}\n`
              : '\nDirect HTML fetch returned limited/gated content; use Google Search and URL Context to inspect publicly indexed snippets for this LinkedIn URL.\n') +
            `\nCRITICAL INSTRUCTION: Report ONLY factual information clearly found in the public URL, search results, or metadata above. ` +
            `Do NOT invent, extrapolate, or guess any person's biography, university, jobs, or skills if the profile is private or not indexed. ` +
            `If no reliable public data is available for this exact LinkedIn profile, clearly output: NO_PUBLIC_DATA_FOUND.`,
          config: {
            tools: [{ googleSearch: {} }, { urlContext: {} }],
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });

        gatheredAgentNotes = (retrievalResponse.text ?? '').trim();
        const chunks = retrievalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(chunks)) {
          for (const chunk of chunks) {
            const web = (chunk as { web?: { uri?: string; title?: string } })?.web;
            if (web?.uri) {
              sourcesMap.set(web.uri, {
                title: web.title || web.uri,
                uri: web.uri,
              });
            }
          }
        }
      }

      // Phase 2: Structured Parsing into Resume Editor Schema
      const parseResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents:
          `LinkedIn URL: ${normalizedUrl || 'Not specified'}\n\n` +
          `Collected Public Data:\n${gatheredAgentNotes}\n\n` +
          (directProbeSnippet ? `Metadata:\n${directProbeSnippet}` : ''),
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a structured resume parser converting public LinkedIn profile findings into clean student resume fields. ' +
            'HONESTY RULE: Only extract facts explicitly present in the Collected Public Data. Never fabricate degrees, companies, dates, GPAs, or skills. ' +
            'Set status="not_found" if Collected Public Data indicates NO_PUBLIC_DATA_FOUND or contains no concrete person/career details. ' +
            'Set status="partial" if only name/headline/location were found without detailed experience or education. ' +
            'Set status="success" if multiple resume sections (e.g. headline/summary plus education, experience, or skills) were extracted. ' +
            'Format linkedin in personal as "linkedin.com/in/<slug>" without https://.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                description: 'One of: success, partial, not_found',
              },
              statusMessage: { type: Type.STRING },
              personal: {
                type: Type.OBJECT,
                properties: {
                  fullName: { type: Type.STRING },
                  targetRole: { type: Type.STRING },
                  location: { type: Type.STRING },
                  linkedin: { type: Type.STRING },
                  github: { type: Type.STRING },
                  portfolio: { type: Type.STRING },
                  careerInterests: { type: Type.STRING },
                  summary: { type: Type.STRING },
                },
              },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    degree: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startYear: { type: Type.STRING },
                    endYear: { type: Type.STRING },
                    gradeLabel: { type: Type.STRING },
                    gradeValue: { type: Type.STRING },
                    coursework: { type: Type.STRING },
                  },
                  required: ['degree', 'institution'],
                },
              },
              skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    items: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['category', 'items'],
                },
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    techStack: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    link: { type: Type.STRING },
                    rawNotes: { type: Type.STRING },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['title'],
                },
              },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    role: { type: Type.STRING },
                    organization: { type: Type.STRING },
                    location: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    rawNotes: { type: Type.STRING },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['role', 'organization'],
                },
              },
              certifications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    issuer: { type: Type.STRING },
                    date: { type: Type.STRING },
                    credentialId: { type: Type.STRING },
                  },
                  required: ['title'],
                },
              },
              achievements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    context: { type: Type.STRING },
                    date: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ['title'],
                },
              },
            },
            required: [
              'status',
              'statusMessage',
              'personal',
              'education',
              'skills',
              'projects',
              'experience',
              'certifications',
              'achievements',
            ],
          },
        },
      });

      const structured = JSON.parse((parseResponse.text ?? '{}').trim());

      res.json({
        status: structured.status || 'partial',
        statusMessage: structured.statusMessage || 'Profile check completed.',
        normalizedUrl,
        sources: Array.from(sourcesMap.values()).slice(0, 6),
        extracted: {
          personal: {
            fullName: structured.personal?.fullName || '',
            targetRole: structured.personal?.targetRole || '',
            location: structured.personal?.location || '',
            linkedin:
              structured.personal?.linkedin ||
              (profileSlug ? `linkedin.com/in/${profileSlug}` : ''),
            github: structured.personal?.github || '',
            portfolio: structured.personal?.portfolio || '',
            careerInterests: structured.personal?.careerInterests || '',
            summary: structured.personal?.summary || '',
          },
          education: Array.isArray(structured.education) ? structured.education : [],
          skills: Array.isArray(structured.skills) ? structured.skills : [],
          projects: Array.isArray(structured.projects) ? structured.projects : [],
          experience: Array.isArray(structured.experience) ? structured.experience : [],
          certifications: Array.isArray(structured.certifications) ? structured.certifications : [],
          achievements: Array.isArray(structured.achievements) ? structured.achievements : [],
        },
      });
    } catch (error) {
      handleAiError(res, error, 'Failed to import LinkedIn public profile.');
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

import { jsPDF } from 'jspdf';
import { ResumeConfig, ResumeData, SectionKey } from '../types/resume';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [30, 41, 59];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function downloadResumePdf(data: ResumeData, config: ResumeConfig): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = config.density === 'compact' ? 12 : config.density === 'airy' ? 17 : 14.5;
  const marginY = config.density === 'compact' ? 12 : config.density === 'airy' ? 16 : 14;
  const contentWidth = pageWidth - marginX * 2;
  const baseFont = config.fontPairing === 'serif-sans' ? 'times' : config.fontPairing === 'technical' ? 'courier' : 'helvetica';
  const bodyFont = config.fontPairing === 'serif-sans' ? 'helvetica' : baseFont;
  const [accentR, accentG, accentB] = hexToRgb(config.accentColor);

  const lineGap = config.density === 'compact' ? 4.1 : config.density === 'airy' ? 5.0 : 4.5;
  const sectionGap = config.density === 'compact' ? 4.2 : config.density === 'airy' ? 6.5 : 5.2;

  let y = marginY;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - marginY) {
      doc.addPage();
      y = marginY;
    }
  };

  const writeWrapped = (
    text: string,
    x: number,
    maxWidth: number,
    fontSize: number,
    fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
    color: [number, number, number] = [30, 41, 59],
    family: 'helvetica' | 'times' | 'courier' = bodyFont
  ) => {
    if (!text.trim()) return;
    doc.setFont(family, fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines: string[] = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      ensureSpace(lineGap);
      doc.text(line, x, y);
      y += lineGap;
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(10);
    y += sectionGap * 0.45;
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(accentR, accentG, accentB);
    doc.text(title.toUpperCase(), marginX, y);
    y += 1.6;
    doc.setDrawColor(accentR, accentG, accentB);
    doc.setLineWidth(config.templateId === 'executive-minimal' ? 0.25 : 0.45);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 4.2;
  };

  // Header
  const { personal } = data;
  const isCenteredHeader = config.templateId === 'classic-academic' || config.templateId === 'executive-minimal';

  doc.setFont(baseFont, 'bold');
  doc.setFontSize(19);
  doc.setTextColor(15, 23, 42);
  const displayName = personal.fullName.trim() || 'Student Name';
  if (isCenteredHeader) {
    doc.text(displayName, pageWidth / 2, y, { align: 'center' });
  } else {
    doc.text(displayName, marginX, y);
  }
  y += 5.5;

  const subParts = [personal.targetRole, personal.usn ? `USN: ${personal.usn}` : ''].filter(Boolean);
  if (subParts.length > 0) {
    doc.setFont(bodyFont, 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(accentR, accentG, accentB);
    const subLine = subParts.join('  |  ');
    if (isCenteredHeader) {
      doc.text(subLine, pageWidth / 2, y, { align: 'center' });
    } else {
      doc.text(subLine, marginX, y);
    }
    y += 4.5;
  }

  const contactItems = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.portfolio,
  ]
    .map((s) => s.trim())
    .filter(Boolean);

  if (contactItems.length > 0) {
    doc.setFont(bodyFont, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const contactText = contactItems.join('  •  ');
    const contactLines: string[] = doc.splitTextToSize(contactText, contentWidth);
    for (const line of contactLines) {
      if (isCenteredHeader) {
        doc.text(line, pageWidth / 2, y, { align: 'center' });
      } else {
        doc.text(line, marginX, y);
      }
      y += 3.8;
    }
  }

  y += 1.5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 2;

  const renderSection = (section: SectionKey) => {
    if (config.hiddenSections.includes(section)) return;

    if (section === 'summary' && personal.summary.trim()) {
      drawSectionHeading('Professional Summary');
      writeWrapped(personal.summary.trim(), marginX, contentWidth, 9.5, 'normal', [30, 41, 59]);
      return;
    }

    if (section === 'education' && data.education.some((e) => e.degree.trim() || e.institution.trim())) {
      drawSectionHeading('Education');
      for (const edu of data.education) {
        if (!edu.degree.trim() && !edu.institution.trim()) continue;
        ensureSpace(12);
        doc.setFont(bodyFont, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(edu.degree || 'Degree', marginX, y);

        const dateRange = [edu.startYear, edu.endYear].filter(Boolean).join(' – ');
        if (dateRange) {
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          doc.text(dateRange, pageWidth - marginX, y, { align: 'right' });
        }
        y += 4.3;

        const instLine = [edu.institution, edu.location].filter(Boolean).join(', ');
        doc.setFont(bodyFont, 'normal');
        doc.setFontSize(9.2);
        doc.setTextColor(51, 65, 85);
        if (instLine) doc.text(instLine, marginX, y);
        if (edu.gradeValue.trim()) {
          doc.setFont(bodyFont, 'bold');
          doc.text(`${edu.gradeLabel || 'GPA'}: ${edu.gradeValue}`, pageWidth - marginX, y, { align: 'right' });
        }
        y += 4.2;

        if (edu.coursework.trim()) {
          writeWrapped(`Relevant Coursework: ${edu.coursework}`, marginX, contentWidth, 8.7, 'normal', [71, 85, 105]);
        }
        y += 1.2;
      }
      return;
    }

    if (section === 'skills' && data.skills.some((s) => s.items.length > 0)) {
      drawSectionHeading('Technical Skills');
      for (const group of data.skills) {
        if (group.items.length === 0) continue;
        const line = `${group.category ? `${group.category}: ` : ''}${group.items.join(', ')}`;
        writeWrapped(line, marginX, contentWidth, 9.2, 'normal', [30, 41, 59]);
      }
      return;
    }

    if (section === 'projects' && data.projects.some((p) => p.title.trim())) {
      drawSectionHeading('Academic & Technical Projects');
      for (const proj of data.projects) {
        if (!proj.title.trim()) continue;
        ensureSpace(14);
        doc.setFont(bodyFont, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(proj.title, marginX, y);
        if (proj.duration.trim()) {
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(8.8);
          doc.setTextColor(71, 85, 105);
          doc.text(proj.duration, pageWidth - marginX, y, { align: 'right' });
        }
        y += 4.2;

        const meta = [proj.techStack ? `Tech: ${proj.techStack}` : '', proj.link].filter(Boolean).join('  |  ');
        if (meta) {
          writeWrapped(meta, marginX, contentWidth, 8.7, 'italic', [71, 85, 105]);
        }

        const bullets = proj.bullets.length > 0 ? proj.bullets : proj.rawNotes ? [proj.rawNotes] : [];
        for (const bullet of bullets) {
          if (!bullet.trim()) continue;
          writeWrapped(`•  ${bullet.trim()}`, marginX + 2, contentWidth - 2, 9.1, 'normal', [30, 41, 59]);
        }
        y += 1.4;
      }
      return;
    }

    if (section === 'experience' && data.experience.some((ex) => ex.role.trim() || ex.organization.trim())) {
      drawSectionHeading('Internships & Experience');
      for (const exp of data.experience) {
        if (!exp.role.trim() && !exp.organization.trim()) continue;
        ensureSpace(14);
        doc.setFont(bodyFont, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text([exp.role, exp.organization].filter(Boolean).join(' — '), marginX, y);
        if (exp.duration.trim()) {
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(8.8);
          doc.setTextColor(71, 85, 105);
          doc.text(exp.duration, pageWidth - marginX, y, { align: 'right' });
        }
        y += 4.2;
        if (exp.location.trim()) {
          writeWrapped(exp.location, marginX, contentWidth, 8.6, 'italic', [100, 116, 139]);
        }
        const bullets = exp.bullets.length > 0 ? exp.bullets : exp.rawNotes ? [exp.rawNotes] : [];
        for (const bullet of bullets) {
          if (!bullet.trim()) continue;
          writeWrapped(`•  ${bullet.trim()}`, marginX + 2, contentWidth - 2, 9.1, 'normal', [30, 41, 59]);
        }
        y += 1.4;
      }
      return;
    }

    if (section === 'certifications' && data.certifications.some((c) => c.title.trim())) {
      drawSectionHeading('Certifications');
      for (const cert of data.certifications) {
        if (!cert.title.trim()) continue;
        const details = [cert.title, cert.issuer, cert.date, cert.credentialId ? `ID: ${cert.credentialId}` : '']
          .filter(Boolean)
          .join(' — ');
        writeWrapped(`•  ${details}`, marginX + 1.5, contentWidth - 1.5, 9.1, 'normal', [30, 41, 59]);
      }
      return;
    }

    if (section === 'achievements' && data.achievements.some((a) => a.title.trim())) {
      drawSectionHeading('Achievements & Extracurriculars');
      for (const ach of data.achievements) {
        if (!ach.title.trim()) continue;
        const head = [ach.title, ach.context, ach.date].filter(Boolean).join(' · ');
        writeWrapped(`•  ${head}${ach.description ? ` — ${ach.description}` : ''}`, marginX + 1.5, contentWidth - 1.5, 9.1, 'normal', [30, 41, 59]);
      }
    }
  };

  for (const section of config.sectionOrder) {
    renderSection(section);
  }

  const safeName = (personal.fullName.trim() || 'Student_Resume').replace(/[^a-zA-Z0-9_-]+/g, '_');
  doc.save(`${safeName}_Resume.pdf`);
}

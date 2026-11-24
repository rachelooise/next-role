// Synthetic resume bytes, generated without personal data or another PDF dependency.
export function resumePdf(lines = [
  'Jordan Example', 'Frontend Developer', 'Perth, Australia',
  'Phone: +61 400 000 000', 'Skills: React, TypeScript, Next.js',
  'Experience: Example Studio - Frontend Developer', 'January 2022 - Present',
  'Built accessible interfaces and improved application performance.',
  'Education: Bachelor of Computer Science, Example University, 2021',
]) {
  const escape = (value) => value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
  const stream = `BT /F1 12 Tf 40 780 Td 18 TL ${lines.map((line, index) => `${index ? 'T* ' : ''}(${escape(line)}) Tj`).join('\n')} ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function detailedResumePdf() {
  return resumePdf([
    'Morgan Example', 'Senior Software Engineer, Melbourne Australia',
    'Contact: +61 400 000 001',
    'linkedin.com/in/morgan-example | github.com/morgan-example',
    'Skills: Python, TypeScript, React, PostgreSQL, AWS, Kubernetes',
    'Over seven years of professional software development experience.',
    'Example Studio: Senior Software Engineer, March 2022 to Present.',
    'Led platform work and built APIs supporting thousands of users.',
    'Example Labs: Software Engineer, June 2019 to February 2022.',
    'Maintained payment systems, reviewed code, mentored colleagues.',
    'Example Tech: Junior Developer, February 2017 to May 2019.',
    'Built web applications and resolved production incidents.',
    'Education: Master of Science in Computer Science, Example University, 2016.',
    'Seeking senior software engineering roles. Remote preferred.',
    'Australian citizen. Salary expectation AUD 140,000 per year.',
  ]);
}

/**
 * Template-based "Gen-AI style" outputs (no external AI).
 */

export function formalComplaint(userText: string, locationLabel: string): string {
  const detail = userText.trim() || 'A road safety or infrastructure issue has been observed.'
  return [
    'To: Municipal Road / Traffic Department',
    '',
    `Location context: ${locationLabel}`,
    '',
    'Sir/Madam,',
    '',
    `${detail}`,
    '',
    'A hazard has been observed at the above location, posing risks to commuters and vehicles. Immediate inspection and remedial action are requested.',
    '',
    'Submitted via SadakBolo (community safety reporting).',
  ].join('\n')
}

export function escalatedMessage(): string {
  return [
    'Subject: Follow-up — unresolved civic infrastructure issue',
    '',
    'This issue has not been resolved within the expected time. Kindly provide a status update and revised timeline.',
    '',
    'Under public grievance / RTI norms, citizens may seek written updates on hazards reported to the competent authority.',
    '',
    'Regards,',
    'Concerned commuter (SadakBolo)',
  ].join('\n')
}

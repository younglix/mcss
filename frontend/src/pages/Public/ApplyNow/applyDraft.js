// Shared draft state across the /apply/* multi-step flow. Each step is its
// own route (not a single-page wizard), so sessionStorage is what carries
// the accumulated answers from BioData through to the real POST /apply
// submission on the Review step — cleared once that submission succeeds.
const DRAFT_KEY = 'mcss-apply-draft';
const RESULT_KEY = 'mcss-apply-result';

export function getDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveDraft(partial) {
  const next = { ...getDraft(), ...partial };
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  return next;
}

export function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

export function saveResult(result) {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

export function getResult() {
  try {
    return JSON.parse(sessionStorage.getItem(RESULT_KEY));
  } catch {
    return null;
  }
}

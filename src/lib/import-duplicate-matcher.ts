/**
 * Fuzzy duplicate detection for CSV / bulk imports.
 * Normalizes emails, names, and addresses, then scores matches with regex + token overlap.
 */

export type ImportMatchField = "email" | "name" | "address" | "project";

export interface ImportCandidate {
  rowIndex?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  address?: string;
  title?: string;
}

export interface ExistingProfile {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
}

export interface ExistingProject {
  id: number;
  authorId?: string | null;
  address?: string | null;
  title?: string | null;
}

export interface DuplicateMatch {
  field: ImportMatchField;
  score: number;
  reason: string;
  existingId: string | number;
  importValue: string;
  existingValue: string;
}

export interface ImportDedupeOptions {
  /** Scores at or above this are treated as duplicates (default 0.85). */
  duplicateThreshold?: number;
  /** Scores in [reviewThreshold, duplicateThreshold) are flagged for manual review (default 0.7). */
  reviewThreshold?: number;
}

export interface ImportDedupeResult {
  candidate: ImportCandidate;
  action: "create" | "review" | "skip";
  bestScore: number;
  matches: DuplicateMatch[];
}

const DEFAULT_DUPLICATE_THRESHOLD = 0.85;
const DEFAULT_REVIEW_THRESHOLD = 0.7;

const BUSINESS_SUFFIXES =
  /\b(llc|l\.l\.c\.|inc|incorporated|corp|corporation|co|company|ltd|limited|pllc|pc)\b/gi;

const STREET_ABBREVS: Record<string, string> = {
  st: "street",
  str: "street",
  ave: "avenue",
  av: "avenue",
  blvd: "boulevard",
  rd: "road",
  dr: "drive",
  ln: "lane",
  ct: "court",
  cir: "circle",
  hwy: "highway",
  pkwy: "parkway",
  apt: "apartment",
  ste: "suite",
  fl: "floor",
  bldg: "building",
  n: "north",
  s: "south",
  e: "east",
  w: "west",
  ne: "northeast",
  nw: "northwest",
  se: "southeast",
  sw: "southwest",
};

/** Escape a string for use inside a RegExp. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Collapse whitespace and lowercase for comparisons. */
export function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Normalize email for duplicate checks (Gmail dots, +aliases, lowercase).
 */
export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) return trimmed;

  const [localRaw, domainRaw] = trimmed.split("@");
  const domain = domainRaw.replace(/\.$/, "");

  let local = localRaw;
  const plus = local.indexOf("+");
  if (plus >= 0) local = local.slice(0, plus);

  if (domain === "googlemail.com") {
    return `${local.replace(/\./g, "")}@gmail.com`;
  }
  if (domain === "gmail.com") {
    return `${local.replace(/\./g, "")}@gmail.com`;
  }

  return `${local}@${domain}`;
}

/**
 * Regex that matches the normalized local part with optional separators between characters
 * (catches "j.o.h.n@gmail" style spacing in source data).
 */
export function buildEmailLocalRegex(normalizedEmail: string): RegExp | null {
  const normalized = normalizeEmail(normalizedEmail);
  const at = normalized.indexOf("@");
  if (at <= 0) return null;

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const pattern = local
    .split("")
    .map((ch) => escapeRegex(ch))
    .join("[.\\s]*");

  return new RegExp(`^${pattern}[+\\w.-]*@${escapeRegex(domain)}$`, "i");
}

export function scoreEmailMatch(a: string, b: string): { score: number; reason: string } {
  const na = normalizeEmail(a);
  const nb = normalizeEmail(b);
  if (!na || !nb) return { score: 0, reason: "empty email" };
  if (na === nb) return { score: 1, reason: "normalized email exact match" };

  const regex = buildEmailLocalRegex(na);
  if (regex && regex.test(nb)) {
    return { score: 0.95, reason: "email local-part fuzzy match (aliases/spacing)" };
  }

  const ratio = levenshteinRatio(na, nb);
  if (ratio >= 0.92) {
    return { score: ratio, reason: "email edit-distance similarity" };
  }

  return { score: 0, reason: "no email match" };
}

export function normalizePersonName(parts: {
  firstName?: string;
  lastName?: string;
  companyName?: string;
}): string {
  const company = parts.companyName?.trim();
  if (company) {
    return collapseWhitespace(company.replace(BUSINESS_SUFFIXES, "").replace(/[.,']/g, ""));
  }

  const first = parts.firstName?.trim() ?? "";
  const last = parts.lastName?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  return collapseWhitespace(full.replace(/[.,']/g, ""));
}

/**
 * Build a regex that matches name tokens in any order with flexible spacing/punctuation.
 */
export function buildNameRegex(normalizedName: string): RegExp | null {
  const tokens = normalizedName
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map(escapeRegex);

  if (tokens.length === 0) return null;
  if (tokens.length === 1) {
    return new RegExp(`\\b${tokens[0]}\\b`, "i");
  }

  const forward = tokens.join("[\\s,.-]+");
  const reverse = [...tokens].reverse().join("[\\s,.-]+");
  return new RegExp(`(?:${forward}|${reverse})`, "i");
}

export function scoreNameMatch(
  a: { firstName?: string; lastName?: string; companyName?: string },
  b: { firstName?: string; lastName?: string; companyName?: string }
): { score: number; reason: string } {
  const na = normalizePersonName(a);
  const nb = normalizePersonName(b);
  if (!na || !nb) return { score: 0, reason: "empty name" };
  if (na === nb) return { score: 1, reason: "normalized name exact match" };

  const regexA = buildNameRegex(na);
  const regexB = buildNameRegex(nb);
  if (regexA?.test(nb) || regexB?.test(na)) {
    return { score: 0.9, reason: "name token regex match (order/spacing tolerant)" };
  }

  const tokenScore = tokenOverlapScore(na, nb);
  if (tokenScore >= 0.75) {
    return { score: tokenScore, reason: "name token overlap" };
  }

  const ratio = levenshteinRatio(na, nb);
  if (ratio >= 0.88) {
    return { score: ratio, reason: "name edit-distance similarity" };
  }

  return { score: 0, reason: "no name match" };
}

export interface NormalizedAddress {
  normalized: string;
  streetNumber: string | null;
  tokens: string[];
  zip: string | null;
}

export function normalizeAddress(address: string): NormalizedAddress {
  let value = collapseWhitespace(address);
  value = value.replace(/[#,]/g, " ");

  const zipMatch = value.match(/\b(\d{5})(?:-\d{4})?\b/);
  const zip = zipMatch ? zipMatch[1] : null;
  if (zip) value = value.replace(zipMatch![0], " ");

  const tokens: string[] = [];
  for (const raw of value.split(/\s+/)) {
    if (!raw) continue;
    const bare = raw.replace(/[^\w]/g, "");
    if (!bare) continue;
    const expanded = STREET_ABBREVS[bare] ?? bare;
    if (/^\d+$/.test(expanded)) {
      tokens.push(expanded);
      continue;
    }
    if (expanded.length > 1) tokens.push(expanded);
  }

  const streetNumber = tokens.find((t) => /^\d+$/.test(t)) ?? null;
  const normalized = tokens.join(" ");

  return { normalized, streetNumber, tokens, zip };
}

/**
 * Regex: optional street number, then required sequence of street-name tokens with flexible gaps.
 */
export function buildAddressRegex(normalized: NormalizedAddress): RegExp | null {
  const nameTokens = normalized.tokens.filter((t) => !/^\d+$/.test(t)).map(escapeRegex);
  if (nameTokens.length === 0) return null;

  const numberPart = normalized.streetNumber
    ? `${escapeRegex(normalized.streetNumber)}[\\s,.-]*`
    : "(?:\\d+[\\s,.-]*)?";

  const body = nameTokens.join("[\\s,.-]+");
  return new RegExp(`${numberPart}${body}`, "i");
}

export function scoreAddressMatch(a: string, b: string): { score: number; reason: string } {
  const na = normalizeAddress(a);
  const nb = normalizeAddress(b);
  if (!na.normalized || !nb.normalized) return { score: 0, reason: "empty address" };

  if (na.normalized === nb.normalized) {
    return { score: 1, reason: "normalized address exact match" };
  }

  if (na.streetNumber && nb.streetNumber && na.streetNumber !== nb.streetNumber) {
    return { score: 0, reason: "different street numbers" };
  }

  if (na.zip && nb.zip && na.zip !== nb.zip) {
    return { score: Math.max(0, tokenOverlapScore(na.normalized, nb.normalized) - 0.15), reason: "zip mismatch penalty" };
  }

  const regexA = buildAddressRegex(na);
  const regexB = buildAddressRegex(nb);
  if (regexA?.test(nb.normalized) || regexB?.test(na.normalized)) {
    return { score: 0.92, reason: "address regex match (abbrev/spacing tolerant)" };
  }

  const tokenScore = tokenOverlapScore(na.normalized, nb.normalized);
  if (tokenScore >= 0.72) {
    return { score: tokenScore, reason: "address token overlap" };
  }

  const ratio = levenshteinRatio(na.normalized, nb.normalized);
  if (ratio >= 0.9) {
    return { score: ratio, reason: "address edit-distance similarity" };
  }

  return { score: 0, reason: "no address match" };
}

export function scoreProjectMatch(
  a: { address?: string; title?: string; email?: string },
  b: { address?: string; title?: string; authorEmail?: string },
  profileMatchScore: number
): { score: number; reason: string } {
  if (a.address && b.address) {
    const addr = scoreAddressMatch(a.address, b.address);
    if (addr.score >= 0.85) {
      return { score: addr.score, reason: `project address: ${addr.reason}` };
    }
  }

  if (a.title && b.title) {
    const ta = collapseWhitespace(a.title);
    const tb = collapseWhitespace(b.title);
    if (ta === tb) return { score: 0.88, reason: "project title exact match" };
    const regex = buildNameRegex(ta);
    if (regex?.test(tb)) return { score: 0.85, reason: "project title regex match" };
  }

  if (profileMatchScore >= 0.9 && a.address && b.address) {
    const addr = scoreAddressMatch(a.address, b.address);
    if (addr.score >= 0.65) {
      return {
        score: Math.min(0.84, (profileMatchScore + addr.score) / 2),
        reason: "same client + similar address",
      };
    }
  }

  return { score: 0, reason: "no project match" };
}

function tokenOverlapScore(a: string, b: string): number {
  const ta = new Set(a.split(/\s+/).filter((t) => t.length > 1));
  const tb = new Set(b.split(/\s+/).filter((t) => t.length > 1));
  if (ta.size === 0 || tb.size === 0) return 0;

  let intersection = 0;
  ta.forEach((t) => {
    if (tb.has(t)) intersection++;
  });
  const union = new Set(Array.from(ta).concat(Array.from(tb))).size;
  return union === 0 ? 0 : intersection / union;
}

function levenshteinRatio(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / maxLen;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[n];
}

function actionFromScore(
  bestScore: number,
  options: ImportDedupeOptions
): ImportDedupeResult["action"] {
  const dup = options.duplicateThreshold ?? DEFAULT_DUPLICATE_THRESHOLD;
  const review = options.reviewThreshold ?? DEFAULT_REVIEW_THRESHOLD;
  if (bestScore >= dup) return "skip";
  if (bestScore >= review) return "review";
  return "create";
}

/**
 * Find duplicate profiles and projects for one import row.
 */
export function findDuplicateMatches(
  candidate: ImportCandidate,
  existing: { profiles: ExistingProfile[]; projects: ExistingProject[] },
  profileEmailById: Map<string, string>,
  options: ImportDedupeOptions = {}
): ImportDedupeResult {
  const matches: DuplicateMatch[] = [];

  for (const profile of existing.profiles) {
    if (candidate.email && profile.email) {
      const { score, reason } = scoreEmailMatch(candidate.email, profile.email);
      if (score > 0) {
        matches.push({
          field: "email",
          score,
          reason,
          existingId: profile.id,
          importValue: candidate.email,
          existingValue: profile.email,
        });
      }
    }

    const nameScore = scoreNameMatch(candidate, profile);
    if (nameScore.score > 0) {
      matches.push({
        field: "name",
        score: nameScore.score,
        reason: nameScore.reason,
        existingId: profile.id,
        importValue:
          normalizePersonName(candidate) ||
          [candidate.firstName, candidate.lastName].filter(Boolean).join(" "),
        existingValue: normalizePersonName(profile),
      });
    }
  }

  let profileBest = 0;
  for (const m of matches) {
    if ((m.field === "email" || m.field === "name") && m.score > profileBest) {
      profileBest = m.score;
    }
  }

  for (const project of existing.projects) {
    if (!candidate.address && !candidate.title) continue;

    const authorEmail = project.authorId
      ? profileEmailById.get(project.authorId)
      : undefined;

    const projectScore = scoreProjectMatch(
      candidate,
      {
        address: project.address ?? undefined,
        title: project.title ?? undefined,
        authorEmail,
      },
      profileBest
    );

    if (projectScore.score > 0) {
      matches.push({
        field: "project",
        score: projectScore.score,
        reason: projectScore.reason,
        existingId: project.id,
        importValue: candidate.address || candidate.title || "",
        existingValue: project.address || project.title || "",
      });
    }

    if (candidate.address && project.address) {
      const addr = scoreAddressMatch(candidate.address, project.address);
      if (addr.score > 0 && addr.score >= (options.reviewThreshold ?? DEFAULT_REVIEW_THRESHOLD)) {
        matches.push({
          field: "address",
          score: addr.score,
          reason: addr.reason,
          existingId: project.id,
          importValue: candidate.address,
          existingValue: project.address,
        });
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);

  const deduped = dedupeMatches(matches);
  const bestScore = deduped[0]?.score ?? 0;

  return {
    candidate,
    action: actionFromScore(bestScore, options),
    bestScore,
    matches: deduped,
  };
}

function dedupeMatches(matches: DuplicateMatch[]): DuplicateMatch[] {
  const byKey = new Map<string, DuplicateMatch>();
  for (const m of matches) {
    const key = `${m.field}:${m.existingId}`;
    const prev = byKey.get(key);
    if (!prev || m.score > prev.score) byKey.set(key, m);
  }
  return Array.from(byKey.values()).sort((a, b) => b.score - a.score);
}

/**
 * Scan a batch of import rows (e.g. parsed CSV) against existing DB records.
 */
export function scanImportBatch(
  rows: ImportCandidate[],
  existing: { profiles: ExistingProfile[]; projects: ExistingProject[] },
  options: ImportDedupeOptions = {}
): ImportDedupeResult[] {
  const profileEmailById = new Map<string, string>();
  for (const p of existing.profiles) {
    if (p.id && p.email) profileEmailById.set(p.id, p.email);
  }

  return rows.map((row, index) =>
    findDuplicateMatches({ ...row, rowIndex: row.rowIndex ?? index + 1 }, existing, profileEmailById, options)
  );
}

import type { Enums } from '@/integrations/supabase/types';

type Faculty = Enums<'faculty_type'>;
type Budget = Enums<'budget_range'>;
type Usage = Enums<'usage_type'>;

// ---------- Faculty mappings ----------
export const facultyTagMap: Record<Faculty, string[]> = {
  Engineering: ['laptop', 'gpu', 'workstation', 'programming', 'cad', 'high-performance'],
  Business: ['laptop', 'tablet', 'office', 'portable', 'business'],
  Medicine: ['tablet', 'lightweight', 'portable', 'long-battery', 'note-taking'],
  Pharmacy: ['tablet', 'lightweight', 'portable', 'long-battery', 'note-taking'],
  'Computer Science': ['laptop', 'programming', 'high-performance', 'workstation', 'developer'],
  'Artificial Intelligence': ['laptop', 'gpu', 'high-performance', 'workstation', 'programming'],
  Arts: ['display', 'design', 'creative', 'color-accurate', 'tablet', 'stylus'],
  Law: ['laptop', 'tablet', 'portable', 'office', 'long-battery'],
  Media: ['display', 'creative', 'design', 'color-accurate', 'laptop', 'high-performance'],
  Education: ['laptop', 'tablet', 'portable', 'office', 'note-taking'],
  Architecture: ['laptop', 'gpu', 'workstation', 'cad', 'display', 'color-accurate'],
  Dentistry: ['tablet', 'lightweight', 'portable', 'long-battery', 'note-taking'],
  Nursing: ['tablet', 'lightweight', 'portable', 'long-battery', 'note-taking'],
  Science: ['laptop', 'workstation', 'high-performance', 'programming'],
  Agriculture: ['laptop', 'tablet', 'portable', 'long-battery'],
  Economics: ['laptop', 'tablet', 'office', 'portable', 'business'],
  Other: ['laptop', 'headphones', 'accessories'],
};

export const facultyCategoryMap: Record<Faculty, string[]> = {
  Engineering: ['Laptops', 'GPUs', 'Monitors', 'Storage', 'Keyboards'],
  Business: ['Laptops', 'Tablets', 'Headphones'],
  Medicine: ['Tablets', 'Laptops', 'Headphones'],
  Pharmacy: ['Tablets', 'Laptops', 'Headphones'],
  'Computer Science': ['Laptops', 'Monitors', 'Keyboards', 'Storage'],
  'Artificial Intelligence': ['Laptops', 'GPUs', 'Storage', 'Monitors'],
  Arts: ['Monitors', 'Tablets', 'Laptops'],
  Law: ['Laptops', 'Tablets', 'Headphones'],
  Media: ['Laptops', 'Monitors', 'Tablets', 'Headphones'],
  Education: ['Laptops', 'Tablets', 'Headphones'],
  Architecture: ['Laptops', 'Monitors', 'GPUs', 'Tablets'],
  Dentistry: ['Tablets', 'Laptops', 'Headphones'],
  Nursing: ['Tablets', 'Laptops', 'Headphones'],
  Science: ['Laptops', 'Monitors', 'Storage'],
  Agriculture: ['Laptops', 'Tablets'],
  Economics: ['Laptops', 'Tablets', 'Headphones'],
  Other: ['Laptops', 'Headphones', 'Tablets'],
};

const businessReasons = {
  laptop: 'Reliable laptop for business tasks',
  tablet: 'Portable tablet for meetings & presentations',
  office: 'Optimized for office productivity',
  portable: 'Easy to carry between classes',
  business: 'Professional-grade for business students',
};

const medicalReasons = {
  tablet: 'Lightweight tablet perfect for medical references',
  lightweight: 'Easy to carry on long hospital rotations',
  portable: 'Highly portable for clinical use',
  'long-battery': 'All-day battery for back-to-back lectures',
  'note-taking': 'Great for handwritten notes',
};

const creativeReasons = {
  display: 'Premium display for visual work',
  design: 'Built for design & creative workflows',
  creative: 'Crafted for creative projects',
  'color-accurate': 'Color-accurate display for designers',
  tablet: 'Drawing tablet for digital art',
  stylus: 'Stylus support for sketching',
  laptop: 'Powerful laptop for creative software',
  'high-performance': 'Handles heavy creative workloads',
};

const devReasons = {
  laptop: 'Solid laptop for development workflows',
  programming: 'Built for coding and IDEs',
  workstation: 'Workstation-grade reliability',
  'high-performance': 'Top-tier performance for builds & compilation',
  developer: 'Loved by developers',
  gpu: 'GPU power for ML/AI training',
};

export const facultyReasonMap: Record<Faculty, Record<string, string>> = {
  Engineering: {
    laptop: 'High-performance laptop ideal for engineering software',
    gpu: 'Powerful GPU for simulations & 3D modeling',
    workstation: 'Workstation-grade reliability for engineering tasks',
    programming: 'Built for development workflows',
    cad: 'Optimized for CAD applications',
    'high-performance': 'Top-tier performance for demanding engineering work',
  },
  Business: businessReasons,
  Medicine: medicalReasons,
  Pharmacy: medicalReasons,
  'Computer Science': devReasons,
  'Artificial Intelligence': devReasons,
  Arts: creativeReasons,
  Law: {
    laptop: 'Reliable laptop for legal research',
    tablet: 'Portable tablet for case files',
    portable: 'Easy to carry to court & class',
    office: 'Optimized for document workflows',
    'long-battery': 'All-day battery for long sessions',
  },
  Media: creativeReasons,
  Education: {
    laptop: 'Versatile laptop for teaching prep',
    tablet: 'Great for interactive lessons',
    portable: 'Easy to carry to lectures',
    office: 'Optimized for productivity',
    'note-taking': 'Perfect for lesson notes',
  },
  Architecture: {
    laptop: 'Powerful laptop for design software',
    gpu: 'GPU for 3D rendering',
    workstation: 'Workstation-grade for heavy projects',
    cad: 'Optimized for CAD applications',
    display: 'Large display for detailed drawings',
    'color-accurate': 'Color-accurate display for renders',
  },
  Dentistry: medicalReasons,
  Nursing: medicalReasons,
  Science: {
    laptop: 'Reliable laptop for research tasks',
    workstation: 'Workstation-grade for data analysis',
    'high-performance': 'Handles heavy computational work',
    programming: 'Great for scripting & analysis',
  },
  Agriculture: {
    laptop: 'Versatile laptop for fieldwork data',
    tablet: 'Portable tablet for on-site notes',
    portable: 'Easy to carry to the field',
    'long-battery': 'All-day battery for long days',
  },
  Economics: businessReasons,
  Other: {
    laptop: 'Versatile laptop for any major',
    headphones: 'Quality audio for study & entertainment',
    accessories: 'Useful accessory to enhance your setup',
  },
};

// ---------- Budget mapping (EGP) ----------
export const budgetRanges: Record<Budget, { min: number; max: number; label: string }> = {
  low: { min: 0, max: 15000, label: 'Budget (≤ 15k EGP)' },
  medium: { min: 15000, max: 40000, label: 'Mid-range (15k–40k EGP)' },
  high: { min: 40000, max: Number.POSITIVE_INFINITY, label: 'Premium (40k+ EGP)' },
};

// ---------- Usage tag mapping ----------
export const usageTagMap: Record<Usage, string[]> = {
  gaming: ['gaming', 'gpu', 'high-performance', 'rgb'],
  programming: ['programming', 'laptop', 'workstation', 'high-performance'],
  design: ['design', 'creative', 'color-accurate', 'display', 'stylus'],
  study: ['portable', 'lightweight', 'long-battery', 'note-taking', 'tablet'],
  general: ['laptop', 'headphones', 'accessories'],
};

// ---------- Helpers ----------
export function getRecommendedTags(faculty: Faculty | null | undefined): string[] {
  if (!faculty) return facultyTagMap.Other;
  return facultyTagMap[faculty] ?? facultyTagMap.Other;
}

export function getRecommendedCategories(faculty: Faculty | null | undefined): string[] {
  if (!faculty) return facultyCategoryMap.Other;
  return facultyCategoryMap[faculty] ?? facultyCategoryMap.Other;
}

export function getUsageTags(usage: Usage | null | undefined): string[] {
  if (!usage) return [];
  return usageTagMap[usage] ?? [];
}

export function getBudgetBounds(budget: Budget | null | undefined): { min: number; max: number } | null {
  if (!budget) return null;
  return budgetRanges[budget] ?? null;
}

export function getRecommendationReason(faculty: Faculty | null | undefined, tags: string[] | null): string {
  if (!faculty || !tags || tags.length === 0) return '';
  const reasonsForFaculty = facultyReasonMap[faculty] ?? {};
  const matchingTag = tags.find((t) => reasonsForFaculty[t]);
  if (matchingTag) return reasonsForFaculty[matchingTag];
  return '';
}

/**
 * Returns the matched faculty+tag so callers can translate via i18n.
 * Use with t(`recommendationReasons.${faculty}.${tag}`, { defaultValue: fallback }).
 */
export function getRecommendationReasonKey(
  faculty: Faculty | null | undefined,
  tags: string[] | null
): { faculty: string; tag: string; fallback: string } | null {
  if (!faculty || !tags || tags.length === 0) return null;
  const reasonsForFaculty = facultyReasonMap[faculty] ?? {};
  const matchingTag = tags.find((t) => reasonsForFaculty[t]);
  if (!matchingTag) return null;
  return { faculty, tag: matchingTag, fallback: reasonsForFaculty[matchingTag] };
}

export function getFacultyLabel(faculty: Faculty | null | undefined): string {
  if (!faculty || faculty === 'Other') return 'You';
  return faculty;
}

// ---------- Smart scoring (v2) ----------
export interface ScoreInput {
  tags?: string[] | null;
  category?: string | null;
  price?: number | null;
  popularity_score?: number | null;
  rating?: number | null;
  clicks?: number;
  cartAdds?: number;
  purchases?: number;
}

export interface ScoreContext {
  faculty?: Faculty | null;
  budget?: Budget | null;
  usage?: Usage | null;
  preferredCategories?: string[];
  brandPreference?: string | null;
}

/**
 * Weighted scoring formula:
 *   faculty_match*3 + category_match*2 + budget_match*2 + usage_match*2 + popularity + rating
 * Plus small boosts for behavior signals (clicks, cart adds, purchases) and brand preference.
 */
export function scoreProduct(p: ScoreInput, ctx: ScoreContext): number {
  const facultyTags = new Set(getRecommendedTags(ctx.faculty));
  const facultyCats = new Set(getRecommendedCategories(ctx.faculty));
  const usageTags = new Set(getUsageTags(ctx.usage));
  const preferredCats = new Set(ctx.preferredCategories ?? []);
  const productTags = p.tags ?? [];

  const facultyMatch = productTags.some((t) => facultyTags.has(t)) ? 1 : 0;
  const categoryMatch =
    p.category && (facultyCats.has(p.category) || preferredCats.has(p.category)) ? 1 : 0;
  const usageMatch = productTags.some((t) => usageTags.has(t)) ? 1 : 0;

  const bounds = getBudgetBounds(ctx.budget);
  const budgetMatch = bounds && p.price != null && p.price >= bounds.min && p.price <= bounds.max ? 1 : 0;

  const popularity = p.popularity_score ?? 0;
  const rating = Number(p.rating ?? 0);
  const clicks = p.clicks ?? 0;
  const cartAdds = p.cartAdds ?? 0;
  const purchases = p.purchases ?? 0;

  let brandBoost = 0;
  if (ctx.brandPreference && ctx.brandPreference.trim()) {
    const brand = ctx.brandPreference.toLowerCase().trim();
    const inTags = productTags.some((t) => t.toLowerCase().includes(brand));
    if (inTags) brandBoost = 5;
  }

  return (
    facultyMatch * 3 +
    categoryMatch * 2 +
    budgetMatch * 2 +
    usageMatch * 2 +
    popularity * 1 +
    rating * 2 +
    clicks * 0.3 +
    cartAdds * 0.6 +
    purchases * 1.2 +
    brandBoost
  );
}

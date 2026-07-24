export interface RamOption {
  value: string; // e.g. "16GB"
  label: string;
  extra: number; // EGP
}
export interface SsdOption {
  value: string; // e.g. "1TB"
  label: string;
  extra: number;
}

export const RAM_OPTIONS: RamOption[] = [
  { value: '8GB', label: '8 GB', extra: 0 },
  { value: '16GB', label: '16 GB', extra: 2000 },
  { value: '32GB', label: '32 GB', extra: 5000 },
  { value: '64GB', label: '64 GB', extra: 9000 },
];

export const SSD_OPTIONS: SsdOption[] = [
  { value: '256GB', label: '256 GB', extra: 0 },
  { value: '512GB', label: '512 GB', extra: 1500 },
  { value: '1TB', label: '1 TB', extra: 3500 },
  { value: '2TB', label: '2 TB', extra: 6500 },
];

export const DEFAULT_RAM = RAM_OPTIONS[0];
export const DEFAULT_SSD = SSD_OPTIONS[0];

/** Only laptops and desktop PCs are customizable. */
export function isCustomizable(category?: string | null): boolean {
  if (!category) return false;
  const c = category.toLowerCase();
  return (
    c.includes('laptop') ||
    c.includes('desktop') ||
    c.includes(' pc') ||
    c === 'pc' ||
    c.endsWith(' pcs') ||
    c.includes('desktop pc')
  );
}

export interface CartCustomization {
  ram: string;
  ssd: string;
  ramExtra: number;
  ssdExtra: number;
}

export function customizationExtra(c?: CartCustomization | null): number {
  if (!c) return 0;
  return (c.ramExtra ?? 0) + (c.ssdExtra ?? 0);
}

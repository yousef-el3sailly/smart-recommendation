import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { UserLayout } from '@/components/layout/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Constants } from '@/integrations/supabase/types';
import type { Enums } from '@/integrations/supabase/types';
import { budgetRanges } from '@/lib/recommendations';
import { SeoHead } from '@/components/SeoHead';

const faculties = Constants.public.Enums.faculty_type;
const CATEGORY_OPTIONS = ['Laptops', 'Headphones', 'Tablets', 'Monitors', 'Keyboards', 'Mice', 'GPUs', 'Storage', 'Accessories'];
const USAGE_VALUES: Enums<'usage_type'>[] = ['gaming', 'programming', 'design', 'study', 'general'];
const PRIORITY_VALUES: Enums<'performance_priority'>[] = ['battery', 'performance', 'portability', 'balanced'];

const Profile = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState<Enums<'faculty_type'>>('Other');
  const [studyYear, setStudyYear] = useState<string>('');
  const [budget, setBudget] = useState<Enums<'budget_range'> | ''>('');
  const [usage, setUsage] = useState<Enums<'usage_type'> | ''>('');
  const [priority, setPriority] = useState<Enums<'performance_priority'> | ''>('');
  const [brand, setBrand] = useState('');
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setFaculty(profile.faculty ?? 'Other');
    setStudyYear(profile.study_year != null ? String(profile.study_year) : '');
    setBudget(profile.budget_range ?? '');
    setUsage(profile.usage_type ?? '');
    setPriority(profile.performance_priority ?? '');
    setBrand(profile.brand_preference ?? '');
    setPreferredCategories(profile.preferred_categories ?? []);
  }, [profile]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  const toggleCategory = (cat: string) => {
    setPreferredCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name,
        faculty,
        study_year: studyYear ? parseInt(studyYear, 10) : null,
        budget_range: budget || null,
        usage_type: usage || null,
        performance_priority: priority || null,
        brand_preference: brand.trim() || null,
        preferred_categories: preferredCategories,
      } as any);
      toast({ title: t('profile.updated'), description: t('profile.updatedDesc') });
    } catch (err: any) {
      toast({ title: t('profile.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserLayout>
      <SeoHead title={t('profile.title')} />
      <div className="container max-w-2xl py-8 md:py-12">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('profile.subtitle')}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>{t('profile.email')}</Label>
              <Input value={user.email ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.name')}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('profile.faculty')}</Label>
                <Select value={faculty} onValueChange={(v) => setFaculty(v as Enums<'faculty_type'>)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="study-year">{t('profile.studyYear')}</Label>
                <Select value={studyYear} onValueChange={setStudyYear}>
                  <SelectTrigger id="study-year"><SelectValue placeholder={t('profile.selectYear')} /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <SelectItem key={y} value={String(y)}>{t('profile.year', { n: y })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('profile.budget')}</Label>
                <Select value={budget} onValueChange={(v) => setBudget(v as Enums<'budget_range'>)}>
                  <SelectTrigger><SelectValue placeholder={t('profile.selectBudget')} /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(budgetRanges) as Array<Enums<'budget_range'>>).map((b) => (
                      <SelectItem key={b} value={b}>{budgetRanges[b].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('profile.usage')}</Label>
                <Select value={usage} onValueChange={(v) => setUsage(v as Enums<'usage_type'>)}>
                  <SelectTrigger><SelectValue placeholder={t('profile.usagePlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {USAGE_VALUES.map((u) => (
                      <SelectItem key={u} value={u}>{t(`profile.usageOptions.${u}` as any)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('profile.priority')}</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Enums<'performance_priority'>)}>
                  <SelectTrigger><SelectValue placeholder={t('profile.priorityPlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_VALUES.map((p) => (
                      <SelectItem key={p} value={p}>{t(`profile.priorityOptions.${p}` as any)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">{t('profile.brand')}</Label>
                <Input
                  id="brand"
                  placeholder={t('profile.brandPlaceholder')}
                  value={brand}
                  maxLength={50}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('profile.categories')}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-md">
                {CATEGORY_OPTIONS.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={preferredCategories.includes(cat)}
                      onCheckedChange={() => toggleCategory(cat)}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
              {saving ? (
                <><span className="me-2 inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> {t('profile.saving')}</>
              ) : t('profile.save')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default Profile;

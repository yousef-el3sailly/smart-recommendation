import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { UserLayout } from '@/components/layout/UserLayout';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { SeoHead } from '@/components/SeoHead';
import {
  usePopularProducts,
  usePersonalizedRecommendations,
  useFacultyTopPicks,
  useTrendingProducts,
  useBudgetProducts,
  useRecentlyViewed,
} from '@/hooks/useProducts';
import {
  getRecommendationReasonKey,
  getFacultyLabel,
  budgetRanges,
} from '@/lib/recommendations';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Sparkles, TrendingUp, GraduationCap, Wallet } from 'lucide-react';

const ProductSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="aspect-square w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  products: any[] | undefined | null;
  emptyText: string;
  trackingSource: string;
  showReasonForFaculty?: string | null;
}

const ProductSection: React.FC<SectionProps> = ({
  title, icon, loading, products, emptyText, trackingSource, showReasonForFaculty,
}) => {
  const { t } = useTranslation();
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/products">
            {t('home.viewAll')} <ArrowRight className="ms-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
          : products?.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                recommendationReason={(() => {
                  if (!showReasonForFaculty) return undefined;
                  const r = getRecommendationReasonKey(showReasonForFaculty as any, p.tags);
                  if (!r) return undefined;
                  return t(`recommendationReasons.${r.faculty}.${r.tag}`, { defaultValue: r.fallback });
                })()}
                trackingSource={trackingSource}
              />
            ))}
        {!loading && (!products || products.length === 0) && (
          <p className="col-span-full text-muted-foreground text-center py-8">{emptyText}</p>
        )}
      </div>
    </section>
  );
};

const Index = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  const { data: personalized, isLoading: persLoading } = usePersonalizedRecommendations(profile);
  const { data: facultyPicks, isLoading: facLoading } = useFacultyTopPicks(profile);
  const { data: trending, isLoading: trendLoading } = useTrendingProducts();
  const { data: budgetPicks, isLoading: budgetLoading } = useBudgetProducts(profile?.budget_range);
  const { data: popular, isLoading: popLoading } = usePopularProducts();
  const { data: recentlyViewed } = useRecentlyViewed(user?.id);

  const hasFaculty = !!profile?.faculty && profile.faculty !== 'Other';
  const hasBudget = !!profile?.budget_range;

  return (
    <UserLayout>
      <SeoHead />
      <section className="border-b bg-gradient-to-br from-primary/5 to-primary/10 py-16 md:py-24">
        <div className="container text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t('home.heroTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/products">{t('home.browseProducts')}</Link>
            </Button>
            {!user ? (
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">{t('home.signUpCta')}</Link>
              </Button>
            ) : (
              (!hasFaculty || !hasBudget) && (
                <Button asChild variant="outline" size="lg">
                  <Link to="/profile">{t('home.completeProfile')}</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </section>

      <div className="container px-4 sm:px-6 py-10 sm:py-12 space-y-12 sm:space-y-16">
        {user && (
          <ProductSection
            title={t('home.sections.smartPicks')}
            icon={<Sparkles className="h-5 w-5 text-primary" />}
            loading={persLoading}
            products={personalized}
            emptyText={t('home.empty.personalized')}
            trackingSource="personalized"
            showReasonForFaculty={profile?.faculty ?? null}
          />
        )}

        {user && hasFaculty && (
          <ProductSection
            title={t('home.sections.facultyPicks', { faculty: t(`faculties.${profile?.faculty}`, { defaultValue: getFacultyLabel(profile?.faculty) }) })}
            icon={<GraduationCap className="h-5 w-5 text-primary" />}
            loading={facLoading}
            products={facultyPicks}
            emptyText={t('home.empty.faculty')}
            trackingSource="faculty_top_picks"
            showReasonForFaculty={profile?.faculty}
          />
        )}

        {user && hasBudget && (
          <ProductSection
            title={t('home.sections.budgetPicks', { label: budgetRanges[profile!.budget_range!].label })}
            icon={<Wallet className="h-5 w-5 text-primary" />}
            loading={budgetLoading}
            products={budgetPicks}
            emptyText={t('home.empty.budget')}
            trackingSource="budget"
          />
        )}

        <ProductSection
          title={t('home.sections.trending')}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          loading={trendLoading}
          products={trending}
          emptyText={t('home.empty.trending')}
          trackingSource="trending"
        />

        <ProductSection
          title={t('home.sections.popular')}
          icon={<Sparkles className="h-5 w-5 text-primary" />}
          loading={popLoading}
          products={popular}
          emptyText={t('home.empty.popular')}
          trackingSource="popular"
        />

        {user && recentlyViewed && recentlyViewed.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">{t('home.sections.recentlyViewed')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {recentlyViewed.map((rv: any) => rv.products && (
                <ProductCard key={rv.id} product={rv.products} trackingSource="recently_viewed" />
              ))}
            </div>
          </section>
        )}
      </div>
    </UserLayout>
  );
};

export default Index;

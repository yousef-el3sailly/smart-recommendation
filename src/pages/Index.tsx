import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserLayout } from '@/components/layout/UserLayout';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import {
  usePopularProducts,
  usePersonalizedRecommendations,
  useFacultyTopPicks,
  useTrendingProducts,
  useBudgetProducts,
  useRecentlyViewed,
} from '@/hooks/useProducts';
import {
  getRecommendationReason,
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
  products: ReturnType<typeof Array.prototype.slice> | undefined | null;
  emptyText: string;
  trackingSource: string;
  showReasonForFaculty?: string | null;
}

const ProductSection: React.FC<SectionProps & { products: any[] | undefined | null }> = ({
  title,
  icon,
  loading,
  products,
  emptyText,
  trackingSource,
  showReasonForFaculty,
}) => (
  <section>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link to="/products">
          View All <ArrowRight className="ml-1 h-4 w-4" />
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
              recommendationReason={
                showReasonForFaculty ? getRecommendationReason(showReasonForFaculty as any, p.tags) : undefined
              }
              trackingSource={trackingSource}
            />
          ))}
      {!loading && (!products || products.length === 0) && (
        <p className="col-span-full text-muted-foreground text-center py-8">{emptyText}</p>
      )}
    </div>
  </section>
);

const Index = () => {
  const { user, profile } = useAuth();

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
      <section className="border-b bg-gradient-to-br from-primary/5 to-primary/10 py-16 md:py-24">
        <div className="container text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Find the Perfect Tech for Your Studies
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get personalized electronics recommendations based on your faculty, budget, and how you use your devices.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/products">Browse Products</Link>
            </Button>
            {!user ? (
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">Sign Up for Recommendations</Link>
              </Button>
            ) : (
              (!hasFaculty || !hasBudget) && (
                <Button asChild variant="outline" size="lg">
                  <Link to="/profile">Complete Your Profile</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </section>

      <div className="container px-4 sm:px-6 py-10 sm:py-12 space-y-12 sm:space-y-16">
        {user && (
          <ProductSection
            title=" Smart Picks For You"
            icon={<Sparkles className="h-5 w-5 text-primary" />}
            loading={persLoading}
            products={personalized}
            emptyText="No recommendations yet — complete your profile or browse products."
            trackingSource="personalized"
            showReasonForFaculty={profile?.faculty ?? null}
          />
        )}

        {user && hasFaculty && (
          <ProductSection
            title={`Top Picks for ${getFacultyLabel(profile?.faculty)}`}
            icon={<GraduationCap className="h-5 w-5 text-primary" />}
            loading={facLoading}
            products={facultyPicks}
            emptyText="No faculty matches yet."
            trackingSource="faculty_top_picks"
            showReasonForFaculty={profile?.faculty}
          />
        )}

        {user && hasBudget && (
          <ProductSection
            title={`Best for Your Budget — ${budgetRanges[profile!.budget_range!].label}`}
            icon={<Wallet className="h-5 w-5 text-primary" />}
            loading={budgetLoading}
            products={budgetPicks}
            emptyText="No products in this budget yet."
            trackingSource="budget"
          />
        )}

        <ProductSection
          title="Trending Products"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          loading={trendLoading}
          products={trending}
          emptyText="No trending products yet."
          trackingSource="trending"
        />

        <ProductSection
          title="Most Popular"
          icon={<Sparkles className="h-5 w-5 text-primary" />}
          loading={popLoading}
          products={popular}
          emptyText="No products yet."
          trackingSource="popular"
        />

        {user && recentlyViewed && recentlyViewed.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
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

import React, { useState, useMemo } from 'react';
import { UserLayout } from '@/components/layout/UserLayout';
import { ProductCard } from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Products = () => {
  const { data: products, isLoading } = useProducts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map((p) => p.category))];
  }, [products]);

  const maxPrice = useMemo(() => {
    if (!products || products.length === 0) return 100000;
    return Math.max(...products.map(p => p.price));
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || p.category === category;
      const matchRating = (p.rating ?? 0) >= minRating;
      const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchSearch && matchCat && matchRating && matchPrice;
    });

    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return result;
  }, [products, search, category, sortBy, minRating, priceRange]);

  return (
    <UserLayout>
      <div className="container px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-6">All Products</h1>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rating</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="sm:w-auto">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid sm:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label>Price Range: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} EGP</Label>
                <Slider
                  min={0}
                  max={maxPrice}
                  step={100}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Rating: {minRating} stars</Label>
                <Slider
                  min={0}
                  max={5}
                  step={0.5}
                  value={[minRating]}
                  onValueChange={(v) => setMinRating(v[0])}
                />
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4">{filtered.length} products found</p>

        {isLoading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-2xl border border-border/60 p-3">
                <Skeleton className="aspect-[4/3] sm:aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 space-y-2">
                <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold">No products found</p>
                <p className="text-muted-foreground text-sm">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default Products;

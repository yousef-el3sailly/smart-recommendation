import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { UserLayout } from '@/components/layout/UserLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

const Favorites = () => {
  const { user, loading } = useAuth();
  const { data: favorites, isLoading } = useFavorites();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  return (
    <UserLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : !favorites || favorites.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">No favorites yet</h2>
            <p className="text-muted-foreground">Save products you love to your wishlist.</p>
            <Button asChild><Link to="/products">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map((fav: any) => fav.products && (
              <ProductCard key={fav.id} product={fav.products} />
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default Favorites;

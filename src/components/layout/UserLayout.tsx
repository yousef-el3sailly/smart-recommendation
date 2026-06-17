import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, User, LogOut, LogIn, LayoutDashboard, ShoppingCart, Heart, Package, Menu, Home } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/products', label: t('nav.products'), icon: ShoppingBag },
    ...(user
      ? [
          { to: '/favorites', label: t('nav.wishlist'), icon: Heart },
          { to: '/orders', label: t('nav.orders'), icon: Package },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 sm:px-6 flex h-16 items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-11 w-11" aria-label={t('nav.openMenu')}>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="flex items-center gap-2 font-bold text-xl mb-6">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  <span>{t('brand')}</span>
                </div>
                <nav className="flex flex-col gap-1">
                  {navLinks.map((l) => (
                    <SheetClose asChild key={l.to}>
                      <Link
                        to={l.to}
                        className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <l.icon className="h-4 w-4" /> {l.label}
                      </Link>
                    </SheetClose>
                  ))}
                  {isAdmin && (
                    <SheetClose asChild>
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" /> {t('nav.admin')}
                      </Link>
                    </SheetClose>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span>{t('brand')}</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm font-medium hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" className="relative h-11 w-11" onClick={() => navigate('/cart')} aria-label={t('nav.cart')}>
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <Badge className="absolute top-1 right-1 h-5 min-w-5 px-1 flex items-center justify-center p-0 text-[10px] font-bold">
                  {totalItems}
                </Badge>
              )}
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11" aria-label={t('nav.account')}>
                    <User className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium truncate max-w-[200px]">{profile?.name || user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" /> {t('nav.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/favorites')}>
                    <Heart className="mr-2 h-4 w-4" /> {t('nav.wishlist')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    <Package className="mr-2 h-4 w-4" /> {t('nav.myOrders')}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> {t('nav.adminDashboard')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
                <LogIn className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.signIn')}</span>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        {t('footer.copyright')}
      </footer>
    </div>
  );
};

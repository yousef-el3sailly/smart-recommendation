import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const change = (lng: 'en' | 'ar') => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('app_lang', lng); } catch { /* ignore */ }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11" aria-label={t('lang.switchTo')}>
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => change('en')} className={i18n.language === 'en' ? 'font-semibold' : ''}>
          {t('lang.english')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => change('ar')} className={i18n.language === 'ar' ? 'font-semibold' : ''}>
          {t('lang.arabic')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

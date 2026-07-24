import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface Props {
  title?: string;
  description?: string;
}

export const SeoHead: React.FC<Props> = ({ title, description }) => {
  const { i18n, t } = useTranslation();
  const { pathname } = useLocation();
  const brand = t('brand');
  const fullTitle = title ? `${title} | ${brand}` : brand;
  const desc = description ?? t('home.heroSubtitle');
  const lang = i18n.language;
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const href = `${base}${pathname}`;

  return (
    <Helmet>
      <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={href} />
      <link rel="alternate" hrefLang="en" href={href} />
      <link rel="alternate" hrefLang="ar" href={href} />
      <link rel="alternate" hrefLang="x-default" href={href} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:locale" content={lang === 'ar' ? 'ar_EG' : 'en_US'} />
    </Helmet>
  );
};

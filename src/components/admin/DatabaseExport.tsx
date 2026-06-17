import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const TABLES = [
  'cart_events',
  'favorites',
  'order_items',
  'orders',
  'product_clicks',
  'products',
  'profiles',
  'recently_viewed',
  'user_roles',
] as const;

type TableName = (typeof TABLES)[number];

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    let s: string;
    if (typeof val === 'object') s = JSON.stringify(val);
    else s = String(val);
    if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape((row as any)[h])).join(','));
  }
  return lines.join('\n');
}

async function fetchTable(table: TableName): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const DatabaseExport: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  if (!isAdmin) return null;

  const verifyAdmin = async (): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (error || !data) {
      toast.error(t('admin.dbExport.errorAuth'));
      return false;
    }
    return true;
  };

  const exportOne = async (table: TableName) => {
    setBusy(table);
    try {
      if (!(await verifyAdmin())) return;
      const rows = await fetchTable(table);
      const csv = toCsv(rows);
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${table}.csv`);
      toast.success(t('admin.dbExport.successTable', { table }));
    } catch (e: any) {
      toast.error(t('admin.dbExport.errorTable', { table }) + (e?.message ? `: ${e.message}` : ''));
    } finally {
      setBusy(null);
    }
  };

  const exportAll = async () => {
    setBusy('__all__');
    try {
      if (!(await verifyAdmin())) return;
      const zip = new JSZip();
      const results = await Promise.allSettled(TABLES.map((tn) => fetchTable(tn)));
      results.forEach((r, i) => {
        const tn = TABLES[i];
        if (r.status === 'fulfilled') {
          zip.file(`${tn}.csv`, toCsv(r.value));
        } else {
          zip.file(`${tn}.error.txt`, String(r.reason?.message ?? r.reason));
        }
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      downloadBlob(blob, `database-export-${ts}.zip`);
      toast.success(t('admin.dbExport.successAll'));
    } catch (e: any) {
      toast.error(e?.message ?? 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4" />
          {t('admin.dbExport.title')}
        </CardTitle>
        <CardDescription>{t('admin.dbExport.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TABLES.map((tn) => {
            const loading = busy === tn;
            return (
              <Button
                key={tn}
                variant="outline"
                onClick={() => exportOne(tn)}
                disabled={busy !== null}
                className="justify-start gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="truncate">{t('admin.dbExport.exportTable', { table: tn })}</span>
              </Button>
            );
          })}
        </div>
        <div className="mt-4">
          <Button
            onClick={exportAll}
            disabled={busy !== null}
            className="w-full gap-2"
          >
            {busy === '__all__' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {busy === '__all__' ? t('admin.dbExport.exporting') : t('admin.dbExport.exportAll')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseExport;

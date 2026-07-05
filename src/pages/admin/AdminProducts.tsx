import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Upload, Image, Search } from 'lucide-react';
import type { Product } from '@/hooks/useProducts';

interface ProductForm {
  name: string;
  category: string;
  price: string;
  rating: string;
  tags: string;
  description: string;
  stock: string;
}

const emptyForm: ProductForm = {
  name: '', category: '', price: '',
  rating: '', tags: '', description: '', stock: '',
};

const AdminProducts = () => {
  const { t } = useTranslation();
  const { data: products, isLoading } = useProducts();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      rating: String(p.rating ?? ''),
      tags: (p.tags ?? []).join(', '),
      description: p.description ?? '',
      stock: p.stock != null ? String(p.stock) : '',
    });
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(p.image_url);
    setDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${uuidv4()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.price) {
      toast({ title: t('admin.productsPage.fillRequired'), variant: 'destructive' });
      return;
    }
    if (!editingId && !imageFile && !existingImageUrl) {
      toast({ title: t('admin.productsPage.uploadRequired'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let image_url = existingImageUrl;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      const payload = {
        name: form.name,
        category: form.category,
        price: parseFloat(form.price),
        image_url,
        rating: form.rating ? parseFloat(form.rating) : null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        description: form.description,
        stock: form.stock ? parseInt(form.stock) : null,
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
        toast({ title: t('admin.productsPage.updated') });
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast({ title: t('admin.productsPage.created') });
      }
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['admin-product-count'] });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: t('admin.common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: t('admin.productsPage.deleteError'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('admin.productsPage.deleted') });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['admin-product-count'] });
    }
  };

  const updateField = (field: keyof ProductForm, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold">{t('admin.productsPage.title')}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="me-2 h-4 w-4" />{t('admin.productsPage.add')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? t('admin.productsPage.edit') : t('admin.productsPage.add')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('admin.productsPage.name')} *</Label>
                <Input value={form.name} onChange={e => updateField('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.productsPage.category')} *</Label>
                <Input value={form.category} onChange={e => updateField('category', e.target.value)} placeholder={t('admin.productsPage.categoryPlaceholder')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.productsPage.price')} *</Label>
                  <Input type="number" min="0" value={form.price} onChange={e => updateField('price', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.productsPage.rating')}</Label>
                  <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => updateField('rating', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.productsPage.stock')}</Label>
                <Input type="number" min="0" value={form.stock} onChange={e => updateField('stock', e.target.value)} placeholder={t('admin.productsPage.stockPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.productsPage.productImage')} {!editingId && '*'}</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview || existingImageUrl ? (
                    <img src={imagePreview || existingImageUrl!} alt="Preview" className="max-h-40 mx-auto rounded" />
                  ) : (
                    <div className="space-y-2 py-4">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t('admin.productsPage.uploadImage')}</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.productsPage.tags')}</Label>
                <Input value={form.tags} onChange={e => updateField('tags', e.target.value)} placeholder={t('admin.productsPage.tagsPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.productsPage.description')}</Label>
                <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3} />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? t('admin.productsPage.saving') : editingId ? t('admin.productsPage.update') : t('admin.productsPage.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('admin.productsPage.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-10"
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.productsPage.image')}</TableHead>
              <TableHead>{t('admin.productsPage.name')}</TableHead>
              <TableHead>{t('admin.productsPage.category')}</TableHead>
              <TableHead>{t('admin.productsPage.price')}</TableHead>
              <TableHead>{t('admin.productsPage.stock')}</TableHead>
              <TableHead>{t('admin.productsPage.rating')}</TableHead>
              <TableHead className="w-24">{t('admin.productsPage.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">{t('admin.productsPage.loading')}</TableCell></TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {products && products.length > 0 ? t('admin.productsPage.noMatch') : t('admin.productsPage.noProducts')}
              </TableCell></TableRow>
            ) : (
              filteredProducts.map(p => (
                <TableRow key={p.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Image className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{p.price.toLocaleString()} EGP</TableCell>
                  <TableCell>{p.stock != null ? p.stock : '∞'}</TableCell>
                  <TableCell>{p.rating ?? '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('admin.productsPage.deleteTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('admin.productsPage.deleteDesc', { name: p.name })}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(p.id)}>{t('admin.common.delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;

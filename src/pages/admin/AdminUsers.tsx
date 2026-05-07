import React, { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Enums } from '@/integrations/supabase/types';

type AppRole = Enums<'app_role'>;

const AdminUsers = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data;
    },
  });

  const getRoleForUser = (userId: string): AppRole => {
    return roles?.find(r => r.user_id === userId)?.role ?? 'user';
  };

  const updateRole = async (userId: string, newRole: AppRole) => {
    const existing = roles?.find(r => r.user_id === userId);
    if (existing) {
      const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
    }
    toast({ title: 'Role updated' });
    qc.invalidateQueries({ queryKey: ['admin-user-roles'] });
  };

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        (p.name ?? '').toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q) ||
        (p.faculty ?? '').toLowerCase().includes(q)
    );
  }, [profiles, search]);

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or faculty…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredProfiles.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                {profiles && profiles.length > 0 ? 'No users match your search' : 'No users yet'}
              </TableCell></TableRow>
            ) : (
              filteredProfiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name || '—'}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.faculty ?? 'Other'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select value={getRoleForUser(p.user_id)} onValueChange={(v) => updateRole(p.user_id, v as AppRole)}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

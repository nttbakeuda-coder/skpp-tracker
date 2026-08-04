-- ============================================================
--  Dokumen SKPP Final (hasil scan)
--  Staf mengunggah PDF SKPP yang sudah ditandatangani (modul dasbor),
--  pemohon mengunduhnya di portal (Pengajuan Saya).
--  Prasyarat: fungsi public.is_staff() & public.is_admin() sudah ada
--  (dibuat pada draft-fase0/fase1). Jalankan SELURUH file ini di
--  Supabase -> SQL Editor.
-- ============================================================

-- 1) Kolom path file SKPP terscan pada tabel Pengajuan
alter table public."Pengajuan"
  add column if not exists "skppFinalPath" text;

-- 2) Bucket privat khusus hasil scan SKPP
insert into storage.buckets (id, name, public)
values ('skpp-final', 'skpp-final', false)
on conflict (id) do nothing;

-- 3) RLS storage untuk bucket 'skpp-final'
--    - Tulis (insert/update): hanya STAF (admin/operator/staf).
--    - Baca (select): staf, atau PEMILIK pengajuan (submittedBy = auth.uid()).
--    - Hapus: hanya admin.
drop policy if exists "skppfinal_obj_insert" on storage.objects;
create policy "skppfinal_obj_insert" on storage.objects
  for insert to authenticated
  with check ( bucket_id = 'skpp-final' and public.is_staff() );

drop policy if exists "skppfinal_obj_update" on storage.objects;
create policy "skppfinal_obj_update" on storage.objects
  for update to authenticated
  using      ( bucket_id = 'skpp-final' and public.is_staff() )
  with check ( bucket_id = 'skpp-final' and public.is_staff() );

drop policy if exists "skppfinal_obj_delete" on storage.objects;
create policy "skppfinal_obj_delete" on storage.objects
  for delete to authenticated
  using ( bucket_id = 'skpp-final' and public.is_admin() );

drop policy if exists "skppfinal_obj_select" on storage.objects;
create policy "skppfinal_obj_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'skpp-final'
    and (
      public.is_staff()
      or exists (
        select 1 from public."Pengajuan" p
        where p."skppFinalPath" = name
          and p."submittedBy" = auth.uid()
      )
    )
  );

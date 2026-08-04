-- ================================================================================
--  KATONG SKPP — PROVISIONING PORTAL ONLINE KE PRODUKSI (phxyrferpnylgbbghgsn)
--  Berkas ini menggabungkan (verbatim) migrasi DELTA yang ada di STAGING namun
--  BELUM ada di PRODUKSI, dalam urutan dependensi yang benar. SEMUA idempoten
--  (create or replace / if not exists / drop policy if exists) -> aman diulang.
--
--  PRASYARAT (harus SUDAH ada di produksi dari sistem dasbor lama):
--    tabel: "Pengajuan", "Riwayat", "Counter", profiles, "Akun"
--    fungsi: public.is_admin()
--  Cek dulu (jalankan blok VERIFIKASI PRASYARAT di PRODUCTION_GOLIVE.md).
--
--  JANGAN memuat baris data spesifik-staging dari supabase_fix_nip.sql
--  (UPDATE ... where id='SKPP-2026-0031'). Hanya perubahan tipe kolom nip yang
--  disertakan di bagian akhir berkas ini.
--
--  Cara pakai: Supabase (project PRODUKSI) -> SQL Editor -> tempel SELURUH isi
--  berkas ini -> Run. Lihat PRODUCTION_GOLIVE.md untuk langkah non-SQL
--  (storage, auth, Edge Function push, webhook, env Vercel, verifikasi).
-- ================================================================================


-- ############################################################
-- ## 1/9  draft-fase0/up.sql  (is_staff, submittedBy/sumber, RLS per-pemilik)
-- ############################################################

-- ============================================================
--  DRAFT — FASE 0: Fondasi RLS per-pemilik
--  (prasyarat sebelum portal pengajuan publik / login eksternal aktif)
--
--  SIFAT: ADITIF & AMAN untuk kondisi SEKARANG (hanya staf yang login).
--   - is_staff() bernilai TRUE untuk semua akun saat ini (admin/operator/
--     staf) -> perilaku dashboard TIDAK berubah.
--   - Saat nanti ada akun eksternal (pemohon/bendahara), mereka OTOMATIS
--     terkunci hanya ke baris miliknya (submittedBy = dirinya).
--
--  BELUM termasuk: insert/update oleh eksternal, persetujuan akun, upload
--  berkas, status 'diajukan' aktif -> itu Fase 1.
--
--  ROLLBACK: jalankan down.sql (kembali persis ke kondisi 13_rls_hardening).
--  JANGAN dijalankan di produksi sampai desain disepakati.
-- ============================================================

-- 0) Helper: apakah pemanggil = staf internal?
--    SECURITY DEFINER -> menembus RLS (hindari rekursi saat dipakai di
--    policy tabel profiles), sama pola dengan is_admin().
create or replace function public.is_staff()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','operator','staf')
  );
$$;
revoke all     on function public.is_staff() from public;
grant  execute on function public.is_staff() to authenticated;

-- 1) Kolom kepemilikan & sumber pada Pengajuan (aditif; nullable/default,
--    sehingga app versi sekarang mengabaikannya).
alter table public."Pengajuan"
  add column if not exists "submittedBy" uuid references auth.users(id) on delete set null,
  add column if not exists sumber text not null default 'loket';   -- 'loket' | 'online'
-- Catatan: status pra-loket 'diajukan' baru dipakai di Fase 1; kolom status
-- yang ada tetap ('proses'|'kembali'|'selesai') hingga portal diaktifkan.
create index if not exists "Pengajuan_submittedBy_idx" on public."Pengajuan" ("submittedBy");

-- 2) PENGAJUAN — SELECT/UPDATE jadi (staf ATAU pemilik). INSERT tetap
--    staf-only di Fase 0 (insert eksternal ditambah di Fase 1). DELETE admin.
drop policy if exists "pengajuan_select"       on public."Pengajuan";
drop policy if exists "pengajuan_insert"       on public."Pengajuan";
drop policy if exists "pengajuan_update"       on public."Pengajuan";
drop policy if exists "pengajuan_delete_admin" on public."Pengajuan";

create policy "pengajuan_select" on public."Pengajuan"
  for select to authenticated
  using ( public.is_staff() or "submittedBy" = auth.uid() );

create policy "pengajuan_insert" on public."Pengajuan"
  for insert to authenticated
  with check ( public.is_staff() );

create policy "pengajuan_update" on public."Pengajuan"
  for update to authenticated
  using ( public.is_staff() )
  with check ( public.is_staff() );

create policy "pengajuan_delete_admin" on public."Pengajuan"
  for delete to authenticated
  using ( public.is_admin() );

-- 3) RIWAYAT — staf lihat semua; pemohon hanya riwayat pengajuan miliknya.
--    INSERT staf-only; tanpa UPDATE (audit tahan-ubah); DELETE admin.
drop policy if exists "riwayat_select"       on public."Riwayat";
drop policy if exists "riwayat_insert"       on public."Riwayat";
drop policy if exists "riwayat_delete_admin" on public."Riwayat";

create policy "riwayat_select" on public."Riwayat"
  for select to authenticated
  using (
    public.is_staff()
    or "pengajuanId" in (select id from public."Pengajuan" where "submittedBy" = auth.uid())
  );

create policy "riwayat_insert" on public."Riwayat"
  for insert to authenticated
  with check ( public.is_staff() );

create policy "riwayat_delete_admin" on public."Riwayat"
  for delete to authenticated
  using ( public.is_admin() );

-- 4) PROFILES — direktori dibatasi: staf baca semua (dibutuhkan dropdown
--    verifikasi), pemohon hanya baca profilnya sendiri.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using ( public.is_staff() or id = auth.uid() );

-- ── VERIFIKASI ──
-- a) Staf (login skrg) HARUS tetap melihat semua pengajuan:
--    select count(*) from public."Pengajuan";
-- b) Cek policy terpasang:
--    select tablename, policyname, cmd, qual from pg_policies
--    where schemaname='public' and tablename in ('Pengajuan','Riwayat','profiles')
--    order by tablename, cmd;


-- ############################################################
-- ## 2/9  draft-fase1/up.sql  (akun eksternal, BerkasPengajuan, bucket, RPC ajukan/tolak)
-- ############################################################

-- ============================================================
--  DRAFT — FASE 1: Portal Pengajuan SKPP Online (DB layer)
--  Prasyarat: draft-fase0/up.sql sudah aktif (submittedBy, sumber, is_staff()).
--  ⚠️ UJI DI SUPABASE STAGING DULU. Jangan langsung ke produksi.
--  Rollback: draft-fase1/down.sql
-- ============================================================

create extension if not exists pgcrypto;   -- gen_random_bytes

-- 1) PROFILES: peran & status akun eksternal ----------------------------------
alter table public.profiles
  add column if not exists akun_status text not null default 'approved',  -- pending|approved|rejected
  add column if not exists email text;

-- relaksasi CHECK role (tambah pemohon & bendahara)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('staf','operator','admin','pemohon','bendahara'));

-- 2) Trigger: buat profil saat pemohon/bendahara mendaftar mandiri ------------
--    Hanya untuk role eksternal; akun staf (dibuat Edge Function) diabaikan.
create or replace function public.handle_new_external_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role','');
begin
  if r in ('pemohon','bendahara') then
    insert into public.profiles (id, username, nama, role, email, opd, akun_status)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data->>'username',''), new.email),
      coalesce(new.raw_user_meta_data->>'nama',''),
      r,
      new.email,
      nullif(new.raw_user_meta_data->>'opd',''),
      'pending'
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_handle_new_external_user on auth.users;
create trigger trg_handle_new_external_user
  after insert on auth.users
  for each row execute function public.handle_new_external_user();

-- 3) Helper: pemohon/bendahara yang SUDAH disetujui admin ---------------------
create or replace function public.is_approved_pemohon()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('pemohon','bendahara') and akun_status = 'approved'
  );
$$;
revoke all on function public.is_approved_pemohon() from public;
grant execute on function public.is_approved_pemohon() to authenticated;

-- 4) Helper: kode akses 8 char CSPRNG (alfabet tanpa 0 O 1 I L) ---------------
-- search_path menyertakan "extensions" karena Supabase memasang pgcrypto di
-- skema itu (bukan public) secara default.
create or replace function public.gen_kode_akses(n int default 8)
returns text language plpgsql set search_path = public, extensions as $$
declare alf text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; out text := ''; i int; b bytea;
begin
  b := gen_random_bytes(n);
  for i in 1..n loop
    out := out || substr(alf, (get_byte(b, i-1) % length(alf)) + 1, 1);
  end loop;
  return out;
end;
$$;

-- 5) Perluas proteksi kolom immutable Pengajuan utk non-staf -----------------
create or replace function public.protect_pengajuan_immutable()
returns trigger language plpgsql as $$
begin
  if current_user = 'service_role'
     or coalesce(current_setting('request.jwt.claim.role', true),'') = 'service_role'
     or public.is_staff() then
    return new;
  end if;
  if new.id           is distinct from old.id           then raise exception 'id tak boleh diubah'; end if;
  if new."kodeAkses"  is distinct from old."kodeAkses"  then raise exception 'kodeAkses tak boleh diubah'; end if;
  if new."submittedBy" is distinct from old."submittedBy" then raise exception 'submittedBy tak boleh diubah'; end if;
  if new.sumber       is distinct from old.sumber       then raise exception 'sumber tak boleh diubah'; end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_pengajuan_immutable on public."Pengajuan";
create trigger trg_protect_pengajuan_immutable
  before update on public."Pengajuan"
  for each row execute function public.protect_pengajuan_immutable();

-- 6) PENGAJUAN — buka insert/update/delete terbatas utk pemohon --------------
drop policy if exists "pengajuan_insert"       on public."Pengajuan";
drop policy if exists "pengajuan_update"       on public."Pengajuan";
drop policy if exists "pengajuan_delete_admin" on public."Pengajuan";

create policy "pengajuan_insert" on public."Pengajuan"
  for insert to authenticated
  with check (
    public.is_staff()
    or ( public.is_approved_pemohon()
         and "submittedBy" = auth.uid()
         and sumber = 'online'
         and status = 'diajukan' )
  );

create policy "pengajuan_update" on public."Pengajuan"
  for update to authenticated
  using ( public.is_staff() or ("submittedBy" = auth.uid() and status = 'diajukan') )
  with check ( public.is_staff() or ("submittedBy" = auth.uid() and status = 'diajukan') );

create policy "pengajuan_delete" on public."Pengajuan"
  for delete to authenticated
  using ( public.is_admin() or ("submittedBy" = auth.uid() and status = 'diajukan') );
-- (SELECT tetap dari Fase 0: is_staff() OR submittedBy = auth.uid())

-- 7) Tabel metadata berkas + RLS ---------------------------------------------
create table if not exists public."BerkasPengajuan" (
  id           uuid primary key default gen_random_uuid(),
  "pengajuanId" text references public."Pengajuan"(id) on delete cascade,
  jenis        text,
  path         text not null,
  "uploadedBy" uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists "BerkasPengajuan_peng_idx" on public."BerkasPengajuan" ("pengajuanId");
alter table public."BerkasPengajuan" enable row level security;

drop policy if exists "berkas_select" on public."BerkasPengajuan";
create policy "berkas_select" on public."BerkasPengajuan"
  for select to authenticated
  using (
    public.is_staff()
    or "pengajuanId" in (select id from public."Pengajuan" where "submittedBy" = auth.uid())
  );

drop policy if exists "berkas_insert" on public."BerkasPengajuan";
create policy "berkas_insert" on public."BerkasPengajuan"
  for insert to authenticated
  with check (
    public.is_staff()
    or ( public.is_approved_pemohon()
         and "uploadedBy" = auth.uid()
         -- 'diajukan' = sebelum diverifikasi loket; 'kembali' = berkas/bukti
         -- tambahan diminta staf saat proses (mis. bukti pelunasan hutang).
         and "pengajuanId" in (select id from public."Pengajuan"
                               where "submittedBy" = auth.uid() and status in ('diajukan','kembali')) )
  );

drop policy if exists "berkas_delete" on public."BerkasPengajuan";
create policy "berkas_delete" on public."BerkasPengajuan"
  for delete to authenticated
  using (
    public.is_admin()
    or ( "uploadedBy" = auth.uid()
         and "pengajuanId" in (select id from public."Pengajuan"
                               where "submittedBy" = auth.uid() and status = 'diajukan') )
  );
-- Catatan: "Tolak Bukti Hutang" oleh Staf Pengampu OPD (non-admin) TIDAK lewat
-- policy ini -- pakai RPC public.tolak_bukti_hutang (SECURITY DEFINER) di bawah,
-- yang mengecek sendiri role pemanggil, supaya staf tidak diberi hak hapus umum.

-- 8) Storage: bucket privat + policy per-pemilik -----------------------------
insert into storage.buckets (id, name, public)
values ('berkas-pengajuan','berkas-pengajuan', false)
on conflict (id) do nothing;

drop policy if exists "berkas_obj_insert" on storage.objects;
create policy "berkas_obj_insert" on storage.objects
  for insert to authenticated
  with check ( bucket_id = 'berkas-pengajuan'
               and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "berkas_obj_select" on storage.objects;
create policy "berkas_obj_select" on storage.objects
  for select to authenticated
  using ( bucket_id = 'berkas-pengajuan'
          and ( public.is_staff() or (storage.foldername(name))[1] = auth.uid()::text ) );

drop policy if exists "berkas_obj_delete" on storage.objects;
create policy "berkas_obj_delete" on storage.objects
  for delete to authenticated
  using ( bucket_id = 'berkas-pengajuan'
          and ( public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text ) );
-- Catatan: batas tipe/ukuran file diatur di setelan bucket (Dashboard Storage).

-- 9) RPC pengajuan online (server yang atur id/kodeAkses/status) --------------
create or replace function public.ajukan_pengajuan_online(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid     uuid := auth.uid();
  -- Variabel TIDAK boleh sama nama dengan kolom tabel yang disentuh di sini
  -- (mis. "tahun") -- PL/pgSQL akan gagal dgn "column reference is ambiguous"
  -- khususnya pada klausa INSERT ... ON CONFLICT (kolom).
  v_tahun int  := extract(year from now());
  v_nilai int;
  new_id  text;
  kode    text;
begin
  if not public.is_approved_pemohon() then
    raise exception 'Akun belum disetujui admin / bukan pemohon.';
  end if;

  insert into public."Counter"(tahun, nilai) values (v_tahun, 1)
    on conflict (tahun) do update set nilai = public."Counter".nilai + 1
    returning nilai into v_nilai;

  new_id := 'SKPP-' || v_tahun || '-' || lpad(v_nilai::text, 4, '0');
  kode   := public.gen_kode_akses(8);

  insert into public."Pengajuan"
    (id, nama, nip, opd, jabatan, pangkat, alasan, jalur, kasubid,
     "kodeAkses", "submittedBy", sumber, status, "tanggalMasuk")
  values
    (new_id, p->>'nama', p->>'nip', p->>'opd', p->>'jabatan', p->>'pangkat',
     coalesce(p->>'alasan','Pensiun'),
     null,                                    -- jalur A/B DITENTUKAN LOKET saat verifikasi
     p->>'kasubid',
     kode, uid, 'online', 'diajukan', to_char(now(),'DD Mon YYYY'));

  return jsonb_build_object('id', new_id, 'kodeAkses', kode);
end;
$$;
grant execute on function public.ajukan_pengajuan_online(jsonb) to authenticated;

-- 10) RPC tolak bukti pelunasan hutang (dashboard internal) -----------------
-- Dipakai Staf Pengampu OPD (role 'staf') atau Admin saat bukti yang diunggah
-- pemohon (mis. bukti setoran RKUD) keliru/tidak sah: menghapus METADATA-nya
-- (jadi kembali "belum diunggah" di portal, pemohon diminta unggah ulang) &
-- mencatat alasan penolakan ke Riwayat. SECURITY DEFINER agar staf non-admin
-- TIDAK perlu diberi hak DELETE umum lewat RLS -- otorisasi diperiksa di
-- dalam fungsi ini saja, khusus utk aksi ini.
-- Catatan: file di Storage TIDAK ikut dihapus -- Supabase melarang DELETE
-- langsung ke storage.objects lewat SQL ("Use the Storage API instead").
-- Dibiarkan tersimpan (bucket privat, sudah tak tertaut ke BerkasPengajuan
-- manapun jadi tak lagi terlihat/dipakai) -- lebih aman drpd memberi hak
-- hapus Storage API ke staf non-admin hanya utk pembersihan.
create or replace function public.tolak_bukti_hutang(
  p_pengajuan_id text, p_berkas_id uuid, p_label text, p_alasan text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_role       text;
  v_path       text;
  v_tahap      text;
  v_oleh       text;
  v_oleh_nama  text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role not in ('staf','admin') then
    raise exception 'Hanya Staf Pengampu OPD atau Admin yang dapat menolak bukti.';
  end if;
  if coalesce(trim(p_alasan), '') = '' then
    raise exception 'Alasan penolakan wajib diisi.';
  end if;

  select path into v_path from public."BerkasPengajuan"
    where id = p_berkas_id and "pengajuanId" = p_pengajuan_id;
  if v_path is null then
    raise exception 'Berkas tidak ditemukan.';
  end if;

  delete from public."BerkasPengajuan" where id = p_berkas_id;

  select "tahapAktif" into v_tahap from public."Pengajuan" where id = p_pengajuan_id;
  select username, nama into v_oleh, v_oleh_nama from public.profiles where id = auth.uid();

  insert into public."Riwayat" ("pengajuanId", tahap, waktu, catatan, "isKembali", oleh, "olehNama")
  values (
    p_pengajuan_id, v_tahap, to_char(now(), 'DD/MM/YYYY, HH24.MI.SS'),
    format('Bukti "%s" ditolak: %s. Pemohon perlu mengunggah ulang.', p_label, p_alasan),
    false, coalesce(v_oleh, ''), coalesce(v_oleh_nama, '')
  );

  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.tolak_bukti_hutang(text, uuid, text, text) from public;
grant execute on function public.tolak_bukti_hutang(text, uuid, text, text) to authenticated;

-- ── VERIFIKASI (staging) ──
-- 1) daftar akun pending:  select username,nama,role,akun_status from profiles where akun_status='pending';
-- 2) approve manual:       update profiles set akun_status='approved' where id='<uid>';
-- 3) uji RPC sbg pemohon approved: select public.ajukan_pengajuan_online('{"nama":"Uji","nip":"1","jalur":"A","kasubid":"X"}'::jsonb);


-- ############################################################
-- ## 3/9  12_serah_terima.sql  (kolom serah terima + bucket bukti-serah-terima)
-- ############################################################

-- ============================================================
--  FITUR — Serah Terima SKPP ke Pemohon (bukti + tanda tangan + foto)
--
--  Mencatat KAPAN SKPP diserahkan, SIAPA penerimanya, beserta bukti:
--  tanda tangan digital (PNG) dan/atau foto/scan tanda terima.
--  File bukti disimpan di Supabase Storage (bucket privat), tabel hanya
--  menyimpan PATH-nya.
--
--  Jalankan di Supabase -> SQL Editor SEBELUM deploy frontend baru.
-- ============================================================

-- 1) Kolom data serah terima pada Pengajuan
alter table public."Pengajuan"
  add column if not exists "tanggalSerahTerima" text,
  add column if not exists "penerimaNama" text,
  add column if not exists "penerimaNIP" text,
  add column if not exists "penerimaStatus" text,
  add column if not exists "ttdSerahPath" text,
  add column if not exists "buktiSerahPath" text;

-- 2) Bucket privat untuk berkas bukti
insert into storage.buckets (id, name, public)
values ('bukti-serah-terima', 'bukti-serah-terima', false)
on conflict (id) do nothing;

-- 3) Akses Storage: HANYA user login (authenticated) yang boleh unggah & baca.
--    anon (portal publik) TIDAK diberi policy -> tidak bisa mengakses bukti.
drop policy if exists "serah_upload" on storage.objects;
drop policy if exists "serah_read"   on storage.objects;
drop policy if exists "serah_update" on storage.objects;

create policy "serah_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bukti-serah-terima');

create policy "serah_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'bukti-serah-terima');

create policy "serah_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'bukti-serah-terima')
  with check (bucket_id = 'bukti-serah-terima');


-- ############################################################
-- ## 4/9  supabase_survei.sql  (SurveiSKM + kirim_survei/rekap)  [SEBELUM lacak]
-- ############################################################

-- ============================================================
--  SURVEI KEPUASAN MASYARAKAT (SKM) — SI-PASTI
--  Kerangka Permenpan-RB No. 14 Tahun 2017: 9 unsur, skala 1–4.
--  Menghasilkan Indeks Kepuasan Masyarakat (IKM).
--
--  Alur: pemohon mengisi survei SETELAH SKPP "selesai", baik lewat akun
--  (Pengajuan Saya) maupun tanpa login (nomor pengajuan/NIP + kode akses).
--  Satu survei per pengajuan. Anonim (tanpa identitas pribadi).
--
--  Jalankan SELURUH isi file ini di Supabase -> SQL Editor.
--  Setelah itu jalankan ulang supabase_lacak.sql (sudah ditambah 'sudahSurvei').
-- ============================================================

-- ── Tabel ───────────────────────────────────────────────────
create table if not exists public."SurveiSKM" (
  id            bigint generated always as identity primary key,
  "pengajuanId" text not null unique
                references public."Pengajuan"(id) on delete cascade,
  u1 smallint not null check (u1 between 1 and 4),  -- Persyaratan
  u2 smallint not null check (u2 between 1 and 4),  -- Sistem, mekanisme & prosedur
  u3 smallint not null check (u3 between 1 and 4),  -- Waktu penyelesaian
  u4 smallint not null check (u4 between 1 and 4),  -- Biaya/tarif
  u5 smallint not null check (u5 between 1 and 4),  -- Produk/jenis layanan
  u6 smallint not null check (u6 between 1 and 4),  -- Kompetensi pelaksana
  u7 smallint not null check (u7 between 1 and 4),  -- Perilaku pelaksana
  u8 smallint not null check (u8 between 1 and 4),  -- Sarana & prasarana
  u9 smallint not null check (u9 between 1 and 4),  -- Penanganan pengaduan/saran
  saran          text,
  "respondenTipe" text,                             -- 'pemohon' | 'bendahara' | null
  created_at     timestamptz not null default now()
);

-- RLS aktif; TIDAK ada policy publik -> tabel hanya bisa diakses lewat RPC
-- SECURITY DEFINER di bawah (dan service role dari dashboard admin).
alter table public."SurveiSKM" enable row level security;

-- ── RPC: kirim_survei() ─────────────────────────────────────
--  Dipakai portal publik & Pengajuan Saya. Memvalidasi: pengajuan cocok
--  (nomor/NIP + kode akses), status='selesai', belum pernah disurvei, dan
--  kesembilan unsur bernilai 1..4. Kembalikan { ok, error? }.
create or replace function public.kirim_survei(
  p_id      text,
  p_kode    text,
  p_jawaban jsonb,
  p_saran   text default null,
  p_tipe    text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pid    text;
  v_status text;
  v_u      smallint[];
  i        int;
begin
  select p.id, p.status into v_pid, v_status
  from public."Pengajuan" p
  where (
          upper(trim(p.id)) = upper(trim(p_id))
          or (trim(p_id) ~ '^\d+$' and p.nip::text = trim(p_id))
        )
    and upper(trim(p."kodeAkses")) = upper(trim(p_kode))
  order by p.id desc
  limit 1;

  if v_pid is null then
    return jsonb_build_object('ok', false, 'error', 'Nomor/NIP atau kode akses tidak cocok.');
  end if;
  if v_status is distinct from 'selesai' then
    return jsonb_build_object('ok', false, 'error', 'Survei hanya dapat diisi setelah SKPP selesai.');
  end if;
  if exists (select 1 from public."SurveiSKM" s where s."pengajuanId" = v_pid) then
    return jsonb_build_object('ok', false, 'error', 'Survei untuk pengajuan ini sudah pernah diisi.');
  end if;

  begin
    v_u := array[
      (p_jawaban->>'u1')::smallint, (p_jawaban->>'u2')::smallint, (p_jawaban->>'u3')::smallint,
      (p_jawaban->>'u4')::smallint, (p_jawaban->>'u5')::smallint, (p_jawaban->>'u6')::smallint,
      (p_jawaban->>'u7')::smallint, (p_jawaban->>'u8')::smallint, (p_jawaban->>'u9')::smallint
    ];
  exception when others then
    return jsonb_build_object('ok', false, 'error', 'Jawaban survei tidak lengkap.');
  end;
  for i in 1..9 loop
    if v_u[i] is null or v_u[i] < 1 or v_u[i] > 4 then
      return jsonb_build_object('ok', false, 'error', 'Setiap unsur wajib dinilai (1–4).');
    end if;
  end loop;

  insert into public."SurveiSKM"(
    "pengajuanId", u1,u2,u3,u4,u5,u6,u7,u8,u9, saran, "respondenTipe"
  ) values (
    v_pid, v_u[1],v_u[2],v_u[3],v_u[4],v_u[5],v_u[6],v_u[7],v_u[8],v_u[9],
    nullif(btrim(coalesce(p_saran,'')), ''),
    nullif(btrim(coalesce(p_tipe,'')),  '')
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke all     on function public.kirim_survei(text,text,jsonb,text,text) from public;
grant  execute on function public.kirim_survei(text,text,jsonb,text,text) to anon, authenticated;

-- ── RPC: survei_ids_saya() ──────────────────────────────────
--  Untuk "wajib" di Pengajuan Saya: kembalikan daftar id pengajuan MILIK
--  pemanggil (auth.uid()) yang SUDAH disurvei. Frontend membandingkannya
--  dgn pengajuan berstatus 'selesai' untuk tahu mana yang wajib diisi.
create or replace function public.survei_ids_saya()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(s."pengajuanId"), '[]'::jsonb)
  from public."SurveiSKM" s
  join public."Pengajuan" p on p.id = s."pengajuanId"
  where p."submittedBy" = auth.uid();
$$;

revoke all     on function public.survei_ids_saya() from public;
grant  execute on function public.survei_ids_saya() to authenticated;

-- ── RPC: rekap_survei_skm(dari, sampai) ─────────────────────
--  Untuk dashboard admin. Kembalikan agregat SKM pada rentang tanggal:
--  jumlah responden, rata-rata (NRR) tiap unsur, nilai IKM (skala 0–100),
--  mutu (A/B/C/D), dan daftar saran. Hanya untuk 'authenticated' (staf yang
--  login di dashboard). IKM = rata-rata NRR 9 unsur × 25 (Permenpan 14/2017,
--  bobot setara). Panggil dgn p_dari/p_sampai null utk seluruh periode.
create or replace function public.rekap_survei_skm(
  p_dari date default null,
  p_sampai date default null
) returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  with f as (
    select * from public."SurveiSKM" s
    where (p_dari   is null or s.created_at >= p_dari)
      and (p_sampai is null or s.created_at <  (p_sampai + 1))
  ),
  nrr as (
    select
      avg(u1)::numeric(4,3) n1, avg(u2)::numeric(4,3) n2, avg(u3)::numeric(4,3) n3,
      avg(u4)::numeric(4,3) n4, avg(u5)::numeric(4,3) n5, avg(u6)::numeric(4,3) n6,
      avg(u7)::numeric(4,3) n7, avg(u8)::numeric(4,3) n8, avg(u9)::numeric(4,3) n9,
      count(*) c
    from f
  ),
  ikm as (
    select case when c = 0 then null
      else round(((n1+n2+n3+n4+n5+n6+n7+n8+n9)/9.0) * 25, 2) end as nilai, c
    from nrr
  )
  select jsonb_build_object(
    'responden', (select c from nrr),
    'nrr', case when (select c from nrr) = 0 then null else
      jsonb_build_object(
        'u1',(select n1 from nrr),'u2',(select n2 from nrr),'u3',(select n3 from nrr),
        'u4',(select n4 from nrr),'u5',(select n5 from nrr),'u6',(select n6 from nrr),
        'u7',(select n7 from nrr),'u8',(select n8 from nrr),'u9',(select n9 from nrr)
      ) end,
    'ikm', (select nilai from ikm),
    'mutu', case
      when (select nilai from ikm) is null then null
      when (select nilai from ikm) >= 88.31 then 'A'
      when (select nilai from ikm) >= 76.61 then 'B'
      when (select nilai from ikm) >= 65.00 then 'C'
      else 'D' end,
    'saran', coalesce((
      select jsonb_agg(jsonb_build_object(
               'saran', s.saran, 'tipe', s."respondenTipe", 'waktu', s.created_at
             ) order by s.created_at desc)
      from f s where s.saran is not null and btrim(s.saran) <> ''
    ), '[]'::jsonb)
  );
$$;

revoke all     on function public.rekap_survei_skm(date, date) from public;
grant  execute on function public.rekap_survei_skm(date, date) to authenticated;


-- ############################################################
-- ## 5/9  supabase_lacak.sql  (RPC lacak diperbarui: sudahSurvei, sumber)
-- ############################################################

-- ============================================================
--  RPC: lacak(p_id, p_kode)
--  Dipakai oleh modul pelacakan publik (sipasti.my.id / index.html).
--  p_id boleh berupa NOMOR PENGAJUAN atau NIP. Mengembalikan satu objek
--  pengajuan HANYA jika (nomor ATAU nip) DAN kode akses cocok; jika tidak
--  cocok -> NULL. Bila satu NIP punya beberapa pengajuan dgn kode yang sama,
--  diambil yang terbaru.
--
--  SECURITY DEFINER: fungsi tetap bisa membaca tabel walau RLS aktif,
--  sehingga tabel mentah tidak perlu diekspos ke anon.
--  Jalankan seluruh isi file ini di Supabase -> SQL Editor.
-- ============================================================

create or replace function public.lacak(p_id text, p_kode text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',              p.id,
    'nama',            p.nama,
    'nip',             p.nip::text,
    'opd',             p.opd,
    'jabatan',         p.jabatan,
    'pangkat',         p.pangkat,
    'alasan',          p.alasan,
    'jalur',           p.jalur,
    'status',          p.status,
    'tahapSelesai',    p."tahapSelesai",
    'tahapAktif',      p."tahapAktif",
    'catatan',         p.catatan,
    'tanggalMasuk',    p."tanggalMasuk",
    'estimasiSelesai', p."estimasiSelesai",
    'tanggalSelesai',  p."tanggalSelesai",
    'nomorSKPP',       p."nomorSKPP",
    'tanggalSerahTerima', p."tanggalSerahTerima",
    'penerimaNama',    p."penerimaNama",
    'penerimaStatus',  p."penerimaStatus",
    'sumber',          p.sumber,
    'sudahSurvei',     exists(select 1 from public."SurveiSKM" s where s."pengajuanId" = p.id),
    'riwayat', coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object(
                   'tahap',     r.tahap,
                   'waktu',     r.waktu,
                   'catatan',   r.catatan,
                   'isKembali', r."isKembali"
                 )
                 order by r.created_at, r.id
               )
        from public."Riwayat" r
        where r."pengajuanId" = p.id
      ),
      '[]'::jsonb
    )
  )
  from public."Pengajuan" p
  where (
          upper(trim(p.id)) = upper(trim(p_id))
          or (trim(p_id) ~ '^\d+$' and p.nip::text = trim(p_id))
        )
    and upper(trim(p."kodeAkses")) = upper(trim(p_kode))
  order by p.id desc
  limit 1;
$$;

-- Hanya boleh dipanggil sebagai RPC oleh anon/authenticated (bukan diakses
-- siapa pun secara internal yang tak diinginkan).
revoke all     on function public.lacak(text, text) from public;
grant  execute on function public.lacak(text, text) to anon, authenticated;


-- ############################################################
-- ## 6/9  supabase_bulk.sql  (RPC ajukan_pengajuan_online_bulk — bendahara)
-- ############################################################

-- ============================================================
--  RPC: ajukan_pengajuan_online_bulk(p jsonb)
--  Pengajuan BULK oleh Bendahara OPD: banyak pegawai sekaligus dengan SATU
--  kode akses BERSAMA (pembeda hanya NOMOR pengajuan tiap pegawai).
--  Berkas persyaratan diunggah terpisah oleh klien (uploadBerkas) ke tiap
--  pengajuan setelah menerima daftar id dari fungsi ini.
--
--  p      = { "opd": "...", "items": [ {nama,nip,jabatan,pangkat,alasan}, ... ] }
--  return = { "kodeAkses": "XXXXXXXX",
--             "rows": [ {"id":"SKPP-2026-0001","nama":"..."}, ... ] }  (urut = input)
--
--  SECURITY DEFINER: seluruh insert berjalan sbg owner (lewati RLS), satu
--  transaksi -> atomik. Hanya pemohon/bendahara yang SUDAH disetujui admin.
--  Jalankan seluruh isi file ini di Supabase -> SQL Editor.
-- ============================================================
create or replace function public.ajukan_pengajuan_online_bulk(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid      uuid := auth.uid();
  v_tahun  int  := extract(year from now());
  v_nilai  int;
  new_id   text;
  kode     text;
  v_opd    text := nullif(p->>'opd','');
  it       jsonb;
  rows     jsonb := '[]'::jsonb;
begin
  if not public.is_approved_pemohon() then
    raise exception 'Akun belum disetujui admin / bukan pemohon.';
  end if;
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then
    raise exception 'Daftar pegawai kosong.';
  end if;

  kode := public.gen_kode_akses(8);   -- SATU kode akses untuk seluruh grup

  for it in select * from jsonb_array_elements(p->'items')
  loop
    -- Nomor urut tahunan (sama seperti ajukan_pengajuan_online, per pegawai).
    insert into public."Counter"(tahun, nilai) values (v_tahun, 1)
      on conflict (tahun) do update set nilai = public."Counter".nilai + 1
      returning nilai into v_nilai;

    new_id := 'SKPP-' || v_tahun || '-' || lpad(v_nilai::text, 4, '0');

    insert into public."Pengajuan"
      (id, nama, nip, opd, jabatan, pangkat, alasan, jalur, kasubid,
       "kodeAkses", "submittedBy", sumber, status, "tanggalMasuk")
    values
      (new_id, it->>'nama', it->>'nip', coalesce(nullif(it->>'opd',''), v_opd),
       it->>'jabatan', it->>'pangkat', coalesce(it->>'alasan','Pensiun'),
       null,                                   -- jalur A/B DITENTUKAN LOKET saat verifikasi
       it->>'kasubid',
       kode, uid, 'online', 'diajukan', to_char(now(),'DD Mon YYYY'));

    rows := rows || jsonb_build_object('id', new_id, 'nama', it->>'nama');
  end loop;

  return jsonb_build_object('kodeAkses', kode, 'rows', rows);
end;
$$;

revoke all     on function public.ajukan_pengajuan_online_bulk(jsonb) from public;
grant  execute on function public.ajukan_pengajuan_online_bulk(jsonb) to authenticated;


-- ############################################################
-- ## 7/9  supabase_skpp_final.sql  (kolom skppFinalPath + bucket skpp-final)
-- ############################################################

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


-- ############################################################
-- ## 8/9  supabase_push.sql  (PushSubscription + RPC langganan)
-- ############################################################

-- ============================================================
--  WEB PUSH NOTIFICATION — DASBOR INTERNAL SI-PASTI
--  Menyimpan langganan (subscription) Web Push milik tiap staf, agar Edge
--  Function "kirim-push" bisa mengirim notifikasi ke taskbar/Action Center
--  komputer staf walau tab dashboard sedang ditutup.
--
--  Jalankan SELURUH isi file ini di Supabase -> SQL Editor.
--  (Langkah deploy Edge Function & Database Webhook ada di PUSH_SETUP.md.)
-- ============================================================

create table if not exists public."PushSubscription" (
  id          bigint generated always as identity primary key,
  "userId"    uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  ua          text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_pushsub_user on public."PushSubscription"("userId");

alter table public."PushSubscription" enable row level security;

-- Staf hanya boleh mengelola langganannya sendiri (opsional; penulisan utama
-- lewat RPC di bawah). Edge Function memakai service role -> menembus RLS.
drop policy if exists pushsub_sel_own on public."PushSubscription";
drop policy if exists pushsub_del_own on public."PushSubscription";
create policy pushsub_sel_own on public."PushSubscription"
  for select to authenticated using ("userId" = auth.uid());
create policy pushsub_del_own on public."PushSubscription"
  for delete to authenticated using ("userId" = auth.uid());

-- ── RPC: simpan_langganan_push() ────────────────────────────
--  Upsert langganan milik pemanggil (auth.uid()). Endpoint unik -> bila
--  browser yang sama mendaftar ulang, datanya diperbarui, bukan dobel.
create or replace function public.simpan_langganan_push(
  p_endpoint text, p_p256dh text, p_auth text, p_ua text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Harus login.');
  end if;
  insert into public."PushSubscription"("userId", endpoint, p256dh, auth, ua)
  values (v_uid, p_endpoint, p_p256dh, p_auth, p_ua)
  on conflict (endpoint) do update
    set "userId" = excluded."userId",
        p256dh   = excluded.p256dh,
        auth     = excluded.auth,
        ua       = excluded.ua;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all     on function public.simpan_langganan_push(text,text,text,text) from public;
grant  execute on function public.simpan_langganan_push(text,text,text,text) to authenticated;

-- ── RPC: hapus_langganan_push() ─────────────────────────────
create or replace function public.hapus_langganan_push(p_endpoint text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  delete from public."PushSubscription"
  where endpoint = p_endpoint and "userId" = auth.uid();
  select jsonb_build_object('ok', true);
$$;
revoke all     on function public.hapus_langganan_push(text) from public;
grant  execute on function public.hapus_langganan_push(text) to authenticated;


-- ############################################################
-- ## 9/9  supabase_reset_request.sql  (ResetRequest — lupa sandi staf)
-- ############################################################

-- ============================================================================
-- SI-PASTI / SKPP-ADMIN — Fitur "Lupa Kata Sandi" (permintaan reset ke admin)
-- ----------------------------------------------------------------------------
-- Karena login memakai email sintetis (username@skpp.local) tanpa email asli,
-- reset kata sandi dilakukan melalui ADMIN. Pegawai yang lupa sandi mengisi
-- form di halaman login → permintaan tersimpan di tabel "ResetRequest" →
-- admin melihat daftarnya di menu "Manajemen Staf" dan mereset sandinya.
--
-- Cara pakai:
--   1. Supabase Dashboard → project SKPP → "SQL Editor".
--   2. Tempel SELURUH isi file ini → "Run".
-- ============================================================================

create table if not exists public."ResetRequest" (
  id         uuid primary key default gen_random_uuid(),
  username   text not null,
  alasan     text,
  status     text not null default 'pending',   -- 'pending' | 'selesai'
  waktu      text,                               -- waktu tampil (format id-ID)
  created_at timestamptz not null default now()
);

create index if not exists "ResetRequest_status_idx" on public."ResetRequest" (status);

-- Aktifkan Row Level Security
alter table public."ResetRequest" enable row level security;

-- Pengunjung TANPA login (anon) hanya boleh MENGAJUKAN permintaan baru
-- (status wajib 'pending'). Mereka TIDAK bisa membaca/mengubah permintaan lain.
drop policy if exists "anon ajukan reset" on public."ResetRequest";
create policy "anon ajukan reset" on public."ResetRequest"
  for insert to anon with check (status = 'pending');

-- Pengguna login boleh insert juga (mis. admin menambah manual) — opsional.
drop policy if exists "auth insert reset" on public."ResetRequest";
create policy "auth insert reset" on public."ResetRequest"
  for insert to authenticated with check (true);

-- Hanya pengguna login (admin) yang boleh melihat/mengubah/menghapus permintaan.
drop policy if exists "auth select reset" on public."ResetRequest";
create policy "auth select reset" on public."ResetRequest"
  for select to authenticated using (true);

drop policy if exists "auth update reset" on public."ResetRequest";
create policy "auth update reset" on public."ResetRequest"
  for update to authenticated using (true) with check (true);

drop policy if exists "auth delete reset" on public."ResetRequest";
create policy "auth delete reset" on public."ResetRequest"
  for delete to authenticated using (true);


-- ############################################################
-- ## 10  nip -> text  (HANYA perubahan tipe; TANPA baris data staging)
-- ############################################################

-- NIP 18 digit melebihi presisi angka JS -> WAJIB text agar tidak korup saat
-- pengajuan online menyimpan NIP. Aman untuk kolom yang sudah text (no-op).
alter table public."Pengajuan"
  alter column nip type text using nip::text;

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

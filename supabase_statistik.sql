-- ============================================================
--  RPC: statistik()
--  Dipakai bar statistik di modul pelacakan publik (index.html).
--  Mengembalikan HANYA angka agregat (tidak ada data sensitif),
--  jadi aman dipanggil anon. SECURITY DEFINER -> menembus RLS.
--
--  total    : jumlah seluruh pengajuan.
--  terbit   : status='selesai' ATAU semua tahap selesai (A=7, B=11).
--  rataHari : rata-rata lama proses dalam HARI KERJA (Senin–Jumat,
--             tanpa Sabtu/Minggu) dari riwayat pertama s/d terakhir
--             tiap SKPP yang sudah terbit, dibulatkan.
--
--  Jalankan di Supabase -> SQL Editor.
-- ============================================================

create or replace function public.statistik()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  with terbit_p as (
    select p.id
    from public."Pengajuan" p
    where p.status = 'selesai'
       or coalesce(
            cardinality(string_to_array(nullif(trim(p."tahapSelesai"), ''), ',')), 0
          ) >= case when p.jalur = 'A' then 7 else 11 end
  ),
  rentang as (
    select r."pengajuanId" as id,
           min(r.created_at)::date as d1,
           max(r.created_at)::date as d2
    from public."Riwayat" r
    join terbit_p tp on tp.id = r."pengajuanId"
    group by r."pengajuanId"
  ),
  durasi as (
    select id,
      (select count(*)
       from generate_series(d1 + 1, d2, interval '1 day') g
       where extract(isodow from g) < 6) as hari   -- isodow 6=Sabtu, 7=Minggu
    from rentang
  )
  select jsonb_build_object(
    'total',    (select count(*) from public."Pengajuan"),
    'terbit',   (select count(*) from terbit_p),
    'rataHari', coalesce((select round(avg(hari))::int from durasi), 0)
  );
$$;

revoke all     on function public.statistik() from public;
grant  execute on function public.statistik() to anon, authenticated;

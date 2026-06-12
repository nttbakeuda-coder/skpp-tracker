-- ============================================================
--  RPC: statistik()
--  Dipakai bar statistik di modul pelacakan publik (index.html).
--  Mengembalikan HANYA angka agregat (tidak ada data sensitif),
--  jadi aman dipanggil anon. SECURITY DEFINER -> menembus RLS.
--
--  Definisi "terbit" disamakan dengan dashboard:
--    status = 'selesai'  ATAU  semua tahap selesai (progress 100%).
--    (Jalur A = 7 tahap, Jalur B = 11 tahap.)
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
  select jsonb_build_object(
    'total', (select count(*) from public."Pengajuan"),
    'terbit', (
      select count(*) from public."Pengajuan" p
      where p.status = 'selesai'
         or coalesce(
              cardinality(string_to_array(nullif(trim(p."tahapSelesai"), ''), ',')), 0
            ) >= case when p.jalur = 'A' then 7 else 11 end
    )
  );
$$;

revoke all     on function public.statistik() from public;
grant  execute on function public.statistik() to anon, authenticated;

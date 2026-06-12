-- ============================================================
--  RPC: lacak(p_id, p_kode)
--  Dipakai oleh modul pelacakan publik (sipasti.my.id / index.html).
--  Mengembalikan satu objek pengajuan HANYA jika nomor pengajuan
--  DAN kode akses cocok. Jika tidak cocok -> NULL.
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
  where upper(trim(p.id))          = upper(trim(p_id))
    and upper(trim(p."kodeAkses")) = upper(trim(p_kode))
  limit 1;
$$;

-- Hanya boleh dipanggil sebagai RPC oleh anon/authenticated (bukan diakses
-- siapa pun secara internal yang tak diinginkan).
revoke all     on function public.lacak(text, text) from public;
grant  execute on function public.lacak(text, text) to anon, authenticated;

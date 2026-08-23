-- ============================================================
--  RPC: ajukan_ulang_pengajuan(p_id text)
--  Mengajukan KEMBALI pengajuan yang berstatus 'ditolak' TANPA input ulang:
--  status dikembalikan ke 'diajukan' (masuk lagi ke antrean verifikasi Loket),
--  memakai data & berkas yang sudah ada. Pemohon bisa melengkapi/mengganti
--  berkas setelahnya (karena status 'diajukan' membuka kembali unggahan).
--
--  Keamanan: SECURITY DEFINER, otorisasi diperiksa DI DALAM fungsi
--  (kepemilikan submittedBy = auth.uid() + status HARUS 'ditolak') — pemohon
--  TIDAK diberi hak UPDATE umum lewat RLS (policy pengajuan_update hanya izinkan
--  pemilik saat status='diajukan'). Pola sama dgn tolak_bukti_hutang.
--
--  Jalankan di: Supabase (project PRODUCTION) -> SQL Editor.
-- ============================================================
create or replace function public.ajukan_ulang_pengajuan(p_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid         uuid := auth.uid();
  v_status    text;
  v_owner     uuid;
  v_oleh      text;
  v_oleh_nama text;
begin
  if not public.is_approved_pemohon() then
    raise exception 'Akun belum disetujui admin.';
  end if;

  select status, "submittedBy" into v_status, v_owner
    from public."Pengajuan" where id = p_id;
  if v_owner is null then
    raise exception 'Pengajuan tidak ditemukan.';
  end if;
  if v_owner <> uid then
    raise exception 'Hanya pemilik pengajuan yang dapat mengajukan kembali.';
  end if;
  if v_status is distinct from 'ditolak' then
    raise exception 'Hanya pengajuan berstatus Ditolak yang dapat diajukan kembali.';
  end if;

  -- Kembalikan ke keadaan awal antrean (mirror pengajuan online baru):
  -- status 'diajukan', jalur/tahap direset, tanggal masuk = hari ini.
  update public."Pengajuan"
     set status         = 'diajukan',
         jalur          = null,
         "tahapAktif"   = null,
         "tahapSelesai" = null,
         "tanggalMasuk" = to_char(now(),'DD Mon YYYY')
   where id = p_id;

  select username, nama into v_oleh, v_oleh_nama from public.profiles where id = uid;

  insert into public."Riwayat" ("pengajuanId", tahap, waktu, catatan, "isKembali", oleh, "olehNama")
  values (
    p_id, null, to_char(now(), 'DD/MM/YYYY, HH24.MI.SS'),
    'Pengajuan diajukan kembali oleh pemohon setelah sebelumnya ditolak. Menunggu verifikasi ulang Loket.',
    false, coalesce(v_oleh, ''), coalesce(v_oleh_nama, '')
  );

  return jsonb_build_object('ok', true);
end;
$$;
revoke all     on function public.ajukan_ulang_pengajuan(text) from public;
grant  execute on function public.ajukan_ulang_pengajuan(text) to authenticated;

-- ── UJI (opsional) ──
-- Sebagai pemohon pemilik pengajuan ditolak:
--   select public.ajukan_ulang_pengajuan('SKPP-2026-0037');  -- -> {"ok": true}
-- Status di "Pengajuan" berubah 'ditolak' -> 'diajukan', ada baris baru di "Riwayat".

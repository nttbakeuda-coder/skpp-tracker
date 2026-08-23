-- ============================================================
--  RPC: ajukan_ulang_pengajuan(p_id text, p jsonb)
--  Mengajukan KEMBALI pengajuan yang berstatus 'ditolak': memperbarui data
--  (nama/nip/opd/jabatan/pangkat/alasan — hasil edit pemohon di form) lalu
--  mengembalikan status ke 'diajukan' (masuk lagi ke antrean verifikasi Loket).
--  Pengajuan yang sama (id & kodeAkses TETAP) dipakai ulang — pemohon tidak
--  membuat pengajuan baru, jadi aturan "1 pengajuan per pegawai" terjaga.
--
--  p boleh null / sebagian kolom -> kolom yang tak dikirim dibiarkan apa adanya.
--  Keamanan: SECURITY DEFINER, otorisasi diperiksa DI DALAM fungsi (kepemilikan
--  submittedBy = auth.uid() + status HARUS 'ditolak'). Pemohon TIDAK diberi hak
--  UPDATE umum lewat RLS. Pola sama dgn tolak_bukti_hutang.
--
--  Jalankan di: Supabase (project PRODUCTION) -> SQL Editor.
-- ============================================================

-- Ganti versi lama (hanya reset status, tanpa edit) dengan versi (text, jsonb).
drop function if exists public.ajukan_ulang_pengajuan(text);

create or replace function public.ajukan_ulang_pengajuan(p_id text, p jsonb)
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

  -- Perbarui data hasil edit (kolom yg tak dikirim di p dibiarkan) + reset ke
  -- keadaan awal antrean: status 'diajukan', jalur/tahap dikosongkan, tgl hari ini.
  update public."Pengajuan"
     set nama           = coalesce(p->>'nama',    nama),
         nip            = coalesce(p->>'nip',     nip),
         opd            = coalesce(p->>'opd',     opd),
         jabatan        = coalesce(p->>'jabatan', jabatan),
         pangkat        = coalesce(p->>'pangkat', pangkat),
         alasan         = coalesce(p->>'alasan',  alasan),
         status         = 'diajukan',
         jalur          = null,
         "tahapAktif"   = null,
         "tahapSelesai" = null,
         "tanggalMasuk" = to_char(now(),'DD Mon YYYY')
   where id = p_id;

  select username, nama into v_oleh, v_oleh_nama from public.profiles where id = uid;

  insert into public."Riwayat" ("pengajuanId", tahap, waktu, catatan, "isKembali", oleh, "olehNama")
  values (
    p_id, null, to_char(now(), 'DD/MM/YYYY, HH24.MI.SS'),
    'Pengajuan diperbarui & diajukan kembali oleh pemohon setelah sebelumnya ditolak. Menunggu verifikasi ulang Loket.',
    false, coalesce(v_oleh, ''), coalesce(v_oleh_nama, '')
  );

  return jsonb_build_object('ok', true);
end;
$$;
revoke all     on function public.ajukan_ulang_pengajuan(text, jsonb) from public;
grant  execute on function public.ajukan_ulang_pengajuan(text, jsonb) to authenticated;

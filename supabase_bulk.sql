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

DO $$
DECLARE
  t record;
  r text;
  mi int; ji int; qi int;
  mid uuid; jid uuid; qid uuid;
  roles text[] := array['pekerja','senior'];
  role_label text; diff text; credit int; sname text; stitle text;
  job_title text; job_desc text;
BEGIN
  FOR t IN SELECT id, slug, name FROM public.career_tracks ORDER BY sort_order LOOP
    FOREACH r IN ARRAY roles LOOP
      IF r = 'pekerja' THEN
        role_label := 'Pekerja'; diff := 'intermediate'; credit := 8;
        sname := 'Kak Dimas'; stitle := 'Lead ' || t.name;
      ELSE
        role_label := 'Senior'; diff := 'advanced'; credit := 12;
        sname := 'Bu Anindya'; stitle := 'Head of ' || t.name;
      END IF;

      FOR mi IN 1..2 LOOP
        INSERT INTO public.intern_missions
          (track_id, slug, title, description, difficulty, target_role, reward_credit, senior_name, senior_title, order_index)
        VALUES (
          t.id,
          t.slug || '-' || r || '-' || mi,
          CASE WHEN r = 'pekerja'
            THEN 'Sprint ' || mi || ': Eksekusi Mandiri ' || t.name
            ELSE 'Sprint ' || mi || ': Keputusan Strategis ' || t.name END,
          CASE WHEN r = 'pekerja'
            THEN 'Misi tingkat Pekerja untuk ' || t.name || '. Kamu memegang tugas nyata dengan trade-off teknis dan tenggat yang ketat.'
            ELSE 'Misi tingkat Senior untuk ' || t.name || '. Kamu memimpin arah kerja, menilai risiko, dan menentukan prioritas tim.' END,
          diff, r, credit, sname, stitle, mi
        )
        RETURNING id INTO mid;

        FOR ji IN 1..3 LOOP
          job_title := CASE ji
            WHEN 1 THEN CASE WHEN r = 'pekerja' THEN 'Analisis kebutuhan' ELSE 'Penilaian risiko' END
            WHEN 2 THEN CASE WHEN r = 'pekerja' THEN 'Eksekusi teknis' ELSE 'Arahan teknis tim' END
            ELSE CASE WHEN r = 'pekerja' THEN 'Review dan serah terima' ELSE 'Keputusan akhir dan komunikasi' END
          END;
          job_desc := 'Pekerjaan ' || ji || ' pada misi tingkat ' || role_label || ' di bidang ' || t.name || '.';

          INSERT INTO public.intern_jobs (mission_id, title, description, order_index)
          VALUES (mid, job_title, job_desc, ji)
          RETURNING id INTO jid;

          FOR qi IN 1..2 LOOP
            INSERT INTO public.intern_questions (job_id, senior_message, question_text, explanation, order_index)
            VALUES (
              jid,
              CASE WHEN r = 'pekerja'
                THEN 'Halo! Untuk ' || lower(job_title) || ' ini, klien ' || t.name || ' minta hasil yang bisa dipakai minggu depan. Aku mau lihat cara kamu mengambil keputusan sendiri.'
                ELSE 'Aku butuh sudut pandang senior di sini. Untuk ' || lower(job_title) || ', dampaknya kena ke seluruh tim ' || t.name || ', bukan cuma ke kamu.' END,
              CASE WHEN r = 'pekerja'
                THEN 'Langkah mana yang paling tepat kamu ambil lebih dulu pada tahap ' || lower(job_title) || ' (bagian ' || qi || ')?'
                ELSE 'Sebagai penanggung jawab, keputusan mana yang paling bertanggung jawab pada tahap ' || lower(job_title) || ' (bagian ' || qi || ')?' END,
              CASE WHEN r = 'pekerja'
                THEN 'Pekerja yang baik memvalidasi kebutuhan dan dampak sebelum mengeksekusi, lalu mencatat keputusannya agar bisa direview.'
                ELSE 'Senior menimbang risiko, biaya, dan dampak jangka panjang, lalu mengomunikasikan keputusan secara transparan ke tim dan pemangku kepentingan.' END,
              qi
            )
            RETURNING id INTO qid;

            INSERT INTO public.intern_answer_options (question_id, label, is_correct, feedback, order_index) VALUES
              (qid,
               CASE WHEN r = 'pekerja'
                 THEN 'Pastikan dulu kriteria selesai dan dampaknya, baru eksekusi sambil mencatat keputusan.'
                 ELSE 'Petakan risiko dan dampaknya, ambil keputusan yang bisa dipertanggungjawabkan, lalu jelaskan alasannya ke tim.' END,
               true,
               'Tepat. Ini cara kerja yang bisa dipertanggungjawabkan dan mudah direview.', 1),
              (qid,
               'Langsung kerjakan sesuai perkiraan sendiri supaya cepat selesai.',
               false,
               'Cepat, tapi berisiko salah arah. Validasi dulu kriteria dan dampaknya.', 2),
              (qid,
               'Tunggu instruksi detail dari atasan sebelum melakukan apa pun.',
               false,
               'Di tingkat ' || role_label || ', kamu diharapkan mengambil inisiatif dengan alasan yang jelas.', 3);
          END LOOP;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
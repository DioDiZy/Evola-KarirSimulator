
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'magang';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('magang','pekerja'));

CREATE TABLE public.intern_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.career_tracks(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'beginner',
  target_role text NOT NULL DEFAULT 'magang',
  reward_credit integer NOT NULL DEFAULT 5,
  senior_name text NOT NULL DEFAULT 'Kak Rani',
  senior_title text NOT NULL DEFAULT 'Senior Mentor',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.intern_missions TO authenticated;
GRANT ALL ON public.intern_missions TO service_role;
ALTER TABLE public.intern_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Intern missions readable" ON public.intern_missions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.intern_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.intern_missions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.intern_jobs TO authenticated;
GRANT ALL ON public.intern_jobs TO service_role;
ALTER TABLE public.intern_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Intern jobs readable" ON public.intern_jobs FOR SELECT TO authenticated USING (true);

CREATE TABLE public.intern_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.intern_jobs(id) ON DELETE CASCADE,
  senior_message text NOT NULL,
  question_text text NOT NULL,
  explanation text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0
);
GRANT SELECT (id, job_id, senior_message, question_text, order_index) ON public.intern_questions TO authenticated;
GRANT ALL ON public.intern_questions TO service_role;
ALTER TABLE public.intern_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Intern questions readable" ON public.intern_questions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.intern_answer_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.intern_questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  feedback text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0
);
GRANT SELECT (id, question_id, label, order_index) ON public.intern_answer_options TO authenticated;
GRANT ALL ON public.intern_answer_options TO service_role;
ALTER TABLE public.intern_answer_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Intern options readable" ON public.intern_answer_options FOR SELECT TO authenticated USING (true);

CREATE TABLE public.user_intern_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL REFERENCES public.intern_missions(id) ON DELETE CASCADE,
  current_job_index integer NOT NULL DEFAULT 0,
  current_question_index integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  incorrect_answers integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress',
  credit_awarded integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_intern_progress TO authenticated;
GRANT ALL ON public.user_intern_progress TO service_role;
ALTER TABLE public.user_intern_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own intern progress" ON public.user_intern_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_intern_progress_updated_at BEFORE UPDATE ON public.user_intern_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_intern_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.intern_questions(id) ON DELETE CASCADE,
  selected_option_id uuid NOT NULL REFERENCES public.intern_answer_options(id) ON DELETE CASCADE,
  is_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_intern_answers TO authenticated;
GRANT ALL ON public.user_intern_answers TO service_role;
ALTER TABLE public.user_intern_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own intern answers" ON public.user_intern_answers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DO $seed$
DECLARE
  data jsonb := $json$
{
  "frontend-developer": [
    {"slug":"fe-magang-landing-page","title":"Membantu Merapikan Landing Page Klien","description":"Ikut tim frontend memperbaiki landing page yang membingungkan pengguna.","senior":"Kak Rani","jobs":[
      {"title":"Memahami Masalah Pengguna","description":"Membaca hasil pengujian dan menentukan prioritas.","q":[
        {"s":"Halo! Hari ini kita bantu klien memperbaiki landing page mereka. Hasil tes menunjukkan banyak pengguna bingung tombol mana untuk mendaftar.","q":"Menurutmu tindakan pertama yang paling tepat apa?","e":"Prioritas pertama adalah kejelasan aksi utama, bukan hiasan visual.","o":[
          ["Memperjelas tombol call-to-action utama",true,"Benar. Pengguna harus langsung tahu tindakan berikutnya lewat teks, ukuran, posisi, dan kontras."],
          ["Menambahkan lebih banyak animasi di seluruh halaman",false,"Belum tepat. Animasi tidak menjawab kebingungan pengguna soal langkah berikutnya."],
          ["Mengganti seluruh warna tanpa pengujian",false,"Belum tepat. Perubahan besar tanpa data justru berisiko menambah masalah."]]},
        {"s":"Bagus. Sekarang soal struktur halamannya.","q":"Di mana sebaiknya tombol daftar utama diletakkan?","e":"Aksi utama harus terlihat tanpa perlu mencari.","o":[
          ["Di area paling atas yang langsung terlihat, dan diulang di akhir halaman",true,"Tepat. Pengguna bisa bertindak kapan pun mereka siap."],
          ["Hanya di bagian paling bawah halaman",false,"Kurang tepat. Banyak pengguna tidak menggulir sampai bawah."],
          ["Disembunyikan di dalam menu navigasi",false,"Kurang tepat. Aksi utama tidak boleh butuh usaha ekstra untuk ditemukan."]]}]},
      {"title":"Menulis Markup yang Rapi","description":"Menyiapkan struktur HTML yang benar.","q":[
        {"s":"Kita lanjut ke kodenya ya. Aku mau markup-nya bersih dulu sebelum styling.","q":"Elemen apa yang paling tepat untuk tombol daftar?","e":"Gunakan elemen semantik agar aksesibilitas dan keyboard bekerja otomatis.","o":[
          ["<button> atau <a> sesuai fungsinya",true,"Betul. Elemen semantik memberi perilaku keyboard dan pembaca layar secara gratis."],
          ["<div> dengan event klik",false,"Kurang tepat. div tidak bisa difokus keyboard tanpa penambahan manual."],
          ["<span> dengan style tombol",false,"Kurang tepat. Tampilan mirip tombol tidak berarti fungsinya sama."]]},
        {"s":"Satu hal lagi soal gambar hero di halaman itu.","q":"Apa yang wajib ada pada setiap gambar penting?","e":"Teks alternatif membantu pengguna pembaca layar dan SEO.","o":[
          ["Atribut alt yang deskriptif",true,"Benar. alt menjelaskan isi gambar bagi yang tidak bisa melihatnya."],
          ["Ukuran file sekecil mungkin saja",false,"Optimasi penting, tapi bukan pengganti teks alternatif."],
          ["Efek bayangan agar menarik",false,"Itu urusan estetika, bukan kebutuhan dasar."]]}]},
      {"title":"Memeriksa Tampilan Mobile","description":"Memastikan halaman nyaman di layar kecil.","q":[
        {"s":"Sebagian besar pengunjung klien memakai ponsel.","q":"Pendekatan layout mana yang kamu pilih?","e":"Mobile-first membuat konten inti selalu terlayani lebih dulu.","o":[
          ["Mendesain mobile lebih dulu lalu menyesuaikan ke layar besar",true,"Tepat. Ini memaksa kita memprioritaskan konten yang benar-benar penting."],
          ["Membuat versi desktop saja lalu memperkecil semuanya",false,"Kurang tepat. Hasilnya biasanya teks kecil dan tombol sulit disentuh."],
          ["Membuat situs terpisah untuk mobile",false,"Kurang efisien untuk kebutuhan sekecil ini."]]},
        {"s":"Terakhir soal kenyamanan sentuh.","q":"Berapa ukuran minimal area tombol yang nyaman disentuh?","e":"Standar umum aksesibilitas adalah sekitar 44x44 piksel.","o":[
          ["Sekitar 44 x 44 piksel",true,"Benar. Ukuran ini mengurangi salah tekan di layar sentuh."],
          ["Sekitar 16 x 16 piksel",false,"Terlalu kecil untuk jari pengguna."],
          ["Tidak ada aturan, ikut selera desain",false,"Ada panduan aksesibilitas yang sebaiknya kita ikuti."]]}]}]},
    {"slug":"fe-magang-form-pendaftaran","title":"Memperbaiki Form Pendaftaran","description":"Membantu menurunkan angka pengguna yang gagal mendaftar.","senior":"Kak Rani","jobs":[
      {"title":"Menyederhanakan Field","description":"Mengurangi hambatan pada form.","q":[
        {"s":"Data kita menunjukkan banyak orang berhenti di tengah pengisian form.","q":"Langkah pertama yang paling masuk akal apa?","e":"Setiap field tambahan menambah peluang pengguna menyerah.","o":[
          ["Menghapus field yang tidak benar-benar dibutuhkan saat pendaftaran",true,"Tepat. Minta data seperlunya dulu, sisanya bisa menyusul."],
          ["Menambahkan field agar data lebih lengkap",false,"Justru memperparah, karena form terasa makin berat."],
          ["Memperbesar tombol kirim saja",false,"Belum menyentuh akar masalahnya."]]},
        {"s":"Soal label input nih.","q":"Bagaimana sebaiknya label ditampilkan?","e":"Placeholder hilang saat mengetik, label tidak.","o":[
          ["Label tetap terlihat di atas input",true,"Benar. Pengguna tetap tahu isi field walau sedang mengetik."],
          ["Cukup placeholder di dalam input",false,"Kurang tepat. Placeholder hilang begitu pengguna mengetik."],
          ["Tanpa label, cukup ikon",false,"Ikon sering ambigu dan menyulitkan pembaca layar."]]}]},
      {"title":"Menangani Validasi","description":"Memberi pesan kesalahan yang membantu.","q":[
        {"s":"Sekarang bagian error message.","q":"Pesan error seperti apa yang paling membantu?","e":"Pesan harus spesifik dan menawarkan solusi.","o":[
          ["Menjelaskan apa yang salah dan cara memperbaikinya, dekat field terkait",true,"Tepat. Pengguna langsung tahu tindakan koreksinya."],
          ["Cukup tulis Terjadi kesalahan di atas form",false,"Terlalu umum, pengguna tetap bingung."],
          ["Hanya mewarnai field jadi merah",false,"Warna saja tidak cukup, terutama bagi pengguna buta warna."]]},
        {"s":"Kapan validasi sebaiknya berjalan?","q":"Pilih waktu validasi yang paling ramah pengguna.","e":"Validasi saat meninggalkan field mengurangi gangguan.","o":[
          ["Saat pengguna selesai mengisi sebuah field dan berpindah",true,"Benar. Tidak mengganggu saat mengetik, tapi tetap cepat memberi tahu."],
          ["Setiap karakter diketik",false,"Terasa mengganggu dan membuat pengguna cemas."],
          ["Hanya setelah tombol kirim ditekan",false,"Pengguna jadi harus mengoreksi banyak hal sekaligus."]]}]},
      {"title":"Menjaga Aksesibilitas","description":"Memastikan form bisa dipakai semua orang.","q":[
        {"s":"Aku mau form ini bisa dipakai lewat keyboard sepenuhnya.","q":"Apa yang harus kita pastikan?","e":"Fokus keyboard yang terlihat adalah syarat dasar.","o":[
          ["Urutan fokus logis dan indikator fokus terlihat jelas",true,"Tepat. Pengguna keyboard harus selalu tahu posisinya."],
          ["Menghilangkan outline fokus agar rapi",false,"Justru membuat navigasi keyboard mustahil diikuti."],
          ["Mengunci fokus di field pertama",false,"Itu menjebak pengguna dan melanggar aksesibilitas."]]},
        {"s":"Terakhir soal tombol ikon di form.","q":"Apa yang perlu ditambahkan pada tombol yang hanya berisi ikon?","e":"aria-label memberi nama yang bisa dibacakan pembaca layar.","o":[
          ["aria-label yang menjelaskan fungsinya",true,"Benar. Tanpa itu pembaca layar hanya menyebut tombol."],
          ["Judul tooltip saja",false,"Tooltip tidak selalu terbaca oleh teknologi bantu."],
          ["Tidak perlu apa-apa jika ikonnya umum",false,"Ikon umum pun tetap ambigu bagi sebagian pengguna."]]}]}]}
  ],
  "data-analyst": [
    {"slug":"da-magang-bersihkan-data","title":"Membersihkan Data Penjualan","description":"Menyiapkan data mentah agar layak dianalisis.","senior":"Kak Bima","jobs":[
      {"title":"Memeriksa Kualitas Data","description":"Mengecek isi file sebelum analisis.","q":[
        {"s":"Halo! Kita dapat file penjualan mentah dari tim sales.","q":"Apa hal pertama yang kamu lakukan?","e":"Selalu pahami dan periksa data sebelum menyimpulkan.","o":[
          ["Memeriksa jumlah baris, tipe kolom, dan nilai kosong",true,"Tepat. Pemeriksaan awal mencegah kesimpulan yang salah."],
          ["Langsung membuat grafik akhir",false,"Berisiko, karena data kotor menghasilkan grafik menyesatkan."],
          ["Mengirim file apa adanya ke manajer",false,"Kita belum tahu apakah datanya bisa dipercaya."]]},
        {"s":"Ada beberapa baris yang sama persis muncul dua kali.","q":"Apa tindakan yang tepat?","e":"Duplikat menggelembungkan angka total.","o":[
          ["Menghapus duplikat setelah memastikan memang baris yang sama",true,"Benar. Konfirmasi dulu, baru hapus agar tidak kehilangan data sah."],
          ["Membiarkannya karena tidak berpengaruh",false,"Justru berpengaruh, total penjualan bisa terlihat lebih besar."],
          ["Menghapus semua baris yang mirip",false,"Terlalu agresif, bisa membuang transaksi yang valid."]]}]},
      {"title":"Menangani Nilai Kosong","description":"Memutuskan perlakuan data hilang.","q":[
        {"s":"Kolom jumlah_pembelian punya 3 persen nilai kosong.","q":"Pendekatan mana yang paling aman?","e":"Pahami penyebab data hilang sebelum mengisinya.","o":[
          ["Cari tahu penyebabnya dulu, baru tentukan diisi atau dikeluarkan",true,"Tepat. Perlakuan yang benar bergantung pada penyebab data hilang."],
          ["Isi semuanya dengan angka nol",false,"Nol berarti tidak membeli, itu mengubah makna data."],
          ["Hapus seluruh kolom",false,"Terlalu berlebihan untuk kekosongan sekecil itu."]]},
        {"s":"Ada tanggal yang formatnya campur aduk.","q":"Apa yang kamu lakukan?","e":"Format konsisten memudahkan analisis waktu.","o":[
          ["Menyeragamkan ke satu format tanggal standar",true,"Benar. Format konsisten mencegah error saat pengurutan dan agregasi."],
          ["Mengubahnya jadi teks biasa",false,"Kita jadi kehilangan kemampuan menghitung rentang waktu."],
          ["Membiarkan karena bisa dibaca manusia",false,"Alat analisis tidak setoleran manusia dalam membaca format."]]}]},
      {"title":"Menyajikan Temuan","description":"Mengomunikasikan hasil ke tim bisnis.","q":[
        {"s":"Manajer minta ringkasan tren penjualan bulanan.","q":"Visual mana yang paling cocok?","e":"Pilih visual sesuai pertanyaan yang dijawab.","o":[
          ["Line chart per bulan",true,"Tepat. Line chart paling jelas untuk perubahan sepanjang waktu."],
          ["Pie chart semua transaksi",false,"Pie chart tidak menunjukkan perubahan waktu."],
          ["Tabel berisi seluruh baris mentah",false,"Terlalu detail untuk kebutuhan ringkasan."]]},
        {"s":"Satu hal yang sering dilupakan anak magang.","q":"Apa yang wajib menyertai angka dalam laporan?","e":"Konteks membuat angka bisa ditindaklanjuti.","o":[
          ["Konteks: periode data, sumber, dan keterbatasannya",true,"Benar. Tanpa konteks, angka mudah disalahartikan."],
          ["Warna yang menarik",false,"Estetika membantu, tapi bukan hal wajib."],
          ["Sebanyak mungkin metrik",false,"Terlalu banyak metrik justru mengaburkan pesan utama."]]}]}]},
    {"slug":"da-magang-dashboard-retensi","title":"Menyiapkan Dashboard Retensi","description":"Membantu tim produk memantau retensi pengguna.","senior":"Kak Bima","jobs":[
      {"title":"Menentukan Metrik","description":"Memilih ukuran yang relevan.","q":[
        {"s":"Tim produk ingin tahu apakah pengguna kembali memakai aplikasi.","q":"Metrik mana yang paling relevan?","e":"Retensi mengukur pengguna yang kembali, bukan sekadar jumlah kunjungan.","o":[
          ["Persentase pengguna yang kembali aktif dalam periode tertentu",true,"Tepat. Itulah definisi dasar retensi."],
          ["Total kunjungan halaman",false,"Bisa naik walau penggunanya itu-itu saja."],
          ["Jumlah pendaftar baru",false,"Itu akuisisi, bukan retensi."]]},
        {"s":"Kita perlu membandingkan kelompok pengguna berdasarkan bulan bergabung.","q":"Analisis apa yang tepat?","e":"Analisis kohort memisahkan pengguna berdasarkan waktu bergabung.","o":[
          ["Analisis kohort",true,"Benar. Kohort menunjukkan perilaku tiap kelompok dari waktu ke waktu."],
          ["Rata-rata sederhana semua pengguna",false,"Menyamarkan perbedaan antar kelompok."],
          ["Membandingkan dua hari acak",false,"Sampelnya terlalu sempit untuk disimpulkan."]]}]},
      {"title":"Membangun Query","description":"Mengambil data dengan benar.","q":[
        {"s":"Kamu menulis query yang menggabungkan tabel pengguna dan aktivitas.","q":"Apa yang perlu diwaspadai?","e":"Join yang salah bisa menggandakan baris.","o":[
          ["Join bisa menggandakan baris sehingga angka membengkak",true,"Tepat. Selalu cek jumlah baris sebelum dan sesudah join."],
          ["Join selalu aman selama sintaksnya benar",false,"Sintaks benar tidak menjamin hasil yang benar."],
          ["Cukup pakai SELECT *",false,"Itu justru menyulitkan pengecekan hasil."]]},
        {"s":"Dashboard-nya lambat saat data membesar.","q":"Apa langkah awal yang wajar?","e":"Batasi data dan agregasi lebih awal.","o":[
          ["Membatasi rentang tanggal dan meringkas data lebih dulu",true,"Benar. Agregasi awal mengurangi beban query secara signifikan."],
          ["Menambah jumlah grafik",false,"Justru menambah beban."],
          ["Memuat semua data mentah ke browser",false,"Itu penyebab umum dashboard lambat."]]}]},
      {"title":"Menutup Pekerjaan","description":"Memastikan hasil bisa dipakai tim.","q":[
        {"s":"Sebelum dashboard dipakai tim, ada satu hal penting.","q":"Apa yang kamu lakukan?","e":"Validasi silang menjaga kepercayaan terhadap data.","o":[
          ["Memvalidasi angka dengan sumber lain yang sudah dipercaya",true,"Tepat. Sekali angka salah, kepercayaan tim sulit dipulihkan."],
          ["Langsung bagikan tautannya",false,"Berisiko menyebarkan angka yang belum diverifikasi."],
          ["Menunggu tim yang mengeceknya",false,"Verifikasi adalah tanggung jawab pembuat analisis."]]},
        {"s":"Terakhir soal dokumentasi.","q":"Apa yang paling berguna dicatat?","e":"Definisi metrik mencegah salah tafsir di kemudian hari.","o":[
          ["Definisi tiap metrik dan sumber datanya",true,"Benar. Ini membuat dashboard tetap bisa dipahami bulan depan."],
          ["Warna tema dashboard",false,"Tidak membantu pemahaman data."],
          ["Nama file kerja pribadi",false,"Tidak relevan bagi pengguna dashboard."]]}]}]}
  ],
  "devops-engineer": [
    {"slug":"do-magang-pipeline-dasar","title":"Menjaga Pipeline Deploy Tetap Sehat","description":"Belajar dasar CI/CD bersama tim infrastruktur.","senior":"Kak Aldi","jobs":[
      {"title":"Membaca Log Kegagalan","description":"Menelusuri penyebab build gagal.","q":[
        {"s":"Halo! Pipeline kita gagal semalam dan tim menunggu rilis.","q":"Apa langkah pertamamu?","e":"Log adalah sumber kebenaran pertama saat build gagal.","o":[
          ["Membaca log build dari kegagalan paling awal",true,"Tepat. Error pertama biasanya menjelaskan sisanya."],
          ["Menjalankan ulang pipeline berkali-kali",false,"Tanpa membaca log, kita hanya menebak."],
          ["Mengubah konfigurasi secara acak",false,"Berisiko menambah masalah baru."]]},
        {"s":"Ternyata gagal karena versi dependensi berubah.","q":"Bagaimana mencegahnya berulang?","e":"Lockfile menjaga versi tetap konsisten.","o":[
          ["Mengunci versi dependensi lewat lockfile",true,"Benar. Build jadi dapat diulang dengan hasil sama."],
          ["Selalu memakai versi terbaru otomatis",false,"Itu justru sumber ketidakstabilan."],
          ["Menonaktifkan pemeriksaan dependensi",false,"Menyembunyikan masalah, bukan menyelesaikannya."]]}]},
      {"title":"Mengelola Rahasia","description":"Menyimpan kredensial dengan aman.","q":[
        {"s":"Kita butuh API key untuk tahap deploy.","q":"Di mana sebaiknya disimpan?","e":"Rahasia tidak boleh masuk ke repositori.","o":[
          ["Sebagai secret environment di sistem CI",true,"Tepat. Nilainya tidak tersimpan di kode dan bisa dirotasi."],
          ["Ditulis langsung di file konfigurasi repo",false,"Sangat berisiko, siapa pun yang punya akses repo bisa melihatnya."],
          ["Dikirim lewat chat tim",false,"Riwayat chat bukan tempat menyimpan rahasia."]]},
        {"s":"Log deploy kadang mencetak nilai variabel.","q":"Apa yang harus dipastikan?","e":"Masking mencegah kebocoran lewat log.","o":[
          ["Nilai rahasia disamarkan pada output log",true,"Benar. Log sering tersimpan lama dan bisa dibaca banyak orang."],
          ["Log dimatikan sepenuhnya",false,"Kita jadi kehilangan kemampuan menelusuri masalah."],
          ["Tidak masalah karena log bersifat internal",false,"Internal bukan berarti aman."]]}]},
      {"title":"Menyiapkan Rollback","description":"Menyiapkan rencana bila rilis bermasalah.","q":[
        {"s":"Rilis baru bikin error di produksi dan pengguna terdampak.","q":"Tindakan pertama yang tepat apa?","e":"Pulihkan layanan dulu, investigasi kemudian.","o":[
          ["Rollback ke versi stabil sebelumnya",true,"Tepat. Prioritas utama adalah memulihkan layanan pengguna."],
          ["Memperbaiki langsung di produksi",false,"Berisiko tinggi dan memperpanjang gangguan."],
          ["Menunggu sampai jam kerja berikutnya",false,"Pengguna terdampak selama itu."]]},
        {"s":"Setelah layanan pulih, ada satu kebiasaan baik tim kita.","q":"Apa yang sebaiknya dilakukan?","e":"Postmortem tanpa menyalahkan membuat tim belajar.","o":[
          ["Menulis catatan insiden dan tindakan pencegahannya",true,"Benar. Fokusnya pada perbaikan sistem, bukan mencari siapa yang salah."],
          ["Melupakannya karena sudah beres",false,"Masalah yang sama akan terulang."],
          ["Mencari siapa yang harus disalahkan",false,"Budaya menyalahkan membuat orang menyembunyikan masalah."]]}]}]},
    {"slug":"do-magang-monitoring","title":"Menyiapkan Monitoring Dasar","description":"Membuat tim tahu lebih dulu sebelum pengguna komplain.","senior":"Kak Aldi","jobs":[
      {"title":"Memilih Metrik","description":"Menentukan apa yang dipantau.","q":[
        {"s":"Kita mau tahu kondisi layanan tanpa menunggu laporan pengguna.","q":"Metrik mana yang paling utama dipantau?","e":"Error rate dan latensi langsung mencerminkan pengalaman pengguna.","o":[
          ["Tingkat error dan waktu respons",true,"Tepat. Keduanya paling cepat menunjukkan layanan bermasalah."],
          ["Jumlah baris kode",false,"Tidak menggambarkan kesehatan layanan."],
          ["Jumlah commit harian",false,"Itu metrik aktivitas tim, bukan kondisi sistem."]]},
        {"s":"Soal alert nih.","q":"Kapan alert sebaiknya berbunyi?","e":"Alert harus dapat ditindaklanjuti agar tidak diabaikan.","o":[
          ["Saat ada kondisi yang benar-benar butuh tindakan manusia",true,"Benar. Alert yang terlalu sering justru mulai diabaikan tim."],
          ["Setiap ada satu error kecil",false,"Menyebabkan kelelahan alert."],
          ["Hanya saat layanan mati total",false,"Terlambat, pengguna sudah terdampak lebih dulu."]]}]},
      {"title":"Membaca Dashboard","description":"Menafsirkan grafik pemantauan.","q":[
        {"s":"Grafik latensi naik tajam tiap pukul 20.00.","q":"Apa hipotesis pertama yang wajar?","e":"Pola berulang biasanya terkait beban atau jadwal tugas.","o":[
          ["Ada lonjakan trafik atau job terjadwal pada jam itu",true,"Tepat. Pola berulang mengarah ke penyebab yang terjadwal."],
          ["Servernya rusak setiap malam",false,"Terlalu cepat menyimpulkan tanpa bukti."],
          ["Grafiknya salah",false,"Kemungkinan ada, tapi bukan hipotesis pertama."]]},
        {"s":"Kita perlu tahu apa yang terjadi di dalam sistem saat itu.","q":"Apa yang paling membantu penelusuran?","e":"Log terstruktur dan tracing memudahkan menemukan sumber lambat.","o":[
          ["Log terstruktur dengan ID permintaan",true,"Benar. Kita bisa menelusuri satu permintaan dari ujung ke ujung."],
          ["Tebakan dari pengalaman saja",false,"Tidak bisa diverifikasi."],
          ["Menambah server tanpa analisis",false,"Boros dan belum tentu menyelesaikan penyebabnya."]]}]},
      {"title":"Menjaga Kebiasaan Baik","description":"Menutup pekerjaan dengan rapi.","q":[
        {"s":"Kamu sudah menambahkan alert baru hari ini.","q":"Apa yang perlu dilakukan sebelum menutup tugas?","e":"Alert tanpa panduan tindakan membingungkan tim jaga.","o":[
          ["Mendokumentasikan arti alert dan langkah penanganannya",true,"Tepat. Siapa pun yang berjaga jadi tahu harus berbuat apa."],
          ["Membiarkan tim menebak sendiri",false,"Memperlambat respons saat insiden."],
          ["Menonaktifkan alert saat malam",false,"Insiden tidak mengenal jam kerja."]]},
        {"s":"Terakhir, soal cara kerja tim infrastruktur.","q":"Perubahan konfigurasi sebaiknya dilakukan bagaimana?","e":"Perubahan lewat kode bisa direview dan dilacak.","o":[
          ["Lewat perubahan kode yang direview dan tercatat",true,"Benar. Ada jejak, bisa direview, dan mudah dikembalikan."],
          ["Langsung diubah manual di server",false,"Tidak ada jejak dan sulit direplikasi."],
          ["Diubah siapa saja tanpa pemberitahuan",false,"Sumber utama insiden yang sulit ditelusuri."]]}]}]}
  ]
}
$json$;
  tslug text;
  m jsonb;
  j jsonb;
  q jsonb;
  o jsonb;
  v_track uuid;
  v_mission uuid;
  v_job uuid;
  v_q uuid;
  mi int; ji int; qi int; oi int;
BEGIN
  FOR tslug IN SELECT jsonb_object_keys(data) LOOP
    SELECT id INTO v_track FROM public.career_tracks WHERE slug = tslug;
    CONTINUE WHEN v_track IS NULL;
    mi := 0;
    FOR m IN SELECT * FROM jsonb_array_elements(data -> tslug) LOOP
      INSERT INTO public.intern_missions (track_id, slug, title, description, senior_name, order_index)
      VALUES (v_track, m->>'slug', m->>'title', m->>'description', m->>'senior', mi)
      RETURNING id INTO v_mission;
      ji := 0;
      FOR j IN SELECT * FROM jsonb_array_elements(m -> 'jobs') LOOP
        INSERT INTO public.intern_jobs (mission_id, title, description, order_index)
        VALUES (v_mission, j->>'title', j->>'description', ji)
        RETURNING id INTO v_job;
        qi := 0;
        FOR q IN SELECT * FROM jsonb_array_elements(j -> 'q') LOOP
          INSERT INTO public.intern_questions (job_id, senior_message, question_text, explanation, order_index)
          VALUES (v_job, q->>'s', q->>'q', q->>'e', qi)
          RETURNING id INTO v_q;
          oi := 0;
          FOR o IN SELECT * FROM jsonb_array_elements(q -> 'o') LOOP
            INSERT INTO public.intern_answer_options (question_id, label, is_correct, feedback, order_index)
            VALUES (v_q, o->>0, (o->>1)::boolean, o->>2, oi);
            oi := oi + 1;
          END LOOP;
          qi := qi + 1;
        END LOOP;
        ji := ji + 1;
      END LOOP;
      mi := mi + 1;
    END LOOP;
  END LOOP;
END
$seed$;

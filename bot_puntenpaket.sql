-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 01 Des 2024 pada 04.49
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bot_puntenpaket`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbantrian`
--

CREATE TABLE `tbantrian` (
  `id` int(11) NOT NULL,
  `id_pemilik` varchar(200) NOT NULL,
  `id_jadwal` int(11) NOT NULL,
  `jumlah_paket` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Trigger `tbantrian`
--
DELIMITER $$
CREATE TRIGGER `deleteAntrianUpdateSlot` BEFORE DELETE ON `tbantrian` FOR EACH ROW UPDATE tbJadwal SET slots = slots + old.jumlah_paket WHERE id = old.id_jadwal
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbjadwal`
--

CREATE TABLE `tbjadwal` (
  `id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `kode_waktu` int(11) NOT NULL,
  `slots` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `tbjadwal`
--

INSERT INTO `tbjadwal` (`id`, `tanggal`, `kode_waktu`, `slots`) VALUES
(105, '2024-12-01', 1, 29),
(106, '2024-12-01', 2, 29),
(107, '2024-12-01', 3, 29),
(108, '2024-12-01', 4, 29),
(109, '2024-12-01', 5, 29),
(110, '2024-12-01', 6, 29),
(111, '2024-12-02', 1, 29),
(112, '2024-12-02', 2, 29),
(113, '2024-12-02', 3, 29),
(114, '2024-12-02', 4, 29),
(115, '2024-12-02', 5, 29),
(116, '2024-12-02', 6, 29),
(117, '2024-12-03', 1, 29),
(118, '2024-12-03', 2, 29),
(119, '2024-12-03', 3, 29),
(120, '2024-12-03', 4, 29),
(121, '2024-12-03', 5, 29),
(122, '2024-12-03', 6, 29),
(123, '2024-12-04', 1, 29),
(124, '2024-12-04', 2, 29),
(125, '2024-12-04', 3, 29),
(126, '2024-12-04', 4, 29),
(127, '2024-12-04', 5, 29),
(128, '2024-12-04', 6, 29),
(129, '2024-12-05', 1, 29),
(130, '2024-12-05', 2, 29),
(131, '2024-12-05', 3, 29),
(132, '2024-12-05', 4, 29),
(133, '2024-12-05', 5, 29),
(134, '2024-12-05', 6, 29);

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbkementerian`
--

CREATE TABLE `tbkementerian` (
  `id` int(11) NOT NULL,
  `role` varchar(200) NOT NULL,
  `password` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `tbkementerian`
--

INSERT INTO `tbkementerian` (`id`, `role`, `password`) VALUES
(1, 'exoff', 'exoff123'),
(2, 'kemenkeu', 'kemenkeu123'),
(3, 'kemendagri', 'kemendagri123'),
(4, 'kemendik', 'kemendik123'),
(5, 'kemenhankam', 'kemenhankam123'),
(6, 'kemenpora', 'kemenpora123'),
(7, 'kemenag', 'kemenag123'),
(8, 'kemenkestra', 'kemenkestra123'),
(9, 'kemkominfo', 'kemkominfo123'),
(10, 'kemenekraf', 'kemenekraf123'),
(11, 'kemenlu', 'kemenlu123'),
(12, 'admin', 'khusus_admin');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbpaket`
--

CREATE TABLE `tbpaket` (
  `id_paket` int(11) NOT NULL,
  `id_pemilik` varchar(200) NOT NULL,
  `kode_unik` varchar(200) NOT NULL,
  `id_petugas` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Trigger `tbpaket`
--
DELIMITER $$
CREATE TRIGGER `insertPaketToPaketMasuk` AFTER INSERT ON `tbpaket` FOR EACH ROW INSERT INTO tbPaketMasuk (`id_masuk`, `id_pemilik`, `kode_unik`, `id_petugas`, `timestamp`) VALUES (NULL, new.id_pemilik, new.kode_unik, new.id_petugas, CURRENT_TIMESTAMP())
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbpaketkeluar`
--

CREATE TABLE `tbpaketkeluar` (
  `id_keluar` int(11) NOT NULL,
  `id_pemilik` varchar(200) NOT NULL,
  `kode_unik` varchar(200) NOT NULL,
  `id_petugas` varchar(200) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `tbpaketkeluar`
--

INSERT INTO `tbpaketkeluar` (`id_keluar`, `id_pemilik`, `kode_unik`, `id_petugas`, `timestamp`) VALUES
(31, '7402005803', 'JWWTFV', '7486048562', '2024-12-01 02:51:40'),
(32, '7402005803', 'KAZZJL', '7486048562', '2024-12-01 03:01:41'),
(33, '', 'KJPTZP', '7486048562', '2024-12-01 03:07:48'),
(34, '', 'KJPTZP', '7486048562', '2024-12-01 03:07:48'),
(35, '7402005803', 'ZBEHCN', '7486048562', '2024-12-01 03:09:02');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbpaketmasuk`
--

CREATE TABLE `tbpaketmasuk` (
  `id_masuk` int(11) NOT NULL,
  `id_pemilik` varchar(200) NOT NULL,
  `kode_unik` varchar(200) NOT NULL,
  `id_petugas` varchar(200) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `tbpaketmasuk`
--

INSERT INTO `tbpaketmasuk` (`id_masuk`, `id_pemilik`, `kode_unik`, `id_petugas`, `timestamp`) VALUES
(35, '1284888091', 'JGCQKX', '7402005803', '2024-11-30 10:59:30'),
(36, '7402005803', 'JWWTFV', '7486048562', '2024-12-01 02:50:10'),
(37, '7402005803', 'KAZZJL', '7486048562', '2024-12-01 03:00:19'),
(38, '7402005803', 'KJPTZP', '7486048562', '2024-12-01 03:04:28'),
(39, '7402005803', 'ZBEHCN', '7486048562', '2024-12-01 03:08:43');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbtemppaket`
--

CREATE TABLE `tbtemppaket` (
  `id_temp` int(11) NOT NULL,
  `atas_nama` varchar(200) NOT NULL,
  `asrama` varchar(200) NOT NULL,
  `kode_unik` varchar(200) NOT NULL,
  `id_chat` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Trigger `tbtemppaket`
--
DELIMITER $$
CREATE TRIGGER `insertTempToPaket` AFTER UPDATE ON `tbtemppaket` FOR EACH ROW INSERT INTO tbpaket (id_pemilik, kode_unik, id_petugas) VALUES ((SELECT tbuser.id_chat FROM tbuser WHERE atas_nama=new.atas_nama AND asrama=new.asrama), new.kode_unik, new.id_chat)
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbuser`
--

CREATE TABLE `tbuser` (
  `id` int(11) NOT NULL,
  `username` varchar(200) DEFAULT NULL,
  `first_name` varchar(200) DEFAULT NULL,
  `atas_nama` varchar(200) NOT NULL,
  `asrama` varchar(200) NOT NULL,
  `id_chat` varchar(200) NOT NULL,
  `kementerian` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `tbuser`
--

INSERT INTO `tbuser` (`id`, `username`, `first_name`, `atas_nama`, `asrama`, `id_chat`, `kementerian`) VALUES
(13, NULL, 'XII-1', 'Dandel Jason Han', 'ASPA 4', '1087000243', ''),
(15, 'raditya1122', 'Raditya', 'Radit', 'ASPA 2', '738816388', ''),
(22, 'cndrmwaaa', 'Asrar', 'tatang aja', 'ASPA 3', '1284888091', ''),
(23, 'cahkuy', 'C', 'Cahyo Surahyo', 'ASPA 3', '7402005803', 'admin'),
(24, 'bekaskmnkstr', 'K', 'Admin', 'ASPA 1', '7486048562', 'admin');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbwaktu`
--

CREATE TABLE `tbwaktu` (
  `id_waktu` int(11) NOT NULL,
  `rentang_waktu` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `tbwaktu`
--

INSERT INTO `tbwaktu` (`id_waktu`, `rentang_waktu`) VALUES
(1, '9.00 - 10.00'),
(2, '10.00 - 11.00'),
(3, '11.00 - 12.00'),
(4, '13.00 - 14.00'),
(5, '14.00 - 15.00'),
(6, '15.00 - 16.00');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `tbantrian`
--
ALTER TABLE `tbantrian`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `tbjadwal`
--
ALTER TABLE `tbjadwal`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `tbkementerian`
--
ALTER TABLE `tbkementerian`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `tbpaket`
--
ALTER TABLE `tbpaket`
  ADD PRIMARY KEY (`id_paket`,`kode_unik`);

--
-- Indeks untuk tabel `tbpaketkeluar`
--
ALTER TABLE `tbpaketkeluar`
  ADD PRIMARY KEY (`id_keluar`);

--
-- Indeks untuk tabel `tbpaketmasuk`
--
ALTER TABLE `tbpaketmasuk`
  ADD PRIMARY KEY (`id_masuk`);

--
-- Indeks untuk tabel `tbtemppaket`
--
ALTER TABLE `tbtemppaket`
  ADD PRIMARY KEY (`id_temp`);

--
-- Indeks untuk tabel `tbuser`
--
ALTER TABLE `tbuser`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_chat` (`id_chat`);

--
-- Indeks untuk tabel `tbwaktu`
--
ALTER TABLE `tbwaktu`
  ADD PRIMARY KEY (`id_waktu`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `tbantrian`
--
ALTER TABLE `tbantrian`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT untuk tabel `tbjadwal`
--
ALTER TABLE `tbjadwal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=135;

--
-- AUTO_INCREMENT untuk tabel `tbkementerian`
--
ALTER TABLE `tbkementerian`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT untuk tabel `tbpaket`
--
ALTER TABLE `tbpaket`
  MODIFY `id_paket` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT untuk tabel `tbpaketkeluar`
--
ALTER TABLE `tbpaketkeluar`
  MODIFY `id_keluar` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT untuk tabel `tbpaketmasuk`
--
ALTER TABLE `tbpaketmasuk`
  MODIFY `id_masuk` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT untuk tabel `tbtemppaket`
--
ALTER TABLE `tbtemppaket`
  MODIFY `id_temp` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT untuk tabel `tbuser`
--
ALTER TABLE `tbuser`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT untuk tabel `tbwaktu`
--
ALTER TABLE `tbwaktu`
  MODIFY `id_waktu` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

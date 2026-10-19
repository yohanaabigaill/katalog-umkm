"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient, createSessionClient } from "@/lib/supabase/admin";

export async function login(prevState, formData) {
  const data = formData instanceof FormData ? formData : prevState;
  const email = data?.get?.("email");
  const password = data?.get?.("password");

  if (!email || !password) {
    return "Email dan password wajib diisi.";
  }

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password),
    });

    if (error) {
      return "Email atau password salah.";
    }
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return err.message || "Terjadi kesalahan saat masuk.";
  }

  redirect("/admin");
}

export async function keluar() {
  try {
    const supabase = await createAdminClient();
    await supabase.auth.signOut();
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
  }

  redirect("/admin/login");
}

export async function gantiPassword(prevState, formData) {
  const data = formData instanceof FormData ? formData : prevState;
  const passwordBaru = data?.get?.("password_baru");
  const konfirmasiPassword = data?.get?.("konfirmasi_password");

  if (!passwordBaru || !konfirmasiPassword) {
    return { error: "Semua kolom password wajib diisi." };
  }

  if (passwordBaru.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }

  if (passwordBaru !== konfirmasiPassword) {
    return { error: "Konfirmasi password tidak cocok dengan password baru." };
  }

  try {
    const supabase = await createAdminClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Kamu harus login terlebih dahulu." };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: String(passwordBaru),
    });

    if (updateError) {
      return { error: updateError.message || "Gagal mengganti password." };
    }

    return { success: "Password berhasil diganti." };
  } catch (err) {
    return { error: err.message || "Terjadi kesalahan saat mengganti password." };
  }
}

export async function tambahProduk(prevState, formData) {
  const data = formData instanceof FormData ? formData : prevState;

  const nama = data?.get?.("nama")?.toString().trim();
  const hargaRaw = data?.get?.("harga")?.toString().trim();
  const kategori = data?.get?.("kategori")?.toString().trim() || null;
  const foto_url = data?.get?.("foto_url")?.toString().trim() || null;
  const deskripsi = data?.get?.("deskripsi")?.toString().trim() || null;

  if (!nama) {
    return { error: "Nama produk wajib diisi." };
  }

  const harga = parseInt(hargaRaw, 10);
  if (isNaN(harga) || harga < 0) {
    return { error: "Harga harus berupa angka dan tidak boleh negatif." };
  }

  try {
    const supabase = await createSessionClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Kamu harus login terlebih dahulu." };
    }

    const { error: insertError } = await supabase.from("produk").insert({
      nama,
      harga,
      kategori,
      foto_url,
      deskripsi,
    });

    if (insertError) {
      return { error: insertError.message || "Gagal menyimpan produk." };
    }
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: err.message || "Terjadi kesalahan saat menyimpan produk." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export const logout = keluar;
export const masuk = login;
export const ubahPassword = gantiPassword;

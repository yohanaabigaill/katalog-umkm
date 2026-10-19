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

export async function ubahProduk(arg1, arg2, arg3) {
  let id;
  let data;

  if (arg3 instanceof FormData) {
    id = arg1;
    data = arg3;
  } else if (arg2 instanceof FormData) {
    if (typeof arg1 === "string" || typeof arg1 === "number") {
      id = arg1;
      data = arg2;
    } else {
      data = arg2;
      id = data.get("id") || (arg1 && arg1.id);
    }
  } else if (arg1 instanceof FormData) {
    data = arg1;
    id = data.get("id");
  } else if (arg1 && typeof arg1 === "object" && !(arg1 instanceof FormData) && !arg2) {
    data = arg1;
    id = data.id;
  } else {
    id = arg1;
    data = arg2;
  }

  if (!id && data?.get) {
    id = data.get("id");
  }

  const nama = (data?.get ? data.get("nama") : data?.nama)?.toString().trim();
  const hargaRaw = (data?.get ? data.get("harga") : data?.harga)?.toString().trim();
  const kategori =
    ((data?.get ? data.get("kategori") : data?.kategori)?.toString().trim()) || null;
  const foto_url =
    ((data?.get ? data.get("foto_url") : data?.foto_url)?.toString().trim()) || null;
  const deskripsi =
    ((data?.get ? data.get("deskripsi") : data?.deskripsi)?.toString().trim()) || null;

  if (!id) {
    return { error: "ID produk wajib diisi." };
  }

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

    const { error: updateError } = await supabase
      .from("produk")
      .update({
        nama,
        harga,
        kategori,
        foto_url,
        deskripsi,
      })
      .eq("id", id);

    if (updateError) {
      return { error: updateError.message || "Gagal memperbarui produk." };
    }
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: err.message || "Terjadi kesalahan saat memperbarui produk." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/produk/${id}`);
  redirect("/admin");
}

export const logout = keluar;
export const masuk = login;
export const ubahPassword = gantiPassword;
export const editProduk = ubahProduk;
export const updateProduk = ubahProduk;


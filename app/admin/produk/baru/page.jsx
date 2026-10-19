"use client";

import { useActionState } from "react";
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { tambahProduk } from "@/app/admin/actions";

export default function HalamanTambahProduk() {
  const [state, formAction] = useActionState(tambahProduk, null);

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Tambah produk</h1>

      {state?.error && (
        <p className="max-w-xl rounded-xl border border-garis bg-permukaan p-3 text-sm text-bahaya">
          {state.error}
        </p>
      )}

      <FormProduk action={formAction} labelTombol="Simpan produk" />
    </div>
  );
}

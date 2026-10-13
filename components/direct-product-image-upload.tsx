"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { createClient } from "../lib/supabase/client";

const MAX_PRODUCT_IMAGE_BYTES = 45 * 1024 * 1024;

function imageExtension(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return null;
}

async function hasValidImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
      bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a &&
      bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  if (file.type === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export function DirectProductImageUpload({ organizationId }: { organizationId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pathRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const preventSubmitDuringUpload = (event: SubmitEvent) => {
      if (uploadingRef.current) {
        event.preventDefault();
        setStatus("Please wait for the photo upload to finish before saving.");
      }
    };
    form.addEventListener("submit", preventSubmitDuringUpload);
    return () => form.removeEventListener("submit", preventSubmitDuringUpload);
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const extension = imageExtension(file);
    if (!extension || file.size <= 0 || file.size > MAX_PRODUCT_IMAGE_BYTES ||
        !(await hasValidImageSignature(file))) {
      event.currentTarget.value = "";
      setStatus("Choose a valid JPEG, PNG, or WebP image no larger than 45 MB.");
      return;
    }

    uploadingRef.current = true;
    setStatus("Uploading photo directly to secure storage…");
    try {
      const supabase = createClient();
      const path = organizationId + "/" + crypto.randomUUID() + "." + extension;
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });
      if (error) {
        setStatus("The photo could not be uploaded. Check your seller access and try again.");
        return;
      }

      const previousPath = pathRef.current?.value;
      if (pathRef.current) pathRef.current.value = path;
      if (previousPath && previousPath !== path) {
        await supabase.storage.from("product-images").remove([previousPath]);
      }
      setStatus("Photo uploaded. Save the product listing to attach it.");
    } catch {
      setStatus("The photo could not be uploaded. Check your connection and try again.");
    } finally {
      uploadingRef.current = false;
    }
  }

  return (
    <label>
      Upload product photo directly to Supabase (JPEG, PNG, or WebP, max 45 MB)
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
      <input ref={pathRef} type="hidden" name="uploadedImagePath" />
      {status && <small role="status">{status}</small>}
    </label>
  );
}

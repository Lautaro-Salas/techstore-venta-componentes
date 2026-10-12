"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ALLOWED_IMAGE_TYPES, IMAGE_PATH_PATTERN, MAX_IMAGE_BYTES, MAX_IMAGES } from "@/schemas/admin";
import { uploadProductImageAction } from "./actions";
import type { ProductSectionProps } from "./product-form-values";

const ACCEPT = Object.keys(ALLOWED_IMAGE_TYPES).join(",");
const BYTES_PER_MB = 1024 * 1024;

type Image = ProductSectionProps["values"]["images"][number];

export function ProductImagesEditor({ values, set, errors }: ProductSectionProps) {
  const images = values.images;
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [path, setPath] = useState("");
  const full = images.length >= MAX_IMAGES;

  const update = (next: Image[]) => set("images", next);
  const move = (index: number, offset: number) => {
    const next = [...images];
    const [item] = next.splice(index, 1);
    if (item) next.splice(index + offset, 0, item);
    update(next);
  };

  const upload = (file: File) => {
    if (!(file.type in ALLOWED_IMAGE_TYPES)) return toast.error("Formato no permitido", "Subí una imagen JPG, PNG o WebP.");
    if (file.size > MAX_IMAGE_BYTES) return toast.error("Imagen demasiado pesada", `El máximo es ${MAX_IMAGE_BYTES / BYTES_PER_MB} MB.`);
    const data = new FormData();
    data.set("file", file);
    startUpload(async () => {
      const result = await uploadProductImageAction(data);
      if (!result.ok) return toast.error(result.error);
      set("images", [...images, { url: result.data.url, alt: values.name }]);
      toast.success("Imagen subida");
    });
  };

  const addPath = () => {
    const url = path.trim();
    if (!IMAGE_PATH_PATTERN.test(url)) return toast.error("Ruta inválida", "Usá una ruta local, por ejemplo /images/products/foto.webp");
    update([...images, { url, alt: values.name }]);
    setPath("");
  };

  return (
    <Card>
      <CardHeader title="Imágenes" description={`La primera es la principal. Máximo ${MAX_IMAGES}. JPG, PNG o WebP de hasta 5 MB.`} />
      <CardBody className="flex flex-col gap-4">
        {errors.images && <p className="text-sm font-medium text-danger" role="alert">{errors.images}</p>}
        {images.length > 0 && (
          <ol className="flex flex-col gap-3">
            {images.map((img, i) => (
              <li key={`${img.url}-${i}`} className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
                <span className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
                  <img src={img.url} alt="" className="size-full object-cover" />
                  {i === 0 && <span className="absolute inset-x-0 bottom-0 bg-primary py-0.5 text-center text-[10px] font-semibold text-primary-foreground">Principal</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 truncate font-mono text-xs text-muted">{img.url}</p>
                  <Input
                    label={`Texto alternativo de la imagen ${i + 1}`}
                    value={img.alt}
                    maxLength={200}
                    onChange={(e) => update(images.map((it, j) => (j === i ? { ...it, alt: e.target.value } : it)))}
                    error={errors[`images.${i}.url`] ?? errors[`images.${i}.alt`]}
                  />
                </div>
                <div className="flex gap-1 sm:flex-col">
                  <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Subir imagen ${i + 1}`}><ArrowUp className="size-4" aria-hidden /></Button>
                  <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={`Bajar imagen ${i + 1}`}><ArrowDown className="size-4" aria-hidden /></Button>
                  <Button variant="ghost" size="icon" onClick={() => update(images.filter((_, j) => j !== i))} aria-label={`Quitar imagen ${i + 1}`} className="text-danger"><Trash2 className="size-4" aria-hidden /></Button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} loading={uploading} disabled={full} icon={<ImagePlus className="size-4" aria-hidden />}>
            Subir imagen
          </Button>
          <div className="flex flex-1 gap-2">
            <Input label="O agregá una ruta existente" placeholder="/images/products/foto.webp" value={path} onChange={(e) => setPath(e.target.value)} containerClassName="flex-1" />
            <Button variant="outline" onClick={addPath} disabled={full || !path.trim()} className="self-end" icon={<Link2 className="size-4" aria-hidden />}>
              Agregar
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

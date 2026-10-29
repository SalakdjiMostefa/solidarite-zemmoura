/**
 * Photos : compression dans le navigateur puis envoi vers Cloudinary (upload preset non signé).
 * Pas de Firebase Storage (offre Spark).
 */
import imageCompression from 'browser-image-compression';
import { CLOUDINARY } from '../config/site';

export const CLOUDINARY_READY = Boolean(CLOUDINARY.cloudName && CLOUDINARY.uploadPreset);

/** ~1600 px, WebP, < 300 Ko */
export async function compresser(file: File): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 0.3,
    fileType: 'image/webp',
    initialQuality: 0.82,
    useWebWorker: true,
  });
}

/** Envoi avec progression (0 → 1). Renvoie l'URL sécurisée. */
export function envoyer(file: File, onProgress: (p: number) => void): Promise<string> {
  // Mode démo : pas de compte Cloudinary → URL locale temporaire
  if (!CLOUDINARY_READY) {
    return new Promise((resolve) => {
      let p = 0;
      const id = setInterval(() => {
        p += 0.2;
        onProgress(Math.min(1, p));
        if (p >= 1) {
          clearInterval(id);
          resolve(URL.createObjectURL(file));
        }
      }, 120);
    });
  }
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY.uploadPreset);
    fd.append('folder', 'solidarite-zemoura');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText).secure_url);
      else reject(new Error(`Cloudinary : ${xhr.status} ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error('Réseau indisponible'));
    xhr.send(fd);
  });
}

/** Ajoute / retire la transformation « flouter les visages » sur une URL Cloudinary */
export function avecFlou(url: string, flou: boolean): string {
  if (!url.includes('res.cloudinary.com')) return url;
  const sans = url.replace('/upload/e_blur_faces:800/', '/upload/');
  return flou ? sans.replace('/upload/', '/upload/e_blur_faces:800/') : sans;
}

export const estFloutee = (url: string) => url.includes('/e_blur_faces');

/**
 * Photos : compression dans le navigateur puis envoi vers Cloudinary (upload preset non signé).
 * Pas de Firebase Storage (offre Spark).
 * Sécurisation côté client : contrôle strict des types MIME et limites de taille.
 */
import imageCompression from 'browser-image-compression';
import { CLOUDINARY } from '../config/site';

export const CLOUDINARY_READY = Boolean(CLOUDINARY.cloudName && CLOUDINARY.uploadPreset);

const TYPES_AUTORISES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif'];
const TAILLE_MAX_ENTREE = 15 * 1024 * 1024; // 15 Mo max avant compression

/** Vérifie que le fichier est une image valide avant traitement */
export function validerImage(file: File): void {
  if (!file) throw new Error('Aucun fichier sélectionné');
  if (file.size > TAILLE_MAX_ENTREE) {
    throw new Error('La taille de la photo dépasse 15 Mo. Veuillez choisir une photo plus légère.');
  }
  const typeOk = TYPES_AUTORISES.includes(file.type.toLowerCase()) || Boolean(file.name.match(/\.(jpe?g|png|webp|heic|heif|avif)$/i));
  if (!typeOk) {
    throw new Error('Format non autorisé. Seules les images (JPEG, PNG, WebP) sont acceptées.');
  }
}

/** ~1600 px, WebP, < 300 Ko */
export async function compresser(file: File): Promise<File> {
  validerImage(file);
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
  validerImage(file);

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
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res.secure_url || res.url);
        } catch {
          reject(new Error('Réponse invalide du serveur d’images'));
        }
      } else {
        reject(new Error(`Cloudinary : ${xhr.status} ${xhr.responseText}`));
      }
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

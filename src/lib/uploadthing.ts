// Typed upload components/hooks generated from the file router definition in
// src/app/api/uploadthing/core.ts (event covers, org logos/covers, profile
// photos, game gallery media — each has its own route/size limit there).
import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

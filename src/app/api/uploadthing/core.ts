import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  teamLogo: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(() => ({}))
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),

  eventCover: f({ image: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(() => ({}))
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),

  eventGallery: f({
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    video: { maxFileSize: "64MB", maxFileCount: 10 },
  })
    .middleware(() => ({}))
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

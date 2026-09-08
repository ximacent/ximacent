// // src/lib/storage/getStorageAdapter.ts
// import { ImageStorageAdapter } from "./imageStorage.types";
// import { LocalDiskStorageAdapter } from "./localDiskStorageAdapter";
// // import { S3StorageAdapter } from "./s3StorageAdapter"; // add later

// let adapter: ImageStorageAdapter | null = null;

// export function getStorageAdapter(): ImageStorageAdapter {
//   if (!adapter) {
//     adapter = new LocalDiskStorageAdapter();
//     // Later, swap based on env — no caller code changes:
//     // adapter = process.env.STORAGE_DRIVER === "s3" ? new S3StorageAdapter() : new LocalDiskStorageAdapter();
//   }
//   return adapter;
// }




// //Adapter for cloudinary
// src/lib/storage/getStorageAdapter.ts
import { ImageStorageAdapter } from "./imageStorage.types";
import { CloudinaryStorageAdapter } from "./cloudinaryStorageAdapter";
import { LocalDiskStorageAdapter } from "./localDiskStorageAdapter";

let adapter: ImageStorageAdapter | null = null;

export function getStorageAdapter(): ImageStorageAdapter {
  if (!adapter) {
    adapter =
      process.env.STORAGE_DRIVER === "local"
        ? new LocalDiskStorageAdapter()
        : new CloudinaryStorageAdapter();
  }
  return adapter;
}
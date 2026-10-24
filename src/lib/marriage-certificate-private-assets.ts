import {
  deletePrivateMarriageAsset,
  isPrivateMarriageAssetRef,
  readPrivateMarriageAssetBytes,
  savePrivateMarriagePngSignature,
} from "@/lib/marriage-private-storage";

/** @deprecated Use isPrivateMarriageAssetRef — kept for PDF loader compatibility. */
export function isPrivateSignaturePath(assetPath: string | null | undefined) {
  return isPrivateMarriageAssetRef(assetPath);
}

export async function savePrivateSignaturePng(bytes: Buffer) {
  return savePrivateMarriagePngSignature(bytes);
}

export async function readPrivateSignatureBytes(assetPath: string | null | undefined) {
  return readPrivateMarriageAssetBytes(assetPath);
}

export async function deletePrivateSignatureFile(assetPath: string | null | undefined) {
  await deletePrivateMarriageAsset(assetPath);
}

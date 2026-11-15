// Cloud Storage paths. storage.rules only allows uploads at these paths, and
// firestore.rules requires bikes.photoPath / documents.storagePath to match them.

// Keep file names to one safe path segment: no slashes, at most 200 characters.
function safeFileName(fileName: string): string {
  const cleaned = fileName.replace(/[^\w.-]+/g, '_').slice(-200);
  return cleaned || 'file';
}

export function bikePhotoPath(uid: string, bikeId: string, fileName: string): string {
  return `users/${uid}/bikes/${bikeId}/${safeFileName(fileName)}`;
}

export function documentFilePath(uid: string, documentId: string, fileName: string): string {
  return `users/${uid}/documents/${documentId}/${safeFileName(fileName)}`;
}

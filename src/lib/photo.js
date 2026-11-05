/** Shrink the photo chosen in a file input in place, so a full-size phone photo fits the upload limit. */
export async function shrinkPhoto(input, max = 1600) {
	const file = input.files?.[0];
	if (!file || file.type === 'image/gif') return;
	try {
		const bitmap = await createImageBitmap(file);
		const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		const blob = await new Promise((done) => canvas.toBlob(done, 'image/jpeg', 0.85));
		if (!blob) return;
		const moved = new DataTransfer();
		moved.items.add(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
		input.files = moved.files;
	} catch {
		// The browser can't read this format; the server will accept or explain it.
	}
}

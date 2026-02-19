/*
    // Normal File
    {
        id: 'id',
        content: '__ACTUAL_CNTENT__'
    }
    // Comparable File
    {
        id: 'id',
        content: '{
            original: '__CONTENT__',
            modified: '__CONTENT__'
        }'
    }
*/
class FileContentManager {
	static DB_NAME = 'TestDatabase';

	static createFileContent = (file) =>
		FileContentManager.updateFileContent({
			id: file.id,
			content: file.isComparator ? JSON.stringify({ original: '', modified: '' }) : ''
		});

	static getFileContent = (fileId) =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileContentManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					getRequest = db.transaction('fileContent', 'readonly').objectStore('fileContent').get(fileId);

				getRequest.onsuccess = () => {
					const fileContent = getRequest.result;
					resolve(fileContent);
				};
			};
		});

	static updateFileContent = (fileContent) =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileContentManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					updateRequest = db
						.transaction('fileContent', 'readwrite')
						.objectStore('fileContent')
						.put(fileContent);

				updateRequest.onsuccess = () => resolve(true);
				updateRequest.onerror = () => resolve(false);
			};
		});

	static deleteFileContent = (fileId) =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileContentManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					deleteRequest = db
						.transaction('fileContent', 'readwrite')
						.objectStore('fileContent')
						.delete(fileId);

				deleteRequest.onsuccess = () => resolve(true);
				deleteRequest.onerror = () => resolve(false);
			};
		});

	static getFileContentSizeInBytes = () =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileContentManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					transaction = db.transaction('fileContent', 'readwrite').objectStore('fileContent').openCursor();

				let size = 0;
				transaction.onsuccess = () => {
					const cursor = transaction.result;
					if (cursor) {
						const storedObject = cursor.value,
							json = JSON.stringify(storedObject);
						size += json.length;
						cursor.continue();
					} else {
						resolve({ bytes: size, string: StorageUtil.getReadableSize(size) });
					}
				};
				transaction.onerror = () => reject(false);
			};
		});
}

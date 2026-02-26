class FileManager {
	static DB_NAME = 'TestDatabase';

	static {
		FileManager.init();
	}

	static init() {
		const request = indexedDB.open(FileManager.DB_NAME);
		request.onupgradeneeded = () => {
			const db = request.result;

			const filesObjectStore = db.createObjectStore('files', { keyPath: 'id' });
			filesObjectStore.createIndex('title', 'title', { unique: false });
			filesObjectStore.createIndex('index', 'index', { unique: false });
			filesObjectStore.createIndex('extension', 'extension', { unique: false });
			filesObjectStore.createIndex('language', 'language', { unique: false });
			filesObjectStore.createIndex('isComparator', 'isComparator', { unique: false });

			const fileContentObjectStore = db.createObjectStore('fileContent', { keyPath: 'id' });
			fileContentObjectStore.createIndex('content', 'content', { unique: false });
		};
		request.onsuccess = () => {};
		request.onerror = () => {
			console.error("Why didn't you allow my web app to use IndexedDB?!");
		};
	}

	static getAllFiles = async () =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					cursorRequest = db
						.transaction('files', 'readonly')
						.objectStore('files')
						.index('index')
						.openCursor();

				const files = [];
				cursorRequest.onsuccess = (event) => {
					const cursor = event.target.result;
					if (cursor) {
						files.push(cursor.value);
						cursor.continue();
					} else {
						resolve(files);
					}
				};
			};
		});

	static getFile = async (fileId) =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					getRequest = db.transaction('files', 'readonly').objectStore('files').get(fileId);

				getRequest.onsuccess = () => {
					const file = getRequest.result;
					resolve(file);
				};
			};
		});

	static createFile = async (files, newFile) =>
		Promise.all(
			files.map((file, index) => {
				file.index = index + 1;
				return FileManager.updateFile(file);
			})
		)
			// Filter only the necessary keys
			.then(() => ({
				id: newFile.id,
				title: newFile.title,
				extension: newFile.extension,
				language: newFile.language,
				index: newFile.index,
				isComparator: newFile.isComparator
			}))
			.then((file) => FileManager.updateFile(file))
			.then((file) => (file ? FileContentManager.createFileContent(newFile) : false));

	static updateFile = async (file) =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					updateRequest = db.transaction('files', 'readwrite').objectStore('files').put(file);

				updateRequest.onsuccess = () => resolve(file);
				updateRequest.onerror = () => resolve(false);
			};
		});

	static updateFilePositions = async (files, fromIndex, toIndex) =>
		Promise.all(
			files.slice(fromIndex, toIndex + 1).map((file, index) => {
				file.index = fromIndex + index;
				return FileManager.updateFile(file);
			})
		).then((res) => res.every((response) => response));

	static deleteFile = async (fileId) =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					deleteRequest = db.transaction('files', 'readwrite').objectStore('files').delete(fileId);

				deleteRequest.onsuccess = () =>
					FileContentManager.deleteFileContent(fileId).then((res) => resolve(res));
				deleteRequest.onerror = () => resolve(false);
			};
		});

	static getFileByOrder = async (fileIndex) =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					cursorRequest = db
						.transaction('files', 'readonly')
						.objectStore('files')
						.index('index')
						.openCursor();

				let count = 0;
				cursorRequest.onsuccess = (event) => {
					const cursor = event.target.result;
					if (cursor) {
						if (count++ === fileIndex) {
							return resolve(cursor.value);
						}
						cursor.continue();
					} else {
						resolve(null);
					}
				};
				cursorRequest.onerror = (err) => reject(err);
			};
		});

	// New file functions
	static getNewFileName(length = 10) {
		const timestamp = new Date().getTime().toString(36);
		const randomString = Math.random().toString(36).substring(2, 12);
		return (timestamp + randomString).substring(0, length);
	}
	static getNewFileJSON = (isComparator) => ({
		id: FileManager.getNewFileName(),
		title: '',
		extension: '',
		language: 'plaintext',
		index: 0,
		isComparator: isComparator,
		isCreate: true
	});

	static clearAllFileData = () =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					transaction = db.transaction(['files', 'fileContent'], 'readwrite');

				transaction.objectStore('files').clear();
				transaction.objectStore('fileContent').clear();

				transaction.oncomplete = () => resolve(true);
				transaction.onerror = () => reject(false);
			};
			request.onerror = () => reject(false);
		});
}

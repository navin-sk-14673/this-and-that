class FileManager {
	static DB_NAME = 'TestDatabase';
	static DB_VERSION = 2;
	static ARCHIVE_MAX_AGE_DAYS = 7;

	static {
		FileManager.init();
	}

	static init() {
		const request = indexedDB.open(FileManager.DB_NAME, FileManager.DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;

			if (!db.objectStoreNames.contains('files')) {
				const filesObjectStore = db.createObjectStore('files', { keyPath: 'id' });
				filesObjectStore.createIndex('title', 'title', { unique: false });
				filesObjectStore.createIndex('index', 'index', { unique: false });
				filesObjectStore.createIndex('extension', 'extension', { unique: false });
				filesObjectStore.createIndex('language', 'language', { unique: false });
				filesObjectStore.createIndex('isComparator', 'isComparator', { unique: false });
			}

			if (!db.objectStoreNames.contains('fileContent')) {
				const fileContentObjectStore = db.createObjectStore('fileContent', { keyPath: 'id' });
				fileContentObjectStore.createIndex('content', 'content', { unique: false });
			}

			if (!db.objectStoreNames.contains('archivedFiles')) {
				const archivedStore = db.createObjectStore('archivedFiles', { keyPath: 'id' });
				archivedStore.createIndex('deletedAt', 'deletedAt', { unique: false });
			}
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

	static saveFileOrder(files) {
		try {
			const meta = files.map((f) => ({
				id: f.id,
				index: f.index,
				title: f.title,
				extension: f.extension,
				language: f.language,
				isComparator: f.isComparator
			}));
			localStorage.setItem('clsc-file-order', JSON.stringify(meta));
		} catch (e) {
			console.warn('Could not save file order to localStorage', e);
		}
	}

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

	// --- Soft-delete: archive a file instead of permanently deleting ---

	static getAllArchivedFiles = async () =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result;

				if (!db.objectStoreNames.contains('archivedFiles')) {
					return resolve([]);
				}

				const cursorRequest = db
					.transaction('archivedFiles', 'readonly')
					.objectStore('archivedFiles')
					.index('deletedAt')
					.openCursor(null, 'prev');

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
				cursorRequest.onerror = () => resolve([]);
			};
		});

	static permanentDeleteArchivedFile = async (fileId) =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					transaction = db.transaction('archivedFiles', 'readwrite');

				transaction.objectStore('archivedFiles').delete(fileId);

				transaction.oncomplete = () => FileContentManager.deleteFileContent(fileId).then(() => resolve(true));
				transaction.onerror = () => resolve(false);
			};
		});

	static deleteAllArchivedFiles = async () =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result;

				if (!db.objectStoreNames.contains('archivedFiles')) {
					return resolve(true);
				}

				// First collect all archived file IDs so we can delete their content too
				const ids = [];
				const cursorRequest = db
					.transaction('archivedFiles', 'readonly')
					.objectStore('archivedFiles')
					.openCursor();

				cursorRequest.onsuccess = (event) => {
					const cursor = event.target.result;
					if (cursor) {
						ids.push(cursor.value.id);
						cursor.continue();
					} else {
						// Clear the archive store
						const clearTransaction = db.transaction('archivedFiles', 'readwrite');
						clearTransaction.objectStore('archivedFiles').clear();

						clearTransaction.oncomplete = () =>
							Promise.all(ids.map((id) => FileContentManager.deleteFileContent(id)))
								.then(() => resolve(true))
								.catch(() => resolve(false));
						clearTransaction.onerror = () => resolve(false);
					}
				};
				cursorRequest.onerror = () => resolve(false);
			};
		});

	static restoreArchivedFileById = async (fileId) =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					transaction = db.transaction(['archivedFiles', 'files'], 'readwrite'),
					archiveStore = transaction.objectStore('archivedFiles'),
					getRequest = archiveStore.get(fileId);

				getRequest.onsuccess = () => {
					const archived = getRequest.result;
					if (!archived) return resolve(null);

					archiveStore.delete(archived.id);

					const restoredFile = {
						id: archived.id,
						title: archived.title,
						extension: archived.extension,
						language: archived.language,
						index: archived.index,
						isComparator: archived.isComparator
					};
					transaction.objectStore('files').put(restoredFile);

					transaction.oncomplete = () => resolve(restoredFile);
					transaction.onerror = () => resolve(null);
				};
				getRequest.onerror = () => resolve(null);
			};
		});

	static archiveFile = async (fileData) =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					transaction = db.transaction(['files', 'archivedFiles'], 'readwrite');

				// Remove from active files
				transaction.objectStore('files').delete(fileData.id);

				// Add to archive with deletion timestamp
				const archived = {
					id: fileData.id,
					title: fileData.title,
					extension: fileData.extension,
					language: fileData.language,
					index: fileData.index,
					isComparator: fileData.isComparator,
					deletedAt: Date.now()
				};
				transaction.objectStore('archivedFiles').put(archived);

				// Content stays in fileContent store — not deleted
				transaction.oncomplete = () => resolve(true);
				transaction.onerror = () => resolve(false);
			};
		});

	static restoreLastArchivedFile = async () =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result,
					transaction = db.transaction(['archivedFiles', 'files'], 'readwrite'),
					archiveStore = transaction.objectStore('archivedFiles'),
					cursorRequest = archiveStore.index('deletedAt').openCursor(null, 'prev');

				cursorRequest.onsuccess = (event) => {
					const cursor = event.target.result;
					if (!cursor) {
						// No archived files
						return resolve(null);
					}

					const archived = cursor.value;

					// Remove from archive
					archiveStore.delete(archived.id);

					// Re-insert into active files
					const restoredFile = {
						id: archived.id,
						title: archived.title,
						extension: archived.extension,
						language: archived.language,
						index: archived.index,
						isComparator: archived.isComparator
					};
					transaction.objectStore('files').put(restoredFile);

					transaction.oncomplete = () => resolve(restoredFile);
					transaction.onerror = () => resolve(null);
				};
				cursorRequest.onerror = () => resolve(null);
			};
		});

	static purgeOldArchives = async (maxAgeDays = FileManager.ARCHIVE_MAX_AGE_DAYS) =>
		new Promise((resolve, reject) => {
			const request = indexedDB.open(FileManager.DB_NAME);
			request.onsuccess = () => {
				const db = request.result;

				if (!db.objectStoreNames.contains('archivedFiles')) {
					return resolve(0);
				}

				const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000,
					transaction = db.transaction('archivedFiles', 'readwrite'),
					store = transaction.objectStore('archivedFiles'),
					range = IDBKeyRange.upperBound(cutoff),
					cursorRequest = store.index('deletedAt').openCursor(range);

				const expiredIds = [];

				cursorRequest.onsuccess = (event) => {
					const cursor = event.target.result;
					if (cursor) {
						expiredIds.push(cursor.value.id);
						cursor.delete();
						cursor.continue();
					}
				};

				transaction.oncomplete = () => {
					// Now clean up file content for expired entries
					if (expiredIds.length > 0) {
						Promise.all(expiredIds.map((id) => FileContentManager.deleteFileContent(id))).then(() =>
							resolve(expiredIds.length)
						);
					} else {
						resolve(0);
					}
				};
				transaction.onerror = () => resolve(0);
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
					storeNames = ['files', 'fileContent'];

				if (db.objectStoreNames.contains('archivedFiles')) {
					storeNames.push('archivedFiles');
				}

				const transaction = db.transaction(storeNames, 'readwrite');

				transaction.objectStore('files').clear();
				transaction.objectStore('fileContent').clear();

				if (db.objectStoreNames.contains('archivedFiles')) {
					transaction.objectStore('archivedFiles').clear();
				}

				transaction.oncomplete = () => resolve(true);
				transaction.onerror = () => reject(false);
			};
			request.onerror = () => reject(false);
		});
}

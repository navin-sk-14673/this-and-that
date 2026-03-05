Lyte.Component.register('main-container', {
	init() {
		MonacoEditor.getEditor().then((monaco) => {
			this.setData('monaco', monaco);

			MonacoEditor.initThemes().then((themes) => {
				this.setData('editorThemes', themes);
			});
		});
	},
	didConnect() {
		FileManager.getAllFiles().then((files) => {
			this.setData('files', files);
			this.setData('filesLoaded', true);
		});

		// Purge archived files older than 7 days
		FileManager.purgeOldArchives();

		this.FILE_TREE = this.$node.querySelector('#editor-file-tree');
		this._initEditorAreaDrop();
		this._initKeyboardShortcuts();
		// const ORIGINAL_JSON = {
		// 		name: 'Navin',
		// 		age: 12,
		// 		languages: ['Tamil', 'C', 'C++', 'Java', '.js']
		// 	},
		// 	MODIFIED_JSON = {
		// 		name: 'Navin',
		// 		age: 12,
		// 		languages: ['Tamil', 'css', 'scss', 'Java', '.js']
		// 	};
		// MonacoEditor.getEditor().then((monaco) => {
		// 	const leftJSONModel = monaco.editor.createModel(JSON.stringify(ORIGINAL_JSON, null, '\t'), 'json');
		// 	const rightJSONModel = monaco.editor.createModel(JSON.stringify(MODIFIED_JSON, null, '\t'), 'json');
		// 	const container = this.$node.querySelector('.editor-area-container');
		// 	const editor = monaco.editor.createDiffEditor(container, {
		// 		automaticLayout: true,
		// 		enableSplitViewResizing: true,
		// 		renderSideBySide: true,
		// 		smoothScrolling: true,
		// 		originalEditable: true, // for left pane
		// 		readOnly: false, // for right pane,
		// 		cursorBlinking: 'smooth',
		// 		cursorSmoothCaretAnimation: 'on'
		// 	});
		// 	editor.setModel({
		// 		original: leftJSONModel,
		// 		modified: rightJSONModel
		// 	});
		// 	// console.log(editor._themeService);
		// });
	},
	data: function () {
		return {
			files: Lyte.attr('array', { default: [], watch: true }),
			filesLoaded: Lyte.attr('boolean', { default: false }),
			monaco: Lyte.attr('object'),
			editorThemes: Lyte.attr('array'),
			showPreferenceModal: Lyte.attr('boolean', { default: false }),
			showAboutModal: Lyte.attr('boolean', { default: false }),
			showArchivePanel: Lyte.attr('boolean', { default: false }),
			addFileMenuOptions: Lyte.attr('array', {
				default: [
					{ label: 'New File', icon: 'note_add', action: 'onNewFile', shortcut: '⌃⇧N' },
					{ label: 'New Comparator', icon: 'difference', action: 'onNewComparator', shortcut: '⌃⇧M' },
					{ separator: true },
					{ label: 'Import Files', icon: 'upload_file', action: 'onImportFile', shortcut: '⌃⇧O' }
				]
			}),
			footerMenuOptions: Lyte.attr('array', {
				default: [
					{ label: 'About', icon: 'info_i', action: 'onOpenAbout' },
					{ label: 'Settings', icon: 'settings', action: 'onOpenSettings' }
				]
			})
		};
	},
	actions: {
		onCreateComparatorFileClick() {
			this.FILE_TREE.component.onCreateComparatorFile();
		},
		onCreateFileClick() {
			this.FILE_TREE.component.onCreateFile();
		},
		onAboutClick() {
			this.setData('showAboutModal', true);
		},
		onArchiveClick() {
			this.setData('showArchivePanel', true);
		},
		onPreferenceClick() {
			this.setData('showPreferenceModal', true);
		}
	},
	methods: {
		onNewFile() {
			this.FILE_TREE.component.onCreateFile();
		},
		onNewComparator() {
			this.FILE_TREE.component.onCreateComparatorFile();
		},
		onImportFile() {
			this._triggerFileImport();
		},
		onOpenArchive() {
			this.setData('showArchivePanel', true);
		},
		onOpenAbout() {
			this.setData('showAboutModal', true);
		},
		onOpenSettings() {
			this.setData('showPreferenceModal', true);
		}
	},

	// --- Keyboard Shortcuts ---

	_initKeyboardShortcuts() {
		this._onGlobalKeydown = (e) => {
			if (e.ctrlKey && e.shiftKey && !e.metaKey && !e.altKey) {
				if (e.code === 'KeyN') {
					e.preventDefault();
					e.stopPropagation();
					this.FILE_TREE.component.onCreateFile();
				} else if (e.code === 'KeyM') {
					e.preventDefault();
					e.stopPropagation();
					this.FILE_TREE.component.onCreateComparatorFile();
				} else if (e.code === 'KeyT') {
					e.preventDefault();
					e.stopPropagation();
					this.FILE_TREE.component.restoreArchivedFile();
				} else if (e.code === 'KeyO') {
					e.preventDefault();
					e.stopPropagation();
					this._triggerFileImport();
				}
			}
		};
		// Use capture phase so it fires before Monaco intercepts
		document.addEventListener('keydown', this._onGlobalKeydown, true);
	},

	// --- File Import via Input ---

	_triggerFileImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;
		input.style.display = 'none';
		input.addEventListener('change', (e) => {
			if (e.target.files && e.target.files.length > 0) {
				this._importFiles(e.target.files);
			}
			input.remove();
		});
		document.body.appendChild(input);
		input.click();
	},

	async _importFiles(fileList) {
		const files = this.getData('files');
		const importedFiles = Array.from(fileList);
		const newFiles = [];
		const skippedFiles = [];

		// First pass: read all files
		const readFiles = [];
		for (let i = 0; i < importedFiles.length; i++) {
			const file = importedFiles[i];

			if (file.size > 100 * 1024 * 1024) {
				skippedFiles.push(file.name);
				continue;
			}

			const [title, extension] = this._splitFileName(file.name);
			let content = '';

			try {
				content = await FileContentManager.readFileText(file);
			} catch (err) {
				console.warn('Could not read file (adding with empty content):', file.name, err);
			}

			readFiles.push({ title, extension, content, originalName: file.name });
		}

		// Detect comparator pairs: title.left.ext <-> title.right.ext
		const comparatorLeftRegex = /^(.+)\.left$/;
		const comparatorRightRegex = /^(.+)\.right$/;
		const rightFilesMap = new Map();
		for (const rf of readFiles) {
			const rightMatch = rf.title.match(comparatorRightRegex);
			if (rightMatch) {
				rightFilesMap.set(rightMatch[1] + rf.extension, rf);
			}
		}

		const consumed = new Set();
		for (const rf of readFiles) {
			if (consumed.has(rf)) continue;

			const leftMatch = rf.title.match(comparatorLeftRegex);
			if (leftMatch) {
				const baseTitle = leftMatch[1];
				const rightFile = rightFilesMap.get(baseTitle + rf.extension);
				if (rightFile && !consumed.has(rightFile)) {
					consumed.add(rf);
					consumed.add(rightFile);
					const language = MonacoEditor.getFileLanguageByExtension(rf.extension);
					newFiles.push({
						meta: {
							id: FileManager.getNewFileName(),
							title: baseTitle,
							extension: rf.extension,
							language: language,
							index: newFiles.length,
							isComparator: true
						},
						content: { original: rf.content, modified: rightFile.content }
					});
					continue;
				}
			}

			// Regular file (or unpaired left/right)
			const language = MonacoEditor.getFileLanguageByExtension(rf.extension);
			newFiles.push({
				meta: {
					id: FileManager.getNewFileName(),
					title: rf.title,
					extension: rf.extension,
					language: language,
					index: newFiles.length,
					isComparator: false
				},
				content: rf.content
			});
		}

		if (skippedFiles.length > 0) {
			alert('The following files exceed the 100 MB limit and were skipped:\n\n' + skippedFiles.join('\n'));
		}

		if (newFiles.length === 0) return;

		// Persist new file metadata + content to IndexedDB
		for (let i = 0; i < newFiles.length; i++) {
			const { meta, content } = newFiles[i];
			await FileManager.updateFile(meta);
			await FileContentManager.updateFileContent({ id: meta.id, content: content });
		}

		// Insert at top of file list
		for (let i = 0; i < newFiles.length; i++) {
			Lyte.arrayUtils(files, 'insertAt', i, newFiles[i].meta);
		}

		// Normalize all indices to match array order and persist to DB + localStorage
		await FileManager.updateFilePositions(files, 0, files.length - 1);
		FileManager.saveFileOrder(files);

		// Navigate to the first imported file
		Lyte.Router.transitionTo({
			route: 'index.view',
			dynamicParams: [newFiles[0].meta.id]
		});
	},

	// --- Editor Area External File Drop ---

	_editorDropOverlay: null,
	_editorDragCounter: 0,
	_editorDragOverTimer: null,

	_initEditorAreaDrop() {
		const container = this.$node.querySelector('.editor-area-container');
		if (!container) return;

		container.addEventListener('dragenter', (e) => this._onEditorDragEnter(e));
		container.addEventListener('dragleave', (e) => this._onEditorDragLeave(e));
		container.addEventListener('dragover', (e) => this._onEditorDragOver(e));
		container.addEventListener('drop', (e) => this._onEditorDrop(e));
	},

	_isExternalFileDrag(e) {
		return e.dataTransfer && e.dataTransfer.types.includes('Files');
	},

	_showEditorDropOverlay() {
		const container = this.$node.querySelector('.editor-area-container');
		if (!container || this._editorDropOverlay) return;

		const overlay = document.createElement('div');
		overlay.className = 'editor-drop-overlay';
		overlay.innerHTML =
			'<div class="editor-drop-overlay__content">' +
			'<span class="material-symbols-outlined editor-drop-overlay__icon">upload_file</span>' +
			'<span class="editor-drop-overlay__text">Drop anywhere to import</span>' +
			'</div>';
		container.appendChild(overlay);
		this._editorDropOverlay = overlay;
	},

	_removeEditorDropOverlay() {
		if (this._editorDropOverlay && this._editorDropOverlay.parentNode) {
			this._editorDropOverlay.parentNode.removeChild(this._editorDropOverlay);
		}
		this._editorDropOverlay = null;
	},

	_cleanupEditorDrag() {
		this._editorDragCounter = 0;
		clearTimeout(this._editorDragOverTimer);
		this._editorDragOverTimer = null;
		this._removeEditorDropOverlay();
	},

	_onEditorDragEnter(e) {
		if (!this._isExternalFileDrag(e)) return;
		this._editorDragCounter++;
		if (this._editorDragCounter === 1) {
			this._showEditorDropOverlay();
		}
	},

	_onEditorDragLeave(e) {
		if (!this._isExternalFileDrag(e)) return;
		this._editorDragCounter--;
		const container = this.$node.querySelector('.editor-area-container');
		if (this._editorDragCounter <= 0 || !container.contains(e.relatedTarget)) {
			this._cleanupEditorDrag();
		}
	},

	_onEditorDragOver(e) {
		if (!this._isExternalFileDrag(e)) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';

		// Generic safety net
		clearTimeout(this._editorDragOverTimer);
		this._editorDragOverTimer = setTimeout(() => this._cleanupEditorDrag(), 150);
	},

	_splitFileName(name) {
		const lastDot = name.lastIndexOf('.');
		if (lastDot > 0) {
			return [name.substring(0, lastDot), '.' + name.substring(lastDot + 1)];
		}
		return [name, ''];
	},

	async _onEditorDrop(e) {
		if (!this._isExternalFileDrag(e)) return;
		e.preventDefault();
		this._cleanupEditorDrag();

		// Snapshot File objects synchronously — DataTransfer.files becomes stale after the first await
		const droppedFiles = Array.from(e.dataTransfer.files);
		if (droppedFiles.length === 0) return;

		const files = this.getData('files');
		const newFiles = [];
		const skippedFiles = [];

		// First pass: read all files
		const readFiles = [];
		for (let i = 0; i < droppedFiles.length; i++) {
			const droppedFile = droppedFiles[i];

			if (droppedFile.size > 100 * 1024 * 1024) {
				skippedFiles.push(droppedFile.name);
				continue;
			}

			const [title, extension] = this._splitFileName(droppedFile.name);
			let content = '';

			try {
				content = await FileContentManager.readFileText(droppedFile);
			} catch (err) {
				console.warn('Could not read file (adding with empty content):', droppedFile.name, err);
			}

			readFiles.push({ title, extension, content, originalName: droppedFile.name });
		}

		// Detect comparator pairs: title.left.ext <-> title.right.ext
		const comparatorLeftRegex = /^(.+)\.left$/;
		const comparatorRightRegex = /^(.+)\.right$/;
		const rightFilesMap = new Map();
		for (const rf of readFiles) {
			const rightMatch = rf.title.match(comparatorRightRegex);
			if (rightMatch) {
				rightFilesMap.set(rightMatch[1] + rf.extension, rf);
			}
		}

		const consumed = new Set();
		for (const rf of readFiles) {
			if (consumed.has(rf)) continue;

			const leftMatch = rf.title.match(comparatorLeftRegex);
			if (leftMatch) {
				const baseTitle = leftMatch[1];
				const rightFile = rightFilesMap.get(baseTitle + rf.extension);
				if (rightFile && !consumed.has(rightFile)) {
					consumed.add(rf);
					consumed.add(rightFile);
					const language = MonacoEditor.getFileLanguageByExtension(rf.extension);
					newFiles.push({
						meta: {
							id: FileManager.getNewFileName(),
							title: baseTitle,
							extension: rf.extension,
							language: language,
							index: newFiles.length,
							isComparator: true
						},
						content: { original: rf.content, modified: rightFile.content }
					});
					continue;
				}
			}

			// Regular file (or unpaired left/right)
			const language = MonacoEditor.getFileLanguageByExtension(rf.extension);
			newFiles.push({
				meta: {
					id: FileManager.getNewFileName(),
					title: rf.title,
					extension: rf.extension,
					language: language,
					index: newFiles.length,
					isComparator: false
				},
				content: rf.content
			});
		}

		if (skippedFiles.length > 0) {
			alert('The following files exceed the 100 MB limit and were skipped:\n\n' + skippedFiles.join('\n'));
		}

		if (newFiles.length === 0) return;

		// Persist new file metadata + content to IndexedDB
		for (let i = 0; i < newFiles.length; i++) {
			const { meta, content } = newFiles[i];
			await FileManager.updateFile(meta);
			await FileContentManager.updateFileContent({ id: meta.id, content: content });
		}

		// Insert at top of file list
		for (let i = 0; i < newFiles.length; i++) {
			Lyte.arrayUtils(files, 'insertAt', i, newFiles[i].meta);
		}

		// Normalize all indices to match array order and persist to DB + localStorage
		await FileManager.updateFilePositions(files, 0, files.length - 1);
		FileManager.saveFileOrder(files);

		// Navigate to the first dropped file
		Lyte.Router.transitionTo({
			route: 'index.view',
			dynamicParams: [newFiles[0].meta.id]
		});
	},

	didDestroy() {
		if (this._onGlobalKeydown) {
			document.removeEventListener('keydown', this._onGlobalKeydown, true);
		}
	}
});

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
		FileManager.getAllFiles().then((files) => this.setData('files', files));

		this.FILE_TREE = this.$node.querySelector('#editor-file-tree');
		this._initEditorAreaDrop();
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
			monaco: Lyte.attr('object'),
			editorThemes: Lyte.attr('array'),
			showPreferenceModal: Lyte.attr('boolean', { default: false }),
			showAboutModal: Lyte.attr('boolean', { default: false })
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
		onPreferenceClick() {
			this.setData('showPreferenceModal', true);
		}
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

		const droppedFiles = e.dataTransfer.files;
		if (!droppedFiles || droppedFiles.length === 0) return;

		const files = this.getData('files');
		const newFiles = [];
		const skippedFiles = [];

		for (let i = 0; i < droppedFiles.length; i++) {
			const droppedFile = droppedFiles[i];

			if (droppedFile.size > 100 * 1024 * 1024) {
				skippedFiles.push(droppedFile.name);
				continue;
			}

			try {
				const content = await droppedFile.text();
				const [title, extension] = this._splitFileName(droppedFile.name);
				const language = MonacoEditor.getFileLanguageByExtension(extension);

				const fileJSON = {
					id: FileManager.getNewFileName(),
					title: title,
					extension: extension,
					language: language,
					index: i,
					isComparator: false
				};

				newFiles.push({ meta: fileJSON, content: content });
			} catch (err) {
				console.warn('Could not read file:', droppedFile.name, err);
			}
		}

		if (skippedFiles.length > 0) {
			alert('The following files exceed the 100 MB limit and were skipped:\n\n' + skippedFiles.join('\n'));
		}

		if (newFiles.length === 0) return;

		// Persist to IndexedDB first
		for (let i = 0; i < newFiles.length; i++) {
			const { meta, content } = newFiles[i];
			await FileManager.createFile(files, meta);
			await FileContentManager.updateFileContent({ id: meta.id, content: content });
		}

		// Insert at top of file list
		for (let i = 0; i < newFiles.length; i++) {
			Lyte.arrayUtils(files, 'insertAt', i, newFiles[i].meta);
		}

		// Navigate to the first dropped file
		Lyte.Router.transitionTo({
			route: 'index.view',
			dynamicParams: [newFiles[0].meta.id]
		});
	},

	didDestroy() {}
});

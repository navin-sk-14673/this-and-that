Lyte.Component.register('editor-file-tree', {
	didConnect() {
		Lyte.addEventListener('beforeRouteTransition', ({ history, prevTrans, trans }) =>
			this.__routePageObservable(trans.info)
		);
		this.__routePageObservable(Lyte.Router.getCurrentRouteInfo());

		this.initSortable();
		this.initExternalDrop();
	},
	initSortable() {
		const sortable = this.$node.querySelector('.editor-file-tree-container');
		if (!sortable) {
			return;
		}
		$L(sortable).sortable({
			gridView: true,
			tolerance: 'intersect',
			cancel: '.sortable-item-restrict',
			restrict: '.sortable-field-restrict',

			onEnter: (event, { element, sortable, placeholder }) => {},
			onLeave: (event, { element, sortable, placeholder }) => {},
			onBeforeDrop: (
				element,
				belowElement,
				placeholderElement,
				fromIndex,
				toIndex,
				source,
				destination,
				event
			) => {},
			onDrop: (droppedElement, destination, belowElement, fromIndex, toIndex, source, event) => {
				const files = this.getData('files'),
					file = files[fromIndex];
				Lyte.arrayUtils(files, 'splice', fromIndex, 1);
				Lyte.arrayUtils(files, 'splice', toIndex, 0, file);

				this.executeMethod('onFilesPositionUpdate', fromIndex, toIndex).then((res) => console.log(res));
			}
		});
		this.setData('sortableClass', sortable.getSortableClass());
	},

	// --- External File Drop ---

	_dropPlaceholder: null,
	_dropIndex: 0,
	_dragCounter: 0,
	_dragOverTimer: null,

	initExternalDrop() {
		const dropZone = this.$node;

		this._onDragOver = this._handleDragOver.bind(this);
		this._onDrop = this._handleDrop.bind(this);
		this._onDragEnter = this._handleDragEnter.bind(this);
		this._onDragLeave = this._handleDragLeave.bind(this);

		dropZone.addEventListener('dragover', this._onDragOver);
		dropZone.addEventListener('drop', this._onDrop);
		dropZone.addEventListener('dragenter', this._onDragEnter);
		dropZone.addEventListener('dragleave', this._onDragLeave);
	},

	_isExternalFileDrag(e) {
		return e.dataTransfer && e.dataTransfer.types.includes('Files');
	},

	_cleanupDrag() {
		this._dragCounter = 0;
		clearTimeout(this._dragOverTimer);
		this._dragOverTimer = null;
		this._removePlaceholder();
		this.$node.classList.remove('--external-drag-active');
	},

	_handleDragEnter(e) {
		if (!this._isExternalFileDrag(e)) return;
		this._dragCounter++;
		if (this._dragCounter === 1) {
			this.$node.classList.add('--external-drag-active');
		}
	},

	_handleDragLeave(e) {
		if (!this._isExternalFileDrag(e)) return;
		this._dragCounter--;
		if (this._dragCounter <= 0 || !this.$node.contains(e.relatedTarget)) {
			this._cleanupDrag();
		}
	},

	_handleDragOver(e) {
		if (!this._isExternalFileDrag(e)) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';

		// Generic safety net: if dragover stops firing, the drag ended
		clearTimeout(this._dragOverTimer);
		this._dragOverTimer = setTimeout(() => this._cleanupDrag(), 150);

		const container = this.$node.querySelector('.editor-file-tree-container');
		if (!container) {
			// No files yet — placeholder not needed, will insert at index 0
			this._dropIndex = 0;
			return;
		}

		const items = container.querySelectorAll('editor-file');
		const mouseY = e.clientY;
		let insertIndex = items.length;

		for (let i = 0; i < items.length; i++) {
			const rect = items[i].getBoundingClientRect();
			const midY = rect.top + rect.height / 2;
			if (mouseY < midY) {
				insertIndex = i;
				break;
			}
		}

		this._dropIndex = insertIndex;
		this._updatePlaceholder(container, items, insertIndex);
	},

	_updatePlaceholder(container, items, insertIndex) {
		if (!this._dropPlaceholder) {
			this._dropPlaceholder = document.createElement('div');
			this._dropPlaceholder.className = 'external-drop-placeholder';
		}

		// Insert at the correct position
		if (insertIndex < items.length) {
			container.insertBefore(this._dropPlaceholder, items[insertIndex]);
		} else {
			container.appendChild(this._dropPlaceholder);
		}
	},

	_removePlaceholder() {
		if (this._dropPlaceholder && this._dropPlaceholder.parentNode) {
			this._dropPlaceholder.parentNode.removeChild(this._dropPlaceholder);
		}
		this._dropPlaceholder = null;
	},

	_splitFileName(name) {
		const lastDot = name.lastIndexOf('.');
		if (lastDot > 0) {
			return [name.substring(0, lastDot), '.' + name.substring(lastDot + 1)];
		}
		return [name, ''];
	},

	async _handleDrop(e) {
		if (!this._isExternalFileDrag(e)) return;
		e.preventDefault();
		this._cleanupDrag();

		const droppedFiles = e.dataTransfer.files;
		if (!droppedFiles || droppedFiles.length === 0) return;

		const insertIndex = this._dropIndex;

		const files = this.getData('files');
		const newFiles = [];
		const skippedFiles = [];

		for (let i = 0; i < droppedFiles.length; i++) {
			const droppedFile = droppedFiles[i];

			// Warn and skip files > 100MB
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
					index: insertIndex + i,
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

		// Persist to IndexedDB first (before UI insert, so editors load the content)
		for (let i = 0; i < newFiles.length; i++) {
			const { meta, content } = newFiles[i];
			await FileManager.createFile(files, meta);
			await FileContentManager.updateFileContent({ id: meta.id, content: content });
		}

		// Then insert into Lyte array to trigger UI re-render
		for (let i = 0; i < newFiles.length; i++) {
			Lyte.arrayUtils(files, 'insertAt', insertIndex + i, newFiles[i].meta);
		}

		// Navigate to the first dropped file
		if (newFiles.length > 0) {
			Lyte.Router.transitionTo({
				route: 'index.view',
				dynamicParams: [newFiles[0].meta.id]
			});
		}
	},
	data: function () {
		return {
			files: Lyte.attr('array', { default: [] }),
			activeFileId: Lyte.attr('string'),
			currentThemeIndex: Lyte.attr('number', { default: 0 }),
			sortableClass: Lyte.attr('string')
		};
	},
	actions: {
		onNewFileClick() {
			this.onCreateFile();
		},
		onNewComparatorFileClick() {
			this.onCreateComparatorFile();
		}
	},
	methods: {
		onThemeSelect: (dropdown, selectedOption, optionIndex) => MonacoEditor.setTheme(selectedOption.key),

		// callbacks from editor-file comp
		async onFileCreate(file) {
			const files = this.getData('files');
			return FileManager.createFile(files, file);
		},
		async onFileUpdate(file) {
			return FileManager.updateFile(file);
		},
		async onFilesPositionUpdate(fromIndex, toIndex) {
			const files = this.getData('files');
			[fromIndex, toIndex] = [Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex)];
			return FileManager.updateFilePositions(files, fromIndex, toIndex);
		},
		async onFileRemove(file) {
			const files = this.getData('files');
			for (let i = 0; i < files.length; i++) {
				if (files[i].id == file.id) {
					Lyte.arrayUtils(files, 'removeAt', i, 1);
					return FileManager.deleteFile(file.id);
				}
			}
		}
	},

	createNewFile(isComparator) {
		const files = this.getData('files'),
			file = FileManager.getNewFileJSON(isComparator);
		Lyte.arrayUtils(files, 'insertAt', 0, file);
	},
	onCreateComparatorFile() {
		this.createNewFile(true);
	},
	onCreateFile() {
		this.createNewFile(false);
	},

	__filesObserver: function () {
		if (this.getData('files').length && !this.getData('sortableClass')) {
			Lyte.resolvePromises(this).then(() => this.initSortable());
		}
	}.observes('files.length'),

	__routePageObservable(trans) {
		const fileId = trans.dynamicParams[0];
		this.setData('activeFileId', fileId);

		$L('.editor-area-container').addClass('--on-editor-change');
		setTimeout(() => $L('.editor-area-container').removeClass('--on-editor-change'), 300);
	}
});

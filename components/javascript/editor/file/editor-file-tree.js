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

		// Use capture phase so preventDefault() fires before any child element
		// (e.g. <a> tags inside link-to) can influence the browser's drop decision.
		dropZone.addEventListener('dragover', this._onDragOver, true);
		dropZone.addEventListener('drop', this._onDrop, true);
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
		this._clearEmptyGhost();
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
		e.stopPropagation();
		e.dataTransfer.dropEffect = 'copy';

		// Generic safety net: if dragover stops firing, the drag ended
		clearTimeout(this._dragOverTimer);
		this._dragOverTimer = setTimeout(() => this._cleanupDrag(), 150);

		const container = this.$node.querySelector('.editor-file-tree-container');
		if (!container) {
			// No files yet — show ghost rows matching the number of dragged files
			this._dropIndex = 0;
			this._updateEmptyGhost(e);
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
		this._updatePlaceholder(container, items, insertIndex, e);
	},

	_placeholderFileCount: 0,

	_updatePlaceholder(container, items, insertIndex, e) {
		const fileCount = Math.max(1, (e && e.dataTransfer.items && e.dataTransfer.items.length) || 1);

		if (!this._dropPlaceholder) {
			this._dropPlaceholder = document.createElement('div');
			this._dropPlaceholder.className = 'external-drop-placeholder';
		}

		// Rebuild rows if file count changed
		if (fileCount !== this._placeholderFileCount) {
			this._dropPlaceholder.innerHTML = '';
			const textWidths = [55, 70, 45, 82, 60, 50, 75];
			for (let i = 0; i < fileCount; i++) {
				const row = document.createElement('div');
				row.className = 'external-drop-placeholder__row';
				row.innerHTML =
					'<div class="external-drop-placeholder__icon"></div>' +
					'<div class="external-drop-placeholder__text" style="width: ' +
					textWidths[i % textWidths.length] +
					'%"></div>';
				this._dropPlaceholder.appendChild(row);
			}
			this._placeholderFileCount = fileCount;
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
		this._placeholderFileCount = 0;
	},

	_emptyGhostCount: 0,

	_updateEmptyGhost(e) {
		const ghost = this.$node.querySelector('.editor-file-tree-empty-drop-ghost');
		if (!ghost) return;

		const fileCount = Math.max(1, (e.dataTransfer.items && e.dataTransfer.items.length) || 1);
		if (fileCount === this._emptyGhostCount) return;

		// Rebuild rows to match dragged file count
		ghost.innerHTML = '';
		const textWidths = [55, 70, 45, 82, 60, 50, 75];
		for (let i = 0; i < fileCount; i++) {
			const row = document.createElement('div');
			row.className = 'editor-file-tree-empty-drop-ghost__row';
			row.innerHTML =
				'<div class="editor-file-tree-empty-drop-ghost__icon"></div>' +
				'<div class="editor-file-tree-empty-drop-ghost__text" style="width: ' +
				textWidths[i % textWidths.length] +
				'%"></div>';
			ghost.appendChild(row);
		}
		this._emptyGhostCount = fileCount;
	},

	_clearEmptyGhost() {
		const ghost = this.$node.querySelector('.editor-file-tree-empty-drop-ghost');
		if (ghost) {
			ghost.innerHTML =
				'<div class="editor-file-tree-empty-drop-ghost__row">' +
				'<div class="editor-file-tree-empty-drop-ghost__icon"></div>' +
				'<div class="editor-file-tree-empty-drop-ghost__text"></div>' +
				'</div>';
		}
		this._emptyGhostCount = 0;
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
		e.stopPropagation();

		// Capture drop position before cleanup (cleanup doesn't reset _dropIndex,
		// but reading it first is safer in case _cleanupDrag ever changes)
		const insertIndex = this._dropIndex;
		this._cleanupDrag();

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

			// Warn and skip files > 100MB
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
		for (const file of readFiles) {
			const rightMatch = file.title.match(comparatorRightRegex);
			if (rightMatch) {
				rightFilesMap.set(rightMatch[1] + file.extension, file);
			}
		}

		const consumed = new Set();
		for (const file of readFiles) {
			if (consumed.has(file)) continue;

			const leftMatch = file.title.match(comparatorLeftRegex);
			if (leftMatch) {
				const baseTitle = leftMatch[1];
				const rightFile = rightFilesMap.get(baseTitle + file.extension);
				if (rightFile && !consumed.has(rightFile)) {
					consumed.add(file);
					consumed.add(rightFile);
					const language = MonacoEditor.getFileLanguageByExtension(file.extension);
					newFiles.push({
						meta: {
							id: FileManager.getNewFileName(),
							title: baseTitle,
							extension: file.extension,
							language: language,
							index: insertIndex + newFiles.length,
							isComparator: true
						},
						content: { original: file.content, modified: rightFile.content }
					});
					continue;
				}
			}

			// Regular file (or unpaired left/right)
			const language = MonacoEditor.getFileLanguageByExtension(file.extension);
			newFiles.push({
				meta: {
					id: FileManager.getNewFileName(),
					title: file.title,
					extension: file.extension,
					language: language,
					index: insertIndex + newFiles.length,
					isComparator: false
				},
				content: file.content
			});
		}

		if (skippedFiles.length > 0) {
			alert('The following files exceed the 100 MB limit and were skipped:\n\n' + skippedFiles.join('\n'));
		}

		if (newFiles.length === 0) return;

		// Persist new file metadata + content to IndexedDB (before UI insert, so editors can load)
		for (let i = 0; i < newFiles.length; i++) {
			const { meta, content } = newFiles[i];
			await FileManager.updateFile(meta);
			await FileContentManager.updateFileContent({ id: meta.id, content: content });
		}

		// Insert into Lyte array at the drop position
		for (let i = 0; i < newFiles.length; i++) {
			Lyte.arrayUtils(files, 'insertAt', insertIndex + i, newFiles[i].meta);
		}

		// Normalize all indices to match array order and persist to DB + localStorage
		await FileManager.updateFilePositions(files, 0, files.length - 1);
		FileManager.saveFileOrder(files);

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
			filesLoaded: Lyte.attr('boolean', { default: false }),
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
		},
		onImportFilesClick() {
			this._triggerFileImport();
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
					const fileData = { ...files[i], index: i };
					Lyte.arrayUtils(files, 'removeAt', i, 1);
					return FileManager.archiveFile(fileData);
				}
			}
		}
	},

	async restoreArchivedFile() {
		const restoredFile = await FileManager.restoreLastArchivedFile();
		if (!restoredFile) return false;

		const files = this.getData('files');
		const insertIndex = Math.min(restoredFile.index, files.length);

		// Re-insert into the Lyte array at the original position (clamped)
		Lyte.arrayUtils(files, 'insertAt', insertIndex, restoredFile);

		// Update positions for affected files in IndexedDB
		for (let i = insertIndex; i < files.length; i++) {
			files[i].index = i;
			await FileManager.updateFile(files[i]);
		}

		// Navigate to the restored file
		Lyte.Router.transitionTo({
			route: 'index.view',
			dynamicParams: [restoredFile.id]
		});

		return true;
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

	_triggerFileImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;
		input.style.display = 'none';

		input.addEventListener('change', async () => {
			const selectedFiles = Array.from(input.files);
			if (selectedFiles.length === 0) return;

			const files = this.getData('files');
			const newFiles = [];
			const skippedFiles = [];

			// First pass: read all files and detect comparator pairs
			const readFiles = [];
			for (let i = 0; i < selectedFiles.length; i++) {
				const selected = selectedFiles[i];

				if (selected.size > 100 * 1024 * 1024) {
					skippedFiles.push(selected.name);
					continue;
				}

				const [title, extension] = this._splitFileName(selected.name);
				let content = '';

				try {
					content = await FileContentManager.readFileText(selected);
				} catch (err) {
					console.warn('Could not read file (adding with empty content):', selected.name, err);
				}

				readFiles.push({ title, extension, content, originalName: selected.name });
			}

			// Detect comparator pairs: title.left.ext <-> title.right.ext
			const comparatorLeftRegex = /^(.+)\.left$/;
			const comparatorRightRegex = /^(.+)\.right$/;

			// Build a map of right-side files keyed by "baseTitle + extension"
			const rightFilesMap = new Map();
			for (const file of readFiles) {
				const rightMatch = file.title.match(comparatorRightRegex);
				if (rightMatch) {
					const key = rightMatch[1] + file.extension;
					rightFilesMap.set(key, file);
				}
			}

			// Track which files have been consumed as part of a comparator pair
			const consumed = new Set();

			for (const file of readFiles) {
				if (consumed.has(file)) continue;

				const leftMatch = file.title.match(comparatorLeftRegex);
				if (leftMatch) {
					const baseTitle = leftMatch[1];
					const key = baseTitle + file.extension;
					const rightFile = rightFilesMap.get(key);

					if (rightFile && !consumed.has(rightFile)) {
						// Couple into a comparator file
						consumed.add(file);
						consumed.add(rightFile);

						const language = MonacoEditor.getFileLanguageByExtension(file.extension);
						const fileJSON = {
							id: FileManager.getNewFileName(),
							title: baseTitle,
							extension: file.extension,
							language: language,
							index: newFiles.length,
							isComparator: true
						};
						const comparatorContent = {
							original: file.content,
							modified: rightFile.content
						};
						newFiles.push({ meta: fileJSON, content: comparatorContent });
						continue;
					}
				}

				// Regular file (or unpaired left/right)
				const language = MonacoEditor.getFileLanguageByExtension(file.extension);
				const fileJSON = {
					id: FileManager.getNewFileName(),
					title: file.title,
					extension: file.extension,
					language: language,
					index: newFiles.length,
					isComparator: false
				};
				newFiles.push({ meta: fileJSON, content: file.content });
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

			for (let i = 0; i < newFiles.length; i++) {
				Lyte.arrayUtils(files, 'insertAt', i, newFiles[i].meta);
			}

			// Normalize all indices to match array order and persist to DB + localStorage
			await FileManager.updateFilePositions(files, 0, files.length - 1);
			FileManager.saveFileOrder(files);

			if (newFiles.length > 0) {
				Lyte.Router.transitionTo({
					route: 'index.view',
					dynamicParams: [newFiles[0].meta.id]
				});
			}

			input.remove();
		});

		document.body.appendChild(input);
		input.click();
	},

	__filesObserver: function () {
		if (this.getData('filesLoaded') && this.getData('files').length && !this.getData('sortableClass')) {
			Lyte.resolvePromises(this).then(() => this.initSortable());
		}
	}.observes('files.length', 'filesLoaded'),

	__routePageObservable(trans) {
		const fileId = trans.dynamicParams[0];
		this.setData('activeFileId', fileId);

		$L('.editor-area-container').addClass('--on-editor-change');
		setTimeout(() => $L('.editor-area-container').removeClass('--on-editor-change'), 300);
	}
});

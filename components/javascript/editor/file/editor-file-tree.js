Lyte.Component.register('editor-file-tree', {
	didConnect() {
		Lyte.addEventListener('beforeRouteTransition', ({ history, prevTrans, trans }) =>
			this.__routePageObservable(trans.info)
		);
		this.__routePageObservable(Lyte.Router.getCurrentRouteInfo());

		this.initSortable();
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

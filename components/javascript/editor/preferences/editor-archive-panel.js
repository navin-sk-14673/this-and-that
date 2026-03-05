Lyte.Component.register('editor-archive-panel', {
	didConnect() {
		this._updateModalPosition();
		this._loadArchivedFiles();

		// Keep wrapper class in sync whenever sidebar position changes
		this._positionObserver = new MutationObserver(() => {
			this._updateModalPosition();
		});
		this._positionObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-tree-position']
		});
	},

	didDestroy() {
		if (this._positionObserver) {
			this._positionObserver.disconnect();
			this._positionObserver = null;
		}
	},

	data: function () {
		return {
			ltPropShow: Lyte.attr('boolean', { default: false }),
			files: Lyte.attr('array', { default: [] }),
			archivedFiles: Lyte.attr('array', { default: [] }),
			loaded: Lyte.attr('boolean', { default: false }),
			archivePanelWrapperClass: Lyte.attr('string', {
				default: 'clsc-modal-base clsc-modal-left archive-panel-modal'
			}),
			showDeleteAllModal: Lyte.attr('boolean', { default: false }),
			showToast: Lyte.attr('boolean', { default: false }),
			toastMessage: Lyte.attr('string', { default: '' }),
			toastType: Lyte.attr('string', { default: 'success' }),
			toastIcon: Lyte.attr('string', { default: 'check_circle' })
		};
	},

	actions: {
		async onRestoreClick(archivedFile) {
			const restoredFile = await FileManager.restoreArchivedFileById(archivedFile.id);
			if (!restoredFile) return;

			// Remove from the archived list
			const archived = this.getData('archivedFiles');
			for (let i = 0; i < archived.length; i++) {
				if (archived[i].id === archivedFile.id) {
					Lyte.arrayUtils(archived, 'removeAt', i, 1);
					break;
				}
			}

			// Insert into active files at the clamped original position
			const files = this.getData('files');
			const insertIndex = Math.min(restoredFile.index, files.length);
			Lyte.arrayUtils(files, 'insertAt', insertIndex, restoredFile);

			// Update positions in IndexedDB
			for (let i = insertIndex; i < files.length; i++) {
				files[i].index = i;
				FileManager.updateFile(files[i]);
			}

			// Navigate to restored file
			Lyte.Router.transitionTo({
				route: 'index.view',
				dynamicParams: [restoredFile.id]
			});
		},

		async onDeleteClick(archivedFile) {
			const success = await FileManager.permanentDeleteArchivedFile(archivedFile.id);
			if (!success) return;

			const archived = this.getData('archivedFiles');
			for (let i = 0; i < archived.length; i++) {
				if (archived[i].id === archivedFile.id) {
					Lyte.arrayUtils(archived, 'removeAt', i, 1);
					break;
				}
			}
		},

		onDeleteAllClick() {
			this.setData('showDeleteAllModal', true);
		},

		onDeleteAllCancel() {
			this.setData('showDeleteAllModal', false);
		},

		async onDeleteAllConfirm() {
			const count = this.getData('archivedFiles').length;
			const success = await FileManager.deleteAllArchivedFiles();

			this.setData('showDeleteAllModal', false);

			if (success) {
				this.setData('archivedFiles', []);
				this.setData('toastMessage', count + (count === 1 ? ' file' : ' files') + ' deleted');
				this.setData('toastType', 'success');
				this.setData('toastIcon', 'check_circle');
				this.setData('showToast', true);
			}
		}
	},

	methods: {},

	// Reload archived files whenever the panel is shown
	__showObserver: function () {
		if (this.getData('ltPropShow')) {
			this._loadArchivedFiles();
		}
	}.observes('ltPropShow'),

	_getAutoDeleteLabel(deletedAt) {
		const msPerDay = 24 * 60 * 60 * 1000;
		const daysElapsed = (Date.now() - deletedAt) / msPerDay;
		const daysRemaining = Math.max(0, Math.ceil(7 - daysElapsed));

		if (daysRemaining <= 0) return 'Expiring soon';
		if (daysRemaining === 1) return 'Auto-deletes in 1 day';
		return daysRemaining + ' days';
	},

	_updateModalPosition() {
		var isRight = document.documentElement.getAttribute('data-tree-position') === 'right';
		var dirClass = !isRight ? 'clsc-modal-right' : 'clsc-modal-left';
		this.setData('archivePanelWrapperClass', 'clsc-modal-base ' + dirClass + ' archive-panel-modal');
	},

	async _loadArchivedFiles() {
		this.setData('loaded', false);
		const archived = await FileManager.getAllArchivedFiles();
		archived.forEach((file) => {
			file.autoDeleteLabel = this._getAutoDeleteLabel(file.deletedAt);
		});
		this.setData('archivedFiles', archived);
		this.setData('loaded', true);
	}
});

Lyte.Component.register('editor-file', {
	STATES: {
		CREATE: 'create',
		DEFAULT: 'defaut'
	},
	didConnect() {
		const file = this.getData('file');
		this.setData('state', file.isCreate ? this.STATES.CREATE : this.STATES.DEFAULT);
	},
	data: function () {
		return {
			state: Lyte.attr('string', { default: this.STATES.DEFAULT }),
			file: Lyte.attr('object'),
			__prevFile: Lyte.attr('object', { default: { title: '', extension: '' } }),
			fileIndex: Lyte.attr('number')
		};
	},
	actions: {
		onDoubleClick() {
			this.setData('state', this.STATES.CREATE);
		},
		onFileRemove() {
			this.removeFile();
		}
	},
	methods: {
		onFileNameBlur() {
			this.setData('__prevFile.title', '');
			this.setData('__prevFile.extension', '');
			this.setData('state', this.STATES.DEFAULT);

			const file = this.getData('file');

			if (file.isDelete) {
				this.removeFile();
			} else if (file.isCreate) {
				this.executeMethod('onFileCreate').then((res) => {
					Lyte.objectUtils(file, 'delete', 'isCreate');
					Lyte.Router.transitionTo({
						route: 'index.view',
						dynamicParams: [file.id]
					});
					// console.log(res);
				});
			} else {
				this.executeMethod('onFileUpdate').then((res) => {
					// Lyte.Router.transitionTo({
					// 	route: 'index.view',
					// 	dynamicParams: [file.id]
					// });
				});
			}
		},
		onFileNameFocus() {
			const file = this.getData('file'),
				fileTitle = file.title,
				fileExtension = file.extension,
				input = this.$node.querySelector('clsc-input').component;

			this.setData('__prevFile.title', fileTitle);
			this.setData('__prevFile.extension', fileExtension);

			input.setSelectionRange(0, fileTitle.length);
		},
		onFileNameChange({ newValue: value }) {
			const [fileName, extension] = this.splitStringByLastPeriod(value);
			this.setData('file.title', fileName);
			this.setData('file.extension', extension);
			this.setData('file.language', MonacoEditor.getFileLanguageByExtension(extension));
		},
		onFileNameKeyup(event) {
			const value = event.target.value;
			if (event.key == 'Escape') {
				const file = this.getData('file');
				if (file.isCreate) {
					this.setData('file.title', '');
					this.setData('file.isDelete', true);
				} else {
					const prevFile = this.getData('__prevFile');
					this.setData('file.title', prevFile.title);
					this.setData('file.extension', prevFile.extension);
				}
				document.activeElement.blur();
			} else if (event.key == 'Enter') {
				document.activeElement.blur();
			}
		}
	},

	removeFile() {
		this.executeMethod('onFileRemove').then((res) => console.log(res));
	},

	splitStringByLastPeriod(str) {
		const lastPeriodIndex = str.lastIndexOf('.');
		if (lastPeriodIndex != -1) {
			const part1 = str.substring(0, lastPeriodIndex);
			const part2 = '.' + str.substring(lastPeriodIndex + 1);
			return [part1, part2];
		}
		return [str, ''];
	},

	__fileIndexObservable: function ({ newValue: index }) {
		this.setData('file.index', index);
	}.observes('fileIndex')
});

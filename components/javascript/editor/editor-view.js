Lyte.Component.register('editor-view', {
	async didConnect() {
		const file = this.getData('file');

		return FileContentManager.getFileContent(file.id).then((fileContent) => {
			const container = this.$node.querySelector('.editor-view-container');
			if (file.isComparator) {
				const diffEditor = monaco.editor.createDiffEditor(container, {
					...MonacoEditor.DEFAULT_CONF.getComparableFileEditorConf(),
					...{
						language: file.language
					}
				});

				const content = fileContent.content,
					originalCode = content.original,
					modifiedCode = content.modified;

				const originalModel = monaco.editor.createModel(originalCode, file.language),
					modifiedModel = monaco.editor.createModel(modifiedCode, file.language);

				diffEditor.setModel({
					original: originalModel,
					modified: modifiedModel
				});
				diffEditor.onDidUpdateDiff(() =>
					this.saveComparableFileContent(
						diffEditor.getOriginalEditor().getValue(),
						diffEditor.getModifiedEditor().getValue()
					)
				);
				diffEditor.getOriginalEditor().onContextMenu((e) => {
					e.event.preventDefault();
					e.event.stopPropagation();
					const { clientX, clientY } = e.event.browserEvent;
					console.log(clientX, clientY);

					// openCustomContextMenu(clientX, clientY);
				});
				this.DIFF_EDITOR = diffEditor;
			} else {
				const editor = monaco.editor.create(container, {
					...MonacoEditor.DEFAULT_CONF.getFileEditorConf(),
					...{
						language: file.language
					}
				});

				const value = fileContent.content;
				editor.setValue(value);

				editor.onDidChangeModelContent(() => {
					this.saveFileContent(editor.getValue());
				});

				// Options update
				// const options = editor.getOptions();
				// options.wordWrap = 'off';
				// editor.updateOptions(options);

				editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => console.log('hello world'));
				editor.focus();
				this.EDITOR = editor;
			}
		});
	},
	data: function () {
		return {
			isActive: Lyte.attr('boolean'),
			file: Lyte.attr('object'),
			monaco: Lyte.attr('object')
		};
	},
	actions: {},
	methods: {},

	saveFileContent(content) {
		const fileId = this.getData('file.id');
		FileContentManager.updateFileContent({
			id: fileId,
			content: content
		});
	},
	saveComparableFileContent(originalEditorContent, modifiedEditorContent) {
		const fileId = this.getData('file.id');
		FileContentManager.updateFileContent({
			id: fileId,
			content: {
				original: originalEditorContent,
				modified: modifiedEditorContent
			}
		});
	},

	__fileExtensionObservable: function () {
		const fileLanguage = this.getData('file.language');
		if (this.EDITOR) {
			monaco.editor.setModelLanguage(this.EDITOR.getModel(), fileLanguage);
		} else if (this.DIFF_EDITOR) {
			const { original, modified } = this.DIFF_EDITOR.getModel();
			monaco.editor.setModelLanguage(original, fileLanguage);
			monaco.editor.setModelLanguage(modified, fileLanguage);
		}
	}.observes('file.language'),

	__isActiveObservable: function () {
		const isActive = this.getData('isActive');
		if (isActive && this.EDITOR) {
			this.EDITOR.focus();
		}
	}
		.observes('isActive')
		.on('didConnect')
});

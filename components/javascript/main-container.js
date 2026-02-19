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
			editorThemes: Lyte.attr('array')
		};
	},
	actions: {
		onCreateComparatorFileClick() {
			this.FILE_TREE.component.onCreateComparatorFile();
		},
		onCreateFileClick() {
			this.FILE_TREE.component.onCreateFile();
		}
	},
	methods: {},

	didDestroy() {
		alert();
	}
});

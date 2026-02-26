Lyte.Component.register('editor-user-preference-modal', {
	APP_PREF_KEY: 'penpal-app-prefs',
	EDITOR_PREF_KEY: 'penpal-editor-prefs',

	THEMES: {
		SYSTEM: 'system',
		LIGHT: 'light',
		DARK: 'dark'
	},

	EDITOR_DEFAULTS: {
		wordWrap: true,
		lineNumbers: true,
		minimap: true,
		stickyScroll: true,
		tabSize: 4
	},

	didConnect() {
		// Load app preferences
		const appPrefs = this.getAppPrefs();
		this.setData('selectedTheme', appPrefs.theme);
		this.applyTheme(appPrefs.theme);
		this.setData('selectedTreePosition', appPrefs.treePosition || 'left');
		this.applyTreePosition(appPrefs.treePosition || 'left');

		// Load editor preferences
		const editorPrefs = this.getEditorPrefs();
		this.setData('wordWrap', editorPrefs.wordWrap);
		this.setData('lineNumbers', editorPrefs.lineNumbers);
		this.setData('minimap', editorPrefs.minimap);
		this.setData('stickyScroll', editorPrefs.stickyScroll);
		this.setData('selectedTabSize', String(editorPrefs.tabSize));
	},

	data: function () {
		return {
			ltPropShow: Lyte.attr('boolean', { default: false }),
			files: Lyte.attr('array', { default: [] }),
			selectedTheme: Lyte.attr('string', { default: 'system' }),
			themeOptions: Lyte.attr('array', {
				default: [
					{ value: 'system', label: 'System', icon: 'desktop_windows' },
					{ value: 'light', label: 'Light', icon: 'light_mode' },
					{ value: 'dark', label: 'Dark', icon: 'dark_mode' }
				]
			}),
			selectedTabSize: Lyte.attr('string', { default: '4' }),
			tabSizeOptions: Lyte.attr('array', {
				default: [
					{ value: '2', label: '2' },
					{ value: '4', label: '4' },
					{ value: '8', label: '8' }
				]
			}),
			wordWrap: Lyte.attr('boolean', { default: true }),
			lineNumbers: Lyte.attr('boolean', { default: true }),
			minimap: Lyte.attr('boolean', { default: true }),
			stickyScroll: Lyte.attr('boolean', { default: true }),
			selectedTreePosition: Lyte.attr('string', { default: 'left' }),
			treePositionOptions: Lyte.attr('array', {
				default: [
					{ value: 'left', label: 'Left', icon: 'align_horizontal_left' },
					{ value: 'right', label: 'Right', icon: 'align_horizontal_right' }
				]
			}),
			showClearDataModal: Lyte.attr('boolean', { default: false })
		};
	},

	actions: {
		onExportClick() {
			this._exportAsZip();
		},
		onClearDataClick() {
			this.setData('showClearDataModal', true);
		},
		onClearDataCancel() {
			this.setData('showClearDataModal', false);
		},
		onClearDataConfirm() {
			this.setData('showClearDataModal', false);
			FileManager.clearAllFileData().then(() => {
				this.setData('ltPropShow', false);
				window.location.reload();
			});
		}
	},

	methods: {},

	// --- Export as ZIP ---

	async _exportAsZip() {
		try {
			const files = this.getData('files');
			if (!files || files.length === 0) return;

			const zip = new JSZip();
			const usedNames = {};

			// Helper to get a unique filename
			const getUniqueName = (name) => {
				if (!usedNames[name]) {
					usedNames[name] = 1;
					return name;
				}
				let counter = usedNames[name];
				usedNames[name] = counter + 1;

				// Insert counter before extension
				const dotIndex = name.lastIndexOf('.');
				if (dotIndex > 0) {
					return name.slice(0, dotIndex) + ' (' + counter + ')' + name.slice(dotIndex);
				}
				return name + ' (' + counter + ')';
			};

			// Build metadata array (no content)
			const metaFiles = files.map((file) => ({
				id: file.id,
				title: file.title,
				extension: file.extension,
				language: file.language,
				index: file.index,
				isComparator: file.isComparator
			}));

			// Add each file's content to the ZIP
			for (const file of files) {
				const contentRecord = await FileContentManager.getFileContent(file.id);
				const ext = file.extension || '';
				const baseTitle = file.title || 'untitled';

				if (file.isComparator) {
					let original = '';
					let modified = '';
					try {
						const raw = contentRecord ? contentRecord.content : '';
						const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
						original = parsed.original || '';
						modified = parsed.modified || '';
					} catch (e) {
						// fallback if parsing fails
					}

					const leftName = getUniqueName(baseTitle + '.left' + ext);
					const rightName = getUniqueName(baseTitle + '.right' + ext);
					zip.file(leftName, original);
					zip.file(rightName, modified);
				} else {
					const fileName = getUniqueName(baseTitle + ext);
					zip.file(fileName, contentRecord ? contentRecord.content || '' : '');
				}
			}

			// Add metadata
			zip.file(
				'codepal.meta.json',
				JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), files: metaFiles }, null, 2)
			);

			// Generate and trigger download
			const blob = await zip.generateAsync({ type: 'blob' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'codepal-export.zip';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (e) {
			console.error('Export failed:', e);
		}
	},

	// Observers
	onWordWrapChange: function () {
		const val = this.getData('wordWrap');
		this.saveEditorPrefs({ wordWrap: val });
		this.applyEditorOption('wordWrap', val ? 'on' : 'off');
	}.observes('wordWrap'),

	onLineNumbersChange: function () {
		const val = this.getData('lineNumbers');
		this.saveEditorPrefs({ lineNumbers: val });
		this.applyEditorOption('lineNumbers', val ? 'on' : 'off');
	}.observes('lineNumbers'),

	onMinimapChange: function () {
		const val = this.getData('minimap');
		this.saveEditorPrefs({ minimap: val });
		this.applyEditorOption('minimap', { enabled: val });
	}.observes('minimap'),

	onStickyScrollChange: function () {
		const val = this.getData('stickyScroll');
		this.saveEditorPrefs({ stickyScroll: val });
		this.applyEditorOption('stickyScroll', { enabled: val });
	}.observes('stickyScroll'),

	onThemeChange: function () {
		const theme = this.getData('selectedTheme');
		this.saveAppPrefs({ theme });
		this.applyTheme(theme);
	}.observes('selectedTheme'),

	onTabSizeChange: function () {
		const val = parseInt(this.getData('selectedTabSize'), 10);
		this.saveEditorPrefs({ tabSize: val });
		this.applyEditorOption('tabSize', val);
	}.observes('selectedTabSize'),

	onTreePositionChange: function () {
		const position = this.getData('selectedTreePosition');
		this.saveAppPrefs({ treePosition: position });
		this.applyTreePosition(position);
	}.observes('selectedTreePosition'),

	// --- Storage helpers ---

	getAppPrefs() {
		try {
			const raw = localStorage.getItem(this.APP_PREF_KEY);
			return raw ? JSON.parse(raw) : { theme: this.THEMES.SYSTEM };
		} catch (e) {
			return { theme: this.THEMES.SYSTEM };
		}
	},

	saveAppPrefs(partial) {
		const prefs = { ...this.getAppPrefs(), ...partial };
		localStorage.setItem(this.APP_PREF_KEY, JSON.stringify(prefs));
	},

	getEditorPrefs() {
		try {
			const raw = localStorage.getItem(this.EDITOR_PREF_KEY);
			return raw ? { ...this.EDITOR_DEFAULTS, ...JSON.parse(raw) } : { ...this.EDITOR_DEFAULTS };
		} catch (e) {
			return { ...this.EDITOR_DEFAULTS };
		}
	},

	saveEditorPrefs(partial) {
		const prefs = { ...this.getEditorPrefs(), ...partial };
		localStorage.setItem(this.EDITOR_PREF_KEY, JSON.stringify(prefs));
	},

	// --- Theme application ---

	applyTheme(theme) {
		const root = document.documentElement;
		let isDark;

		root.removeAttribute('data-theme');

		if (theme === this.THEMES.SYSTEM) {
			isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			root.setAttribute('data-theme', isDark ? 'dark' : 'light');
		} else {
			isDark = theme === this.THEMES.DARK;
			root.setAttribute('data-theme', theme);
		}

		this.applyMonacoTheme(isDark);
	},

	applyMonacoTheme(isDark) {
		try {
			if (MonacoEditor.IS_RESOLVED) {
				monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
			}
		} catch (e) {
			// Monaco not loaded yet
		}
	},

	applyTreePosition(position) {
		document.documentElement.setAttribute('data-tree-position', position);
	},

	// --- Editor options application ---

	applyEditorOption(key, value) {
		try {
			if (!MonacoEditor.IS_RESOLVED) return;

			const editors = monaco.editor.getEditors();
			const diffEditors = monaco.editor.getDiffEditors();

			const isModelOption = key === 'tabSize';

			if (isModelOption) {
				editors.forEach((editor) => {
					const model = editor.getModel();
					if (model) model.updateOptions({ [key]: value });
				});
				diffEditors.forEach((diffEditor) => {
					const original = diffEditor.getOriginalEditor().getModel();
					const modified = diffEditor.getModifiedEditor().getModel();
					if (original) original.updateOptions({ [key]: value });
					if (modified) modified.updateOptions({ [key]: value });
				});
			} else {
				const options = { [key]: value };
				editors.forEach((editor) => editor.updateOptions(options));
				diffEditors.forEach((diffEditor) => {
					diffEditor.updateOptions(options);
				});
			}
		} catch (e) {
			// Monaco not loaded yet
		}
	},

	// --- System theme listener ---

	__systemThemeListener: null,

	__selectedThemeObservable: function () {
		const theme = this.getData('selectedTheme');

		if (this.__systemThemeListener) {
			window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.__systemThemeListener);
			this.__systemThemeListener = null;
		}

		if (theme === this.THEMES.SYSTEM) {
			this.__systemThemeListener = (e) => {
				document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
				this.applyMonacoTheme(e.matches);
			};
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.__systemThemeListener);
		}
	}.observes('selectedTheme')
});

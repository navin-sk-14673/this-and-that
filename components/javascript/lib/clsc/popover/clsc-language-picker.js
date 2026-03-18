Lyte.Component.register('clsc-language-picker', {
	data: function () {
		return {
			isOpen: Lyte.attr('boolean', { default: false }),
			posX: Lyte.attr('number', { default: 0 }),
			posY: Lyte.attr('number', { default: 0 }),
			searchText: Lyte.attr('string', { default: '' }),
			languages: Lyte.attr('array', { default: [] }),
			filteredLanguages: Lyte.attr('array', { default: [] }),
			focusedIndex: Lyte.attr('number', { default: 0 }),
			__contextFile: Lyte.attr('object', { default: null })
		};
	},

	didConnect() {
		this._onDocClick = (e) => {
			if (this.getData('isOpen') && !this.$node.contains(e.target)) {
				this.close();
			}
		};
		this._onDocKeydown = (e) => {
			if (e.key === 'Escape') {
				this.close();
			}
		};

		document.addEventListener('click', this._onDocClick, true);
		document.addEventListener('keydown', this._onDocKeydown);
	},

	didDestroy() {
		document.removeEventListener('click', this._onDocClick, true);
		document.removeEventListener('keydown', this._onDocKeydown);
	},

	_ensureLanguages() {
		if (this.getData('languages').length > 0) return;
		const monacoLangs = monaco.languages.getLanguages();
		const languages = monacoLangs
			.filter((lang) => !lang.id.startsWith('freemarker2.tag-'))
			.map((lang) => ({
				id: lang.id,
				name: lang.aliases && lang.aliases.length > 0 ? lang.aliases[0] : lang.id
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
		this.setData('languages', languages);
	},

	open(x, y, file) {
		this._ensureLanguages();
		this.setData('__contextFile', file);
		this.setData('posX', x);
		this.setData('posY', y);
		this.setData('searchText', '');
		this.setData('filteredLanguages', this.getData('languages'));
		this.setData('focusedIndex', 0);
		this.setData('isOpen', true);

		requestAnimationFrame(() => {
			const el = this.$node.querySelector('.clsc-language-picker');
			if (!el) return;

			const rect = el.getBoundingClientRect();
			const vw = window.innerWidth;
			const vh = window.innerHeight;

			if (rect.right > vw) {
				this.setData('posX', x - rect.width);
			}
			if (rect.bottom > vh) {
				this.setData('posY', Math.max(8, y - rect.height));
			}

			const input = el.querySelector('.clsc-language-picker__input');
			if (input) input.focus();
			this._renderIcons();
		});
	},

	close() {
		this.setData('isOpen', false);
		this.setData('__contextFile', null);
	},

	actions: {
		onSearchInput(event) {
			const text = event.target.value.toLowerCase();
			this.setData('searchText', text);
			const all = this.getData('languages');
			if (!text) {
				this.setData('filteredLanguages', all);
			} else {
				this.setData(
					'filteredLanguages',
					all.filter((lang) => lang.name.toLowerCase().includes(text) || lang.id.toLowerCase().includes(text))
				);
			}
			this.setData('focusedIndex', 0);
			requestAnimationFrame(() => this._renderIcons());
		},

		onKeydown(event) {
			const filtered = this.getData('filteredLanguages');
			let idx = this.getData('focusedIndex');

			if (event.key === 'ArrowDown') {
				event.preventDefault();
				idx = Math.min(idx + 1, filtered.length - 1);
				this.setData('focusedIndex', idx);
				this._scrollToFocused();
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				idx = Math.max(idx - 1, 0);
				this.setData('focusedIndex', idx);
				this._scrollToFocused();
			} else if (event.key === 'Enter') {
				event.preventDefault();
				if (filtered[idx]) {
					this._selectLanguage(filtered[idx]);
				}
			}
		},

		onItemClick(index) {
			const filtered = this.getData('filteredLanguages');
			if (filtered[index]) {
				this._selectLanguage(filtered[index]);
			}
		}
	},

	methods: {},

	_selectLanguage(lang) {
		const file = this.getData('__contextFile');
		this.close();
		if (file && this.getMethods('onLanguageSelected')) {
			this.executeMethod('onLanguageSelected', lang, file);
		}
	},

	_scrollToFocused() {
		requestAnimationFrame(() => {
			const list = this.$node.querySelector('.clsc-language-picker__list');
			const focused = list && list.querySelector('.--focused');
			if (focused) {
				focused.scrollIntoView({ block: 'nearest' });
			}
		});
	},

	_renderIcons() {
		if (!this._langExtMap) {
			this._langExtMap = {};
			monaco.languages.getLanguages().forEach((lang) => {
				if (lang.extensions && lang.extensions.length > 0) {
					this._langExtMap[lang.id] = lang.extensions[0];
				}
			});
		}
		const defaultSvg = MonacoEditor.ICON_DEFS.defaultIcon.svg;
		const icons = this.$node.querySelectorAll('.clsc-language-picker__item-icon');
		icons.forEach((el) => {
			const langId = el.getAttribute('data-lang-id');
			let svg = MonacoEditor.getFileIconByLanguage(langId);
			if (!svg && this._langExtMap[langId]) {
				svg = MonacoEditor.getFileIconByExtension(this._langExtMap[langId]);
			}
			el.innerHTML = svg || defaultSvg;
		});
	}
});

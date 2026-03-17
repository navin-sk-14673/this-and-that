Lyte.Component.register('clsc-context-menu', {
	data: function () {
		return {
			options: Lyte.attr('array', { default: [] }),
			isOpen: Lyte.attr('boolean', { default: false }),
			posX: Lyte.attr('number', { default: 0 }),
			posY: Lyte.attr('number', { default: 0 }),
			__contextData: Lyte.attr('object', { default: null })
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
		this._onDocScroll = () => {
			this.close();
		};
		this._onDocContextMenu = (e) => {
			if (this.getData('isOpen') && !this.$node.contains(e.target)) {
				this.close();
			}
		};

		document.addEventListener('click', this._onDocClick, true);
		document.addEventListener('keydown', this._onDocKeydown);
		document.addEventListener('scroll', this._onDocScroll, true);
		document.addEventListener('contextmenu', this._onDocContextMenu);
	},

	didDestroy() {
		document.removeEventListener('click', this._onDocClick, true);
		document.removeEventListener('keydown', this._onDocKeydown);
		document.removeEventListener('scroll', this._onDocScroll, true);
		document.removeEventListener('contextmenu', this._onDocContextMenu);
	},

	/**
	 * Open the context menu at the given coordinates.
	 * @param {number} x - clientX from the contextmenu event
	 * @param {number} y - clientY from the contextmenu event
	 * @param {object} contextData - arbitrary data about the right-clicked item
	 */
	open(x, y, contextData) {
		this.setData('__contextData', contextData);
		this.setData('posX', x);
		this.setData('posY', y);
		this.setData('isOpen', true);

		// Adjust position if menu overflows viewport
		requestAnimationFrame(() => {
			const menu = this.$node.querySelector('.clsc-context-menu');
			if (!menu) return;

			const rect = menu.getBoundingClientRect();
			const vw = window.innerWidth;
			const vh = window.innerHeight;

			if (rect.right > vw) {
				this.setData('posX', x - rect.width);
			}
			if (rect.bottom > vh) {
				this.setData('posY', y - rect.height);
			}
		});
	},

	close() {
		this.setData('isOpen', false);
		this.setData('__contextData', null);
	},

	actions: {
		onItemClick(index) {
			const options = this.getData('options');
			const option = options[index];
			if (!option || option.disabled) return;

			const contextData = this.getData('__contextData');
			this.close();

			if (option.action && this.getMethods(option.action)) {
				this.executeMethod(option.action, option, contextData);
			}
		}
	},

	methods: {}
});

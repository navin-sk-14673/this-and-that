Lyte.Component.register('clsc-info-popover', {
	data: function () {
		return {
			isOpen: Lyte.attr('boolean', { default: false }),
			title: Lyte.attr('string', { default: '' }),
			entries: Lyte.attr('array', { default: [] }),
			posX: Lyte.attr('number', { default: 0 }),
			posY: Lyte.attr('number', { default: 0 })
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

	open(x, y, title, entries) {
		this.setData('title', title);
		this.setData('entries', entries);
		this.setData('posX', x);
		this.setData('posY', y);
		this.setData('isOpen', true);

		requestAnimationFrame(() => {
			const el = this.$node.querySelector('.clsc-info-popover');
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
		});
	},

	close() {
		this.setData('isOpen', false);
	},

	actions: {
		onClose() {
			this.close();
		}
	},

	methods: {}
});

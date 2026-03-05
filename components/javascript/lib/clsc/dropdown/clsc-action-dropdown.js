Lyte.Component.register('clsc-action-dropdown', {
	data: function () {
		return {
			options: Lyte.attr('array', { default: [] }),
			isOpen: Lyte.attr('boolean', { default: false }),
			triggerIcon: Lyte.attr('string', { default: 'add' }),
			menuPosition: Lyte.attr('string', { default: 'side' }) // 'side' | 'top'
		};
	},

	_hideTimer: null,

	didConnect() {
		this._wrapper = this.$node.querySelector('.clsc-action-dropdown');
		if (!this._wrapper) return;

		// Apply position modifier
		if (this.getData('menuPosition') === 'top') {
			this._wrapper.classList.add('clsc-action-dropdown--up');
		}

		this._onEnter = () => {
			clearTimeout(this._hideTimer);
			this.setData('isOpen', true);
		};
		this._onLeave = () => {
			this._hideTimer = setTimeout(() => {
				this.setData('isOpen', false);
			}, 120);
		};
		this._onDocKeydown = (e) => {
			if (e.key === 'Escape') {
				this.setData('isOpen', false);
			}
		};

		this._wrapper.addEventListener('mouseenter', this._onEnter);
		this._wrapper.addEventListener('mouseleave', this._onLeave);
		document.addEventListener('keydown', this._onDocKeydown);
	},

	_syncOpenClass: function () {
		if (!this._wrapper) return;
		this._wrapper.classList.toggle('clsc-action-dropdown--open', this.getData('isOpen'));
	}.observes('isOpen'),

	didDestroy() {
		clearTimeout(this._hideTimer);
		if (this._wrapper) {
			this._wrapper.removeEventListener('mouseenter', this._onEnter);
			this._wrapper.removeEventListener('mouseleave', this._onLeave);
		}
		document.removeEventListener('keydown', this._onDocKeydown);
	},

	actions: {
		onItemClick(index) {
			const options = this.getData('options');
			const option = options[index];
			this.setData('isOpen', false);

			if (option && option.action && this.getMethods(option.action)) {
				this.executeMethod(option.action, option);
			}
		}
	},
	methods: {}
});

Lyte.Component.register('clsc-input', {
	didConnect() {
		if (this.getMethods('onKeyup')) {
			this.$node.querySelector('input').addEventListener('keyup', (event) => {
				this.executeMethod('onKeyup', event);
			});
		}
	},
	data: function () {
		return {
			inputPlaceholder: Lyte.attr('string'),
			inputClass: Lyte.attr('string'),
			inputFocus: Lyte.attr('boolean'),
			inputValue: Lyte.attr('string')
		};
	},
	actions: {},
	methods: {},

	setSelectionRange(from, to) {
		this.$node.querySelector('input').setSelectionRange(from, to);
	}
});

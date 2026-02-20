Lyte.Component.register('clsc-toggle-switch', {
	data: function () {
		return {
			checked: Lyte.attr('boolean', { default: false }),
			disabled: Lyte.attr('boolean', { default: false })
		};
	},
	actions: {
		onToggleChange(event) {
			this.setData('checked', event.target.checked);
		}
	},
	methods: {}
});

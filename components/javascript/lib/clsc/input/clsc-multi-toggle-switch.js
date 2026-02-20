Lyte.Component.register('clsc-multi-toggle-switch', {
	data: function () {
		return {
			options: Lyte.attr('array', { default: [] }),
			selected: Lyte.attr('string', { default: '' }),
			name: Lyte.attr('string', { default: 'multi-toggle' })
		};
	},
	actions: {
		onOptionSelect(value) {
			this.setData('selected', value);
		}
	},
	methods: {}
});

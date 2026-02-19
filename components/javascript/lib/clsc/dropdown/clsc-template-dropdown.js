Lyte.Component.register('clsc-template-dropdown', {
	data: function () {
		return {
			data: Lyte.attr('array'),
			activeOptionIndex: Lyte.attr('number'),
			selected: Lyte.attr('object'),
			disabled: Lyte.attr('boolean', { default: false }),
			placeholder: Lyte.attr('string'),
			isOpen: Lyte.attr('boolean', { default: false })
		};
	},
	actions: {},
	methods: {
		isOpen(isOpen) {
			this.setData('isOpen', isOpen);
		},
		onOptionSelected(event, value, comp, optionItem) {
			const selected = this.getData('data')[value];
			this.setData('activeOptionIndex', value);
			this.setData('selected', selected);

			if (this.getMethods('onSelect')) {
				this.executeMethod('onSelect', this, selected, value);
			}
		}
	}
});

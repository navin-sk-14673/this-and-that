Lyte.Component.register('clsc-search-dropdown', {
	didConnect() {
		this.DROPDOWN = this.$node.querySelector('lyte-dropdown');
		this.INPUT_FIELD = this.$node.querySelector('input[type="text"]');

		this.KEY_NAME = this.getData('keyName');
	},
	data: function () {
		return {
			list: Lyte.attr('array'),
			keyName: Lyte.attr('string', { default: 'value' }),
			placeholder: Lyte.attr('string', { default: 'Search' }),
			optionItems: Lyte.attr('array', { default: [] }),
			selectedItem: Lyte.attr('object'),
			selectedKey: Lyte.attr('string'),
			isOpen: Lyte.attr('boolean', { default: false })
		};
	},
	actions: {
		onChevronClick(event) {
			event.stopPropagation();
			this.getData('isOpen') ? this.DROPDOWN.close() : this.DROPDOWN.open();
		},
		onInput(event) {
			this.filterItems(event.target.value);
		}
	},
	methods: {
		isOpen(isOpen) {
			this.setData('isOpen', isOpen);
		},
		onOptionSelected(event, selectedItemKey, dropdown, dropItem) {
			const optionItems = this.getData('optionItems');
			for (let i = 0; i < optionItems.length; i++) {
				if (optionItems[i] && optionItems[i][this.KEY_NAME] == selectedItemKey) {
					this.setData('selectedItem', optionItems[i]);
					this.setData('selectedKey', selectedItemKey);
					this.INPUT_FIELD.value = '';
					this.filterItems(this.INPUT_FIELD.value);
					this.INPUT_FIELD.blur();
					break;
				}
			}
		}
	},

	filterItems(text) {
		if (this.getMethods('onInput')) {
			this.executeMethod('onInput', text).then((list) => {
				this.setData('optionItems', list);
			});
		}
	},

	__isOpenObservable: function () {
		const isOpen = this.getData('isOpen');
		// console.log(isOpen);

		// if (isOpen) {
		// 	if (this.INPUT_FIELD_PREV_VALUE) {
		// 		this.INPUT_FIELD.value = this.INPUT_FIELD_PREV_VALUE;
		// 		this.INPUT_FIELD_PREV_VALUE = undefined;
		// 	}
		// } else {
		// 	if (this.INPUT_FIELD.value) {
		// 		this.INPUT_FIELD_PREV_VALUE = this.INPUT_FIELD.value;
		// 		this.INPUT_FIELD.value = '';
		// 	}
		// }
	}.observes('isOpen'),

	__listObservable: function () {
		const dataList = this.getData('list');
		const list = dataList == null ? [] : [...dataList];
		this.setData('optionItems', list);
		this.setData('selectedKey', undefined);
		this.setData('selectedItem', undefined);
	}
		.observes('list')
		.on('didConnect')
});

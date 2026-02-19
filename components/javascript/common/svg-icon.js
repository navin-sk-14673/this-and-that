Lyte.Component.register('svg-icon', {
	data: function () {
		return {
			iconClass: Lyte.attr('string'),
			iconPrefix: Lyte.attr('string', { default: 'icon' }),
			iconName: Lyte.attr('string'),
			iconSize: Lyte.attr('string', { default: 'm' }),
			svgClass: Lyte.attr('string', { default: '' })
		};
	},

	__initObservable: function () {
		let finalClass = '';
		finalClass += `${this.data.iconPrefix} `;
		finalClass += `${this.data.iconPrefix}-${this.data.iconName} `;
		finalClass += `${this.data.iconPrefix}-size__${this.data.iconSize} `;
		finalClass += `${this.data.svgClass}`;
		this.setData('iconClass', finalClass.trim());
	}
		.observes('iconClass', 'iconName', 'iconSize', 'svgClass')
		.on('init')
});

Lyte.Component.register('about-modal', {
	data: function () {
		return {
			ltPropShow: Lyte.attr('boolean', { default: false }),
			activeTab: Lyte.attr('string', { default: 'about' })
		};
	},
	actions: {
		onTabSelect(tab) {
			this.setData('activeTab', tab);
		}
	},
	methods: {}
});

Lyte.Component.register('clsc-toast', {
	didConnect() {},

	data: function () {
		return {
			ltPropShow: Lyte.attr('boolean', { default: false }),
			ltPropMessage: Lyte.attr('string', { default: '' }),
			ltPropType: Lyte.attr('string', { default: 'info' }), // info | success | error
			ltPropIcon: Lyte.attr('string', { default: 'check_circle' }),
			ltPropDuration: Lyte.attr('number', { default: 3000 })
		};
	},

	actions: {},

	methods: {},

	__showObserver: function () {
		if (this.getData('ltPropShow')) {
			clearTimeout(this._dismissTimer);
			this._dismissTimer = setTimeout(() => {
				this.setData('ltPropShow', false);
			}, this.getData('ltPropDuration'));
		}
	}.observes('ltPropShow')
});

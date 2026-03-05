Lyte.Component.register('about-modal', {
	data: function () {
		return {
			ltPropShow: Lyte.attr('boolean', { default: false }),
			ltPropIsWalkthrough: Lyte.attr('boolean', { default: false }),
			activeTab: Lyte.attr('string', { default: 'about' })
		};
	},
	TAB_ORDER: ['about', 'limits', 'data'],
	actions: {
		onTabSelect(tab) {
			this.setData('activeTab', tab);
		},
		onWalkthroughNext() {
			var current = this.getData('activeTab');
			var idx = this.TAB_ORDER.indexOf(current);
			if (idx < this.TAB_ORDER.length - 1) {
				this.setData('activeTab', this.TAB_ORDER[idx + 1]);
			}
		},
		onWalkthroughDone() {
			localStorage.setItem('codepal.walkthroughDone', '1');
			this.setData('ltPropShow', false);
			this.setData('ltPropIsWalkthrough', false);
		}
	},
	ltPropShowObserver: function () {
		if (this.getData('ltPropShow')) {
			this.setData('activeTab', 'about');
		}
	}.observes('ltPropShow'),
	methods: {}
});

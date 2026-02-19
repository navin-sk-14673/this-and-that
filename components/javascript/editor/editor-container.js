Lyte.Component.register('editor-container', {
	didConnect() {
		Lyte.addEventListener('beforeRouteTransition', ({ history, prevTrans, trans }) =>
			this.__routePageObservable(trans.info)
		);
		this.__routePageObservable(Lyte.Router.getCurrentRouteInfo());

		// window.addEventListener('beforeunload', (event) => {
		// 	const files = this.getData('files');
		// 	files.forEach((file) => {
		// 		FileContentManager.updateFileContent({
		// 			id: file.id,
		// 			content: 'editor.getValue()'
		// 		});
		// 	});
		// 	event.returnValue = '';
		// });
	},
	data: function () {
		return {
			monaco: Lyte.attr('object'),
			files: Lyte.attr('array', { watch: true }),
			viewId: Lyte.attr('string')
		};
	},
	actions: {},
	methods: {},

	__routePageObservable(trans) {
		const viewId = trans.dynamicParams[0];
		this.setData('viewId', viewId);
	},

	__filesObservable: function () {
		const files = this.getData('files');
		// console.log(files);
	}.observes('files.*')
});

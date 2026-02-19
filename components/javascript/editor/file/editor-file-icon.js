Lyte.Component.register('editor-file-icon', {
	data: function () {
		return {
			extension: Lyte.attr('string'),
			language: Lyte.attr('string'),
			isComparator: Lyte.attr('boolean', { default: false })
		};
	},
	actions: {},
	methods: {},

	__extensionObservable: function () {
		const extension = this.getData('extension');
		if (extension != undefined) {
			this.$node.querySelector('.icon').innerHTML = MonacoEditor.getFileIconByExtension(extension);
		}
	}
		.observes('extension')
		.on('didConnect'),

	__languageObservable: function () {
		const language = this.getData('language');
		if (language != undefined) {
			this.$node.querySelector('.icon').innerHTML = MonacoEditor.getFileIconByLanguage(language);
		}
	}
		.observes('language')
		.on('didConnect')
});

Lyte.Component.register('file-creator-modal', {
	didConnect() {
		const fileTypes = Object.keys(MonacoEditor.LANGUAGE_SVG_MAP).map((language) => ({
			language: language
		}));
		this.setData('fileTypes', fileTypes);
	},
	data: function () {
		return {
			fileTypes: Lyte.attr('array', {
				default: [
					{
						name: 'plaintext',
						extension: '.txt'
					},
					{
						name: 'JSON',
						extension: '.json'
					},
					{
						name: 'Javascript',
						extension: '.js'
					},
					{
						name: 'HTML',
						extension: '.html'
					},
					{
						name: 'CSS',
						extension: '.css'
					},
					{
						name: 'SCSS',
						extension: 'typescript'
					},
					{
						name: 'URL',
						extension: '.url'
					},
					{
						name: 'cadence',
						extension: '.cdc'
					},
					{
						name: 'C',
						extension: '.c'
					},
					{
						name: 'C++',
						extension: '.cpp'
					},
					{
						name: 'PDF',
						extension: '.pdf'
					},
					{
						name: 'vscode',
						extension: '.vsix'
					},
					{
						name: 'Zip',
						extension: '.zip'
					},
					{
						name: 'Settings',
						extension: '.settings'
					}
				]
			}),
			file: Lyte.attr('object', {
				default: {
					title: '',
					extension: '',
					isComparator: undefined
				}
			})
		};
	},
	actions: {},
	methods: {
		async onFileExtensionSearch(text) {
			text = text.toLowerCase();
			return this.getData('fileTypes').filter((file) => file.language.includes(text));
		}
	}
});

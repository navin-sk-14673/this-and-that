const fs = require('fs');
const fsUtil = require('../../../node/util/fs');

module.exports = {
	validateEntityName: function (options) {
		return true;
	},
	locals: function (options) {
		return {};
	},
	fileMapTokens: function (options) {
		return {};
	},
	beforeInstall: function (options) {},
	install: function (options) {},
	afterInstall: function (options) {
		const component = options.cliArgs[2];
		const folderLevel = !!options.d + options.d.split('/').length;
		const scssDefaultContent = `@import '${'../'.repeat(folderLevel)}abstracts/util';\n`;
		const path = options.path.join(options.root, 'styles', 'sass', 'components', options.d);
		fs.mkdirSync(path, { recursive: true });
		fs.writeFileSync(options.path.join(path, component + '.scss'), scssDefaultContent);
	},
	beforeUninstall: function (options) {},
	uninstall: function (options) {},
	afterUninstall: function (options) {
		const component = options.cliArgs[2];
		const path = options.path.join(options.root, 'styles', 'sass', 'components', options.d || '');
		fs.unlinkSync(options.path.join(path, component + '.scss'));
		fsUtil.rmEmptyDirRecursive(path);
	}
};

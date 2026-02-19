const fs = require('fs');

function rmEmptyDirRecursive(folderPath) {
	if (fs.readdirSync(folderPath).length === 0) {
		fs.rmdirSync(folderPath);
		rmEmptyDirRecursive(folderPath.substring(0, folderPath.lastIndexOf('/')));
	}
}

module.exports = { rmEmptyDirRecursive };

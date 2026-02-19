class StorageUtil {
	static getReadableSize = (bytes) => {
		const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
			thresh = 1 << 10;
		let u = 0;
		while (Math.abs(bytes) >= thresh && u++ < units.length - 1) {
			bytes /= thresh;
		}
		return bytes + ' ' + units[u];
	};
}

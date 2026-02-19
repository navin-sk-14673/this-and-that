const RESOURCE_BASE_PATH = '';

function getHtmlTag(tagName, attrs, content = '') {
	const tag = document.createElement(tagName);
	for (const [key, value] of Object.entries(attrs)) {
		tag.setAttribute(key, value);
	}
	tag.innerHTML = content;
	return tag;
}

function getScriptTag(src, isDefer) {
	const script = document.createElement('script');
	script.src = src;
	script.type = 'text/javascript';
	script.async = false;
	if (isDefer) {
		script.defer = true;
	}
	return script;
}
function getStyleSheet(href) {
	const link = document.createElement('link');
	link.href = href;
	link.media = 'print';
	link.rel = 'stylesheet';
	link.setAttribute('onload', 'this.media="all"');
	return link;
}

function insertDependencyFile(fileName, isDefer = false) {
	const file = RESOURCE_BASE_PATH + fileName;
	if (fileName.lastIndexOf('.js') != -1) {
		document.head.appendChild(getScriptTag(file, isDefer));
	} else {
		document.head.appendChild(getStyleSheet(file));
	}
}
function insertDependencies(fileNames) {
	for (const fileName of fileNames) {
		insertDependencyFile(fileName);
	}
}

function initMetaDetails() {
	const metaTags = [
		getHtmlTag('meta', {
			'http-equiv': 'X-UA-Compatible',
			content: 'IE: edge'
		}),
		getHtmlTag('meta', {
			name: 'viewport',
			content: 'width=device-width, initial-scale=1.0'
		})
	];
	metaTags.forEach((tag) => document.head.prepend(tag));
}
initMetaDetails();

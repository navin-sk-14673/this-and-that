HTMLElement.prototype.addClass = function (...className) {
	this.classList.add(...className);
	return this;
};
HTMLElement.prototype.removeClass = function (...className) {
	this.classList.remove(...className);
	return this;
};
HTMLElement.prototype.toggleClass = function (className) {
	this.classList.toggle(className);
	return this;
};
HTMLElement.prototype.containsClass = function (className) {
	return this.classList.contains(className);
};

HTMLElement.prototype.findParent = function (query) {
	let element = this;
	while (element && element != document) {
		if (element.matches(query)) {
			break;
		}
		element = element.parentNode;
	}
	return element;
};

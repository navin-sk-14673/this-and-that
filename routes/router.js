Lyte.Router.configureDefaults({
	baseURL: 'penpal',
	history: 'hash',
	linkActiveClass: 'link-to--active'
});

Lyte.Router.configureRoutes(function () {
	this.route('index', { path: '/' }, function () {
		this.route('view', { path: '/view/:id' });
	});
});

Lyte.Router.beforeRouteTransition = function (history, prevTrans, trans) {
	// terminal.log('beforeRouteTransition', history, prevTrans, trans);
};

Lyte.Router.afterRouteTransition = function (trans) {
	// terminal.log('after Route Change', trans);
};

// Router Utils
Lyte.Router.getCurrentRouteInfo = () => Lyte.Router.getRouteInstance().transition.info;

Lyte.Router.getCurrentRouteDps = function () {
	const result = {};
	let route = Object.assign({}, Lyte.Router.getRouteInstance());
	do {
		result[route.__lp.objPath] = route.getDynamicParam();
	} while ((route = route.parent));
	return result;
};
Lyte.Router.getCurrentRouteDpsAsArray = function () {
	const result = Object.entries(Lyte.Router.getCurrentRouteDps());
	result.level = result.length - 1;
	result.getRouteByLevel = function (level) {
		const res = result[result.level - level];
		return {
			route: res[0],
			dp: res[1]
		};
	};
	return result;
};

Lyte.Router.transitUnlike = function (transition) {
	if (Lyte.Router.__lp.trans.target != transition.route) {
		Lyte.Router.transitionTo(transition);
	}
};

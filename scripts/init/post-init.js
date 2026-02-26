const metaTags = [
	getHtmlTag('script', {
		type: 'text/javascript',
		src: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
	}),
	getHtmlTag('script', {
		type: 'text/javascript',
		src: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/js/all.min.js'
	}),
	getHtmlTag('link', {
		rel: 'preconnect',
		href: 'https://fonts.googleapis.com'
	}),
	getHtmlTag('link', {
		rel: 'preconnect',
		href: 'https://fonts.gstatic.com'
	}),
	getHtmlTag('link', {
		rel: 'stylesheet',
		href: 'https://fonts.googleapis.com/icon?family=Material+Icons'
	}),
	getHtmlTag('link', {
		rel: 'stylesheet',
		href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Bree+Serif&family=Major+Mono+Display&family=DM+Mono:wght@300;400;500&family=Niramit:wght@700&family=Secular+One&family=Arvo&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0'
	})
];
metaTags.forEach((tag) => document.head.append(tag));

insertDependencies([
	'/consolidated_files/conf.js',
	'/consolidated_files/util.js',
	'/consolidated_files/lyte/es5-adapter.js',
	'/consolidated_files/lyte/lyte-req.js',
	'/consolidated_files/lyte-ui-components/plugins.js',
	'/consolidated_files/lyte-ui-components/components.js',
	// '/consolidated_files/models/initial-models.js',
	// '/consolidated_files/mixins/initial-mixins.js',
	'/consolidated_files/components/initial-helpers.js',
	'/consolidated_files/routes/initial-routes.js',
	'/consolidated_files/components/initial-components.js',
	'/consolidated_files/css/initial-styles.css'
]);

fetch('/assets/icons.svg')
	.then((res) => res.text())
	.then((res) => {
		const ICONS_GROUP_DIV = document.getElementById('icons-group');
		ICONS_GROUP_DIV.innerHTML += res;
	});

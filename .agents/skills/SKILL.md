---
name: lyte-skill
description: Zoho Lyte framework guidelines for component structure, template syntax, routing, data store, mixins, observers, and UI components. Use when working with Lyte components, templates, routes, or any .html/.js files in this project.
---

## Lyte Framework Guidelines

This project uses the **Zoho Lyte framework** (`@zoho/lyte` v3.5.x) — a component-based client framework with three decoupled layers: **Router**, **Component**, and **Data Store**.

---

### Component Structure

Every component consists of **three co-located files** with matching kebab-case names:

| File           | Location                 | Purpose                                         |
| -------------- | ------------------------ | ----------------------------------------------- |
| `my-comp.js`   | `components/javascript/` | Registration, data, actions, methods, lifecycle |
| `my-comp.html` | `components/templates/`  | Template markup and bindings                    |
| `my-comp.css`  | `components/styles/`     | Scoped styles (global — no shadow DOM)          |

#### Registration

```js
Lyte.Component.register(
	'my-comp',
	{
		data: function () {
			return {
				propName: Lyte.attr('string', { default: '' }),
				items: Lyte.attr('array', { default: [] }),
				isOpen: Lyte.attr('boolean', { default: false }),
				config: Lyte.attr('object', { default: {} }),
				count: Lyte.attr('number', { default: 0 })
			};
		},
		actions: {
			onButtonClick: function (arg1, arg2) {
				// handle template events
			}
		},
		methods: {
			onDropdownChange: function (selected) {
				// callback for Lyte UI component events
			}
		},
		init() {
			// runs on component initialization (before DOM)
		},
		didConnect() {
			// runs after component is connected to DOM
		}
	},
	{ mixins: ['my-mixin'] }
);
```

#### Rules

-   **Tag name** in `register()` must match the `tag-name` attribute in the HTML template
-   Use `Lyte.attr(type, options)` for all data properties — valid types: `'string'`, `'number'`, `'boolean'`, `'array'`, `'object'`
-   Access data via `this.getData('propName')` and `this.setData('propName', value)`
-   Only the `data` block is accessible from templates; `actions` and `methods` require helpers (`{{action(...)}}` / `{{method(...)}}`)
-   Call methods from JS via `this.executeMethod('methodName', ...args)`
-   Guard method calls with `this.getMethods('methodName')` before `executeMethod`
-   Custom component tag names use a `*-comp` suffix convention (e.g., `modal-comp`, `button-comp`)
-   Lyte UI components use a `lyte-*` prefix (e.g., `lyte-modal`, `lyte-dropdown`)

---

### Template Syntax

Templates are HTML files wrapped in a root `<template>` tag:

```html
<template tag-name="my-comp">
	<!-- component markup here -->
</template>
```

#### Bindings

| Syntax                            | Purpose                          | Example                                            |
| --------------------------------- | -------------------------------- | -------------------------------------------------- |
| `{{propName}}`                    | One-way binding (read-only)      | `{{title}}`                                        |
| `{{lbind(propName)}}`             | Two-way binding (read/write)     | `{{lbind(isOpen)}}`                                |
| `{{action('name', arg1)}}`        | Bind action as event handler     | `onclick="{{action('onClick', event)}}"`           |
| `{{method('name')}}`              | Bind method as callback          | `on-change="{{method('onSelect')}}"`               |
| `{{unescape(value)}}`             | Render raw HTML                  | `{{unescape(htmlContent)}}`                        |
| `{{if(cond, trueVal, falseVal)}}` | Inline conditional               | `class="{{if(active, 'bg-blue', 'bg-gray')}}"`     |
| `{{concat(a, '-', b)}}`           | String concatenation             | `id="{{concat('item-', index)}}"`                  |
| `{{ifEquals(a, b)}}`              | Equality check (returns boolean) | `{{if(ifEquals(status, 'done'), 'green', 'red')}}` |

#### Conditionals

```html
<template lyte-if="{{isLoggedIn}}">
	<p>Welcome back</p>
</template>
<template lyte-else>
	<p>Please log in</p>
</template>
```

Also supports `lyte-else-if`:

```html
<template lyte-if="{{state == 'loading'}}">...</template>
<template lyte-else-if="{{state == 'error'}}">...</template>
<template lyte-else>...</template>
```

#### Loops

**Array iteration:**

```html
<template lyte-for="{{items}} as item index">
	<div>{{index}}: {{item.label}}</div>
</template>
```

**Object iteration:**

```html
<template lyte-for-in="{{config}} as value key">
	<div>{{key}}: {{value}}</div>
</template>
```

#### Switch

```html
<template lyte-switch="{{status}}">
	<template
		lyte-case="active"
		lyte-break>
		Active
	</template>
	<template
		lyte-case="inactive"
		lyte-break>
		Inactive
	</template>
	<template lyte-default>Unknown</template>
</template>
```

#### Passing Props to Child Components

Multi-word property names **must be hyphenated** in HTML attributes (browser limitation), but defined in camelCase in JS:

```html
<!-- HTML: hyphenated -->
<child-comp
	my-data="{{parentData}}"
	is-visible="{{show}}"></child-comp>
```

```js
// JS: camelCase
data: function () {
    return {
        myData: Lyte.attr('object'),
        isVisible: Lyte.attr('boolean', { default: false }),
    };
}
```

---

### Yield System (Content Projection)

Lyte uses a yield pattern similar to slots:

**Defining a yield point (in a reusable component):**

```html
<lyte-yield yield-name="body-content"></lyte-yield>
```

**Filling a yield (from a consumer):**

```html
<modal-comp>
	<template
		is="yield"
		yield-name="body-content">
		<p>Projected content goes here</p>
	</template>
</modal-comp>
```

**Registering yield content for Lyte UI components:**

```html
<lyte-dropdown>
	<template
		is="registerYield"
		yield-name="yield">
		<!-- custom dropdown content -->
	</template>
</lyte-dropdown>
```

---

### Lyte UI Components

Props are passed via `lt-prop-*` attributes (kebab-case, auto-mapped to camelCase):

```html
<lyte-dropdown
	lt-prop-selected="{{lbind(selected)}}"
	lt-prop-options="{{options}}"
	lt-prop-user-value="label"
	lt-prop-system-value="value"
	on-change="{{method('onSelect')}}"></lyte-dropdown>
```

**Available in this project:**
`lyte-accordion`, `lyte-button`, `lyte-calendar`, `lyte-checkbox`, `lyte-code-snippet`, `lyte-dropdown`, `lyte-input`, `lyte-loader`, `lyte-menu`, `lyte-messagebox`, `lyte-modal`, `lyte-nav`, `lyte-number`, `lyte-radiobutton`, `lyte-step`, `lyte-table`, `lyte-tabs`, `lyte-tooltip`, `lyte-wormhole`

**Plugins:** `lyte-moment`, `lyte-scrollbar`, `lyte-search`, `lyte-trapFocus`

---

### Observers

Observers react to data property changes:

```js
nameChanged: function (change) {
    // change = { type: 'change', oldValue, newValue, item }
}.observes('firstName', 'lastName')
```

To also run on component init:

```js
setupData: function () {
    // runs on init AND whenever 'config' changes
}.observes('config').on('didConnect')
```

---

### Mixins

```js
Lyte.Mixin.register('my-mixin', {
	sharedMethod: function () {
		// 'this' refers to the callee (component/route/adapter)
	}
});
```

Attach to components, routes, adapters, or serializers via the third argument:

```js
Lyte.Component.register('my-comp', { ... }, { mixins: ['my-mixin'] });
Lyte.Router.registerRoute('home', { ... }, { mixins: ['my-mixin'] });
store.registerAdapter('user', { ... }, { mixins: ['my-mixin'] });
```

---

### Routing

#### Route Configuration (`router.js`)

```js
Lyte.Router.configureRoutes(function () {
	this.route('index', { path: '/' }, function () {
		this.route('dashboard');
		this.route('user-detail', { path: 'user/:userId' }); // dynamic segment
	});
});
```

#### Route Handlers

```js
Lyte.Router.registerRoute('index.dashboard', {
	queryParams: ['page', 'filter'],

	getDependencies: function (params) {
		return ['path/to/component.js', 'path/to/styles.css'];
	},

	beforeModel: function (params) {
		// permission checks, abort/redirect
	},

	model: function (params) {
		return store.findAll('dashboard');
	},

	afterModel: function (model, params) {
		this.currentModel = { items: model };
	},

	redirect: function (model, params) {
		// conditional redirect
	},

	renderTemplate: function (model, params) {
		return { outlet: '#content', component: 'dashboard-comp' };
	},

	afterRender: function (model, params) {
		// post-render DOM work
	},

	beforeExit: function (model, params) {
		// cleanup before leaving
	},

	didDestroy: function () {
		// full cleanup after route destroyed
	}
});
```

#### Navigation

**From templates:**

```html
<link-to
	lt-prop-route="index.user-detail"
	lt-prop-dp='["user123"]'>
	View User
</link-to>
```

**From JS:**

```js
Lyte.Router.transitionTo({ route: 'index.dashboard', queryParams: { page: 1 } });
Lyte.Router.replaceWith({ route: 'index.home' });
```

---

### Data Store

#### Models

```js
store.registerModel('user', {
	id: Lyte.attr('number', { primaryKey: true }),
	name: Lyte.attr('string'),
	email: Lyte.attr('string')
});
```

#### Adapters

```js
store.registerAdapter('application', {
	host: 'https://api.example.com',
	namespace: 'v1',
	buildURL: function (modelName, type, queryParams, payLoad, url) {
		return url;
	}
});

// Model-specific adapter extending the base
store
	.registerAdapter('user', {
		buildURL: function (modelName, type, queryParams, payLoad, url) {
			return '/custom/users';
		}
	})
	.extends('application');
```

#### Serializers

```js
store.registerSerializer('application', {
    normalize: function (modelName, type, snapshot) { ... },
    normalizeResponse: function (modelName, type, payLoad, pkValue, status) { ... },
    serialize: function (type, payLoad, records) { ... },
});
```

---

### AJAX Utilities

Lyte provides `$L` for AJAX (jQuery-like API):

```js
$L.ajax({ url: '/api/data', type: 'POST', data: payload, success(res) {}, error(err) {} });
$L.get({ url: '/api/data', headers: {}, dataType: 'json', success(data) {} });
```

---

### Naming Conventions

| Element                  | Convention                     | Example                                           |
| ------------------------ | ------------------------------ | ------------------------------------------------- |
| Component tags           | kebab-case with `-comp` suffix | `auth-comp`, `modal-comp`                         |
| Component files          | Match tag name                 | `auth-comp.js`, `auth-comp.html`, `auth-comp.css` |
| Data properties          | camelCase                      | `isModalOpen`, `selectedItems`                    |
| HTML attributes          | kebab-case (auto-mapped)       | `is-modal-open` → `isModalOpen`                   |
| Route names              | dot-separated hierarchy        | `index.automation.tool`                           |
| Model/Adapter/Serializer | Singular noun                  | `application`, `oauth`, `user`                    |
| Lyte UI component props  | `lt-prop-*` kebab-case         | `lt-prop-selected`, `lt-prop-options`             |

### What NOT to Do

-   Do NOT define data properties outside the `data` function
-   Do NOT access `actions` or `methods` directly from templates without helpers
-   Do NOT use camelCase for HTML attributes when passing props — always hyphenate
-   Do NOT mutate data directly — always use `this.setData()` for reactivity
-   Do NOT forget to return `{ outlet, component }` from `renderTemplate` in route handlers
-   Do NOT register a component before its mixin is registered (mixins must be registered first)

---

### Lyte CLI Commands

Lyte CLI is a command-line tool for managing Lyte applications — creating projects, generating/renaming/destroying modules, building, serving, testing, and more.

#### Creating a New Project

```bash
lyte new <app-name>
```

Creates a new Lyte application with the default folder structure, routes, components, and build configuration.

#### Generating Modules

```bash
lyte generate <module> <name> [options]
```

Supported modules: `route`, `component`, `helper`, `mixin`, `test`, `adapter`, `serializer`, `model`, `theme`.

Use `-d <folder>` to generate inside a subfolder (path relative to the module's default directory).

##### Component

```bash
lyte generate component <component-name>
lyte generate component <component-name> -d <folder>
```

Creates three files:

-   `components/javascript/<component-name>.js`
-   `components/templates/<component-name>.html`
-   `components/styles/<component-name>.css`

Component names **must contain at least one hyphen** (W3C custom element requirement). E.g., `blog-post` is valid, `post` is not.

With `-d`:

```bash
lyte generate component blogger-comp -d blogger
# Creates:
#   components/javascript/blogger/blogger-comp.js
#   components/templates/blogger/blogger-comp.html
#   components/styles/blogger/blogger-comp.css
```

##### Route

```bash
lyte generate route <route-name> [path]
```

Adds a route entry in `router.js` under `Lyte.Router.configureRoutes` and creates `routes/<route-name>.js`. The path is optional and always relative.

```bash
lyte generate route favourites /blog/favourites
lyte generate route favourites /blog/favourites?review=true  # with default query params
```

Nested, dynamic, index, and wildcard routes are supported:

```bash
lyte generate route blog.post            # nested under 'blog'
lyte generate route user-detail :userId  # dynamic segment
```

##### Model / Adapter / Serializer

```bash
lyte generate model <model-name> [-d <folder>]
lyte generate adapter <adapter-name> [-d <folder>]
lyte generate serializer <serializer-name> [-d <folder>]
```

##### Helper

```bash
lyte generate helper <helper-name> [-d <folder>]
```

Helper names **must not contain hyphens**. Use camelCase or PascalCase (e.g., `concatString`, `PrefixString`).

##### Mixin

```bash
lyte generate mixin <mixin-name> [-d <folder>]
```

```bash
lyte generate mixin menu-util
```

##### Theme

```bash
lyte generate theme <theme-name> [-d <folder>]
```

Generates `.less` files for all existing components in the specified theme directory.

##### Test

```bash
lyte generate test <spec-name> [--unit-test | --functional-test]
```

```bash
lyte generate test todo-item.spec                        # unit test (default)
lyte generate test todo-item.spec --unit-test            # unit test
lyte generate test application-model.spec --functional-test  # functional test
```

#### Renaming a Module

```bash
lyte rename <module> <current-name> <new-name> [-d <folder>]
```

Renames all files and folders created by `lyte generate`. If the module was created inside a folder, specify `-d`.

```bash
lyte rename component blogger-list blog-list -d blogger
lyte rename route create blog
lyte rename route create blog /bloglist  # also updates route path in router.js
```

#### Destroying a Module

```bash
lyte destroy <module> <name> [-d <folder>]
```

Deletes all files and folders created by `lyte generate`. For routes, specify the complete route name.

```bash
lyte destroy route favourites
lyte destroy component blogger-comp
lyte destroy component blogger-comp -d blogger
```

#### Building the Application

```bash
lyte build [options]
```

Compiles routes, models, and components based on `build/build.js` and outputs to `/dist`.

| Option          | Description                                       |
| --------------- | ------------------------------------------------- |
| `--production`  | Concatenate and minify JS files                   |
| `--development` | Concatenate only (default)                        |
| `--watch`       | Watch files for changes and rebuild automatically |

```bash
lyte build
lyte build --watch
lyte build --production
```

#### Serving the Application

```bash
lyte serve [--port=<number>]
```

Starts the application at port 3000 by default.

```bash
lyte serve --port=4000
```

#### Running Tests

```bash
lyte test [options]
```

| Option              | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `--unit-test`       | Run specs from `unit_test` folder (default)                      |
| `--functional-test` | Run specs from `functional_test` folder                          |
| `--port <number>`   | Change test server port (default: 3000)                          |
| `--random`          | Run specs in random order                                        |
| `--browser <name>`  | Browser to use (`googlechrome`, `firefox`, `safari`, `iexplore`) |
| `--headless`        | Run tests in headless browser                                    |
| `--keepAlive`       | Keep tabs open after each spec (default: true)                   |

```bash
lyte test
lyte test --unit-test
lyte test --functional-test
lyte test lyte-button.spec
lyte test lyte-button.spec,lyte-alert.spec --unit-test
lyte test lyte-app.spec --functional-test
```

#### Replacing Content in Files

```bash
lyte replace <pattern> <replacement> <filepath>
```

Replaces all occurrences of a string or regex pattern in a file. The filepath is relative to the application root.

```bash
lyte replace "welcome" "wel" components/javascript/welcome-comp.js
```

#### Migrating Component Syntax

```bash
lyte migrate <file-or-pattern>
```

Migrates component templates from old syntax to new syntax.

```bash
lyte migrate blog-list.html        # single file
lyte migrate blog-list             # all templates in blog-list directory or blog-list.html
lyte migrate "*.html"              # all template files in templates folder
lyte migrate blog/*.html           # all templates in blog directory
lyte migrate .                     # all templates in the components folder
```

#### Blueprints (Custom Code Generation)

```bash
lyte generate blueprint <blueprint-name>
```

Creates a custom blueprint under `build/blueprints/` with hooks for extending file generation: `validateEntity`, `locals`, `fileMapTokens`, `beforeInstall`, `install`, `afterInstall`, `beforeUninstall`, `uninstall`, `afterUninstall`.

#### Addons

Create reusable component packages distributable across projects:

```bash
lyte new addon <addon-name>     # generate addon file structure
lyte build                      # build addon (from addon directory)
lyte serve                      # serve addon test app
```

Install an addon in an app:

```bash
npm install <addon-name> --registry http://cm-npmregistry
```

Then add the addon name to the `"addons"` array in the app's `package.json` and run `lyte build`.

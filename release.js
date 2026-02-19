const fse = require('fs-extra');
const { execSync } = require('child_process');
const terminal = require('./node/stream/output');
const lyte = require('@zoho/lyte-cli');

const APP_NAME = 'apphealthmonitor';

// From terminal: npm run sass:build && lyte build --env=prod && npm run mvn
Promise.resolve()
	.then(() => fse.rmSync('release', { recursive: true, force: true }))
	.then(() => fse.rmSync('styles/css', { recursive: true, force: true }))
	.then(() => execSync('npm run sass:build'))
	.then(() => fse.rmSync('dist/prod', { recursive: true, force: true }))
	.then(() =>
		lyte({
			root: process.cwd(),
			fromCommand: false,
			cliArgs: ['build', '--env=prod']
		})
	)
	.then(() => fse.copySync('dist/prod', `release/${APP_NAME}`, { overwrite: true }))
	.then(() => fse.rmSync('target', { recursive: true, force: true }))
	.then(() => execSync('mvn clean install -Dmaven.test.skip=true'))
	.then(() => fse.copySync(`target/${APP_NAME}.war`, `release/${APP_NAME}.war`, { overwrite: true }));

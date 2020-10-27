import merge from 'deepmerge';
import copy from 'rollup-plugin-copy'
// use createSpaConfig for bundling a Single Page App
import { createSpaConfig } from '@open-wc/building-rollup';

// use createBasicConfig to do regular JS to JS bundling
// import { createBasicConfig } from '@open-wc/building-rollup';

const baseConfig = createSpaConfig({
  // use the outputdir option to modify where files are output
  // outputDir: 'dist',

  // if you need to support older browsers, such as IE11, set the legacyBuild
  // option to generate an additional build just for this browser
  // legacyBuild: true,

  // development mode creates a non-minified build for debugging or development
  developmentMode: process.env.ROLLUP_WATCH === 'true',

  // set to true to inject the service worker registration into your index.html
  injectServiceWorker: true,
});

export default merge(baseConfig, {
  // if you use createSpaConfig, you can use your index.html as entrypoint,
  // any <script type="module"> inside will be bundled by rollup
  input: './index.html',

  // alternatively, you can use your JS as entrypoint for rollup and
  // optionally set a HTML template manually
  // input: './app.js',
    plugins: [
	copy({
	    targets: [
		{ src: './manifest.json', dest: 'dist' },
		{ src: './favicon.ico', dest: 'dist' },
		{ src: './img/icon-512x512.png', dest: 'dist/img' },
		{ src: './img/icon-192x192.png', dest: 'dist/img' },
		{ src: './img/icon-180x180.png', dest: 'dist/img' },
		{ src: './img/icon-167x167.png', dest: 'dist/img' },
		{ src: './img/icon-152x152.png', dest: 'dist/img' },
		{ src: './img/icon-144x144.png', dest: 'dist/img' }
	    ]
	})]
});

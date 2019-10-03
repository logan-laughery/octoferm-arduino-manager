/**
 * Windows: Please do not use trailing comma as windows will fail with token error
 */

const { series, rimraf } = require('nps-utils');

module.exports = {
  scripts: {
    default: 'nps start',
    /**
     * Starts the builded app from the dist directory
     */
    start: {
      script: 'babel-node dist/index.js',
      description: 'Starts the builded app from the dist directory'
    },
    /**
     * Serves the current app and watches for changes to restart it
     */
    watch: {
      script: series(
        'nps banner.watch',
        'nodemon --watch src --watch .env --exec "babel-node src/index.js"'
      ),
      description: 'Serves the current app and watches for changes to restart it'
    },
    /**
     * Builds the app into the dist directory
     */
    build: {
      script: series(
        'nps banner.build',
        'nps lint.fix',
        'nps clean.dist',
        'nps babel'
      ),
      description: 'Builds the app into the dist directory'
    },
    babel: {
      script: 'babel src --out-dir dist --copy-files',
      description: 'Babel'
    },
    /**
     * Runs TSLint over your project
     */
    lint: {
      default: {
        script: eslint(`./src/**/*.js`),
        hiddenFromHelp: true
      },
      fix: {
        script: `eslint -c ./.eslintrc.json ./src/**/*.js --fix`,
        hiddenFromHelp: true
      }
    },
    /**
     * Clean files and folders
     */
    clean: {
      default: {
        script: series(
          `nps banner.clean`,
          `nps clean.dist`
        ),
        description: 'Deletes the ./dist folder'
      },
      dist: {
        script: rimraf('./dist'),
        hiddenFromHelp: true
      }
    },

    /**
     * This creates pretty banner to the terminal
     */
    banner: {
      generate: banner('generate'),
      build: banner('build'),
      watch: banner('watch'),
      migrate: banner('migrate'),
      seed: banner('seed'),
      revert: banner('revert'),
      clean: banner('clean')
    }
  }
};

function banner(name) {
  return {
    hiddenFromHelp: true,
    silent: true,
    description: `Shows ${name} banners to the console`,
    script: series([
      runFast(`./commands/banner.js ${name}`)
    ])
  };
}

function copy(source, target) {
  return `copyup ${source} ${target}`;
}

function run(path) {
  return `ts-node ${path}`;
}

function runFast(path) {
  return `babel-node ${path}`;
}

function eslint(path) {
  return `eslint -c ./.eslintrc.json ${path} --format stylish`;
}
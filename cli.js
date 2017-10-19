#!/usr/bin/env node
const chalk = require('chalk')
const globby = require('globby')
const {parseFile, stringify} = require('sast')
const {search} = require('./index')
require('epipebomb')()

const yargs = require('yargs')
  .usage('$0 [options] pattern [glob..]')
  .version(require('./package.json').version)
  .option('syntax', {
    desc: 'Which syntax to parse the input file(s) as',
    choices: ['auto', 'css', 'scss', 'sass', 'less'],
    default: 'auto',
    alias: 's',
  })
  .option('context', {
    desc: 'How much context to show',
    default: 0,
    type: 'number',
    alias: 'c',
  })
  .option('unique', {
    desc: 'Only list unique values',
    type: 'boolean',
    alias: 'u',
  })
  .option('verbose', {
    desc: 'Show more useful information for each result',
    type: 'boolean',
    alias: 'v',
  })
  .group(['has', 'not'], 'Predicates:')
  .option('has', {
    desc: 'Only include nodes that contain at least one descendant that matches the given selector, a la :has(selector)',
    type: 'string',
  })
  .option('not', {
    desc: 'Exclude nodes matching the given selector, a la :not(selector)',
    type: 'string',
  })
  .option('lacks', {
    desc: 'Just like :not(:has(selector))',
    type: 'string',
  })
  .demand(1, 'You must provide a search selector')
  .strict(true)


const options = yargs.argv
const args = options._
const pattern = args.shift()
const globs = args.length ? args : '**/*.{css,sass,scss,less}'

const parseFiles = files => {
  const {syntax} = options
  const parseOptions = {syntax}
  return Promise.all(
    files.map(file => {
      console.warn('%s:', chalk.yellow('parsing'), file)
      return parseFile(file, parseOptions)
    })
  )
}

globby(globs)
  .then(parseFiles)
  .then(trees => {
    trees.forEach(tree => {
      const results = search(tree, pattern, options)
      if (results.length) {
        console.warn('%s:', chalk.green(tree.source))
        results.forEach(result => {
          console.log(result.output)
        })
      } else {
        console.warn('%s: 0 results', chalk.yellow(tree.source))
      }
    })
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

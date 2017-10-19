#!/usr/bin/env node
const chalk = require('chalk')
const {parseFile, stringify} = require('sast')
const {search} = require('./index')
const {parseInput} = require('./src/io')
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

const die = error => {
  console.error(error)
  process.exit(1)
}

parseInput(options, args)
  .then(trees => {
    trees.forEach(tree => {
      const results = search(tree, pattern, options)
      const cwd = process.cwd()
      if (results.length) {
        const {source} = tree
        const relativeSource = source.indexOf(cwd) === 0
          ? source.substr(cwd.length)
          : source
        console.warn('%s:', chalk.green(relativeSource))
        results.forEach(result => {
          console.log(result.output)
        })
      } else {
        console.warn('%s: 0 results', chalk.yellow(tree.source))
      }
    })
  })
  .catch(die)

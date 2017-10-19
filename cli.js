#!/usr/bin/env node
const chalk = require('chalk')
const {stringify} = require('sast')
const {search} = require('./index')
const {parseInput} = require('./src/io')

const yargs = require('yargs')
  .usage('$0 [options] selector [predicates..] [files, glob..]')
  .version(require('./package.json').version)
  .option('syntax', {
    desc: 'Which syntax to parse the input file(s) as',
    choices: ['auto', 'css', 'scss', 'sass', 'less'],
    default: 'auto',
    alias: 's',
  })
  .option('context', {
    desc: 'How many parent levels to ascend before showing output, or a selector at which to stop',
    alias: 'c',
    coerce: value => {
      return (value && !isNaN(Number(value)))
        ? Number(value)
        : value
    },
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
  .option('limit', {
    desc: 'Limit output to a given number of results',
    type: 'number',
    alias: 'L',
  })
  .group(['has', 'not', 'lacks', 'count'], 'Predicates:')
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
  .option('count', {
    desc: 'Only include nodes for which the number of matched descendants is exactly the given count, e.g. "--count variable 2"',
    type: 'array',
    nargs: 2,
  })
  .demand(1, 'You must provide a search selector')
  .strict(true)

const options = yargs.argv
const args = options._
const pattern = args.shift()

// prevent EPIPE errors when you pipe to `head -10`, etc.
require('epipebomb')()

const die = error => {
  console.error(error)
  process.exit(1)
}

parseInput(options, args)
  .then(trees => {
    const limit = options.limit
    let count = 0
    let done = false
    trees.some(tree => {
      const results = search(tree, pattern, options)
      const cwd = process.cwd()
      const sourcePath = tree.source.path
      const relativePath = sourcePath.indexOf(cwd) === 0
        ? sourcePath.substr(cwd.length)
        : sourcePath
      if (results.length) {
        console.warn('%s:', chalk.green(relativePath))
        done = results.some(result => {
          console.log(result.output)
          if (++count == limit) return true
        })
      } else {
        // console.warn('%s: 0 results', chalk.yellow(relativePath))
      }
      return done
    })
  })
  .catch(die)

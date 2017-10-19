#!/usr/bin/env node
const {parseFile, stringify} = require('sast')
const {search, contextualize} = require('./index')
const chalk = require('chalk')
const globby = require('globby')
const stringifyPosition = require('unist-util-stringify-position')
const addParents = require('unist-util-parents')

const yargs = require('yargs')
  .usage('$0 [options] pattern [glob..]')
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
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .then(trees => {
    trees.forEach(tree => {
      tree = addParents(tree)
      const results = search(tree, pattern, options)
      if (results.length) {
        console.log('%s:', chalk.green(tree.source))
        results.forEach((node, i) => {
          const context = contextualize(node, options.context)
          const hilite = stringify(node)
          const output = context === node
            ? hilite
            : stringify(context).replace(hilite, chalk.magenta(hilite))
          console.log('%s %s %s',
                      chalk.yellow(stringifyPosition(node)),
                      chalk.green(node.type), output)
        })
      } else {
        console.warn('%s: 0 results', chalk.yellow(tree.source))
      }
    })
  })

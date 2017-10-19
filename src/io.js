const fse = require('fs-extra')
const path = require('path')
const globby = require('globby')
const {parseFile} = require('sast')

const STDIN = '/dev/stdin'
const STDIN_ARGS = ['-', STDIN]

const parseInput = (options, args) => {
  const {syntax} = options
  const DIR_GLOB = (!syntax || syntax === 'auto')
    ? '**/*.{css,sass,scss,less}'
    : `**/*.${syntax}`
  const parseOptions = {syntax}
  const isStdin = arg => STDIN_ARGS.includes(arg)
  const tap = message => value => (console.warn(message, value), value)

  if (args.length && !args.every(isStdin)) {
    const parseFiles = files => files.map(file => parseFile(file, parseOptions))
    const globDir = dir => globby(path.join(dir, DIR_GLOB))
    const flatten = list => list.reduce((acc, d) => acc.concat(d), [])

    const tasks = args.map(input => {
        if (isStdin(input)) {
          return parseFile(STDIN, parseOptions)
        }
        return globby(input)
          // .then(tap('inputs:'))
          .then(files => Promise.all(
            files.map(file => fse.stat(file).then(stat => ({file, stat})))
          ))
          // .then(tap('statted:'))
          .then(data => {
            return data.map(({file, stat}) => {
              return stat.isDirectory() ? globDir(file) : file
            })
          })
          // .then(tap('subtasks:'))
          .then(subtasks => Promise.all(subtasks))
          .then(flatten)
      })

    return Promise.all(tasks)
      .then(flatten)
      // .then(tap('files:'))
      .then(parseFiles)
      .then(parsers => Promise.all(parsers))
  } else {
    return parseFile(STDIN, parseOptions)
  }
}

module.exports = {
  parseInput,
}

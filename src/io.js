const fse = require('fs-extra')
const path = require('path')
const globby = require('globby')
const {parseFile} = require('sast')

const STDIN = '/dev/stdin'
const STDIN_ARGS = ['-', STDIN]

const parseInput = (options, args) => {
  const {syntax} = options

  /*
   * how to find files if the provided argument is a directory
   * depends on the value of the "syntax" option:
   *
   * - if it's not set or it's "auto", then look for all supported syntax
   *   extensions
   * - otherwise, look for only files with an extension matching the syntax
   */
  const DIR_GLOB = (!syntax || syntax === 'auto')
    ? '**/*.{css,sass,scss,less}'
    : `**/*.${syntax}`

  const parseOptions = {syntax}
  const isStdin = arg => STDIN_ARGS.includes(arg)
  const tap = message => value => (console.warn(message, value), value)

  if (args.length && !args.every(isStdin)) {
    const parseFiles = files => Promise.all(files.map(file => parseFile(file, parseOptions)))
    const globDir = dir => globby(path.join(dir, DIR_GLOB))
    const flatten = list => list.reduce((acc, d) => acc.concat(d), [])

    const tasks = args.map(input => {
        if (isStdin(input)) {
          return parseFile(STDIN, parseOptions)
        }
        // resolve all globs
        return globby(input)
          // stat all the files
          .then(files => Promise.all(
            files.map(file => fse.stat(file).then(stat => ({file, stat})))
          ))
          // return a globby() promise for directories, otherwise the
          // filename
          .then(data => {
            return data.map(({file, stat}) => {
              return stat.isDirectory() ? globDir(file) : file
            })
          })
          // resolve all the promises
          .then(subtasks => Promise.all(subtasks))
          // flatten the result, since globs of directories will produce an
          // array of arrays
          .then(flatten)
      })

    // resolve all of the tasks
    return Promise.all(tasks)
      // flatten the result, since some may have resolved to multiple paths
      .then(flatten)
      // parse all the files
      .then(parseFiles)
  } else {
    return parseFile(STDIN, parseOptions)
  }
}

module.exports = {
  parseInput,
}

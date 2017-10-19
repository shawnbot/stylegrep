const addParents = require('unist-util-parents')
const chalk = require('chalk')
const select = require('unist-util-select')
const stringifyPosition = require('unist-util-stringify-position')
const {createFilter, ascending, descending} = require('./src/predicates')
const {jsonify, stringify} = require('sast')

const groupBy = (list, keyFunction) => {
  const map = list.reduce((map, obj, i) => {
    const key = keyFunction.call(list, obj, i)
    if (map.has(key)) {
      map.get(key).push(obj)
    } else {
      map.set(key, [obj])
    }
    return map
  }, new Map())

  return Array.from(map.entries())
    .map(([key, values]) => ({key, values, size: values.length}))
}

const search = (tree, selector, options) => {
  const {context, verbose, unique} = options

  if (context) {
    tree = addParents(tree)
  }

  let results = select(tree, selector)
    .map((node, i) => {
      const string = stringify(node)
      return {
        type: 'node',
        node,
        string,
        output: string,
      }
    })

  const filter = createFilter(options)
  if (filter) {
    results = results.filter(({node}) => filter(node))
  }

  if (context) {
    results.forEach(result => {
      const {node, string} = result
      const ctx = contextualize(node, context)
      result.output = ctx === node
        ? string
        : stringify(ctx).replace(string, chalk.magenta(string))
      result.context = ctx
    })
  }

  if (verbose) {
    results.forEach(result => {
      const {output} = result
      const context = result.context || result.node
      const pos = stringifyPosition(context)
      result.output = `${output}\t${chalk.gray(context.type)}\t${chalk.yellow(pos)}`
    })
  }

  if (unique) {
    results = groupBy(results, result => result.string)
      .sort(descending(g => g.size))
      .map(({key, values}) => {
        const first = values[0]
        const output = first.string
        return {
          type: 'group',
          key,
          values,
          output,
        }
      })

    if (verbose) {
      results.forEach(result => {
        const {values, output} = result
        const count = chalk.yellow(values.length.toLocaleString())
        result.output = `${count}\t${output}`
      })
    }
  }

  return results
}

const contextualize = (node, depth) => {
  for (let i = 0; i < depth; i++) {
    if (!node.parent) break
    node = node.parent
  }
  return node
}

module.exports = {
  search,
  contextualize,
}

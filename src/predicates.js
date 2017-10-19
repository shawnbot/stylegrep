const is = require('unist-util-is')
const select = require('unist-util-select')

const ascending = f => (a, b) => cmp(f(a), f(b))
const descending = f => (a, b) => cmp(f(b), f(a))
const cmp = (a, b) => (a > b ? 1 : a < b ? -1 : 0)

const find = (node, selector) => {
  selector = selector.trim()
  // see: <https://developer.mozilla.org/en-US/docs/Web/CSS/:has>
  // ':has(> ident)' should only return direct descendants (children)
  // of type 'ident'
  if (selector.charAt(0) === '>') {
    selector = selector.replace(/^>\s*/, '')
    return node.children
      ? node.children.filter(child => is(selector, child))
      : []
  } else {
    return select(node, selector)
  }
}

const predicates = {
  has:    selector => node => find(node, selector).length > 0,
  lacks:  selector => node => find(node, selector).length === 0,
  not:    selector => node => !is(selector, node),
  count:  (selector, count) => node => find(node, selector).length == count,
}

const some = tests => d => tests.some(test => test(d))
const every = tests => d => tests.every(test => test(d))
const identity = v => () => v

const predicate = (name, valueOrValues) => {
  const pred = predicates[name]
  return Array.isArray(valueOrValues)
    ? every(valueOrValues.map(pred))
    : pred(valueOrValues)
}

const createFilter = filters => {
  const tests = Object.keys(predicates)
    .filter(key => filters[key])
    .map(key => predicate(key, filters[key]))
  return tests.length
    ? every(tests)
    : identity(true)
}

module.exports = {
  ascending,
  cmp,
  createFilter,
  descending,
  every,
  identity,
  predicate,
  predicates,
  some,
}

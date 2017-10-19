const is = require('unist-util-is')
const select = require('unist-util-select')


const predicates = {
  has: selector => node => select(node, selector).length > 0,
  lacks: selector => node => select(node, selector).length === 0,
  not: selector => node => !is(selector, node),
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
  return tests.length ? every(tests) : identity(true)
}

const ascending = f => (a, b) => cmp(f(a), f(b))
const descending = f => (a, b) => cmp(f(b), f(a))
const cmp = (a, b) => (a > b ? 1 : a < b ? -1 : 0)

module.exports = {
  ascending,
  descending,
  cmp,
  createFilter,
  predicate,
  predicates,
  some,
  every,
  identity,
}

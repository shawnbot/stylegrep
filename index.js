const select = require('unist-util-select')

const search = (tree, pattern, options) => {
  return select(tree, pattern)
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

# stylegrep
Crawl CSS, SCSS, Sass, and Less files using AST selectors, not janky regular
expressions!

## Installation
Install it with npm

```sh
npm install --save stylegrep
```

## CLI
The `stylegrep` command line utility requires at least one positional
argument: the search selector, similar to other tools like `grep` and `ack`.
Additional arguments are treated as file names. Directories will be expanded
into a glob matching either `**/*.{syntax}` if the `--syntax` argument is
provided and is not `auto`, otherwise `**/*.{css,sass,scss,less}` (all
supported syntaxes).

`stylegrep` then parses each file (or stdin if no files are given), finds all
of the nodes matching the search selector, and process them in the following
pipeline:

1. If `--context` is provided, resolve the selected node's parents that
   number of times. This allows you to "zoom out" from the selected node so
   that you can understand where it lives.
1. Apply all predicate options (see below), filtering the selected nodes by
   whether they contain (`--has`), don't match (`--not`), don't contain
   (`--lacks`), or have a specific number of descendants (`--count`) matching
   the given selectors.
1. Limit the returned results if `--limit` is greater than zero.
1. Apply additional formatting if `--verbose`.
1. Write the results to stdout.

```
stylegrep [options] selector [predicates..] [files, globs..]

Predicates:
  --has    Only include nodes that contain at least one descendant that matches
           the given selector, a la :has(selector)                      [string]
  --not    Exclude nodes matching the given selector, a la :not(selector)
                                                                        [string]
  --lacks  Just like :not(:has(selector))                               [string]
  --count  Only include nodes for which the number of matched descendants is
           exactly the given count, e.g. "--count variable 2"            [array]

Options:
  --help         Show help                                             [boolean]
  --version      Show version number                                   [boolean]
  --syntax, -s   Which syntax to parse the input file(s) as
              [choices: "auto", "css", "scss", "sass", "less"] [default: "auto"]
  --context, -c  How much context to show                  [number] [default: 0]
  --unique, -u   Only list unique values                               [boolean]
  --verbose, -v  Show more useful information for each result          [boolean]
  --limit, -L    Limit output to a given number of results              [number]
```

In `--verbose` mode, output is colored so that you can see where the originally
selected node sits in the expanded context:

![example image](https://user-images.githubusercontent.com/113896/31789529-3803a28a-b4c7-11e7-9b79-b1e041145f10.png)

## API
Coming soon!

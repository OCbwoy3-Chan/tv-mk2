import {type Palette} from '#/alf/themes'

// Lightweight code tokenizer adapted from Parfait (Zero-Clause BSD),
// juliet.paris, commit c435dfe0. Unknown languages use shared generic rules.
export type TokenKind =
  | 'comment'
  | 'keyword'
  | 'string'
  | 'number'
  | 'function'
  | 'type'
  | 'property'
  | 'punctuation'
  | 'added'
  | 'removed'
export type Token = {text: string; kind?: TokenKind}

const COMMENTS = {
  slash: String.raw`\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)`,
  line: String.raw`\/\/[^\n]*`,
  block: String.raw`\/\*[\s\S]*?(?:\*\/|$)`,
  hash: String.raw`#[^\n]*`,
  dash: String.raw`--[^\n]*`,
}

const STRINGS = {
  double: String.raw`"(?:\\.|[^"\\\n])*"?`,
  single: String.raw`'(?:\\.|[^'\\\n])*'?`,
  // A character, as Rust and C write one: not a lifetime ('a), which doesn't close.
  char: String.raw`'(?:\\.|[^'\\\n])'`,
  back: '`(?:\\\\.|[^`\\\\])*`?',
  triple: String.raw`"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)`,
}

const NUMBER = String.raw`\b(?:0x[\da-fA-F_]+|0b[01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)[a-zA-Z%]*`

/** Operators and brackets: there, but quiet. */
const PUNCTUATION = String.raw`[{}()[\];,.<>=+\-*/%!&|^~?:]+`

/** Things only some languages have, by the kind they're coloured as. */
type Marks = Partial<Record<TokenKind, string[]>>

type Language = {
  comments: string[]
  strings: string[]
  /** Its keywords. */
  words: string
  marks?: Marks
  /** Keywords in any case, as SQL's. */
  anyCase?: boolean
  /** A string before a colon is a key, as JSON's and YAML's are. */
  keys?: boolean
}

/** Values every language names: coloured as numbers are. */
const CONSTANTS = new Set(
  'true false null nil None True False Nil undefined NaN Infinity iota self Self this'.split(
    ' ',
  ),
)

const C_LIKE =
  'break case const continue default do else enum for if return static struct switch while'
const JS = `${C_LIKE} as async await catch class debugger delete export extends finally from function get implements import in instanceof interface let new of private protected public readonly satisfies set super throw try type typeof var void yield keyof declare namespace abstract`

const LANGUAGES: Record<string, Language> = {
  js: {
    comments: [COMMENTS.slash],
    strings: [STRINGS.double, STRINGS.single, STRINGS.back],
    words: JS,
    marks: {function: [String.raw`@\w+`]},
  },
  rust: {
    comments: [COMMENTS.slash],
    strings: [STRINGS.double, STRINGS.char],
    words:
      'as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub ref return static struct super trait type unsafe use where while',
    // Macros (println!) and lifetimes ('a), and attributes (#[derive]).
    marks: {
      function: [String.raw`\b\w+!(?=\s*[([{])`],
      type: [String.raw`'[a-z_]\w*\b(?!')`],
      keyword: [String.raw`#!?\[[^\]\n]*\]`],
    },
  },
  go: {
    comments: [COMMENTS.slash],
    strings: [STRINGS.double, STRINGS.char, STRINGS.back],
    words:
      'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var',
  },
  gleam: {
    comments: [COMMENTS.line],
    strings: [STRINGS.double],
    words:
      'as assert case const echo else fn if import let opaque panic pub todo type use',
    marks: {function: [String.raw`@\w+`]},
  },
  python: {
    comments: [COMMENTS.hash],
    strings: [STRINGS.triple, STRINGS.double, STRINGS.single],
    words:
      'and as assert async await break case class continue def del elif else except finally for from global if import in is lambda match nonlocal not or pass raise return try while with yield',
    marks: {function: [String.raw`@[\w.]+`]},
  },
  ruby: {
    comments: [COMMENTS.hash],
    strings: [STRINGS.double, STRINGS.single],
    words:
      'alias and begin break case class def do else elsif end ensure for if in module next not or redo require rescue retry return super then unless until when while yield',
    marks: {number: [String.raw`:\w+`], property: [String.raw`@{1,2}\w+`]},
  },
  shell: {
    comments: [COMMENTS.hash],
    strings: [STRINGS.double, STRINGS.single],
    words:
      'if then else elif fi for while until do done case esac in function return local export exit set unset source alias sudo cd echo',
    marks: {property: [String.raw`\$\{?[\w@#?*!-]+\}?`]},
  },
  sql: {
    comments: [COMMENTS.dash, COMMENTS.block],
    strings: [STRINGS.single, STRINGS.double],
    words:
      'select from where insert into values update set delete create table index view drop alter add column join left right inner outer full on as and or not is in like between order by group having limit offset distinct union all primary key foreign references default returning with case when then else end begin commit',
    anyCase: true,
  },
  c: {
    comments: [COMMENTS.slash],
    strings: [STRINGS.double, STRINGS.char],
    words: `${C_LIKE} auto char double extern float goto inline int long register short signed sizeof typedef union unsigned void volatile bool nullptr class namespace template typename private protected public virtual override new delete using`,
    marks: {keyword: [String.raw`#\s*\w+`]},
  },
  java: {
    comments: [COMMENTS.slash],
    strings: [STRINGS.triple, STRINGS.double, STRINGS.char],
    words: `${C_LIKE} abstract boolean byte catch char class double extends final finally float implements import instanceof int interface long new package private protected public short super synchronized throw throws try var void val fun when object data sealed override open lateinit companion is in out suspend`,
    marks: {function: [String.raw`@\w+`]},
  },
  swift: {
    comments: [COMMENTS.slash],
    strings: [STRINGS.triple, STRINGS.double],
    words: `${C_LIKE} actor any as associatedtype async await catch class defer deinit extension fileprivate func guard import in init inout internal is let open private protocol public repeat rethrows some super throw throws try typealias var where`,
    marks: {function: [String.raw`@\w+`]},
  },
  php: {
    comments: [COMMENTS.slash, COMMENTS.hash],
    strings: [STRINGS.double, STRINGS.single],
    words: `${C_LIKE} abstract and array as catch class clone echo elseif extends final finally fn foreach function global implements include instanceof interface isset match namespace new or print private protected public require throw trait try unset use var yield`,
    marks: {property: [String.raw`\$\w+`]},
  },
  lua: {
    comments: [String.raw`--\[\[[\s\S]*?(?:\]\]|$)`, COMMENTS.dash],
    strings: [STRINGS.double, STRINGS.single],
    words:
      'and break do else elseif end for function goto if in local not or repeat return then until while',
  },
  zig: {
    comments: [COMMENTS.line],
    strings: [STRINGS.double, STRINGS.char],
    words: `${C_LIKE} align and anytype async await catch comptime defer errdefer error export extern fn inline noalias opaque or orelse packed pub resume test threadlocal try union unreachable usingnamespace var volatile`,
    marks: {function: [String.raw`@\w+`]},
  },
  elixir: {
    comments: [COMMENTS.hash],
    strings: [STRINGS.triple, STRINGS.double],
    words:
      'after alias and case catch cond def defmodule defp defstruct do else end fn for if import in not or quote raise receive require rescue try unless use when with',
    marks: {number: [String.raw`:\w+`], property: [String.raw`@\w+`]},
  },
  css: {
    comments: [COMMENTS.block],
    strings: [STRINGS.double, STRINGS.single],
    words: 'important inherit initial unset none auto',
    // At-rules, colours, and properties.
    marks: {
      keyword: [String.raw`@[\w-]+`],
      number: [String.raw`#[\da-fA-F]{3,8}\b`],
      property: [String.raw`[\w-]+(?=\s*:[^:])`, String.raw`--[\w-]+`],
    },
  },
  json: {
    comments: [COMMENTS.slash],
    strings: [STRINGS.double],
    words: '',
    keys: true,
  },
  yaml: {
    comments: [COMMENTS.hash],
    strings: [STRINGS.double, STRINGS.single],
    words: 'yes no on off',
    keys: true,
    // A key at its line's start, and a TOML table.
    marks: {
      property: [String.raw`(?<=^|\n)[ \t-]*[\w.-]+(?=[ \t]*[:=])`],
      type: [String.raw`(?<=^|\n)\[[^\]\n]*\]`],
    },
  },
}

const ALIASES: Record<string, string> = {
  javascript: 'js',
  jsx: 'js',
  mjs: 'js',
  cjs: 'js',
  ts: 'js',
  typescript: 'js',
  tsx: 'js',
  rs: 'rust',
  golang: 'go',
  py: 'python',
  rb: 'ruby',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  fish: 'shell',
  console: 'shell',
  h: 'c',
  cpp: 'c',
  'c++': 'c',
  cc: 'c',
  hpp: 'c',
  cs: 'java',
  csharp: 'java',
  kt: 'java',
  kotlin: 'java',
  scala: 'java',
  dart: 'java',
  ex: 'elixir',
  exs: 'elixir',
  scss: 'css',
  less: 'css',
  jsonc: 'json',
  json5: 'json',
  yml: 'yaml',
  toml: 'yaml',
  ini: 'yaml',
}

/** Most languages, near enough: C's comments, their strings, a mix of their keywords. */
const GENERIC: Language = {
  comments: [COMMENTS.slash],
  strings: [STRINGS.double, STRINGS.single, STRINGS.back],
  words: `${JS} fn def func let mut pub impl use match`,
}

const compiled = new Map<Language, {pattern: RegExp; words: Set<string>}>()

const compile = (language: Language) => {
  let found = compiled.get(language)
  if (!found) {
    const group = (name: string, parts: string[] | undefined) =>
      parts?.length ? `(?<${name}>${parts.join('|')})|` : ''
    const marks = Object.entries(language.marks ?? {})
      .map(([kind, parts]) => group(`mark_${kind}`, parts))
      .join('')
    found = {
      pattern: new RegExp(
        group('comment', language.comments) +
          group('string', language.strings) +
          marks +
          `(?<number>${NUMBER})|(?<word>[A-Za-z_][\\w]*)|(?<punctuation>${PUNCTUATION})`,
        'g',
      ),
      words: new Set(
        language.words
          .split(' ')
          .map(word => (language.anyCase ? word.toLowerCase() : word)),
      ),
    }
    compiled.set(language, found)
  }
  return found
}

/** A word's kind, from itself and what's either side of it. */
const wordKind = (
  word: string,
  before: string,
  after: string,
  words: Set<string>,
  anyCase?: boolean,
): TokenKind | undefined => {
  const called = /^\s*!?\s*\(/.test(after)
  // After a dot it's a property or a method, whatever it's called: api.get, node.type.
  if (/\.\s*$/.test(before)) return called ? 'function' : 'property'
  if (words.has(anyCase ? word.toLowerCase() : word)) return 'keyword'
  if (CONSTANTS.has(word)) return 'number'
  if (called) return 'function'
  if (/^[A-Z][A-Z\d_]+$/.test(word)) return 'number'
  if (/^[A-Z]/.test(word)) return 'type'
  return undefined
}

/** A diff: what's added and what's taken out, by line. */
const diff = (code: string): Token[] =>
  code.split(/(?<=\n)/).map(line => ({
    text: line,
    kind: line.startsWith('+')
      ? 'added'
      : line.startsWith('-')
        ? 'removed'
        : line.startsWith('@@')
          ? 'function'
          : undefined,
  }))

/** HTML and XML: their tags and attributes, strings and comments. */
const markup = (code: string): Token[] => {
  const tokens: Token[] = []
  const pattern =
    /(?<comment><!--[\s\S]*?(?:-->|$))|(?<open><\/?)(?<tag>[\w:-]+)|(?<string>"[^"]*"?|'[^']*'?)|(?<property>[\w:-]+(?==))|(?<punctuation>\/?>|=)/g
  let at = 0
  for (const match of code.matchAll(pattern)) {
    if (match.index > at) tokens.push({text: code.slice(at, match.index)})
    const groups = match.groups!
    if (groups.tag) {
      tokens.push(
        {text: groups.open, kind: 'punctuation'},
        {text: groups.tag, kind: 'keyword'},
      )
    } else {
      const kind = (
        ['comment', 'string', 'property', 'punctuation'] as const
      ).find(name => groups[name])
      tokens.push({text: match[0], kind})
    }
    at = match.index + match[0].length
  }
  if (at < code.length) tokens.push({text: code.slice(at)})
  return tokens
}

/** Code in tokens, each with its kind if it has one, for the language its block is in. */
export const highlight = (code: string, language: string): Token[] => {
  const normalized = language.toLowerCase()
  const name = Object.prototype.hasOwnProperty.call(ALIASES, normalized)
    ? ALIASES[normalized]
    : normalized
  if (['text', 'txt', 'plain', 'plaintext'].includes(name))
    return [{text: code}]
  if (name === 'diff' || name === 'patch') return diff(code)
  if (['html', 'xml', 'svg', 'vue', 'svelte'].includes(name))
    return markup(code)
  // Only known, own language specifications enter the bounded compile cache.
  const spec = Object.prototype.hasOwnProperty.call(LANGUAGES, name)
    ? LANGUAGES[name]
    : GENERIC
  const {pattern, words} = compile(spec)
  const tokens: Token[] = []
  let at = 0
  for (const match of code.matchAll(pattern)) {
    if (match.index > at) tokens.push({text: code.slice(at, match.index)})
    const groups = match.groups!
    const end = match.index + match[0].length
    const mark = Object.keys(groups).find(
      key => key.startsWith('mark_') && groups[key],
    )
    const kind: TokenKind | undefined = groups.comment
      ? 'comment'
      : groups.string
        ? spec.keys && /^\s*:(?!:)/.test(code.slice(end, end + 8))
          ? 'property'
          : 'string'
        : mark
          ? (mark.slice(5) as TokenKind)
          : groups.number
            ? 'number'
            : groups.punctuation
              ? 'punctuation'
              : wordKind(
                  match[0],
                  code.slice(Math.max(0, match.index - 4), match.index),
                  code.slice(end, end + 4),
                  words,
                  spec.anyCase,
                )
    tokens.push({text: match[0], kind})
    at = end
  }
  if (at < code.length) tokens.push({text: code.slice(at)})
  return tokens
}

/** Semantic syntax colours shared by native tokens and web CSS variables. */
export function syntaxColors(
  palette: Pick<
    Palette,
    | 'contrast_500'
    | 'contrast_600'
    | 'contrast_900'
    | 'negative_700'
    | 'positive_700'
    | 'primary_600'
    | 'primary_700'
    | 'primary_800'
  >,
): Record<TokenKind, string> {
  return {
    comment: palette.contrast_500,
    keyword: palette.negative_700,
    string: palette.positive_700,
    number: palette.primary_700,
    function: palette.primary_600,
    type: palette.primary_800,
    property: palette.contrast_900,
    punctuation: palette.contrast_600,
    added: palette.positive_700,
    removed: palette.negative_700,
  }
}

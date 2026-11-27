import {highlight} from './highlight'

function colored(code: string, language: string) {
  return highlight(code, language)
    .filter(token => token.kind)
    .map(token => [token.text, token.kind])
}

describe('code highlighting', () => {
  it('gives strings and comments precedence over keywords and punctuation', () => {
    expect(
      colored('const s = "// return 42"; /* "let" */ // false', 'js'),
    ).toEqual([
      ['const', 'keyword'],
      ['=', 'punctuation'],
      ['"// return 42"', 'string'],
      [';', 'punctuation'],
      ['/* "let" */', 'comment'],
      ['// false', 'comment'],
    ])
  })

  it.each([
    ['js', 'javascript jsx mjs cjs ts typescript tsx'],
    ['rust', 'rs'],
    ['go', 'golang'],
    ['python', 'py'],
    ['ruby', 'rb'],
    ['shell', 'sh bash zsh fish console'],
    ['c', 'h cpp c++ cc hpp'],
    ['java', 'cs csharp kt kotlin scala dart'],
    ['elixir', 'ex exs'],
    ['css', 'scss less'],
    ['json', 'jsonc json5'],
    ['yaml', 'yml toml ini'],
    ['html', 'xml svg vue svelte'],
    ['diff', 'patch'],
  ])('uses %s aliases case-insensitively', (language, aliases) => {
    const code = '# note\nconst value = "text"; <node key="v">\n+new\n'
    const expected = highlight(code, language)
    for (const alias of [language, ...aliases.split(' ')]) {
      expect(highlight(code, alias.toUpperCase())).toEqual(expected)
    }
  })

  it.each(['text', 'txt', 'plain', 'plaintext', 'TXT', 'PlainText'])(
    'leaves plain alias %s uncolored',
    language => {
      const code = 'const x = "text" // comment\n🌟'
      expect(highlight(code, language)).toEqual([{text: code}])
    },
  )

  it('recognizes multiline comments, template strings and triple strings', () => {
    expect(colored('/* first\nsecond */\n`hello\nworld`', 'js')).toEqual([
      ['/* first\nsecond */', 'comment'],
      ['`hello\nworld`', 'string'],
    ])
    expect(colored('"""hello\n# not a comment\n"""', 'python')).toEqual([
      ['"""hello\n# not a comment\n"""', 'string'],
    ])
    expect(colored('--[[ first\nsecond ]]', 'lua')).toEqual([
      ['--[[ first\nsecond ]]', 'comment'],
    ])
  })

  it('keeps markup and HTML entities literal without escaping or decoding', () => {
    const code = '<div title="<&amp;">&lt;🌟</div><!-- <tag> -->'
    const tokens = highlight(code, 'html')
    expect(tokens.map(token => token.text).join('')).toBe(code)
    expect(tokens).toContainEqual({text: 'div', kind: 'keyword'})
    expect(tokens).toContainEqual({text: 'title', kind: 'property'})
    expect(tokens).toContainEqual({text: '"<&amp;"', kind: 'string'})
    expect(tokens).toContainEqual({text: '&lt;🌟'})
    expect(tokens).toContainEqual({text: '<!-- <tag> -->', kind: 'comment'})
  })

  it('colors diff lines including their original line endings', () => {
    expect(highlight('@@ heading @@\n-old\r\n+new\n context', 'diff')).toEqual([
      {text: '@@ heading @@\n', kind: 'function'},
      {text: '-old\r\n', kind: 'removed'},
      {text: '+new\n', kind: 'added'},
      {text: ' context', kind: undefined},
    ])
  })

  it.each([
    '',
    'unknown',
    '__proto__',
    'constructor',
    'toString',
    'hasOwnProperty',
  ])('uses generic rules for %s without inherited specifications', language => {
    const code = 'fn greet() { return "hi"; } // note'
    expect(highlight(code, language)).toEqual(
      highlight(code, 'unknown-language'),
    )
    expect(colored(code, language)).toContainEqual(['fn', 'keyword'])
  })

  it('recognizes contextual words, language marks, keys and case-insensitive SQL', () => {
    expect(colored('api.get() api.type true Widget MAX', 'js')).toEqual([
      ['.', 'punctuation'],
      ['get', 'function'],
      ['()', 'punctuation'],
      ['.', 'punctuation'],
      ['type', 'property'],
      ['true', 'number'],
      ['Widget', 'type'],
      ['MAX', 'number'],
    ])
    expect(colored('println!("hi"); \'a', 'rust')).toContainEqual([
      'println!',
      'function',
    ])
    expect(colored('{"key": "value"}', 'json')).toContainEqual([
      '"key"',
      'property',
    ])
    expect(colored('SeLeCt name FROM users', 'sql')).toEqual([
      ['SeLeCt', 'keyword'],
      ['FROM', 'keyword'],
    ])
  })

  it.each(['js', 'python', 'html', 'diff', 'unknown', '__proto__', 'text'])(
    'preserves all Unicode and whitespace in %s',
    language => {
      for (const code of [
        '',
        '🌟 café e\u0301 世界\r\n\t',
        'const café = "👩🏽‍💻";\n// 日本語\n',
        '\ud800\u0000\udfff',
      ]) {
        expect(
          highlight(code, language)
            .map(token => token.text)
            .join(''),
        ).toBe(code)
      }
    },
  )
})

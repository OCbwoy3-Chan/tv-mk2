import {srtToVtt} from './srtToVtt'

describe('srtToVtt', () => {
  it('converts multiple cues, BOM and Windows newlines while preserving text', () => {
    expect(
      srtToVtt(
        '\uFEFF1\r\n00:00:01,000 --> 00:00:02,500\r\nHello, world\r\nSecond line\r\n\r\n2\r\n00:00:03,000 --> 00:00:04,000\r\n<i>Hi</i>',
      ),
    ).toBe(
      'WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.500\nHello, world\nSecond line\n\n2\n00:00:03.000 --> 00:00:04.000\n<i>Hi</i>\n',
    )
  })
  it('accepts cues without numeric identifiers', () => {
    expect(srtToVtt('00:00:00,000 --> 00:00:01,000\nHi')).toContain(
      '00:00:00.000 --> 00:00:01.000',
    )
  })
  it.each(['', 'not subtitles', '1\n00:00:00,000 --> 00:00:01,000'])(
    'rejects invalid input: %s',
    input => {
      expect(() => srtToVtt(input)).toThrow()
    },
  )
})

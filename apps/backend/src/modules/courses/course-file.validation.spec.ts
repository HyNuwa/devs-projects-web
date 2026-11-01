import { byteRange, validateCourseFile } from './course-file.validation';

describe('Course files at the HTTP boundary', () => {
  it('checks content signatures as well as extension and size', () => {
    expect(
      validateCourseFile('notes.pdf', Buffer.from('%PDF-1.7 content')),
    ).toBe('application/pdf');
    expect(() =>
      validateCourseFile('notes.pdf', Buffer.from('MZ executable')),
    ).toThrow();
    expect(() => validateCourseFile('notes.pdf', Buffer.alloc(0))).toThrow();
    expect(() =>
      validateCourseFile('notes.pdf', Buffer.from('%PDF-'), 26 * 1024 * 1024),
    ).toThrow();
  });
  it('supports exact, open and suffix ranges without serving multiple ranges', () => {
    expect(byteRange(undefined, 100)).toBeNull();
    expect(byteRange('bytes=0-9', 100)).toEqual({ start: 0, end: 9 });
    expect(byteRange('bytes=90-', 100)).toEqual({ start: 90, end: 99 });
    expect(byteRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
    for (const range of [
      'bytes=100-',
      'bytes=0-1,3-4',
      'bytes=-0',
      'bytes=3-2',
      'bytes=-',
      'nonsense',
    ])
      expect(() => byteRange(range, 100)).toThrow();
  });
});

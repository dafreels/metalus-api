import { packageNamePipe } from './classname.pipe';

describe('packageNamePipe', () => {
  it('create an instance', () => {
    const pipe = new packageNamePipe();
    expect(pipe).toBeTruthy();
  });
});

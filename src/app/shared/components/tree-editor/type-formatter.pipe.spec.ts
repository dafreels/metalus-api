import { IsGenericType } from './type-formatter.pipe';

describe('IsGenericType', () => {
  it('create an instance', () => {
    const pipe = new IsGenericType();
    expect(pipe).toBeTruthy();
  });
});

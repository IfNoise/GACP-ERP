import { CurrentUser } from './current-user.decorator';

describe('CurrentUser decorator', () => {
  it('is defined', () => {
    expect(CurrentUser).toBeDefined();
    expect(typeof CurrentUser).toBe('function');
  });

  it('can be invoked as a decorator factory', () => {
    const decorator = CurrentUser();
    expect(typeof decorator).toBe('function');
  });

  it('can be invoked with a key', () => {
    const decorator = CurrentUser('sub');
    expect(typeof decorator).toBe('function');
  });
});

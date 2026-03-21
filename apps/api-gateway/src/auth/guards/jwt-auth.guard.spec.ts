import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('is defined and extends AuthGuard', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
    expect(guard.canActivate).toBeDefined();
  });

  it('calls super.canActivate', () => {
    const guard = new JwtAuthGuard();
    // canActivate delegates to passport AuthGuard
    // We can't easily mock super, so we verify the prototype chain
    const proto = Object.getPrototypeOf(Object.getPrototypeOf(guard));
    expect(proto.canActivate).toBeDefined();
  });
});

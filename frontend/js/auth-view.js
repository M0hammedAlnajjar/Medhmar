const eye = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="eye-slash" d="m3 3 18 18"/></svg>';
const google = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93a6 6 0 0 1 0-3.86V7.48H3.06a10 10 0 0 0 0 9.04l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59A5.97 5.97 0 0 1 12 5.95Z"/></svg>';
const emailIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>';
const lockIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
const userIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.6-4.7 3.1-7 7.5-7s6.9 2.3 7.5 7"/></svg>';

function emailField() {
  return '<div class="field auth-field-with-icon"><label for="auth-email">Email</label><div class="auth-input-wrap"><span class="auth-input-icon">'+emailIcon+'</span><input class="input" id="auth-email" name="email" type="email" autocomplete="email" placeholder="mohammed@example.com" maxlength="254" required></div></div>';
}

function passwordField(name, label, isNew = true) {
  return `<div class="field auth-field-with-icon"><label for="auth-${name}">${label}</label><div class="password-control auth-input-wrap"><span class="auth-input-icon">${lockIcon}</span><input class="input" id="auth-${name}" name="${name}" type="password" autocomplete="${isNew ? 'new-password' : 'current-password'}" placeholder="${isNew ? 'At least 12 characters' : 'Enter your password'}" ${isNew ? 'minlength="12"' : ''} maxlength="72" required><button class="password-toggle" type="button" data-password-target="auth-${name}" aria-label="Show ${label.toLowerCase()}" aria-pressed="false">${eye}</button></div></div>`;
}

export function authView(kind) {
  const configs = {
    signin: {
      title: 'Welcome Back', description: 'Sign in to your Medhmar account.',
      fields: `${emailField()}${passwordField('password', 'Password', false)}<div class="auth-options"><label class="auth-check" title="Remember your email on this device"><input type="checkbox" name="rememberMe"> Remember me</label><a href="/forgot-password" data-link>Forgot Password?</a></div>`,
      submit: 'Login',
    },
    signup: {
      title: 'Create Your Account', description: 'Join Medhmar and be part of the camel racing community.',
      fields: `<div class="field"><label for="auth-fullName">Full Name</label><input class="input" id="auth-fullName" name="fullName" autocomplete="name" placeholder="Mohammed Al Najjar" maxlength="150" required></div>${emailField()}${passwordField('password', 'Password')}${passwordField('confirmPassword', 'Confirm Password')}<div class="field"><label for="auth-role">Account Type</label><select class="select" id="auth-role" name="role" required><option value="" selected disabled>Choose your account type</option><option value="VIEWER">Fan / Spectator</option><option value="OWNER">Camel Owner</option><option value="TRAINER">Trainer (Mudammer)</option></select></div><label class="auth-check auth-terms"><input type="checkbox" name="terms" required> I agree to the Terms &amp; Conditions</label>`,
      submit: 'Create Account',
    },
    forgot: {
      title: 'Forgot Your Password?', description: 'Enter your email to receive a reset link.',
      fields: emailField(), submit: 'Send Reset Link',
    },
    reset: {
      title: 'Create New Password', description: 'Enter your new password below.',
      fields: `${passwordField('password', 'New Password')}${passwordField('confirmPassword', 'Confirm New Password')}`,
      submit: 'Reset Password',
    },
  };

  const cfg = configs[kind];
  const social = kind === 'signin' || kind === 'signup';
  const footer = kind === 'signin'
    ? 'Don’t have an account? <a href="/signup" data-link>Create account →</a>'
    : 'Already have an account? <a href="/signin" data-link>Sign in →</a>';

  return `<div class="app-shell auth-page auth-${kind}" lang="en" dir="ltr">
    <div class="auth-bg" aria-hidden="true"></div>
    <header class="auth-brandbar">
      <a class="brand brand-wordmark" href="/" data-link aria-label="Medhmar home"><img src="/assets/medhmar-logo-full.svg" alt="MEDHMAR — Oman Camel Racing" width="480" height="312" decoding="async"></a>
      <div class="auth-brand-message">A HOME FOR<br>CAMEL RACING ENTHUSIASTS <span></span></div>
    </header>
    <main class="auth-stage">
      <section class="auth-card" aria-labelledby="auth-title">
        <div class="auth-visual" aria-hidden="true">
          <img class="auth-photo" src="/assets/racing-hero.webp" width="1672" height="941" alt="" fetchpriority="high" decoding="async">
          <div class="auth-visual-overlay"></div>
        </div>
        <section class="auth-panel">
          <div class="auth-box">
            <div class="auth-user-icon">${userIcon}</div>
            <h1 id="auth-title">${cfg.title}</h1>
            <p>${cfg.description}</p>
            <form class="form" id="auth-form" data-kind="${kind}">
              ${cfg.fields}
              <p class="auth-feedback" id="auth-feedback" role="status" aria-live="polite" hidden></p>
              <button class="btn btn-primary auth-submit" type="submit">${cfg.submit} <span aria-hidden="true">→</span></button>
            </form>
            ${social ? `<div class="divider">Or login with</div><button class="btn auth-google" type="button" id="google-signin">${google}Continue with Google</button>${kind === 'signup' ? '<p class="form-help auth-google-note">Google sign-up creates a Fan / Spectator account automatically.</p>' : ''}<p class="auth-switch">${footer}</p>` : kind === 'forgot' ? '<a class="auth-back" href="/signin" data-link>← Back to Sign In</a>' : ''}
          </div>
        </section>
      </section>
    </main>
  </div>`;
}

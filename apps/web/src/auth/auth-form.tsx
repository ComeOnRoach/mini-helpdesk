import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from './use-auth';
import { validateEmail, validatePassword } from './validation';

interface AuthFormProps {
  // Also the data-testid prefix: login-email, register-submit, ...
  mode: 'login' | 'register';
}

const COPY = {
  login: { title: 'Login', submit: 'Log in', other: '/register', otherText: 'Create an account' },
  register: {
    title: 'Register',
    submit: 'Create account',
    other: '/login',
    otherText: 'I already have an account',
  },
};

export function AuthForm({ mode }: AuthFormProps) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const copy = COPY[mode];

  if (user) {
    return <Navigate to="/tickets" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = {
      email: validateEmail(email),
      password: validatePassword(password, mode === 'register' ? 8 : 1),
    };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) {
      return;
    }
    setSubmitting(true);
    try {
      await (mode === 'login' ? login : register)(email.trim(), password);
      navigate('/tickets', { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h1 data-testid={`${mode}-title`}>{copy.title}</h1>
      <form className="form" onSubmit={onSubmit} noValidate data-testid={`${mode}-form`}>
        {formError && (
          <p className="form-error" role="alert" data-testid={`${mode}-error`}>
            {formError}
          </p>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            data-testid={`${mode}-email`}
          />
        </label>
        {errors.email && (
          <p className="field-error" data-testid={`${mode}-email-error`}>
            {errors.email}
          </p>
        )}
        <label>
          Password
          <input
            type="password"
            value={password}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onChange={(event) => setPassword(event.target.value)}
            data-testid={`${mode}-password`}
          />
        </label>
        {errors.password && (
          <p className="field-error" data-testid={`${mode}-password-error`}>
            {errors.password}
          </p>
        )}
        <button type="submit" disabled={submitting} data-testid={`${mode}-submit`}>
          {submitting ? 'Please wait...' : copy.submit}
        </button>
        <Link to={copy.other} data-testid={`${mode}-switch`}>
          {copy.otherText}
        </Link>
      </form>
    </section>
  );
}

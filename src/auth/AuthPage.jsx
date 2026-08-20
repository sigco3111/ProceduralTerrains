import React, { useState } from 'react';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { APP_NAME } from '../constants/app.js';
import { Logo } from '../landing/shared.jsx';
import { useAuth } from './AuthContext.jsx';
import { usePopup } from '../components/ui/PopupProvider.jsx';

const initialFields = { email: '', username: '', identifier: '', password: '', confirmPassword: '' };

export default function AuthPage({ mode, onBack, onSwitch, onSuccess }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const { showPopup } = usePopup();
  const [fields, setFields] = useState(initialFields);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const change = (name) => (event) => {
    const value = event.target.value;
    setFields((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const clientErrors = {};
    if (isRegister && fields.password !== fields.confirmPassword) {
      clientErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      return;
    }

    setBusy(true);
    setFieldErrors({});
    try {
      if (isRegister) {
        await register({ email: fields.email, username: fields.username, password: fields.password });
      } else {
        await login({ identifier: fields.identifier, password: fields.password });
      }
      onSuccess();
    } catch (error) {
      showPopup(error.message || '요청을 완료할 수 없습니다.', { type: 'error', title: isRegister ? '계정이 생성되지 않았습니다' : '로그인 실패' });
      setFieldErrors(error.fields ?? {});
    } finally {
      setBusy(false);
    }
  };

  const input = (name, label, properties = {}) => (
    <label className={`auth-field${fieldErrors[name] ? ' has-error' : ''}`}>
      <span>{label}</span>
      <input
        name={name}
        value={fields[name]}
        onChange={change(name)}
        aria-invalid={!!fieldErrors[name]}
        aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
        disabled={busy}
        {...properties}
      />
      {fieldErrors[name] && <small id={`${name}-error`}>{fieldErrors[name]}</small>}
    </label>
  );

  return (
    <section className="auth-page" aria-labelledby="auth-title">
      <button type="button" className="auth-back" onClick={onBack}><ArrowLeft size={14} /> 프로젝트로 돌아가기</button>
      <div className="auth-card">
        <header>
          <span className="auth-mark"><Logo size={25} /></span>
          <div>
            <small>{APP_NAME}</small>
            <h1 id="auth-title">{isRegister ? '계정을 만드세요' : '다시 오신 것을 환영합니다'}</h1>
            <p>{isRegister ? 'Keep your identity ready for cloud projects and sharing.' : '계정에 액세스하려면 로그인하세요. 로컬 프로젝트는 이 기기에 남아 있습니다.'}</p>
          </div>
        </header>

        <form onSubmit={submit} noValidate>
          {isRegister && input('username', '사용자 이름', {
            type: 'text', autoComplete: 'username', minLength: 3, maxLength: 32,
            pattern: '[a-zA-Z0-9_]+', placeholder: 'terrain_creator', required: true,
          })}
          {isRegister
            ? input('email', '이메일', { type: 'email', autoComplete: 'email', maxLength: 320, placeholder: 'you@example.com', required: true })
            : input('identifier', '이메일 또는 사용자 이름', { type: 'text', autoComplete: 'username', maxLength: 320, placeholder: 'you@example.com', required: true })}
          {input('password', '비밀번호', {
            type: 'password', autoComplete: isRegister ? 'new-password' : 'current-password',
            minLength: isRegister ? 10 : undefined, maxLength: 128, placeholder: '••••••••••', required: true,
          })}
          {isRegister && input('confirmPassword', '비밀번호 확인', {
            type: 'password', autoComplete: 'new-password', minLength: 10, maxLength: 128,
            placeholder: '••••••••••', required: true,
          })}

          <button type="submit" className="lp-primary auth-submit" disabled={busy}>
            {isRegister ? <UserPlus size={15} /> : <LogIn size={15} />}
            {busy ? '잠시만 기다려 주세요…' : isRegister ? '계정 만들기' : '로그인'}
          </button>
        </form>

        <footer>
          <span>{isRegister ? '이미 계정이 있으신가요?' : '프로시저럴 지형이 처음이신가요?'}</span>
          <button type="button" className="lp-link" onClick={() => onSwitch(isRegister ? 'login' : 'register')}>
            {isRegister ? '로그인' : '계정 만들기'}
          </button>
        </footer>
      </div>
      <p className="auth-local-note">계정은 선택 사항입니다. 로컬에서 프로젝트를 계속 만들고 저장할 수 있습니다.</p>
    </section>
  );
}

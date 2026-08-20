import React from 'react';
import { ArrowLeft, Database, Eye, Fingerprint, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

const POLICY_UPDATED = '2026년 7월 23일';

export default function ConfidentialityPage({ onBack }) {
  return (
    <article className="confidentiality-page" aria-labelledby="confidentiality-title">
      <button type="button" className="admin-back" onClick={onBack}><ArrowLeft size={14} /> Three Terrain으로 돌아가기</button>
      <header className="confidentiality-hero">
        <span className="confidentiality-icon"><ShieldCheck size={22} aria-hidden /></span>
        <div>
          <span>법적 고지 & 개인정보</span>
          <h1 id="confidentiality-title">Confidentiality &amp; privacy</h1>
          <p>Three Terrain이 계정, 프로젝트, 사용 정보를 보호하는 방법.</p>
          <small>Last updated {POLICY_UPDATED}</small>
        </div>
      </header>

      <section className="confidentiality-summary" aria-label="개인정보 요약">
        <div><LockKeyhole size={17} /><strong>기본 비공개</strong><span>별도로 선택하지 않는 한 지형은 비공개로 유지됩니다.</span></div>
        <div><Fingerprint size={17} /><strong>원시 IP 저장 없음</strong><span>네트워크 주소는 회전하는 단방향 식별자로 변환됩니다.</span></div>
        <div><Eye size={17} /><strong>제한된 접근</strong><span>관리 데이터는 권한을 가진 관리자에게만 제공됩니다.</span></div>
      </section>

      <div className="confidentiality-body">
        <section>
          <h2>처리하는 정보</h2>
          <p>We process the information needed to provide the service: your email address, username, profile settings, password hash, 활성 sessions, and terrains you choose to sync. Passwords are never stored in readable form.</p>
          <p>신뢰성, 보안, 제품 분석을 위해 페이지 경로, 방문 시각, 참조 호스트, 제한된 브라우저/장치 정보, 인증 결과, 회전식 일방향 네트워크 식별자를 기록합니다. 서비스는 분석 또는 보안 로그에 원시 IP 주소를 저장하지 않습니다.</p>
        </section>
        <section>
          <h2>정보 사용 방법</h2>
          <p>정보는 계정 인증, 지형 저장 및 공유, 커뮤니티 갤러리 운영, 서비스 사용량 측정, 남용 조사, 관리자 작업 책임 기록 유지에 사용됩니다. 제3자 광고에 판매되거나 사용되지 않습니다.</p>
        </section>
        <section>
          <h2>공개 범위 및 기밀성</h2>
          <p>새 지형은 기본적으로 비공개입니다. 링크가 있는 사람은 미등재 지형에 접근할 수 있습니다. 공개 지형은 커뮤니티 갤러리에 표시될 수 있습니다. 관리자는 서비스 운영을 위해 지형 메타데이터를 볼 수 있지만 대시보드는 의도적으로 비공개 지형 내용을 노출하지 않습니다.</p>
        </section>
        <section>
          <h2>보관 기간</h2>
          <div className="confidentiality-retention">
            <span><Database size={14} /><strong>방문 분석</strong>90일 후 삭제</span>
            <span><Database size={14} /><strong>보안 이벤트</strong>180일 후 삭제</span>
            <span><Database size={14} /><strong>관리자 감사 이벤트</strong>1년 후 삭제</span>
          </div>
          <p>Retention cleanup runs when the service starts and hourly thereafter. Account and terrain data are kept while the account is 활성 or as required to provide the service. Expired sessions are removed automatically.</p>
        </section>
        <section>
          <h2>보안</h2>
          <p>Three Terrain은 프로덕션에서 HTTP 전용 보안 세션 쿠키, 엄격한 원본 확인, 속도 제한, 서버 측 역할 권한 부여, 일방향 비밀번호 해싱, 세션 폐기, 감사 로깅을 사용합니다. 어떤 인터넷 서비스도 절대적인 보안을 보장할 수 없으므로 의심되는 사고는 즉시 신고해야 합니다.</p>
        </section>
        <section>
          <h2>사용자의 선택</h2>
          <p>You can choose each terrain&apos;s visibility, edit your profile, change your password, and sign out to invalidate your current session. To request access, correction, or deletion of account information, contact the project maintainer.</p>
          <a className="confidentiality-contact" href="mailto:zyfodexe@gmail.com"><Mail size={15} /> zyfodexe@gmail.com</a>
        </section>
      </div>
    </article>
  );
}

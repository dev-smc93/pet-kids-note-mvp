# 반려동물 알림장 MVP

반려동물 돌봄 알림장을 "반(그룹)" 단위로 작성/열람할 수 있는 최소 기능 구현 (Web Only → Vercel)

**목표 기간: 8일**

---

## 1. 프로젝트 목표

- 반려동물 돌봄 알림장을 "반(그룹)" 단위로 작성/열람할 수 있는 최소 기능 구현
- 로그인/회원가입 + 알림장 작성/조회/읽음까지만 제공
- Next.js 기반으로 Vercel 배포까지 완료
- **(2차)** 안정화 후 PWA 적용

---

## 2. 사용자/권한 (최소)

| 역할                          | 권한                          |
| ----------------------------- | ----------------------------- |
| **관리자** (센터/호텔/유치원) | 알림장 작성/수정/삭제, 재알림 |
| **보호자**                    | 알림장 열람, 읽음 처리        |

키즈노트처럼 "역할에 따라 수정/삭제 권한 차등" 구조를 그대로 가져감.

---

## 3. 기술 스택

| 구분    | 기술                    |
| ------- | ----------------------- |
| Web     | Next.js                 |
| DB      | Supabase Postgres       |
| Auth    | Supabase Auth           |
| ORM     | Prisma                  |
| Storage | Supabase Storage (사진) |

---

## 4. 데이터 모델 (초간단)

```
profiles(user_id, role, name)
groups(id, name, owner_user_id, sido, sigungu, address)  // "원"
pets(id, owner_user_id, name, breed, photo_url, note)   // 보호자 소유
memberships(user_id, group_id, pet_id, status)           // status: PENDING|APPROVED|REJECTED
reports(id, pet_id, author_user_id, content, created_at, updated_at)
report_media(id, report_id, url, type)
report_reads(report_id, user_id, read_at)
report_comments(id, report_id, author_user_id, content, created_at, updated_at)  // 관리자↔보호자 댓글
```

---

## 5. 화면 구성 (6개)

1. 로그인/회원가입
2. (관리자) 원 관리 (생성, 승인 대기/연결된 반려동물)
3. (보호자) 반려동물 등록 + 원 검색 → 연결 요청
4. 알림장 리스트
5. 알림장 상세 (읽음 표시)
6. 알림장 작성/수정 (관리자)

---

## 6. 기능별 체크리스트

### A. 인증

- [x] 회원가입
- [x] 로그인
- [x] 로그아웃
- [x] 기본 프로필 (닉네임, 역할)
- [x] 관리자 회원가입 시 원 정보 (원 이름, 시/도, 시/군/구, 주소) 입력

### B. 반려동물 연결

- [x] 관리자: 원 생성 (이름, 시/도, 시/군/구, 주소)
- [x] 보호자: 반려동물 등록 (이름, 품종, 사진, 특이사항)
- [x] 보호자: 시/도로 원 검색 → 연결 요청 (승인 대기)
- [x] 관리자: 승인 대기 요청 승인/거절

### C. 알림장 (핵심)

- [x] 관리자: 알림장 작성
  - [x] 필수: 내용 (최대 5,000자)
  - [x] 선택: 사진 첨부 (3~10장 제한)
  - [x] 대상: 반 또는 반려동물(개별) 중 선택 (MVP에선 개별만 해도 충분)
- [x] 보호자: 알림장 목록 조회
- [x] 보호자: 알림장 상세 조회
- [x] 읽음 처리: 열람 여부 표시 (미열람/열람)
- [x] 재알림(재전송): 미열람 사용자에게 다시 알림 (초기엔 "표시/버튼"까지만)
- [x] 수정/삭제: 관리자만 가능
- [x] **관리자 & 보호자 간 댓글 기능** (알림장 단위로 대화)

### D. 간소화 알림장 모드 (선택)

- [ ] 관리자 설정 ON/OFF
- [ ] ON 시: 200자 제한 + 첨부 불가

### E. 배포 및 마무리

- [ ] Vercel 배포
- [ ] env 세팅
- [ ] QA 및 버그픽스
- [ ] UX 마감

---

## 7. 2차 계획 (PWA)

Vercel 배포 완료 후 적용 가능

- manifest + 아이콘 + 서비스워커(기본 캐싱)만으로 "설치형 웹앱" 제공

---

## 8. 개발 가이드라인 ⚠️ (작업 시 필수 준수)

> 기능/화면 구현 시 아래 규칙을 항상 숙지하고 준수한다.

### 1. 모바일 반응형 우선

- 화면은 **모바일 퍼스트**로 구현
- 추후 PWA 적용 예정이므로 모바일 UX를 우선 고려

### 2. MVP 확장성 및 유지보수성

- 추후 기능 확장과 유지보수가 용이하도록 설계
- **독립성**: 컴포넌트/모듈은 단일 책임, 의존성 최소화
- **일관성**: 네이밍, 구조, 패턴 통일
- **재사용성**: 중복 코드는 공통 컴포넌트/유틸로 분리

### 3. 코드 가독성

- **파일당 600줄 이하** 유지
- 초과 시 함수/컴포넌트로 분리하여 모듈화

---

## Getting Started

1. `.env`에 Supabase 관련 변수 추가 (`.env.example` 참고)
2. `npx prisma generate` 실행 (Prisma 클라이언트 생성)
3. `npm run dev` 실행
3. [http://localhost:3000](http://localhost:3000) 접속

```bash
npm run dev
```

**프로젝트 구조**  
→ [doc/프론트&백구조.md](./doc/프론트&백구조.md)

**알림장 테스트 시나리오**  
→ [doc/테스트시나리오_알림장.md](./doc/테스트시나리오_알림장.md)

**Supabase Storage**: 알림장 사진 업로드 시 `report-photos` 버킷 필요 (Storage > New bucket > Public)

**Supabase Realtime**: 알림장 댓글 실시간 반영을 위해 `report_comments` 테이블을 Realtime publication에 추가해야 합니다.  
→ Supabase 대시보드 > Database > Publications > `supabase_realtime`에서 `report_comments` 체크, 또는 `supabase/enable_realtime_report_comments.sql` 실행

---

## 시드 데이터

Supabase Auth 연동 후, 테스트용 시드 데이터를 넣을 수 있습니다.

1. Supabase 대시보드에서 테스트 계정 2개 생성 (Authentication > Users)
2. 관리자 계정의 `user_id` (UUID) 복사 → `.env`에 `SEED_USER_ID="..."` 추가
3. 보호자 계정의 `user_id` (UUID) 복사 → `.env`에 `SEED_GUARDIAN_USER_ID="..."` 추가
4. `npm run db:seed` 실행

시드 내용: Profile(관리자) → Group(해피펫 유치원) / Profile(보호자) → Pet(초코) → Membership(승인됨) → Report(알림장)

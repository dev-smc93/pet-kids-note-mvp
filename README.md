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
groups(id, name, owner_user_id)           // "반"
pets(id, group_id, name, photo_url, note)
memberships(user_id, group_id, pet_id?)   // 보호자 연결
invite_codes(code, group_id, pet_id?, expires_at)
reports(id, pet_id, author_user_id, content, created_at, updated_at)
report_media(id, report_id, url, type)
report_reads(report_id, user_id, read_at)
```

---

## 5. 화면 구성 (6개)

1. 로그인/회원가입
2. (관리자) 반/반려동물 관리
3. (보호자) 초대코드 입력 + 내 반려동물 선택
4. 알림장 리스트
5. 알림장 상세 (읽음 표시)
6. 알림장 작성/수정 (관리자)

---

## 6. 기능별 체크리스트

### A. 인증

- [ ] 회원가입
- [ ] 로그인
- [ ] 로그아웃
- [ ] 기본 프로필 (닉네임, 역할)

### B. 반려동물 연결

- [ ] 관리자: 반(그룹) 생성
- [ ] 관리자: 반려동물 등록 (이름/사진/특이사항)
- [ ] 보호자: 초대코드 입력 → 특정 반(또는 반려동물)에 연결

### C. 알림장 (핵심)

- [ ] 관리자: 알림장 작성
  - [ ] 필수: 내용 (최대 5,000자)
  - [ ] 선택: 사진 첨부 (3~10장 제한)
  - [ ] 대상: 반 또는 반려동물(개별) 중 선택 (MVP에선 개별만 해도 충분)
- [ ] 보호자: 알림장 목록 조회
- [ ] 보호자: 알림장 상세 조회
- [ ] 읽음 처리: 열람 여부 표시 (미열람/열람)
- [ ] 재알림(재전송): 미열람 사용자에게 다시 알림 (초기엔 "표시/버튼"까지만)
- [ ] 수정/삭제: 관리자만 가능

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

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 시드 데이터

Supabase Auth 연동 후, 테스트용 시드 데이터를 넣을 수 있습니다.

1. Supabase 대시보드에서 테스트 계정 생성 (Authentication > Users)
2. 해당 사용자의 `user_id` (UUID) 복사
3. `.env`에 `SEED_USER_ID="복사한-uuid"` 추가
4. `npm run db:seed` 실행

시드 내용: Profile(관리자) → Group(A반) → Pet(초코) → Report(알림장) → InviteCode(SEED-INVITE-001)

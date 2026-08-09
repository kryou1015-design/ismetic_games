# 🔗 GitHub 연동 가이드

## 이미 해둔 것
이 zip 안 프로젝트는 이미 **Git 저장소로 초기화되고 첫 커밋까지 완료**된 상태야.
`git log`를 치면 "Initial commit" 하나가 보일 거야.

---

## 니가 할 일 (5분)

### 1. GitHub에서 빈 저장소 만들기
1. https://github.com/new 접속
2. Repository name: `clearwater` (원하는 이름으로)
3. **Public/Private 아무거나 상관없음**
4. ⚠️ "Add a README file" 체크 **하지 말기** (이미 있음, 충돌 방지)
5. Create repository 클릭

### 2. 터미널(cmd)에서 프로젝트 폴더로 이동
```
cd 압축푼폴더\clearwater
```

### 3. GitHub와 연결 후 업로드
GitHub가 저장소 만들면 화면에 보여주는 주소를 그대로 써:
```
git remote add origin https://github.com/니깃헙아이디/clearwater.git
git branch -M main
git push -u origin main
```
→ 로그인 창 뜨면 GitHub 계정으로 로그인 (또는 토큰 입력)

### 4. 완료 확인
GitHub 저장소 페이지 새로고침 → 파일들 보이면 성공 🎉

---

## 이후로는 이렇게 저장해
코드 수정할 때마다(Claude Code로 작업 후):
```
git add -A
git commit -m "수정 내용 한 줄 설명"
git push
```

## Claude Code랑 같이 쓰면
Claude Code 안에서 "이 프로젝트 GitHub에 커밋하고 push해줘"라고 말만 해도
알아서 git 명령어 실행해줘 (Claude Code는 니 컴퓨터에서 도니까 로그인 정보 접근 가능).

## 나중에 배포할 때도 유리한 이유
Vercel/Netlify는 **GitHub 저장소를 직접 연결**해서 자동 배포하는 기능이 있어 —
push 한 번이면 실제 URL도 같이 갱신되는 구조로 만들 수 있어.

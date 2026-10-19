# CLAUDE.md — 투명한 호수 (Clearwater)

## 컨셉
아이소메트릭 3D 힐링 낚시 웹게임. 핵심: **아빠와 아들의 추억**. 철학: "노을이 질 무렵, 아빠와 아들이 함께 보낸 하루가 떠오르는 따뜻함".
- 아빠 = 플레이어(WASD 이동). 아들 = NPC(따라다님, 대기 중 배회/폰/앉기). 이동 시 손잡기(예고 후).
- 물고기 잡으면 가족 사진(크기별 포즈: 손바닥/한손/두손/함께) → 앨범.
- 무료 위주, 유료 서비스 금지. 최종 목표: 독립 웹게임 URL.

## 조작
마우스=캐스팅 방향 / Space=차징·캐스팅·챔질 / 입질 후 A·D(←→)로 균형 유지해 릴링. 난이도는 `data.js FIGHT_DIFF`(희귀도별).

## 구조 (Three.js r160 + Vite)
- `src/game.js` 렌더러·메인루프·입력·낚시/파이트·UI. `entities.js` 월드/캐릭터/물고기 생성. `environment.js` 시간대(4)·날씨(3). `data.js` 종·지역·장비·FIGHT_DIFF. `photo.js` 사진 캡처. `shop.js` 시장/도감/월드맵. `water.js`/`visuals.js` 물 셰이더·이펙트. `state.js` localStorage(`clearwater_save_v1`).
- 에셋: `src/assets/*.glb` (Blender 자체제작 dad_lowpoly, 물고기 4체형, KayKit CC0).
- 빌드: `npm run build` / 단일파일 `npm run build:single` → `dist-single/index.html`.

## 아트 규칙
팔레트 하늘 #f6d8b8, 물 #8ee0d8/#337a8a, 자연 #74b654, 목재 #9c6b3d, 아빠옷 #f2a65a, 아들옷 #6aa8d8, 골드 #f7d154. roughness .7~.95, metalness 0, 프리미티브 저폴리, 텍스처 금지, 2.5~2.8등신, 아들=아빠 72%, 블룸은 약하게(.14, 밤 .32 — 높이면 화면이 뿌예짐), 아들 표정은 항상 평온/즐거움.
- 구름은 월드가 아닌 **카메라 기준 화면 상단 띠**에 배치(쿼터뷰에서 캐릭터 가림 방지).

## 배포/테스트
- GitHub Pages: `.github/workflows/pages.yml`이 main push마다 `dist`를 배포(레포 Settings→Pages→Source=GitHub Actions 필요). URL: https://kryou1015-design.github.io/ismetic_games/
- 테스트용 쿼리: `?time=dawn|noon|dusk|night`(시간 고정), `?weather=clear|cloudy|rain`(날씨 고정).

## 알려진 사항/백로그
- 구글폰트는 사내망 등에서 막힐 수 있음(폴백 폰트로 동작).
- 헤드리스 점검: 빌드 후 `vite preview` + Playwright(chromium, swiftshader)로 콘솔 오류 확인.
- 백로그: 손잡기 애니, 캐릭터/물 퀄리티 추가 개선, 시간대별 하늘색 블렌딩(현재 지역 고정색), 진짜 BGM.

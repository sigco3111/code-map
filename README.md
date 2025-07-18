
# 코드맵 생성기 (Code Map Generator)

**프로젝트의 코드 구조를 즉시 시각화하는 강력하고 인터랙티브한 도구입니다.**

이 애플리케이션은 로컬 프로젝트 폴더를 선택하기만 하면, 파일, 클래스, 함수 간의 관계를 포함한 전체 코드베이스의 계층적 맵을 동적으로 생성합니다. 모든 처리는 브라우저 내에서 안전하게 이루어지며, 여러분의 코드는 절대 외부로 전송되지 않습니다.

실행주소1 : https://code-map-ruby.vercel.app/

실행주소2 : https://dev-canvas-pi.vercel.app/

## ✨ 주요 기능

*   **인터랙티브 시각화**: 확대/축소 및 이동이 가능한 트리 다이어그램으로 코드를 시각화합니다.
*   **다국어 지원**: JavaScript/TypeScript, Python, Java, C/C++, Objective-C, Swift, Kotlin, Go, Rust 등 다양한 프로그래밍 언어를 파싱합니다.
*   **종속성 분석**: 선택한 노드(파일, 함수 등)가 어떤 코드에 의존하는지(Dependencies), 그리고 어떤 코드에서 사용되는지(Dependents)를 명확하게 보여줍니다.
*   **코드 인텔리전스**:
    *   **히트맵 모드(Heatmap Mode)**: 코드의 **인지 복잡도**나 파일의 **불안정성**을 기준으로 코드베이스 전체에 색상을 입혀, 리팩토링이 필요한 핫스팟이나 아키텍처의 취약점을 시각적으로 빠르게 식별할 수 있습니다.
    *   파일 간의 **순환 종속성**을 감지하고 시각적으로 표시합니다.
    *   외부에서 사용되지 않는 것으로 보이는 export된 코드를 식별하여 코드 품질 개선에 도움을 줍니다.
    *   **안정성 지표(Instability Metric)**: 파일의 변경 가능성을 나타내는 지표(0~1)를 제공합니다. 이 값이 1에 가까울수록 다른 코드에 대한 의존성이 높아 변경에 취약함을 의미하며, 아키텍처의 안정성을 파악하는 데 도움을 줍니다.
    *   **인지 복잡도(Cognitive Complexity) 분석**: 함수의 이해하기 어려운 정도를 측정하는 점수를 제공합니다. 점수가 높을수록 코드를 읽고, 이해하고, 유지보수하기 더 어렵다는 것을 의미하며 리팩토링이 필요한 지점을 찾는 데 도움을 줍니다. (JS/TS는 AST 기반의 정확한 값을, 그 외 언어는 근사치를 제공합니다.)
*   **코드 스니펫 뷰어**: UI에서 직접 함수, 클래스 등의 관련 코드 조각을 확인하여 컨텍스트를 빠르게 파악할 수 있습니다.
*   **완벽한 개인정보 보호**: 모든 파일 읽기 및 분석은 100% 클라이언트 측(브라우저)에서 수행됩니다. 여러분의 소중한 코드는 컴퓨터 밖으로 절대 나가지 않습니다.
*   **강력한 검색 기능**: 프로젝트 내의 모든 파일, 함수 또는 클래스를 신속하게 찾을 수 있습니다.
*   **미니맵 네비게이션**: 대규모 프로젝트에서도 전체 구조를 한눈에 파악하고 쉽게 탐색할 수 있습니다.

## 🚀 사용 방법

1.  `index.html` 파일을 선호하는 웹 브라우저에서 엽니다.
2.  **"프로젝트 폴더 선택"** 버튼을 클릭하여 시각화할 프로젝트를 선택합니다.
3.  애플리케이션이 파일들을 처리하고 인터랙티브한 코드 맵을 표시할 때까지 잠시 기다립니다.
4.  맵 탐색하기:
    *   **이동 (Pan)**: 맵의 배경을 클릭하고 드래그합니다.
    *   **확대/축소 (Zoom)**: 마우스 휠을 사용합니다. (브라우저 기본 기능)
    *   **노드 확장/축소**: 디렉터리나 파일 노드 옆의 `[+]` 또는 `[-]` 버튼을 클릭합니다.
    *   **상세 정보 보기**: 노드(파일, 함수 등)를 클릭하면 우측 패널에 상세 정보, 종속성, 안정성 지표, 코드 스니펫이 표시됩니다.
    *   **검색**: 상단의 검색창을 사용하여 특정 노드를 빠르게 찾을 수 있습니다.
    *   **히트맵**: 상단의 드롭다운 메뉴에서 '인지 복잡도' 또는 '불안정성'을 선택하여 히트맵을 활성화할 수 있습니다.
    *   **미니맵 토글**: 스위치를 사용하여 네비게이션 미니맵을 켜거나 끌 수 있습니다.

## 🛠️ 기술 스택 및 아키텍처

이 프로젝트는 최신 웹 기술을 활용하여 빠르고 안정적인 사용자 경험을 제공합니다.

*   **프론트엔드**: **React**와 **TypeScript**를 사용하여 컴포넌트 기반의 확장 가능한 UI를 구축했습니다.
*   **시각화 렌더링**: **D3.js**를 사용하여 데이터를 기반으로 동적이고 인터랙티브한 트리 레이아웃을 생성합니다.
*   **코드 파싱**:
    *   JavaScript/TypeScript의 경우, **Acorn.js**를 사용하여 상세한 추상 구문 트리(AST) 분석을 수행합니다.
    *   다른 언어들의 경우, 강력한 **정규 표현식(Regex)**을 사용하여 파일, 클래스, 함수, import 구문 등을 식별합니다.
*   **스타일링**: **Tailwind CSS**를 사용하여 현대적이고 반응형인 다크 테마의 UI를 신속하게 개발했습니다.
*   **아키텍처**:
    1.  사용자가 폴더를 선택하면 브라우저의 `FileReader` API가 파일 내용을 비동기적으로 읽습니다.
    2.  `services/parser.ts`에 있는 다국어 파서가 코드 분석을 시작합니다.
    3.  파서는 프로젝트 구조를 나타내는 계층적 데이터 구조(`TreeNode`)를 생성합니다.
    4.  종속성 연결 및 추가 분석(순환 종속성, 미사용 코드, 안정성 지표)을 수행합니다.
    5.  `components/CodeMap.tsx` 컴포넌트가 D3.js를 사용해 분석된 데이터를 SVG 기반의 시각적 맵으로 렌더링합니다.
    6.  React가 UI 상태(선택된 노드, 로딩 상태 등)를 관리하고 사용자 상호작용에 따라 뷰를 업데이트합니다.

## 📂 파일 구조

```
.
├── index.html          # 애플리케이션의 메인 진입점
├── index.tsx           # React 애플리케이션의 루트
├── App.tsx             # 메인 애플리케이션 컴포넌트 (레이아웃, 상태 관리)
├── metadata.json       # 애플리케이션 메타데이터
├── README.md           # 프로젝트 설명 파일
├── components/
│   ├── CodeMap.tsx     # D3.js를 사용한 핵심 시각화 컴포넌트
│   ├── DetailPanel.tsx # 선택된 노드의 상세 정보를 보여주는 패널
│   ├── icons.tsx       # UI에 사용되는 SVG 아이콘
│   └── ...
├── services/
│   └── parser.ts       # 다국어 코드 분석 및 종속성 해결 로직
└── types.ts            # 프로젝트 전반에서 사용되는 TypeScript 타입 정의
```

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE)에 따라 배포됩니다. 자유롭게 사용, 수정, 배포할 수 있습니다.
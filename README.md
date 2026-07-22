# macOS Golden Gate for Visual Studio Code

Kompletny, lokalny pakiet wyglądu dla VS Code 1.129+: jasny i ciemny motyw, ikony interfejsu, adaptacyjne ikony plików oraz ustawienia tego workspace’u. Projekt przekłada publiczny język macOS 27 Golden Gate na oficjalne API VS Code — bez modyfikowania plików aplikacji i bez wstrzykiwania CSS.

## Co otrzymujesz

- `macOS Golden Gate — Light` i `macOS Golden Gate — Dark`, przełączane razem z wyglądem systemu.
- Ciepłą paletę espresso, taupe i champagne z systemowymi kolorami semantycznymi.
- Półprzezroczyste wizualnie warstwy nawigacji, jednolity toolbar i czytelny content area.
- Zaokrąglony zestaw product icons oparty na otwartym Phosphor Icons Regular.
- 330 lekkich ikon SVG dla plików i folderów: osobne warianty jasne i ciemne.
- SF Mono w edytorze i terminalu z bezpiecznymi fallbackami; UI VS Code na macOS korzysta z systemowego kroju Apple.
- Oficjalny eksperymentalny `Modern UI` z VS Code 1.129: pływające, zaokrąglone sidebary i panele.

## Instalacja lokalna

Pakiet jest budowany do:

```text
dist/macos-golden-gate-0.1.0.vsix
```

Instalacja z terminala na tym Macu:

```bash
/Applications/Visual\ Studio\ Code.app/Contents/Resources/app/bin/code \
  --install-extension dist/macos-golden-gate-0.1.0.vsix --force
```

Potem wykonaj w VS Code polecenie `Developer: Reload Window`. Ustawienia w `.vscode/settings.json` automatycznie aktywują kolor, ikony, layout i zmianę Light/Dark tylko w tym folderze.

Do podglądu deweloperskiego bez instalacji naciśnij `F5` i wybierz konfigurację `Preview macOS Golden Gate`.

## Budowanie i sprawdzanie

```bash
npm install
npm run build
npm run check
npm run package
```

Generatory są deterministyczne. `npm run check` sprawdza między innymi format kolorów, kontrast kluczowych par tekst/tło, kompletność mapowań ikon, obecność fontu i bezpieczną zawartość SVG.

## Granice oficjalnego API

VS Code pozwala rozszerzeniu kontrolować kolory, podświetlanie składni, ikony plików i monochromatyczne ikony produktu. Nie udostępnia rozszerzeniom DOM workbencha, prawdziwego macOS vibrancy/backdrop blur, traffic lights ani globalnej zmiany fontu UI.

Dlatego projekt:

- korzysta z oficjalnego `workbench.experimental.modernUI`, zamiast patchować Electron;
- sugeruje Liquid Glass przez warstwy, kontrast, światło, cień i oszczędny tint;
- nie dołącza SF Pro, SF Mono ani SF Symbols — używa fontów już obecnych w macOS;
- nie wywołuje ostrzeżenia `[Unsupported]` i nie jest nadpisywany przez aktualizację VS Code.

## Podstawa projektu

Golden Gate jest wciąż publiczną zapowiedzią na jesień 2026. Apple opisuje go jako dopracowanie Liquid Glass: równiejszą refrakcję, wyższy kontrast, jednolite toolbary, sidebary od krawędzi do krawędzi oraz zaktualizowane kształty okien. Tam, gdzie Apple nie opublikowało jeszcze precyzyjnych tokenów, motyw stosuje zasady macOS Tahoe i Human Interface Guidelines. Szczegóły i jawne rozróżnienie faktów od decyzji projektowych są w `docs/DESIGN.md`.

Źródła:

- [macOS 27 Golden Gate — Apple](https://www.apple.com/pl/os/macos/)
- [Adopting Liquid Glass — Apple Developer](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)
- [Materials — Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Typography — Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/typography)
- [VS Code Modern UI preview](https://code.visualstudio.com/updates/v1_129#_modern-ui-preview-experimental)
- [VS Code theming API](https://code.visualstudio.com/api/extension-capabilities/theming)

## Licencje i znaki towarowe

Kod i oryginalne ikony plików są dostępne na licencji MIT. Font ikon interfejsu pochodzi z [Phosphor Icons](https://phosphoricons.com/) na licencji MIT; pełna treść licencji znajduje się w `assets/licenses/PHOSPHOR-ICONS-MIT.txt`.

Apple, macOS, Golden Gate, Tahoe, SF Pro, SF Mono i SF Symbols są znakami towarowymi Apple Inc. Visual Studio Code jest znakiem towarowym Microsoft Corporation. Ten projekt jest niezależnym motywem inspirowanym publicznym wzornictwem i nie jest powiązany ani zatwierdzony przez Apple lub Microsoft.

# Założenia projektowe Golden Gate

## Co pochodzi ze źródeł Apple

Publiczne materiały macOS 27 opisują Golden Gate jako ewolucję, a nie wymianę Liquid Glass. Najważniejsze wyznaczniki możliwe do przełożenia na VS Code to:

- wyższy kontrast oraz równiejsze załamanie światła;
- jednolity toolbar i sidebary prowadzone od krawędzi do krawędzi;
- ciaśniejsze, spójne kształty okien i koncentryczne promienie elementów;
- aktywna pozycja sidebara o wyraźniejszej wadze;
- kolor akcentu używany oszczędnie, przede wszystkim dla stanu i głównej akcji;
- Liquid Glass jako warstwa funkcji i nawigacji ponad treścią, a nie materiał wypełniający cały content area.

Golden Gate pozostaje zapowiedzią. Szczegóły nieopublikowane publicznie są oparte na macOS Tahoe, aktualnych Human Interface Guidelines oraz publicznym wyglądzie Xcode 27.

## Decyzje tego motywu

Poniższe wartości są statycznym przybliżeniem na potrzeby API VS Code — nie są oficjalnymi tokenami Apple.

| Rola | Light | Dark |
| --- | --- | --- |
| Content canvas | `#F4EFE9` | `#201B18` |
| Editor | `#FAF7F2` | `#231E1B` |
| Navigation glass | `#EEE4DBE8` | `#322A26E6` |
| Floating surface | `#FFF9F4F2` | `#3A302BF2` |
| Primary text | `#1A1715` | `#F5F0EA` |
| Secondary text | `#625C57` | `#B9AFA7` |
| Golden Gate accent | `#AC7F5E` | `#B78A66` |
| Separator | `#6D5E5030` | `#FFFFFF1F` |

Ciepłe neutrals pochodzą z tonu oficjalnej grafiki promocyjnej Golden Gate. Brązowy akcent odpowiada publicznym wartościom systemowego Brown, ale sposób użycia i kompozycja są autorską interpretacją.

Kolory błędów, ostrzeżeń, powodzenia i informacji są kontrastowo dostosowanymi przybliżeniami dynamicznych kolorów systemowych Apple. Podświetlanie kodu celowo zachowuje więcej barw niż natywne kontrolki: informacja semantyczna w edytorze ma pierwszeństwo przed dekoracją.

## Materiał i hierarchia

Warstwa treści pozostaje prawie nieprzezroczysta i spokojna. Efekt szkła jest ograniczony do titlebara, sidebarów, panelu, statusbara, menu i elementów unoszących się. Alpha w kolorach motywu nie zapewnia prawdziwego blur pulpitu — odpowiada za wizualne mieszanie warstw wewnątrz workbencha.

Eksperymentalny Modern UI w VS Code 1.129 dostarcza geometrię, której theme API wcześniej nie potrafiło wyrazić: odstępy, zaokrąglone karty i pływające powierzchnie. Może ulec zmianie w kolejnych wersjach VS Code.

## Typografia

- UI: VS Code na macOS używa systemowego stacku `-apple-system`, który rozwiązuje się do bieżącego kroju SF.
- Kod i terminal: `SF Mono`, `SFMono-Regular`, ukryta systemowa nazwa `.SF NS Mono`, następnie `ui-monospace`, Menlo i Monaco.
- Rozmiar kodu: 13 px z line-height 20 px, odpowiadający zwartej, ale czytelnej gęstości Xcode.

Pliki czcionek Apple nie są kopiowane do projektu ani pakietu VSIX.

## Ikony

Ikony plików są oryginalne i generowane z własnych prostych kształtów. Product icon theme wykorzystuje otwarty font Phosphor Regular, ponieważ VS Code wymaga dla tych ikon fontu monochromatycznego. Brak mapowania świadomie wraca do Codicons — dzięki temu nie znika żadna akcja dostarczona przez nowszy VS Code lub rozszerzenie.

## Źródła

- [Apple: macOS 27 Golden Gate](https://www.apple.com/os/macos/)
- [Apple Developer: What’s new in macOS design](https://developer.apple.com/videos/play/wwdc2026/102/)
- [Apple Developer: Build an AppKit app with the new design](https://developer.apple.com/videos/play/wwdc2026/289/)
- [Apple Developer: What’s new in Xcode 27](https://developer.apple.com/videos/play/wwdc2026/258/)
- [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Apple HIG: Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [Apple HIG: Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [VS Code: Modern UI preview](https://code.visualstudio.com/updates/v1_129#_modern-ui-preview-experimental)
- [VS Code: Product Icon Theme](https://code.visualstudio.com/api/extension-guides/product-icon-theme)
- [VS Code: File Icon Theme](https://code.visualstudio.com/api/extension-guides/file-icon-theme)

// src/styled.d.ts — styled-components v6 theme augmentation.
// Makes props.theme typed as our Theme everywhere (spec §7 tokens).
import 'styled-components';
import type { Theme } from './theme';

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Theme {}
}

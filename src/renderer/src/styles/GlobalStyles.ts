import { createGlobalStyle } from 'styled-components'
import Variables from './Variables'

export const GlobalStyles = createGlobalStyle`
  ${Variables};

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    background: transparent;
    scroll-behavior: smooth;
    box-sizing: border-box;
    width: 100%;
    overflow: hidden;
    -webkit-user-select: none;
  }

  body {
    background: transparent;
  }

  // Scrollbar styles
  html {
    scrollbar-width: thin;
    scrollbar-color: var(--black);
  }
`

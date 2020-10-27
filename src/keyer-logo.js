import { html } from 'lit-element';

export const keyerLogo = html`
  <svg width="512px" height="128px" viewBox="0 192 512 128"
    version="1.1" xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="Page-1" stroke="#1d62a7" stroke-width="16" fill="none" fill-rule="evenodd">
      <line x1="384" y1="224" x2="448" y2="224" id="knob"></line>
      <line x1="64" y1="288" x2="320" y2="288" id="base" ></line>
      <polyline points="64,224 320,224 371.2,274 422.4,274" id="key"></polyline>
      <ellipse cx="148.5" cy="224" rx="16" ry="16" fill="#1d62a7" stroke="#ffffff" stroke-width="1" id="hinge"></ellipse>
    </g>
  </svg>
`;

//
// keyer.js - a progressive web app for morse code
// Copyright (c) 2020 Roger E Critchlow Jr, Charlestown, MA, USA
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// 
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

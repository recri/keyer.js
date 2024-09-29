import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import type { KeyerJs } from '../src/keyer-js.js';
import '../src/keyer-js.js';

describe('KeyerJs', () => {
  let element: KeyerJs;
  beforeEach(async () => {
    element = await fixture(html`<keyer-js></keyer-js>`);
  });

  it('renders a h1', () => {
    const h1 = element.shadowRoot!.querySelector('h1')!;
    expect(h1).to.exist;
    expect(h1.textContent).to.equal('My app');
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});

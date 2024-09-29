import { html, TemplateResult } from 'lit';
import '../src/keyer-js.js';

export default {
  title: 'KeyerJs',
  component: 'keyer-js',
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

interface Story<T> {
  (args: T): TemplateResult;
  args?: Partial<T>;
  argTypes?: Record<string, unknown>;
}

interface ArgTypes {
  header?: string;
  backgroundColor?: string;
}

const Template: Story<ArgTypes> = ({
  header,
  backgroundColor = 'white',
}: ArgTypes) => html`
  <keyer-js
    style="--keyer-js-background-color: ${backgroundColor}"
    .header=${header}
  ></keyer-js>
`;

export const App = Template.bind({});
App.args = {
  header: 'My app',
};

import type { Meta, StoryObj } from '@storybook/react-vite';

// import { fn } from 'storybook/test';

import { Button } from '@workspace/ui/components/button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Example/MyButton',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    // backgroundColor: { control: 'color' },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#story-args
  // args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    variant: 'default',
    size: 'default',
    children: 'I am a primary button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'default',
    children: 'I am a secondary button',
  },
};

export const Large: Story = {
  args: {
    variant: 'default',
    size: 'lg',
    children: 'I am a large button',
  },
};

export const Small: Story = {
  args: {
    variant: 'default',
    size: 'sm',
    children: 'I am a small button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    size: 'lg',
    children: 'I am a destructive button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    size: 'lg',
    children: 'I am a ghost button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    size: 'lg',
    children: 'I am a link button',
  },
};

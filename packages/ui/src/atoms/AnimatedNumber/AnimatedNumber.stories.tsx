import AnimatedNumber, { type AnimatedNumberProps } from './AnimatedNumber'
import { type ComponentMeta, type Story } from '@storybook/react'

export default {
  title: 'Atoms/AnimatedNumber',
  component: AnimatedNumber,
  parameters: {
    layout: 'centered',
  },
} as ComponentMeta<typeof AnimatedNumber>

export const Default: Story<AnimatedNumberProps> = (args: any) => <AnimatedNumber {...args} />

Default.args = {
  end: 320728.44,
}

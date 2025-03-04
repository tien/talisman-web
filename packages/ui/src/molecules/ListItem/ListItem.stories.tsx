import { Identicon } from '../../atoms'
import ListItem, { type ListItemProps } from './ListItem'
import { type ComponentMeta, type Story } from '@storybook/react'
import { Trash } from '@talismn/web-icons'

export default {
  title: 'Molecules/ListItem',
  component: ListItem,
  parameters: {
    layout: 'centered',
  },
} as ComponentMeta<typeof ListItem>

export const Default: Story<ListItemProps> = (args: any) => <ListItem {...args} />

Default.args = {
  overlineContent: 'Polkadot.js import',
  headlineContent: '$356,120.32',
  leadingContent: <Identicon value="1YmEYgtfPbwx5Jos1PjKDWRpuJWSpTzytwZgYan6kgiquNS" size="4rem" />,
  trailingContent: <Trash />,
}

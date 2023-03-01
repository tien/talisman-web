import * as React from 'react'
import { SVGProps } from 'react'
const SvgNavigation2 = (props: SVGProps<SVGSVGElement>) => (
  <svg width={24} height={24} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="m12 2 7 19-7-4-7 4 7-19Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
export default SvgNavigation2

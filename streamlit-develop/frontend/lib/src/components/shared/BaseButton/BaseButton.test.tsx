/**
 * Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022-2025)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react"

import { screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"

import { render } from "~lib/test_util"
import { lightTheme } from "~lib/theme"

import BaseButton, {
  BaseButtonKind,
  BaseButtonProps,
  BaseButtonSize,
} from "./BaseButton"

const getProps = (
  propOverrides: Partial<BaseButtonProps> = {}
): BaseButtonProps => ({
  kind: BaseButtonKind.SECONDARY,
  size: BaseButtonSize.MEDIUM,
  onClick: () => {},
  disabled: false,
  containerWidth: false,
  children: null,
  ...propOverrides,
})

describe("Button element", () => {
  Object.keys(BaseButtonKind).forEach(key => {
    const kind: BaseButtonKind =
      BaseButtonKind[key as keyof typeof BaseButtonKind]

    it(`renders ${kind} buttons correctly`, () => {
      render(<BaseButton {...getProps({ kind })}>Hello</BaseButton>)

      const buttonWidget = screen.getByTestId(`stBaseButton-${kind}`)

      expect(buttonWidget).toBeInTheDocument()
    })

    it(`renders disabled ${kind} correctly`, () => {
      render(
        <BaseButton {...getProps({ kind, disabled: true })}>Hello</BaseButton>
      )

      const buttonWidget = screen.getByTestId(`stBaseButton-${kind}`)
      expect(buttonWidget).toBeDisabled()
    })
  })

  Object.keys(BaseButtonSize).forEach(key => {
    const size: BaseButtonSize =
      BaseButtonSize[key as keyof typeof BaseButtonSize]

    it(`renders ${size} buttons correctly`, () => {
      render(<BaseButton {...getProps({ size })}>Hello</BaseButton>)

      const { spacing } = lightTheme.emotion
      const expectedPadding = {
        [BaseButtonSize.XSMALL]: `${spacing.twoXS} ${spacing.sm}`,
        [BaseButtonSize.SMALL]: `${spacing.twoXS} ${spacing.md}`,
        [BaseButtonSize.LARGE]: `${spacing.md} ${spacing.md}`,
        [BaseButtonSize.MEDIUM]: `${spacing.xs} ${spacing.md}`,
      }

      const buttonWidget = screen.getByRole("button")
      expect(buttonWidget).toHaveStyle(`padding: ${expectedPadding[size]}`)
    })
  })

  it("renders disabled buttons correctly", () => {
    render(<BaseButton {...getProps({ disabled: true })}>Hello</BaseButton>)

    const buttonWidget = screen.getByRole("button")
    expect(buttonWidget).toBeDisabled()
  })

  it("calls onClick when button is clicked", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<BaseButton {...getProps({ onClick })}>Hello</BaseButton>)
    const buttonWidget = screen.getByRole("button")
    await user.click(buttonWidget)

    expect(onClick).toHaveBeenCalled()
  })

  it("does not use container width by default", () => {
    render(<BaseButton {...getProps()}>Hello</BaseButton>)

    const buttonWidget = screen.getByRole("button")
    expect(buttonWidget).toHaveStyle("width: auto")
  })

  it("renders use container width buttons correctly", () => {
    render(
      <BaseButton {...getProps({ containerWidth: true })}>Hello</BaseButton>
    )

    const buttonWidget = screen.getByRole("button")
    expect(buttonWidget).toHaveStyle("width: 100%")
  })
})

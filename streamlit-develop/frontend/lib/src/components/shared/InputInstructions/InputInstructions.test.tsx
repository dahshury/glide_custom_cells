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

import { render } from "~lib/test_util"

import InputInstructions, { Props } from "./InputInstructions"

const getProps = (props: Partial<Props> = {}): Props => ({
  dirty: true,
  value: "asd",
  inForm: false,
  ...props,
})

describe("InputInstructions", () => {
  const defaultProps = getProps()

  it("renders without crashing", () => {
    render(<InputInstructions {...defaultProps} />)

    expect(screen.getByTestId("InputInstructions").textContent).toBeDefined()
  })

  it("should show Enter instructions by default", () => {
    render(<InputInstructions {...defaultProps} />)

    expect(screen.getByText("Press Enter to apply")).toBeVisible()
  })

  describe("Multiline type", () => {
    const props = getProps({
      type: "multiline",
    })

    it("should show Ctrl+Enter instructions", () => {
      render(<InputInstructions {...props} />)
      expect(screen.getByText("Press Ctrl+Enter to apply")).toBeVisible()
    })

    it("show ⌘+Enter instructions", () => {
      Object.defineProperty(navigator, "platform", {
        value: "MacIntel",
        writable: true,
      })

      const currProps = getProps({
        type: "multiline",
      })
      render(<InputInstructions {...currProps} />)

      expect(screen.getByText("Press ⌘+Enter to apply")).toBeVisible()
    })

    it("should show instructions for max length", () => {
      const currProps = getProps({
        type: "multiline",
        maxLength: 3,
      })
      render(<InputInstructions {...currProps} />)

      expect(screen.getByTestId("InputInstructions").textContent).toBe(
        "Press ⌘+Enter to apply3/3"
      )
    })
  })

  it("should show instructions for max length", () => {
    const props = getProps({
      maxLength: 3,
    })
    render(<InputInstructions {...props} />)

    expect(screen.getByTestId("InputInstructions").textContent).toBe(
      "Press Enter to apply3/3"
    )
  })

  describe("Chat type", () => {
    const props = getProps({
      type: "chat",
    })

    it("should not show instructions", () => {
      render(<InputInstructions {...props} />)
      expect(screen.getByTestId("InputInstructions").textContent).toBe("")
    })

    it("should show instructions for max length", () => {
      const currProps = getProps({
        type: "chat",
        maxLength: 3,
      })
      render(<InputInstructions {...currProps} />)

      expect(screen.getByText("3/3")).toBeVisible()
    })
  })

  describe("In Form", () => {
    it("should show correct instructions to submit form with single line input", () => {
      const props = getProps({
        inForm: true,
        type: "single",
      })
      render(<InputInstructions {...props} />)

      expect(screen.getByText("Press Enter to submit form")).toBeVisible()
    })

    it("should show correct instructions to submit form with multiline input", () => {
      const props = getProps({
        inForm: true,
        type: "multiline",
      })
      render(<InputInstructions {...props} />)

      expect(screen.getByText("Press ⌘+Enter to submit form")).toBeVisible()
    })

    it("should not show enter instructions if allowEnterToSubmit is false", () => {
      const props = getProps({
        inForm: true,
        allowEnterToSubmit: false,
      })
      render(<InputInstructions {...props} />)

      expect(screen.getByTestId("InputInstructions")).toHaveTextContent("")
    })
  })
})

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

import React, { FC } from "react"

import { render, screen } from "@testing-library/react"

import ThemeProvider from "~lib/components/core/ThemeProvider"
import { mockTheme } from "~lib/mocks/mockTheme"
import { useRequiredContext } from "~lib/hooks/useRequiredContext"
import { WindowDimensionsProvider } from "~lib/components/shared/WindowDimensions/Provider"
import { WindowDimensionsContext } from "~lib/components/shared/WindowDimensions"

describe("WindowDimensionsProvider", () => {
  it("should provide the width and height of the window and take into account the theme padding", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      fontSize: "16px",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: Replace 'any' with a more specific type.
    } as any)

    const MyComponent: FC = () => {
      const dimensions = useRequiredContext(WindowDimensionsContext)
      return <div>{`${dimensions.fullWidth}x${dimensions.fullHeight}`}</div>
    }

    render(
      <ThemeProvider theme={mockTheme.emotion}>
        <WindowDimensionsProvider>
          <MyComponent />
        </WindowDimensionsProvider>
      </ThemeProvider>
    )

    expect(screen.getByText("1000x710")).toBeVisible()
  })

  it("should throw an error if there are multiple providers in the tree", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})

    const Provider: FC = () => (
      <ThemeProvider theme={mockTheme.emotion}>
        <WindowDimensionsProvider>
          <WindowDimensionsProvider>
            <div>Children content</div>
          </WindowDimensionsProvider>
        </WindowDimensionsProvider>
      </ThemeProvider>
    )

    expect(() => render(<Provider />)).toThrowError(
      "WindowDimensionsProvider should only be used once per app. If you need to read window dimensions, utilize `useRequiredContext(WindowDimensionsContext)` instead."
    )
    consoleError.mockRestore()
  })
})

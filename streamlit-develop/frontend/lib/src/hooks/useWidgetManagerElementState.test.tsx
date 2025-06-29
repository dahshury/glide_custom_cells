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

import { act, render, renderHook, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"

import { WidgetStateManager } from "~lib/WidgetStateManager"
import Form from "~lib/components/widgets/Form"
import { RootStyleProvider } from "~lib/RootStyleProvider"
import { getDefaultTheme } from "~lib/theme"

import useWidgetManagerElementState from "./useWidgetManagerElementState"

const elementId = "elementId"

describe("useWidgetManagerElementState hook", () => {
  it("should initialize correctly with initial state", () => {
    const widgetMgr = new WidgetStateManager({
      formsDataChanged: vi.fn(),
      sendRerunBackMsg: vi.fn(),
    })

    const { result } = renderHook(() =>
      useWidgetManagerElementState<number | null>({
        widgetMgr,
        id: elementId,
        key: "key",
        defaultValue: 42,
      })
    )

    const [state] = result.current

    // Initial state is set correctly
    expect(state).toEqual(42)
    expect(widgetMgr.getElementState(elementId, "key")).toEqual(42)
  })

  it("should set state correctly", () => {
    const widgetMgr = new WidgetStateManager({
      formsDataChanged: vi.fn(),
      sendRerunBackMsg: vi.fn(),
    })

    const { result } = renderHook(() =>
      useWidgetManagerElementState<number | null>({
        widgetMgr,
        id: elementId,
        key: "key",
        defaultValue: 42,
      })
    )

    const [, setState] = result.current

    act(() => {
      setState(24)
    })

    const state = result.current[0]
    expect(state).toEqual(24)
    expect(widgetMgr.getElementState(elementId, "key")).toEqual(24)
  })

  it("should properly clear state on form clear", async () => {
    const user = userEvent.setup()
    const formId = "formId"
    const stateKey = "stateKey"
    const defaultValue = "initial"
    const newValue = "new value"
    const testInputAriaLabel = "test input"

    const widgetMgr = new WidgetStateManager({
      formsDataChanged: vi.fn(),
      sendRerunBackMsg: vi.fn(),
    })

    const TestComponent: FC = () => {
      const [state, setState] = useWidgetManagerElementState<string>({
        widgetMgr,
        id: elementId,
        formId,
        key: stateKey,
        defaultValue,
      })

      return (
        <RootStyleProvider theme={getDefaultTheme()}>
          <Form
            formId={formId}
            clearOnSubmit={true}
            enterToSubmit={false}
            hasSubmitButton={true}
            widgetMgr={widgetMgr}
            border={false}
            scriptNotRunning={true}
          >
            <input
              aria-label={testInputAriaLabel}
              type="text"
              value={state}
              onChange={e => setState(e.currentTarget.value)}
            />
          </Form>
        </RootStyleProvider>
      )
    }

    render(<TestComponent />)

    // verify default value
    const inputElement: HTMLInputElement =
      screen.getByLabelText(testInputAriaLabel)
    expect(inputElement.value).toBe(defaultValue)

    expect(widgetMgr.getElementState(elementId, stateKey)).toBe(defaultValue)

    // change the input value
    await user.clear(inputElement)
    await user.type(inputElement, newValue)

    // verify new value is set
    expect(inputElement.value).toBe(newValue)
    expect(widgetMgr.getElementState(elementId, stateKey)).toBe(newValue)

    // submit the form
    // note: struggled using default html form submission, so manually triggering our submission logic here
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await act(() => {
      widgetMgr.submitForm(formId, undefined)
    })

    // verify the value is reset to the default
    expect(widgetMgr.getElementState(elementId, stateKey)).toBe(defaultValue)
    expect(inputElement.value).toBe(defaultValue)
  })
})

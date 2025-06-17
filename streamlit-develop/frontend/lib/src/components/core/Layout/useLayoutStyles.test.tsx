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

import { describe, expect, it } from "vitest"
import { renderHook } from "@testing-library/react"

import { Element, IAlert, streamlit } from "@streamlit/protobuf"

import { useLayoutStyles, UseLayoutStylesShape } from "./useLayoutStyles"

class MockElement implements Element {
  widthConfig?: streamlit.WidthConfig | null

  heightConfig?: streamlit.HeightConfig | null

  type?: "imgs" | "textArea"

  constructor(props: Partial<MockElement> = {}) {
    Object.assign(this, props)
  }

  toJSON(): MockElement {
    return this
  }
}

const getDefaultStyles = (
  overrides: Partial<UseLayoutStylesShape>
): UseLayoutStylesShape => {
  const defaults = { width: "auto", height: "auto", overflow: "visible" }
  return { ...defaults, ...overrides }
}

describe("#useLayoutStyles", () => {
  describe("with an element", () => {
    describe("that has useContainerWidth set to a falsy value", () => {
      const useContainerWidth = false

      it.each([
        [undefined, getDefaultStyles({})],
        [0, getDefaultStyles({})],
        [-100, getDefaultStyles({})],
        [NaN, getDefaultStyles({})],
        [100, getDefaultStyles({ width: 100 })],
      ])("and with a width value of %s, returns %o", (width, expected) => {
        const element = new MockElement()
        const subElement = { width, useContainerWidth }
        const { result } = renderHook(() =>
          useLayoutStyles({ element, subElement })
        )
        expect(result.current).toEqual(expected)
      })
    })

    describe('that has useContainerWidth set to "true"', () => {
      const useContainerWidth = true

      it.each([
        [undefined, getDefaultStyles({ width: "100%" })],
        [0, getDefaultStyles({ width: "100%" })],
        [-100, getDefaultStyles({ width: "100%" })],
        [NaN, getDefaultStyles({ width: "100%" })],
        [100, getDefaultStyles({ width: "100%" })],
      ])("and with a width value of %s, returns %o", (width, expected) => {
        const element = new MockElement()
        const subElement = { width, useContainerWidth }
        const { result } = renderHook(() =>
          useLayoutStyles({ element, subElement })
        )
        expect(result.current).toEqual(expected)
      })
    })

    describe("that is an image list", () => {
      const useContainerWidth = false

      it.each([
        [undefined, getDefaultStyles({ width: "100%" })],
        [0, getDefaultStyles({ width: "100%" })],
        [-100, getDefaultStyles({ width: "100%" })],
        [NaN, getDefaultStyles({ width: "100%" })],
        [100, getDefaultStyles({ width: "100%" })],
      ])("and with a width value of %s, returns %o", (width, expected) => {
        const element = new MockElement({ type: "imgs" })
        const subElement = { width, useContainerWidth }
        const { result } = renderHook(() =>
          useLayoutStyles({ element, subElement })
        )
        expect(result.current).toEqual(expected)
      })
    })

    describe("that has widthConfig set", () => {
      it.each([
        [
          new streamlit.WidthConfig({ useStretch: true }),
          false,
          getDefaultStyles({ width: "100%" }),
        ],
        [
          new streamlit.WidthConfig({ useStretch: true }),
          true,
          getDefaultStyles({ width: "100%" }),
        ],
        [
          new streamlit.WidthConfig({ useContent: true }),
          false,
          getDefaultStyles({ width: "fit-content" }),
        ],
        [
          new streamlit.WidthConfig({ useContent: true }),
          true,
          getDefaultStyles({ width: "100%" }),
        ],
        [
          new streamlit.WidthConfig({ pixelWidth: 100 }),
          false,
          getDefaultStyles({ width: 100 }),
        ],
        [
          new streamlit.WidthConfig({ pixelWidth: 100 }),
          true,
          getDefaultStyles({ width: "100%" }),
        ],
      ])(
        "and with a widthConfig value of %o and useContainerWidth %s, returns %o",
        (widthConfig, useContainerWidth, expected) => {
          const element = new MockElement({ widthConfig })
          const subElement = { useContainerWidth }
          const { result } = renderHook(() =>
            useLayoutStyles({ element, subElement })
          )
          expect(result.current).toEqual(expected)
        }
      )
    })

    describe("that has widthConfig set to invalid pixelWidth values", () => {
      it.each([
        [0, false, getDefaultStyles({})],
        [-100, false, getDefaultStyles({})],
        [NaN, false, getDefaultStyles({})],
        [100, false, getDefaultStyles({ width: 100 })],
        [0, true, getDefaultStyles({ width: "100%" })],
        [-100, true, getDefaultStyles({ width: "100%" })],
        [NaN, true, getDefaultStyles({ width: "100%" })],
        [100, true, getDefaultStyles({ width: "100%" })],
      ])(
        "and with a pixelWidth value of %s and useContainerWidth %s, returns %o",
        (pixelWidth, useContainerWidth, expected) => {
          const element = new MockElement({
            widthConfig: new streamlit.WidthConfig({ pixelWidth }),
          })
          const subElement = { useContainerWidth }
          const { result } = renderHook(() =>
            useLayoutStyles({ element, subElement })
          )
          expect(result.current).toEqual(expected)
        }
      )
    })

    describe("with variations on element", () => {
      it.each([
        [
          { widthConfig: undefined, useContainerWidth: false },
          getDefaultStyles({}),
        ],
        [
          { widthConfig: undefined, useContainerWidth: true },
          getDefaultStyles({ width: "100%" }),
        ],
      ])("and with element %o, returns %o", (props, expected) => {
        const element = new MockElement({
          widthConfig: props.widthConfig,
        })
        const subElement = { useContainerWidth: props.useContainerWidth }
        const { result } = renderHook(() =>
          useLayoutStyles({ element, subElement })
        )
        expect(result.current).toEqual(expected)
      })
    })

    describe("with width included along with widthConfig", () => {
      it.each([
        [
          {
            widthConfig: new streamlit.WidthConfig({ useStretch: true }),
            width: 100,
          },
          false,
          getDefaultStyles({ width: "100%" }),
        ],
        [
          {
            widthConfig: new streamlit.WidthConfig({ useContent: true }),
            width: 100,
          },
          false,
          getDefaultStyles({ width: "fit-content" }),
        ],
        [
          {
            widthConfig: new streamlit.WidthConfig({ pixelWidth: 200 }),
            width: 100,
          },
          false,
          getDefaultStyles({ width: 200 }),
        ],
        [
          {
            widthConfig: new streamlit.WidthConfig({ pixelWidth: 200 }),
            width: 100,
          },
          true,
          getDefaultStyles({ width: "100%" }),
        ],
        [
          {
            widthConfig: new streamlit.WidthConfig({ pixelWidth: 0 }),
            width: 100,
          },
          false,
          getDefaultStyles({}),
        ],
        [
          {
            widthConfig: new streamlit.WidthConfig({ pixelWidth: -100 }),
            width: 100,
          },
          false,
          getDefaultStyles({}),
        ],
        [
          {
            widthConfig: new streamlit.WidthConfig({ pixelWidth: NaN }),
            width: 100,
          },
          false,
          getDefaultStyles({}),
        ],
      ])(
        "and with element props %o and useContainerWidth %s, returns %o",
        (props, useContainerWidth, expected) => {
          const element = new MockElement({
            widthConfig: props.widthConfig,
          })

          const subElement = {
            width: props.width,
            useContainerWidth,
          }

          const { result } = renderHook(() =>
            useLayoutStyles({ element, subElement })
          )
          expect(result.current).toEqual(expected)
        }
      )
    })

    describe("with width defined on subElement but element.widthConfig is null or undefined", () => {
      it.each([
        [100, false, null, getDefaultStyles({ width: 100 })],
        [200, false, null, getDefaultStyles({ width: 200 })],
        [100, true, null, getDefaultStyles({ width: "100%" })],
        [0, false, null, getDefaultStyles({})],
        [-100, false, null, getDefaultStyles({})],
        [100, false, undefined, getDefaultStyles({ width: 100 })],
        [200, false, undefined, getDefaultStyles({ width: 200 })],
        [100, true, undefined, getDefaultStyles({ width: "100%" })],
        [0, false, undefined, getDefaultStyles({})],
        [-100, false, undefined, getDefaultStyles({})],
      ])(
        "and with a width value of %s, useContainerWidth %s, and widthConfig %s, returns %o",
        (width, useContainerWidth, widthConfig, expected) => {
          const element = new MockElement({
            widthConfig,
          })

          const subElement = {
            width,
            useContainerWidth,
          }

          const { result } = renderHook(() =>
            useLayoutStyles({ element, subElement })
          )
          expect(result.current).toEqual(expected)
        }
      )
    })

    describe("that has heightConfig set", () => {
      it.each([
        [
          new streamlit.HeightConfig({ useStretch: true }),
          getDefaultStyles({ height: "100%" }),
        ],
        [
          new streamlit.HeightConfig({ useContent: true }),
          getDefaultStyles({}),
        ],
        [
          new streamlit.HeightConfig({ pixelHeight: 100 }),
          getDefaultStyles({ height: 100, overflow: "auto" }),
        ],
      ])(
        "and with a heightConfig value of %o, returns %o",
        (heightConfig, expected) => {
          const element = new MockElement({ heightConfig })
          const { result } = renderHook(() => useLayoutStyles({ element }))
          expect(result.current).toEqual(expected)
        }
      )
    })

    describe("that has heightConfig set to invalid pixelHeight values", () => {
      it.each([
        [0, getDefaultStyles({})],
        [-100, getDefaultStyles({})],
        [NaN, getDefaultStyles({})],
      ])(
        "and with a pixelHeight value of %s, returns %o",
        (pixelHeight, expected) => {
          const element = new MockElement({
            heightConfig: new streamlit.HeightConfig({ pixelHeight }),
          })
          const { result } = renderHook(() => useLayoutStyles({ element }))
          expect(result.current).toEqual(expected)
        }
      )
    })

    describe("with height defined on subElement but element.heightConfig is null or undefined", () => {
      it.each([
        [100, null, getDefaultStyles({ height: 100, overflow: "auto" })],
        [200, null, getDefaultStyles({ height: 200, overflow: "auto" })],
        [0, null, getDefaultStyles({})],
        [-100, null, getDefaultStyles({})],
        [NaN, null, getDefaultStyles({})],
        [100, undefined, getDefaultStyles({ height: 100, overflow: "auto" })],
        [200, undefined, getDefaultStyles({ height: 200, overflow: "auto" })],
        [0, undefined, getDefaultStyles({})],
        [-100, undefined, getDefaultStyles({})],
        [NaN, undefined, getDefaultStyles({})],
      ])(
        "and with a height value of %s and heightConfig %s, returns %o",
        (height, heightConfig, expected) => {
          const element = new MockElement({
            heightConfig,
          })

          const subElement = {
            height,
          }

          const { result } = renderHook(() =>
            useLayoutStyles({ element, subElement })
          )
          expect(result.current).toEqual(expected)
        }
      )
    })

    describe("with height included in subElement", () => {
      it.each([
        [undefined, getDefaultStyles({})],
        [0, getDefaultStyles({})],
        [-100, getDefaultStyles({})],
        [NaN, getDefaultStyles({})],
        [100, getDefaultStyles({ height: 100, overflow: "auto" })],
      ])("and with a height value of %s, returns %o", (height, expected) => {
        const element = new MockElement()
        const subElement = { height }
        const { result } = renderHook(() =>
          useLayoutStyles({ element, subElement })
        )
        expect(result.current).toEqual(expected)
      })
    })

    describe("with text area element type", () => {
      it.each([
        [
          new streamlit.HeightConfig({ useStretch: true }),
          getDefaultStyles({ height: "100%" }),
        ],
        [
          new streamlit.HeightConfig({ useContent: true }),
          getDefaultStyles({ height: "auto" }),
        ],
        [
          new streamlit.HeightConfig({ pixelHeight: 100 }),
          getDefaultStyles({ height: "auto" }),
        ],
        [null, getDefaultStyles({ height: "auto" })],
        [undefined, getDefaultStyles({ height: "auto" })],
      ])("and with heightConfig %s, returns %o", (heightConfig, expected) => {
        const element = new MockElement({
          type: "textArea",
          heightConfig,
        })

        const { result } = renderHook(() => useLayoutStyles({ element }))
        expect(result.current).toEqual(expected)
      })
    })

    describe("with height included along with heightConfig", () => {
      it.each([
        [
          {
            heightConfig: new streamlit.HeightConfig({ useStretch: true }),
            height: 100,
          },
          getDefaultStyles({ height: "100%" }),
        ],
        [
          {
            heightConfig: new streamlit.HeightConfig({ useContent: true }),
            height: 100,
          },
          getDefaultStyles({}),
        ],
        [
          {
            heightConfig: new streamlit.HeightConfig({ pixelHeight: 200 }),
            height: 100,
          },
          getDefaultStyles({ height: 200, overflow: "auto" }),
        ],
        [
          {
            heightConfig: new streamlit.HeightConfig({ pixelHeight: 0 }),
            height: 100,
          },
          getDefaultStyles({}),
        ],
        [
          {
            heightConfig: new streamlit.HeightConfig({ pixelHeight: -100 }),
            height: 100,
          },
          getDefaultStyles({}),
        ],
        [
          {
            heightConfig: new streamlit.HeightConfig({ pixelHeight: NaN }),
            height: 100,
          },
          getDefaultStyles({}),
        ],
      ])("and with element props %o, returns %o", (props, expected) => {
        const element = new MockElement({
          heightConfig: props.heightConfig,
        })

        const subElement = {
          height: props.height,
        }

        const { result } = renderHook(() =>
          useLayoutStyles({ element, subElement })
        )
        expect(result.current).toEqual(expected)
      })
    })

    describe("with both width and height configurations", () => {
      it.each([
        [
          {
            widthConfig: new streamlit.WidthConfig({ pixelWidth: 200 }),
            heightConfig: new streamlit.HeightConfig({ pixelHeight: 300 }),
          },
          getDefaultStyles({ width: 200, height: 300, overflow: "auto" }),
        ],
        [
          {
            widthConfig: new streamlit.WidthConfig({ useStretch: true }),
            heightConfig: new streamlit.HeightConfig({ useStretch: true }),
          },
          getDefaultStyles({ width: "100%", height: "100%" }),
        ],
        [
          {
            widthConfig: new streamlit.WidthConfig({ useContent: true }),
            heightConfig: new streamlit.HeightConfig({ useContent: true }),
          },
          getDefaultStyles({ width: "fit-content", height: "auto" }),
        ],
      ])("and with element props %o, returns %o", (props, expected) => {
        const element = new MockElement(props)
        const { result } = renderHook(() => useLayoutStyles({ element }))
        expect(result.current).toEqual(expected)
      })
    })

    describe("with both width and height in subElement", () => {
      it.each([
        [
          { width: 200, height: 300 },
          getDefaultStyles({ width: 200, height: 300, overflow: "auto" }),
        ],
        [
          { width: 0, height: 100 },
          getDefaultStyles({ width: "auto", height: 100, overflow: "auto" }),
        ],
        [
          { width: 100, height: 0 },
          getDefaultStyles({ width: 100, height: "auto" }),
        ],
      ])(
        "and with subElement props %o, returns %o",
        (subElementProps, expected) => {
          const element = new MockElement()
          const { result } = renderHook(() =>
            useLayoutStyles({ element, subElement: subElementProps })
          )
          expect(result.current).toEqual(expected)
        }
      )
    })

    describe("with widthConfig on the subElement (using type assertions)", () => {
      it.each([
        [
          {
            subElementWidthConfig: new streamlit.WidthConfig({
              useStretch: true,
            }),
          },
          getDefaultStyles({ width: "100%", height: "auto" }),
        ],
        [
          {
            subElementWidthConfig: new streamlit.WidthConfig({
              useContent: true,
            }),
          },
          getDefaultStyles({ width: "fit-content", height: "auto" }),
        ],
        [
          {
            subElementWidthConfig: new streamlit.WidthConfig({
              pixelWidth: 150,
            }),
          },
          getDefaultStyles({ width: 150, height: "auto" }),
        ],
      ])(
        "and with subElement widthConfig %o, returns %o",
        (props, expected) => {
          const element = new MockElement()

          // Use type assertion to bypass TypeScript checks
          const subElement = {
            widthConfig: props.subElementWidthConfig,
          } as IAlert

          const { result } = renderHook(() =>
            useLayoutStyles({
              element,
              subElement,
            })
          )
          expect(result.current).toEqual(expected)
        }
      )
    })
  })
})

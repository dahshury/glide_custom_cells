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

import { getLogger } from "loglevel"
import { MockInstance } from "vitest"
import { transparentize } from "color2k"

import { CustomThemeConfig } from "@streamlit/protobuf"

import {
  baseTheme,
  createAutoTheme,
  darkTheme,
  lightTheme,
} from "~lib/theme/index"
import { ThemeConfig } from "~lib/theme/types"
import { LocalStore } from "~lib/util/storageUtils"

import { hasLightBackgroundColor } from "./getColors"
import {
  AUTO_THEME_NAME,
  bgColorToBaseString,
  computeSpacingStyle,
  createEmotionTheme,
  createTheme,
  CUSTOM_THEME_NAME,
  getCachedTheme,
  getDefaultTheme,
  getHostSpecifiedTheme,
  getSystemTheme,
  isColor,
  isPresetTheme,
  parseFont,
  removeCachedTheme,
  setCachedTheme,
  toThemeInput,
} from "./utils"

const matchMediaFillers = {
  onchange: null,
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}

const LOG = getLogger("theme:utils")

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: Replace 'any' with a more specific type.
const windowLocationSearch = (search: string): any => ({
  location: {
    search,
  },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: Replace 'any' with a more specific type.
const windowMatchMedia = (theme: "light" | "dark"): any => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: Replace 'any' with a more specific type.
  matchMedia: (query: any) => ({
    matches: query === `(prefers-color-scheme: ${theme})`,
    media: query,
    ...matchMediaFillers,
  }),
})

const mockWindow = (...overrides: object[]): MockInstance => {
  const localStorage = window.localStorage
  const windowSpy = vi.spyOn(window, "window", "get")

  windowSpy.mockImplementation(() => ({
    localStorage,
    ...windowLocationSearch(""),
    ...windowMatchMedia("light"),
    ...Object.assign({}, ...overrides),
  }))

  return windowSpy
}

describe("Styling utils", () => {
  describe("computeSpacingStyle", () => {
    test("pulls correct theme values", () => {
      expect(computeSpacingStyle("sm md lg none", lightTheme.emotion)).toEqual(
        "0.5rem 0.75rem 1rem 0"
      )
      expect(computeSpacingStyle("xs  0  px  lg", lightTheme.emotion)).toEqual(
        "0.375rem 0 1px 1rem"
      )
    })
  })
})

describe("isPresetTheme", () => {
  it("returns true for the light, dark, and auto themes", () => {
    const presetThemes = [lightTheme, darkTheme, createAutoTheme()]

    presetThemes.forEach((themeConfig: ThemeConfig) => {
      expect(isPresetTheme(themeConfig)).toBe(true)
    })
  })

  it("returns false for custom themes", () => {
    const customTheme = createTheme(
      CUSTOM_THEME_NAME,
      new CustomThemeConfig({
        primaryColor: "red",
        secondaryBackgroundColor: "blue",
      })
    )

    expect(isPresetTheme(customTheme)).toBe(false)
  })
})

describe("Cached theme helpers", () => {
  // NOTE: localStorage is weird, and calling .spyOn(window.localStorage, "setItem")
  // doesn't work. Accessing .__proto__ here isn't too bad of a crime since
  // it's test code.
  const breakLocalStorage = (): void => {
    vi
      // eslint-disable-next-line no-proto
      .spyOn(window.localStorage.__proto__, "setItem")
      .mockImplementation(() => {
        throw new Error("boom")
      })
  }

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  describe("getCachedTheme", () => {
    it("returns null if localStorage is not available", () => {
      breakLocalStorage()

      // eslint-disable-next-line no-proto
      const getItemSpy = vi.spyOn(window.localStorage.__proto__, "getItem")
      expect(getCachedTheme()).toBe(null)
      expect(getItemSpy).not.toHaveBeenCalled()
    })

    it("returns null if no theme is set in localStorage", () => {
      expect(getCachedTheme()).toBe(null)
    })

    it("does not find cached themes with older versions, so returns null", () => {
      // Save a cachedTheme in LocalStorage with the key of a previous version.
      window.localStorage.setItem(
        LocalStore.CACHED_THEME_BASE_KEY,
        JSON.stringify({ name: darkTheme.name })
      )
      expect(getCachedTheme()).toBe(null)
    })

    it("returns preset cached theme if localStorage is available and one is set", () => {
      window.localStorage.setItem(
        LocalStore.ACTIVE_THEME,
        JSON.stringify({ name: darkTheme.name })
      )
      expect(getCachedTheme()).toEqual(darkTheme)
    })

    it("returns a custom cached theme if localStorage is available and one is set", () => {
      const themeInput: Partial<CustomThemeConfig> = {
        primaryColor: "red",
        backgroundColor: "orange",
        secondaryBackgroundColor: "yellow",
        textColor: "green",
        bodyFont: '"Source Sans", sans-serif',
      }

      const customTheme = createTheme(CUSTOM_THEME_NAME, themeInput)

      window.localStorage.setItem(
        LocalStore.ACTIVE_THEME,
        JSON.stringify({ name: CUSTOM_THEME_NAME, themeInput })
      )

      expect(getCachedTheme()).toEqual(customTheme)
    })
  })

  describe("removeCachedTheme", () => {
    it("does nothing if localStorage is not available", () => {
      breakLocalStorage()

      const removeItemSpy = vi.spyOn(
        // eslint-disable-next-line no-proto
        window.localStorage.__proto__,
        "removeItem"
      )
      removeCachedTheme()
      expect(removeItemSpy).not.toHaveBeenCalled()
    })

    it("removes theme if localStorage", () => {
      const removeItemSpy = vi.spyOn(
        // eslint-disable-next-line no-proto
        window.localStorage.__proto__,
        "removeItem"
      )

      removeCachedTheme()
      expect(removeItemSpy).toHaveBeenCalled()
    })
  })

  describe("setCachedTheme", () => {
    const themeInput: Partial<CustomThemeConfig> = {
      primaryColor: "red",
      backgroundColor: "orange",
      secondaryBackgroundColor: "yellow",
      textColor: "green",
      bodyFont: '"Source Sans", sans-serif',
    }
    const customTheme = createTheme(CUSTOM_THEME_NAME, themeInput)

    it("does nothing if localStorage is not available", () => {
      breakLocalStorage()

      // eslint-disable-next-line no-proto
      const setItemSpy = vi.spyOn(window.localStorage.__proto__, "setItem")

      setCachedTheme(darkTheme)
      // This looks a bit funny and is the way it is because the way we know
      // that localStorage is broken is that setItem throws an error at us.
      expect(setItemSpy).toHaveBeenCalledTimes(1)
      expect(setItemSpy).toHaveBeenCalledWith("testData", "testData")
    })

    it("sets a preset theme with just its name if localStorage is available", () => {
      setCachedTheme(darkTheme)
      const cachedTheme = JSON.parse(
        window.localStorage.getItem(LocalStore.ACTIVE_THEME) as string
      )
      expect(cachedTheme).toEqual({ name: darkTheme.name })
    })

    it("deletes cached themes with older versions", () => {
      window.localStorage.setItem("stActiveTheme", "I should get deleted :|")

      window.localStorage.setItem(
        LocalStore.CACHED_THEME_BASE_KEY,
        "I should get deleted too :|"
      )

      setCachedTheme(customTheme)

      expect(window.localStorage.getItem("stActiveTheme")).toBe(null)
      expect(
        window.localStorage.getItem(LocalStore.CACHED_THEME_BASE_KEY)
      ).toBe(null)
    })

    it("sets a custom theme with its name and themeInput if localStorage is available", () => {
      setCachedTheme(customTheme)

      const cachedTheme = JSON.parse(
        window.localStorage.getItem(LocalStore.ACTIVE_THEME) as string
      )

      expect(cachedTheme).toEqual({
        name: customTheme.name,
        themeInput,
      })
    })
  })
})

describe("createTheme", () => {
  it("returns a theme", () => {
    const customThemeConfig = new CustomThemeConfig({
      primaryColor: "red",
      secondaryBackgroundColor: "blue",
      bodyFont: "serif",
    })
    const customTheme = createTheme(CUSTOM_THEME_NAME, customThemeConfig)
    expect(customTheme.name).toBe(CUSTOM_THEME_NAME)
    expect(customTheme.emotion.colors.primary).toBe("red")
    expect(customTheme.emotion.colors.secondaryBg).toBe("blue")
    expect(customTheme.emotion.genericFonts.bodyFont).toBe(
      lightTheme.emotion.fonts.serif
    )
    // If it is not provided, use the default
    expect(customTheme.emotion.colors.bgColor).toBe(
      lightTheme.emotion.colors.bgColor
    )
  })

  it("returns a theme based on a different theme", () => {
    const customThemeConfig = new CustomThemeConfig({
      primaryColor: "red",
      secondaryBackgroundColor: "blue",
      bodyFont: "serif",
    })
    const customTheme = createTheme(
      CUSTOM_THEME_NAME,
      customThemeConfig,
      darkTheme,
      // inSidebar
      true
    )
    expect(customTheme.name).toBe(CUSTOM_THEME_NAME)
    expect(customTheme.emotion.colors.primary).toBe("red")
    expect(customTheme.emotion.colors.secondaryBg).toBe("blue")
    expect(customTheme.emotion.genericFonts.bodyFont).toBe(
      darkTheme.emotion.fonts.serif
    )
    // If it is not provided, use the default
    expect(customTheme.emotion.colors.bgColor).toBe(
      darkTheme.emotion.colors.bgColor
    )
    expect(customTheme.emotion.inSidebar).toBe(true)
    expect(darkTheme.emotion.inSidebar).toBe(false)
  })

  it("handles hex values without #", () => {
    const customThemeConfig = new CustomThemeConfig({
      primaryColor: "eee",
      secondaryBackgroundColor: "fc9231",
      bodyFont: "serif",
    })
    const customTheme = createTheme(
      CUSTOM_THEME_NAME,
      customThemeConfig,
      darkTheme
    )
    expect(customTheme.name).toBe(CUSTOM_THEME_NAME)
    expect(customTheme.emotion.colors.primary).toBe("#eee")
    expect(customTheme.emotion.colors.secondaryBg).toBe("#fc9231")
    expect(customTheme.emotion.genericFonts.bodyFont).toBe(
      customTheme.emotion.fonts.serif
    )
    // If it is not provided, use the default
    expect(customTheme.emotion.colors.bgColor).toBe(
      darkTheme.emotion.colors.bgColor
    )
  })

  it("sets unspecified theme options using the given BaseTheme", () => {
    const customTheme = createTheme(
      CUSTOM_THEME_NAME,
      new CustomThemeConfig({
        base: CustomThemeConfig.BaseTheme.DARK,
        primaryColor: "blue",
      })
    )

    expect(customTheme.emotion.colors.bgColor).toBe(
      darkTheme.emotion.colors.bgColor
    )
    expect(customTheme.emotion.colors.primary).toBe("blue")
    // Auxiliary colors should be those of the Dark theme.
    expect(customTheme.emotion.colors.warning).toBe(
      darkTheme.emotion.colors.warning
    )
  })

  it("sets auxiliary colors based on backgroundColor over the BaseTheme", () => {
    const customTheme = createTheme(
      CUSTOM_THEME_NAME,
      new CustomThemeConfig({
        backgroundColor: "black",
        base: CustomThemeConfig.BaseTheme.LIGHT,
      })
    )

    expect(customTheme.emotion.colors.bgColor).toBe("black")
    // Auxiliary colors should be picked to be ones that work well with the
    // black background even though the user set the base theme to light.
    expect(customTheme.emotion.colors.warning).toBe(
      darkTheme.emotion.colors.warning
    )
    // Theme options should be inherited from the light theme as defined by the
    // user.
    expect(customTheme.emotion.colors.secondaryBg).toBe(
      lightTheme.emotion.colors.secondaryBg
    )
  })
})

describe("getSystemTheme", () => {
  let windowSpy: MockInstance

  afterEach(() => {
    windowSpy.mockRestore()
    window.localStorage.clear()
  })

  it("returns lightTheme when matchMedia does *not* match dark", () => {
    windowSpy = mockWindow()

    expect(getSystemTheme().name).toBe("Light")
  })

  it("returns darkTheme when matchMedia does match dark", () => {
    windowSpy = mockWindow(windowMatchMedia("dark"))

    expect(getSystemTheme().name).toBe("Dark")
  })
})

describe("getHostSpecifiedTheme", () => {
  let windowSpy: MockInstance

  afterEach(() => {
    windowSpy.mockRestore()
    window.localStorage.clear()
  })

  it("sets default to the auto theme when there is no theme preference", () => {
    windowSpy = mockWindow()
    const defaultTheme = getHostSpecifiedTheme()

    expect(defaultTheme.name).toBe(AUTO_THEME_NAME)
    // Also verify that the theme is our lightTheme.
    expect(defaultTheme.emotion.colors).toEqual(lightTheme.emotion.colors)
  })

  it("sets the auto theme correctly when the OS preference is dark", () => {
    mockWindow(windowSpy, windowMatchMedia("dark"))

    const defaultTheme = getHostSpecifiedTheme()

    expect(defaultTheme.name).toBe(AUTO_THEME_NAME)
    expect(defaultTheme.emotion.colors).toEqual(darkTheme.emotion.colors)
  })

  it("sets default to the light theme when an embed query parameter is set", () => {
    windowSpy = mockWindow(
      windowLocationSearch("?embed=true&embed_options=light_theme")
    )
    const defaultTheme = getHostSpecifiedTheme()

    expect(defaultTheme.name).toBe("Light")
    // Also verify that the theme is our lightTheme.
    expect(defaultTheme.emotion.colors).toEqual(lightTheme.emotion.colors)
  })

  it("sets default to the dark theme when an embed query parameter is set", () => {
    windowSpy = mockWindow(
      windowLocationSearch("?embed=true&embed_options=dark_theme")
    )
    const defaultTheme = getHostSpecifiedTheme()

    expect(defaultTheme.name).toBe("Dark")
    // Also verify that the theme is our darkTheme.
    expect(defaultTheme.emotion.colors).toEqual(darkTheme.emotion.colors)
  })

  it("respects embed query parameter is set over system theme", () => {
    windowSpy = mockWindow(
      windowMatchMedia("dark"),
      windowLocationSearch("?embed=true&embed_options=light_theme")
    )
    const defaultTheme = getHostSpecifiedTheme()

    expect(defaultTheme.name).toBe("Light")
    // Also verify that the theme is our lightTheme.
    expect(defaultTheme.emotion.colors).toEqual(lightTheme.emotion.colors)
  })
})

describe("getDefaultTheme", () => {
  let windowSpy: MockInstance

  afterEach(() => {
    windowSpy.mockRestore()
    window.localStorage.clear()
  })

  it("sets default to the auto theme when there is no cached theme", () => {
    windowSpy = mockWindow()
    const defaultTheme = getDefaultTheme()

    expect(defaultTheme.name).toBe(AUTO_THEME_NAME)
    // Also verify that the theme is our lightTheme.
    expect(defaultTheme.emotion.colors).toEqual(lightTheme.emotion.colors)
  })

  it("sets the auto theme correctly when the OS preference is dark", () => {
    mockWindow(windowSpy, windowMatchMedia("dark"))

    const defaultTheme = getDefaultTheme()

    expect(defaultTheme.name).toBe(AUTO_THEME_NAME)
    expect(defaultTheme.emotion.colors).toEqual(darkTheme.emotion.colors)
  })

  it("sets the default to the user preference when one is set", () => {
    windowSpy = mockWindow()
    setCachedTheme(darkTheme)

    const defaultTheme = getDefaultTheme()

    expect(defaultTheme.name).toBe("Dark")
    expect(defaultTheme.emotion.colors).toEqual(darkTheme.emotion.colors)
  })

  it("sets default to the light theme when an embed query parameter is set", () => {
    windowSpy = mockWindow(
      windowLocationSearch("?embed=true&embed_options=light_theme")
    )
    const defaultTheme = getDefaultTheme()

    expect(defaultTheme.name).toBe("Light")
    // Also verify that the theme is our lightTheme.
    expect(defaultTheme.emotion.colors).toEqual(lightTheme.emotion.colors)
  })

  it("sets default to the dark theme when an embed query parameter is set", () => {
    windowSpy = mockWindow(
      windowLocationSearch("?embed=true&embed_options=dark_theme")
    )
    const defaultTheme = getDefaultTheme()

    expect(defaultTheme.name).toBe("Dark")
    // Also verify that the theme is our darkTheme.
    expect(defaultTheme.emotion.colors).toEqual(darkTheme.emotion.colors)
  })

  it("respects embed query parameter is set over system theme", () => {
    windowSpy = mockWindow(
      windowMatchMedia("dark"),
      windowLocationSearch("?embed=true&embed_options=light_theme")
    )
    const defaultTheme = getDefaultTheme()

    expect(defaultTheme.name).toBe("Light")
    // Also verify that the theme is our lightTheme.
    expect(defaultTheme.emotion.colors).toEqual(lightTheme.emotion.colors)
  })
})

describe("isColor", () => {
  // https://www.w3schools.com/cssref/css_colors_legal.asp
  it("works with valid colors", () => {
    expect(isColor("#fff")).toBe(true)
    expect(isColor("#ffffff")).toBe(true)
    expect(isColor("#ffffff0")).toBe(true)
    expect(isColor("#000")).toBe(true)
    expect(isColor("#000000")).toBe(true)
    expect(isColor("#fafafa")).toBe(true)
    expect(isColor("red")).toBe(true)
    expect(isColor("coral")).toBe(true)
    expect(isColor("transparent")).toBe(true)
    expect(isColor("rgb(0,0,0)")).toBe(true)
    expect(isColor("rgb(-1, 0, -255)")).toBe(true)
    expect(isColor("rgba(0,0,0,.5)")).toBe(true)
    expect(isColor("hsl(120,50%,40%)")).toBe(true)
    expect(isColor("hsl(120,50%,40%, .4)")).toBe(true)
    expect(isColor("currentColor")).toBe(true)
  })

  it("works with invalid colors", () => {
    expect(isColor("fff")).toBe(false)
    expect(isColor("cookies are delicious")).toBe(false)
    expect(isColor("")).toBe(false)
    expect(isColor("hsl(120,50,40)")).toBe(false)
  })
})

describe("createEmotionTheme", () => {
  it("sets to light when matchMedia does not match dark", () => {
    const themeInput: Partial<CustomThemeConfig> = {
      headingFont: "serif",
      bodyFont: "monospace",
      codeFont: "monospace",
      primaryColor: "red",
      backgroundColor: "pink",
      secondaryBackgroundColor: "blue",
      textColor: "orange",
    }

    const theme = createEmotionTheme(themeInput)

    expect(theme.colors.primary).toBe("red")
    expect(theme.colors.bgColor).toBe("pink")
    expect(theme.colors.secondaryBg).toBe("blue")
    expect(theme.colors.bodyText).toBe("orange")
    expect(theme.genericFonts.headingFont).toBe(theme.fonts.serif)
    expect(theme.genericFonts.bodyFont).toBe(theme.fonts.monospace)
    expect(theme.genericFonts.codeFont).toBe(theme.fonts.monospace)
  })

  it("defaults to base if missing value", () => {
    const themeInput: Partial<CustomThemeConfig> = {
      primaryColor: "red",
    }

    const theme = createEmotionTheme(themeInput)

    expect(theme.colors.primary).toBe("red")
    expect(theme.colors.bgColor).toBe(baseTheme.emotion.colors.bgColor)
    expect(theme.colors.secondaryBg).toBe(baseTheme.emotion.colors.secondaryBg)
    expect(theme.colors.bodyText).toBe(baseTheme.emotion.colors.bodyText)
    expect(theme.genericFonts.headingFont).toBe(
      baseTheme.emotion.genericFonts.headingFont
    )
    expect(theme.genericFonts.bodyFont).toBe(
      baseTheme.emotion.genericFonts.bodyFont
    )
    expect(theme.genericFonts.codeFont).toBe(
      baseTheme.emotion.genericFonts.codeFont
    )
  })

  it("uses bodyFont for headingFont when headingFont is not configured", () => {
    const themeInput: Partial<CustomThemeConfig> = {
      bodyFont: "monospace",
      // headingFont is intentionally not set
    }

    const theme = createEmotionTheme(themeInput)

    expect(theme.genericFonts.bodyFont).toBe(theme.fonts.monospace)
    expect(theme.genericFonts.headingFont).toBe(theme.fonts.monospace)
  })

  it("adapts the radii theme props if baseRadius is provided", () => {
    const themeInput: Partial<CustomThemeConfig> = {
      baseRadius: "1.2rem",
    }

    const theme = createEmotionTheme(themeInput)

    expect(theme.radii.default).toBe("1.2rem")
    expect(theme.radii.md).toBe("0.6rem")
    expect(theme.radii.xl).toBe("1.8rem")
    expect(theme.radii.xxl).toBe("2.4rem")
  })

  it.each([
    // Test keyword values
    ["full", "1.4rem", "0.7rem", "2.1rem", "2.8rem"],
    ["none", "0rem", "0rem", "0rem", "0rem"],
    ["small", "0.35rem", "0.17rem", "0.52rem", "0.7rem"],
    ["medium", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    ["large", "1rem", "0.5rem", "1.5rem", "2rem"],
    // Test rem values
    ["0.8rem", "0.8rem", "0.4rem", "1.2rem", "1.6rem"],
    ["2rem", "2rem", "1rem", "3rem", "4rem"],
    // Test px values
    ["10px", "10px", "5px", "15px", "20px"],
    ["24px", "24px", "12px", "36px", "48px"],
    // Test with whitespace and uppercase
    [" FULL ", "1.4rem", "0.7rem", "2.1rem", "2.8rem"],
    ["  medium  ", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    ["2 rem ", "2rem", "1rem", "3rem", "4rem"],
    // Test only numbers:
    ["10", "10px", "5px", "15px", "20px"],
    ["24foo", "24px", "12px", "36px", "48px"],
  ])(
    "correctly applies baseRadius '%s'",
    (baseRadius, expectedDefault, expectedMd, expectedXl, expectedXxl) => {
      const themeInput: Partial<CustomThemeConfig> = {
        baseRadius,
      }

      const theme = createEmotionTheme(themeInput)

      expect(theme.radii.default).toBe(expectedDefault)
      expect(theme.radii.md).toBe(expectedMd)
      expect(theme.radii.xl).toBe(expectedXl)
      expect(theme.radii.xxl).toBe(expectedXxl)
    }
  )

  it.each([
    "invalid",
    "rem", // Missing number
    "px", // Missing number
    "", // Empty string
  ])(
    "logs an warning and falls back to default for invalid baseRadius '%s'",
    invalidBaseRadius => {
      const logWarningSpy = vi.spyOn(LOG, "warn")
      const themeInput: Partial<CustomThemeConfig> = {
        baseRadius: invalidBaseRadius,
      }

      const theme = createEmotionTheme(themeInput)

      // Should log an error
      expect(logWarningSpy).toHaveBeenCalledWith(
        `Invalid base radius: ${invalidBaseRadius}. Falling back to default base radius.`
      )

      // Should fall back to default values
      expect(theme.radii.default).toBe(baseTheme.emotion.radii.default)
      expect(theme.radii.md).toBe(baseTheme.emotion.radii.md)
      expect(theme.radii.xl).toBe(baseTheme.emotion.radii.xl)
      expect(theme.radii.xxl).toBe(baseTheme.emotion.radii.xxl)
    }
  )

  it.each([
    // Test keyword values
    ["full", "1.4rem", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    ["none", "0rem", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    ["small", "0.35rem", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    ["medium", "0.5rem", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    ["large", "1rem", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    // Test rem values
    ["0.8rem", "0.8rem", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    ["2rem", "2rem", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    // Test px values
    ["10px", "10px", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    ["24px", "24px", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    // Test with whitespace and uppercase
    [" FULL ", "1.4rem", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    ["  medium  ", "0.5rem", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    ["2 rem ", "2rem", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    // Test only numbers:
    ["10", "10px", "0.5rem", "0.25rem", "0.75rem", "1rem"],
    ["24foo", "24px", "0.5rem", "0.25rem", "0.75rem", "1rem"],
  ])(
    "correctly handles buttonRadius config '%s' (does not impact other radii values)",
    (
      buttonRadius,
      expectedButtonRadius,
      expectedDefault,
      expectedMd,
      expectedXl,
      expectedXxl
    ) => {
      const themeInput: Partial<CustomThemeConfig> = {
        buttonRadius,
      }

      const theme = createEmotionTheme(themeInput)

      expect(theme.radii.button).toBe(expectedButtonRadius)
      expect(theme.radii.default).toBe(expectedDefault)
      expect(theme.radii.md).toBe(expectedMd)
      expect(theme.radii.xl).toBe(expectedXl)
      expect(theme.radii.xxl).toBe(expectedXxl)
    }
  )

  it.each([
    "invalid",
    "rem", // Missing number
    "px", // Missing number
    "", // Empty string
  ])(
    "logs a warning and falls back to default for invalid buttonRadius '%s'",
    invalidButtonRadius => {
      const logWarningSpy = vi.spyOn(LOG, "warn")
      const themeInput: Partial<CustomThemeConfig> = {
        buttonRadius: invalidButtonRadius,
      }

      const theme = createEmotionTheme(themeInput)

      // Should log an error
      expect(logWarningSpy).toHaveBeenCalledWith(
        `Invalid button radius: ${invalidButtonRadius}. Falling back to default button radius.`
      )

      // Should fall back to default values
      expect(theme.radii.button).toBe(baseTheme.emotion.radii.button)
      expect(theme.radii.default).toBe(baseTheme.emotion.radii.default)
      expect(theme.radii.md).toBe(baseTheme.emotion.radii.md)
      expect(theme.radii.xl).toBe(baseTheme.emotion.radii.xl)
      expect(theme.radii.xxl).toBe(baseTheme.emotion.radii.xxl)
    }
  )

  it("sets buttonRadius based on baseRadius if buttonRadius not configured", () => {
    const themeInput: Partial<CustomThemeConfig> = {
      baseRadius: "0.77rem",
    }

    const theme = createEmotionTheme(themeInput)

    expect(theme.radii.button).toBe("0.77rem")
    expect(theme.radii.default).toBe("0.77rem")
    expect(theme.radii.md).toBe("0.39rem")
    expect(theme.radii.xl).toBe("1.16rem")
    expect(theme.radii.xxl).toBe("1.54rem")
  })

  it.each([
    // Test valid color values
    ["red", "orange", "blue", "pink", "purple"],
    ["#ff0000", "#ffa500", "#0000ff", "#ffc0cb", "#800080"],
    [
      "rgb(255, 0, 0)",
      "rgb(255, 165, 0)",
      "rgb(0, 0, 255)",
      "rgb(255, 192, 192)",
      "rgb(128, 0, 128)",
    ],
  ])(
    "correctly handles setting of basic color configs '%s'",
    (primary, bodyText, secondaryBg, bgColor, linkColor) => {
      const themeInput: Partial<CustomThemeConfig> = {
        primaryColor: primary,
        textColor: bodyText,
        secondaryBackgroundColor: secondaryBg,
        backgroundColor: bgColor,
        linkColor,
      }

      const theme = createEmotionTheme(themeInput)

      expect(theme.colors.primary).toBe(primary)
      expect(theme.colors.bodyText).toBe(bodyText)
      expect(theme.colors.secondaryBg).toBe(secondaryBg)
      expect(theme.colors.bgColor).toBe(bgColor)
      expect(theme.colors.link).toBe(linkColor)
    }
  )

  it.each([
    // Test invalid color values passed to each color config
    ["primaryColor", "invalid", "orange", "blue", "pink", "purple", "green"],
    ["textColor", "red", "invalid", "blue", "pink", "purple", "green"],
    [
      "secondaryBackgroundColor",
      "red",
      "orange",
      "invalid",
      "pink",
      "purple",
      "green",
    ],
    ["backgroundColor", "red", "orange", "blue", "invalid", "purple", "green"],
    ["linkColor", "red", "orange", "blue", "pink", "invalid", "green"],
    ["borderColor", "red", "orange", "blue", "pink", "purple", "invalid"],
  ])(
    "logs an warning and falls back to default for any invalid color configs '%s'",
    (
      invalidColorConfig,
      primary,
      bodyText,
      secondaryBg,
      bgColor,
      linkColor,
      borderColor
    ) => {
      const logWarningSpy = vi.spyOn(LOG, "warn")
      const themeInput: Partial<CustomThemeConfig> = {
        primaryColor: primary,
        textColor: bodyText,
        secondaryBackgroundColor: secondaryBg,
        backgroundColor: bgColor,
        linkColor,
        borderColor,
      }

      const theme = createEmotionTheme(themeInput)

      // Should log an error
      expect(logWarningSpy).toHaveBeenCalledWith(
        `Invalid color passed for ${invalidColorConfig} in theme: "invalid"`
      )

      // Check that valid colors are set correctly
      if (invalidColorConfig !== "primaryColor")
        expect(theme.colors.primary).toBe(primary)
      if (invalidColorConfig !== "textColor")
        expect(theme.colors.bodyText).toBe(bodyText)
      if (invalidColorConfig !== "secondaryBackgroundColor")
        expect(theme.colors.secondaryBg).toBe(secondaryBg)
      if (invalidColorConfig !== "backgroundColor")
        expect(theme.colors.bgColor).toBe(bgColor)
      if (invalidColorConfig !== "linkColor")
        expect(theme.colors.link).toBe(linkColor)
      if (invalidColorConfig !== "borderColor")
        expect(theme.colors.borderColor).toBe(borderColor)

      // Check that invalid color falls back to default value
      if (invalidColorConfig === "primaryColor")
        expect(theme.colors.primary).toBe(baseTheme.emotion.colors.primary)
      if (invalidColorConfig === "textColor")
        expect(theme.colors.bodyText).toBe(baseTheme.emotion.colors.bodyText)
      if (invalidColorConfig === "secondaryBackgroundColor")
        expect(theme.colors.secondaryBg).toBe(
          baseTheme.emotion.colors.secondaryBg
        )
      if (invalidColorConfig === "backgroundColor")
        expect(theme.colors.bgColor).toBe(baseTheme.emotion.colors.bgColor)
      if (invalidColorConfig === "linkColor")
        expect(theme.colors.link).toBe(baseTheme.emotion.colors.link)
      if (invalidColorConfig === "borderColor")
        expect(theme.colors.borderColor).toBe(theme.colors.fadedText10)
    }
  )

  it("sets the borderColor properties based on borderColor config", () => {
    const themeInput: Partial<CustomThemeConfig> = {
      borderColor: "blue",
      // Note no specified dataframeBorderColor
    }

    const theme = createEmotionTheme(themeInput)

    expect(theme.colors.borderColor).toBe("blue")
    expect(theme.colors.borderColorLight).toBe(transparentize("blue", 0.55))
    // Sets the dataframeBorderColor based on borderColor if dataframeBorderColor
    // not configured
    expect(theme.colors.dataframeBorderColor).toBe(
      theme.colors.borderColorLight
    )
  })

  it("sets the dataframeBorderColor if configured", () => {
    const themeInput: Partial<CustomThemeConfig> = {
      borderColor: "red",
      dataframeBorderColor: "green",
    }

    const theme = createEmotionTheme(themeInput)
    expect(theme.colors.borderColor).toBe("red")
    expect(theme.colors.dataframeBorderColor).toBe("green")
  })
})

describe("toThemeInput", () => {
  it("converts from emotion theme to what a custom component expects", () => {
    const { colors } = lightTheme.emotion
    expect(toThemeInput(lightTheme.emotion)).toEqual({
      primaryColor: colors.primary,
      bodyFont: `"Source Sans", sans-serif`,
      backgroundColor: colors.bgColor,
      secondaryBackgroundColor: colors.secondaryBg,
      textColor: colors.bodyText,
    })
  })
})

describe("bgColorToBaseString", () => {
  it("returns 'light' if passed undefined", () => {
    expect(bgColorToBaseString(undefined)).toBe("light")
  })

  it("returns 'light' for a light background color", () => {
    expect(bgColorToBaseString("#FFFFFF")).toBe("light")
  })

  it("returns 'dark' for a dark background color", () => {
    expect(bgColorToBaseString("#000000")).toBe("dark")
  })
})

describe("hasLightBackgroundColor", () => {
  const testCases = [
    {
      description: "works for default light theme",
      theme: lightTheme,
      expectedResult: true,
    },
    {
      description: "works for default dark theme",
      theme: darkTheme,
      expectedResult: false,
    },
    {
      description: "works for custom light theme",
      theme: createTheme(
        CUSTOM_THEME_NAME,
        new CustomThemeConfig({ backgroundColor: "yellow" })
      ),
      expectedResult: true,
    },
    {
      description: "works for custom dark theme",
      theme: createTheme(
        CUSTOM_THEME_NAME,
        new CustomThemeConfig({ backgroundColor: "navy" })
      ),
      expectedResult: false,
    },
  ]

  testCases.forEach(({ description, theme, expectedResult }) => {
    it(`${description}`, () => {
      expect(hasLightBackgroundColor(theme.emotion)).toBe(expectedResult)
    })
  })
})

describe("theme overrides", () => {
  beforeEach(() => {
    vi.resetModules()
    window.__streamlit = undefined
  })

  afterEach(() => {
    vi.resetModules()
    window.__streamlit = undefined
  })

  it("honors the window variables set", async () => {
    window.__streamlit = {
      LIGHT_THEME: {
        primaryColor: "purple",
      },
      DARK_THEME: {
        primaryColor: "yellow",
      },
    }

    const module = await import("./utils")
    // Ensure we are not working with the same object
    expect(module.getMergedLightTheme()).not.toEqual(lightTheme)
    expect(module.getMergedDarkTheme()).not.toEqual(darkTheme)

    expect(module.getMergedLightTheme().emotion.colors.primary).toEqual(
      "purple"
    )
    expect(module.getMergedDarkTheme().emotion.colors.primary).toEqual(
      "yellow"
    )
  })

  it("maintains original theme if no global themes are specified", async () => {
    const module = await import("./utils")
    expect(module.getMergedLightTheme()).toEqual(lightTheme)
    expect(module.getMergedDarkTheme()).toEqual(darkTheme)
  })
})

describe("parseFont", () => {
  it.each([
    // Test standard font mappings
    ["sans-serif", '"Source Sans", sans-serif'],
    ["Sans-Serif", '"Source Sans", sans-serif'], // Case insensitive
    ["SANS-SERIF", '"Source Sans", sans-serif'], // All caps
    ["sans serif", '"Source Sans", sans-serif'], // With space
    ["serif", '"Source Serif", serif'],
    ["monospace", '"Source Code Pro", monospace'],

    // Test fonts that aren't in the map (should return as-is)
    ["Arial", "Arial"],
    ["Helvetica", "Helvetica"],
    ["Times New Roman", "Times New Roman"],
    ["Comic Sans MS", "Comic Sans MS"],
    ["", ""],
  ])("correctly maps '%s' to '%s'", (input, expected) => {
    expect(parseFont(input)).toBe(expected)
  })
})

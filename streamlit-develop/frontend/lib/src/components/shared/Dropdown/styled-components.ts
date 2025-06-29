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

import isPropValid from "@emotion/is-prop-valid"
import styled from "@emotion/styled"
import { StyledDropdownListItem } from "baseui/select"

export const ThemedStyledDropdownListItem = styled(StyledDropdownListItem, {
  shouldForwardProp: isPropValid,
})(({ theme, $isHighlighted }) => {
  return {
    display: "flex",
    alignItems: "center",
    paddingTop: theme.spacing.none,
    paddingBottom: theme.spacing.none,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.lg,
    background: $isHighlighted ? theme.colors.darkenedBgMix15 : undefined,

    // Override the default itemSize set on the component's JSX
    // on mobile, so we can make list items taller and scrollable
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      minHeight: theme.sizes.dropdownItemHeight,
      height: "auto !important",
    },
    "&:hover, &:active, &:focus-visible": {
      background: theme.colors.darkenedBgMix15,
    },
  }
})

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

import { GridCell, GridCellKind, ImageCell } from "@glideapps/glide-data-grid"

import { notNullOrUndefined } from "~lib/util/utils"

import { BaseColumn, BaseColumnProps, toSafeString } from "./utils"

/**
 * A column type that renders an image as a cell value. On cell selection, open
 * the cell overlay with a full version of the image.
 *
 * This column type is currently read-only.
 */
function ImageColumn(props: BaseColumnProps): BaseColumn {
  const cellTemplate: ImageCell = {
    kind: GridCellKind.Image,
    data: [],
    displayData: [],
    readonly: true,
    allowOverlay: true,
    contentAlign: props.contentAlignment || "center",
    style: "normal",
  }

  return {
    ...props,
    kind: "image",
    sortMode: "default",
    isEditable: false, // Image columns are always read-only
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: Replace 'any' with a more specific type.
    getCell(data?: any): GridCell {
      // The native image cell implementation in glide-data-grid expects an array
      // of image URLs. For our usecase, we only support single images. We
      // need to wrap the image URL in an array to have it compatible with the
      // implementation in glide-data-grid.
      const imageUrls = notNullOrUndefined(data) ? [toSafeString(data)] : []

      return {
        ...cellTemplate,
        data: imageUrls,
        isMissingValue: !notNullOrUndefined(data),
        displayData: imageUrls,
      } as ImageCell
    },
    getCellValue(cell: ImageCell): string | null {
      if (cell.data === undefined || cell.data.length === 0) {
        return null
      }

      // We use the image cell only for single images,
      // so we can safely return just the first element
      return cell.data[0]
    },
  }
}

ImageColumn.isEditableType = false

export default ImageColumn

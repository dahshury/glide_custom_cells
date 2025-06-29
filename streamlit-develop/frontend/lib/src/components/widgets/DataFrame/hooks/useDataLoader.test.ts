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

import { useRef } from "react"

import { GridCellKind } from "@glideapps/glide-data-grid"
import { renderHook } from "@testing-library/react"
import { Field, Utf8 } from "apache-arrow"

import { Arrow as ArrowProto } from "@streamlit/protobuf"

import {
  BaseColumn,
  isErrorCell,
  TextColumn,
} from "~lib/components/widgets/DataFrame/columns"
import EditingState from "~lib/components/widgets/DataFrame/EditingState"
import { DataFrameCellType } from "~lib/dataframes/arrowTypeUtils"
import { Quiver } from "~lib/dataframes/Quiver"
import { MULTI, UNICODE } from "~lib/mocks/arrow"

import useDataLoader from "./useDataLoader"

// These columns are based on the UNICODE mock arrow table:
const MOCK_COLUMNS: BaseColumn[] = [
  TextColumn({
    arrowType: {
      type: DataFrameCellType.DATA,
      arrowField: new Field("index-0", new Utf8(), true),
      pandasType: {
        field_name: "index-0",
        name: "index-0",
        pandas_type: "unicode",
        numpy_type: "unicode",
        metadata: null,
      },
    },
    id: "index-0",
    name: "",
    indexNumber: 0,
    isEditable: true,
    isHidden: false,
    isIndex: true,
    isPinned: true,
    isStretched: false,
    title: "",
  }),
  TextColumn({
    arrowType: {
      type: DataFrameCellType.DATA,
      arrowField: new Field("column-c1-0", new Utf8(), true),
      pandasType: {
        field_name: "column-c1-0",
        name: "column-c1-0",
        pandas_type: "unicode",
        numpy_type: "object",
        metadata: null,
      },
    },
    id: "column-c1-0",
    name: "c1",
    indexNumber: 1,
    isEditable: true,
    isHidden: false,
    isIndex: false,
    isPinned: false,
    isStretched: false,
    title: "c1",
  }),
  TextColumn({
    arrowType: {
      type: DataFrameCellType.DATA,
      arrowField: new Field("column-c2-1", new Utf8(), true),
      pandasType: {
        field_name: "column-c2-1",
        name: "column-c2-1",
        pandas_type: "unicode",
        numpy_type: "object",
        metadata: null,
      },
    },
    columnTypeOptions: undefined,
    id: "column-c2-1",
    name: "c2",
    indexNumber: 2,
    isEditable: true,
    isHidden: false,
    isIndex: false,
    isPinned: false,
    isStretched: false,
    title: "c2",
  }),
]

describe("useDataLoader hook", () => {
  it("creates a glide-data-grid compatible callback to access cells", () => {
    const element = ArrowProto.create({
      data: UNICODE,
    })
    const data = new Quiver(element)
    const numRows = data.dimensions.numRows

    const { result } = renderHook(() => {
      const editingState = useRef<EditingState>(new EditingState(numRows))
      return useDataLoader(data, MOCK_COLUMNS, numRows, editingState)
    })

    // Row 1
    expect(
      MOCK_COLUMNS[0].getCellValue(result.current.getCellContent([0, 0]))
    ).toBe("i1")
    expect(
      MOCK_COLUMNS[1].getCellValue(result.current.getCellContent([1, 0]))
    ).toBe("foo")
    expect(
      MOCK_COLUMNS[2].getCellValue(result.current.getCellContent([2, 0]))
    ).toBe("1")

    // Row 2
    expect(
      MOCK_COLUMNS[0].getCellValue(result.current.getCellContent([0, 1]))
    ).toBe("i2")
    expect(
      MOCK_COLUMNS[1].getCellValue(result.current.getCellContent([1, 1]))
    ).toBe("bar")
    expect(
      MOCK_COLUMNS[2].getCellValue(result.current.getCellContent([2, 1]))
    ).toBe("2")

    // if row out of bounds. return error cell
    expect(isErrorCell(result.current.getCellContent([0, 2]))).toBe(true)

    // if column out of bounds. return error cell
    expect(isErrorCell(result.current.getCellContent([3, 0]))).toBe(true)
  })

  it("correctly handles multi-index headers", () => {
    const element = ArrowProto.create({
      data: MULTI,
    })
    const data = new Quiver(element)
    const numRows = data.dimensions.numRows

    const { result } = renderHook(() => {
      const editingState = useRef<EditingState>(new EditingState(numRows))
      return useDataLoader(data, MOCK_COLUMNS, numRows, editingState)
    })

    // Check that row 0 is returning the correct cell value:
    expect(
      MOCK_COLUMNS[0].getCellValue(result.current.getCellContent([2, 0]))
    ).toBe("foo")
  })

  it("uses editing state if a cell got edited", () => {
    const element = ArrowProto.create({
      data: UNICODE,
      editingMode: ArrowProto.EditingMode.FIXED,
    })

    const data = new Quiver(element)
    const numRows = data.dimensions.numRows

    const { result } = renderHook(() => {
      const editingState = useRef<EditingState>(new EditingState(numRows))
      editingState.current.setCell(1, 0, {
        kind: GridCellKind.Text,
        displayData: "edited",
        data: "edited",
        allowOverlay: true,
      })
      return useDataLoader(data, MOCK_COLUMNS, numRows, editingState)
    })

    // Check if value got edited
    expect(
      MOCK_COLUMNS[1].getCellValue(result.current.getCellContent([1, 0]))
    ).toEqual("edited")
  })

  it("uses editing state if a row got deleted", () => {
    const element = ArrowProto.create({
      data: UNICODE,
      editingMode: ArrowProto.EditingMode.DYNAMIC,
    })

    const data = new Quiver(element)
    const numRows = data.dimensions.numRows

    const { result } = renderHook(() => {
      const editingState = useRef<EditingState>(new EditingState(numRows))
      editingState.current.deleteRow(0)
      return useDataLoader(data, MOCK_COLUMNS, numRows, editingState)
    })

    // Should return value of second row
    expect(
      MOCK_COLUMNS[1].getCellValue(result.current.getCellContent([1, 0]))
    ).toEqual("bar")
  })

  it("returns an error cell if getCell from Quiver throws an error", () => {
    const element = ArrowProto.create({
      data: UNICODE,
    })
    const realData = new Quiver(element)
    const numRows = realData.dimensions.numRows

    // Create a data object that throws an error when getCell is called
    const errorData = {
      getCell: () => {
        throw new Error("Error getting cell from Quiver")
      },
      dimensions: realData.dimensions,
      styler: realData.styler,
    } as unknown as Quiver

    const { result } = renderHook(() => {
      const editingState = useRef<EditingState>(new EditingState(numRows))
      return useDataLoader(errorData, MOCK_COLUMNS, numRows, editingState)
    })

    // We should get an error cell since an error is thrown in the try/catch block
    expect(isErrorCell(result.current.getCellContent([1, 0]))).toBe(true)
  })

  it("returns an error cell if getCell from editing state throws an error", () => {
    const element = ArrowProto.create({
      data: UNICODE,
    })
    const realData = new Quiver(element)
    const numRows = realData.dimensions.numRows

    const { result } = renderHook(() => {
      const editingState = useRef<EditingState>(new EditingState(numRows))
      editingState.current.getCell = () => {
        throw new Error("Error getting cell from editing state")
      }
      editingState.current.isAddedRow = () => {
        return true
      }
      return useDataLoader(realData, MOCK_COLUMNS, numRows, editingState)
    })

    // We should get an error cell since an error is thrown in the try/catch block
    expect(isErrorCell(result.current.getCellContent([1, 0]))).toBe(true)
  })
})

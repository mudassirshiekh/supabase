import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { Edit2, Filter, Plus, Workflow } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import { ProtectedSchemaModal } from 'components/interfaces/Database/ProtectedSchemaWarning'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import InfiniteList from 'components/ui/InfiniteList'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useSchemasQuery } from 'data/database/schemas-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Checkbox_Shadcn_,
  Label_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Skeleton,
  TreeViewItemVariant,
  TrewViewItemVariant,
  cn,
} from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
  InnerSideBarFilters,
  InnerSideBarShimmeringLoaders,
} from 'ui-patterns/InnerSideMenu'
import { useProjectContext } from '../ProjectLayout/ProjectContext'
import EntityListItem from './EntityListItem'
import Link from 'next/link'
import { SchemaButton } from './schema-button'

const TableEditorMenu = () => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const snap = useTableEditorStateSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const [showModal, setShowModal] = useState(false)
  const [searchText, setSearchText] = useState<string>('')
  const [visibleTypes, setVisibleTypes] = useState<string[]>(Object.values(ENTITY_TYPE))
  const [sort, setSort] = useLocalStorage<'alphabetical' | 'grouped-alphabetical'>(
    'table-editor-sort',
    'alphabetical'
  )

  const { project } = useProjectContext()
  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useEntityTypesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schemas: [selectedSchema],
      search: searchText.trim() || undefined,
      sort,
      filterTypes: visibleTypes,
    },
    {
      keepPreviousData: Boolean(searchText),
    }
  )

  const entityTypes = useMemo(
    () => data?.pages.flatMap((page) => page.data.entities),
    [data?.pages]
  )

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schema = schemas?.find((schema) => schema.name === selectedSchema)
  const canCreateTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const [protectedSchemas] = partition(
    (schemas ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    (schema) => EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const { data: selectedTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  useEffect(() => {
    if (selectedTable?.schema) {
      setSelectedSchema(selectedTable.schema)
    }
  }, [selectedTable?.schema])

  return (
    <>
      <div className="h-full flex flex-col flex-grow gap-5 py-2">
        <div className="px-4 flex justify-between items-center">
          <h2 className="text-sm">Postgres</h2>
          <div className="flex items-center gap-1">
            <SchemaSelector
              className="w-fit"
              selectedSchemaName={selectedSchema}
              onSelectSchema={(name: string) => {
                setSearchText('')
                setSelectedSchema(name)
              }}
              onSelectCreateSchema={() => snap.onAddSchema()}
            />
            <Button
              type="default"
              icon={<Edit2 />}
              className="w-[26px]"
              onClick={snap.onAddTable}
            />
          </div>
        </div>
        {/* <div className="flex flex-col gap-y-1.5 "> */}
        {/* <SchemaSelector
            className="mx-4 w-fit"
            selectedSchemaName={selectedSchema}
            onSelectSchema={(name: string) => {
              setSearchText('')
              setSelectedSchema(name)
            }}
            onSelectCreateSchema={() => snap.onAddSchema()}
          /> */}
        {/* <div className="grid gap-3 mx-4"> */}
        {/* {!isLocked ? (
              <ButtonTooltip
                block
                title="Create a new table"
                name="New table"
                disabled={!canCreateTables}
                size="tiny"
                icon={<Plus size={14} strokeWidth={1.5} className="text-foreground-muted" />}
                type="default"
                className="justify-start"
                onClick={snap.onAddTable}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canCreateTables
                      ? 'You need additional permissions to create tables'
                      : undefined,
                  },
                }}
              >
                New table
              </ButtonTooltip>
            ) : ( */}
        {/* <Alert_Shadcn_>
              <AlertTitle_Shadcn_ className="text-sm">Viewing protected schema</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_ className="text-xs">
                <p className="mb-2">
                  This schema is managed by Supabase and is read-only through the table editor
                </p>
                <Button type="default" size="tiny" onClick={() => setShowModal(true)}>
                  Learn more
                </Button>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_> */}
        {/* )} */}
        {/* </div> */}
        {/* </div> */}
        <div className="flex flex-auto flex-col gap-2">
          <InnerSideBarFilters className="px-4">
            <InnerSideBarFilterSearchInput
              name="search-tables"
              aria-labelledby="Search tables"
              onChange={(e) => {
                setSearchText(e.target.value)
              }}
              value={searchText}
              placeholder="Search tables..."
            >
              <InnerSideBarFilterSortDropdown
                value={sort}
                onValueChange={(value: any) => setSort(value)}
              >
                <InnerSideBarFilterSortDropdownItem
                  key="alphabetical"
                  value="alphabetical"
                  className="flex gap-2"
                >
                  Alphabetical
                </InnerSideBarFilterSortDropdownItem>
                <InnerSideBarFilterSortDropdownItem
                  key="grouped-alphabetical"
                  value="grouped-alphabetical"
                >
                  Entity Type
                </InnerSideBarFilterSortDropdownItem>
              </InnerSideBarFilterSortDropdown>
            </InnerSideBarFilterSearchInput>
            <Popover_Shadcn_>
              <PopoverTrigger_Shadcn_ asChild>
                <Button
                  type={visibleTypes.length !== 5 ? 'default' : 'dashed'}
                  className="h-[28px] px-1.5"
                  icon={<Filter />}
                />
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="p-0 w-56" side="bottom" align="center">
                <div className="px-3 pt-3 pb-2 flex flex-col gap-y-2">
                  <p className="text-xs">Show entity types</p>
                  <div className="flex flex-col">
                    {Object.entries(ENTITY_TYPE).map(([key, value]) => (
                      <div key={key} className="group flex items-center justify-between py-0.5">
                        <div className="flex items-center gap-x-2">
                          <Checkbox_Shadcn_
                            id={key}
                            name={key}
                            checked={visibleTypes.includes(value)}
                            onCheckedChange={() => {
                              if (visibleTypes.includes(value)) {
                                setVisibleTypes(visibleTypes.filter((y) => y !== value))
                              } else {
                                setVisibleTypes(visibleTypes.concat([value]))
                              }
                            }}
                          />
                          <Label_Shadcn_ htmlFor={key} className="capitalize text-xs">
                            {key.toLowerCase().replace('_', ' ')}
                          </Label_Shadcn_>
                        </div>
                        <Button
                          size="tiny"
                          type="default"
                          onClick={() => setVisibleTypes([value])}
                          className="transition opacity-0 group-hover:opacity-100 h-auto px-1 py-0.5"
                        >
                          Select only
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          </InnerSideBarFilters>

          {isLoading && (
            <div className="flex flex-col gap-y-1">
              <div className="flex flex-row h-6 px-4 items-center gap-2">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="w-40 h-4" />
              </div>
              <div className="flex flex-row h-6 px-4 items-center gap-2">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="w-32 h-4" />
              </div>
              <div className="flex flex-row h-6 px-4 items-center gap-2 opacity-75">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="w-20 h-4" />
              </div>
              <div className="flex flex-row h-6 px-4 items-center gap-2 opacity-50">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="w-40 h-4" />
              </div>
              <div className="flex flex-row h-6 px-4 items-center gap-2 opacity-25">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="w-20 h-4" />
              </div>
            </div>
          )}
          {/* <InnerSideBarShimmeringLoaders />} */}

          {isError && (
            <AlertError error={(error ?? null) as any} subject="Failed to retrieve tables" />
          )}

          {isSuccess && (
            <>
              {searchText.length === 0 && (entityTypes?.length ?? 0) <= 0 && (
                <InnerSideBarEmptyPanel
                  className="mx-4"
                  title="No entities available"
                  description="This schema has no entities available yet"
                />
              )}
              {searchText.length > 0 && (entityTypes?.length ?? 0) <= 0 && (
                <InnerSideBarEmptyPanel
                  className="mx-2"
                  title="No results found"
                  description={`Your search for "${searchText}" did not return any results`}
                />
              )}
              {(entityTypes?.length ?? 0) > 0 && (
                <div className="flex flex-col flex-1" data-testid="tables-list">
                  <SchemaButton schema={schema} />
                  <InfiniteList
                    items={entityTypes}
                    ItemComponent={EntityListItem}
                    itemProps={{
                      projectRef: project?.ref!,
                      id: Number(id),
                      isLocked,
                    }}
                    getItemSize={() => 28}
                    hasNextPage={hasNextPage}
                    isLoadingNextPage={isFetchingNextPage}
                    onLoadNextPage={() => fetchNextPage()}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ProtectedSchemaModal visible={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

export default TableEditorMenu

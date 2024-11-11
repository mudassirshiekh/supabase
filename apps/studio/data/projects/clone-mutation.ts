import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectCloneVariables = {
  projectRef: string
  cloneBackupId: number
  newProjectName: string
  newDbPass: string
}

export async function triggerClone({
  projectRef,
  cloneBackupId,
  newProjectName,
  newDbPass,
}: ProjectCloneVariables) {
  if (!projectRef) throw new Error('Project ref is required')
  const { data, error } = await post('/platform/database/{ref}/clone', {
    params: { path: { ref: projectRef } },
    body: { cloneBackupId, newProjectName, newDbPass },
  })

  if (error) handleError(error)
  return data
}

type ProjectCloneData = Awaited<ReturnType<typeof triggerClone>>

export const useProjectCloneMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectCloneData, ResponseError, ProjectCloneVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectCloneData, ResponseError, ProjectCloneVariables>(
    (vars) => triggerClone(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(projectKeys.listCloneBackups(variables.projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          console.error(data)
          toast.error(`Failed to trigger clone: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

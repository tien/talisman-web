import { ApiPromise } from '@polkadot/api'
import type {
  GenericStorageEntryFunction,
  PromiseResult,
  QueryableStorageEntry,
  StorageEntryPromiseOverloads,
} from '@polkadot/api/types'
import { useContext } from 'react'
import { Loadable, RecoilLoadable, constSelector, useRecoilValueLoadable } from 'recoil'
import { Observable } from 'rxjs'

import { chainQueryState, chainDeriveState } from '../recoils'
import { SubstrateApiContext } from '..'

/**
 * @deprecated use `useChainQueryState` or `useChainDeriveState` instead
 */
export const useChainState = <
  TType extends keyof Pick<ApiPromise, 'query' | 'derive'>,
  TModule extends keyof PickKnownKeys<ApiPromise[TType]>,
  TSection extends Extract<keyof PickKnownKeys<ApiPromise[TType][TModule]>, string>,
  TAugmentedSection extends TType extends 'query' ? TSection | `${TSection}.multi` : TSection,
  TExtractedSection extends TAugmentedSection extends `${infer Section}.multi` ? Section : TAugmentedSection,
  TMethod extends Diverge<
    // @ts-ignore
    ApiPromise[TType][TModule][TExtractedSection],
    StorageEntryPromiseOverloads & QueryableStorageEntry<any, any> & PromiseResult<GenericStorageEntryFunction>
  >
>(
  typeName: TType,
  moduleName: TModule,
  // @ts-ignore
  sectionName: TAugmentedSection,
  params: TMethod extends (...args: any) => any
    ? // @ts-ignore
      TAugmentedSection extends TSection
      ? Leading<Parameters<TMethod>>
      : Leading<Parameters<TMethod>> extends [infer Head]
      ? Head[]
      : Array<Readonly<Leading<Parameters<TMethod>>>>
    : never,
  options: { enabled?: boolean } = { enabled: true }
) => {
  type TResult = TMethod extends PromiseResult<(...args: any) => Observable<infer Result>>
    ? TAugmentedSection extends TSection
      ? Result
      : Result[]
    : never

  const endpoint = useContext(SubstrateApiContext).endpoint

  const loadable = useRecoilValueLoadable<TResult>(
    typeName === 'query'
      ? !options.enabled
        ? (constSelector(undefined) as any)
        : // @ts-expect-error
          chainQueryState(endpoint, moduleName, sectionName, params)
      : !options.enabled
      ? (constSelector(undefined) as any)
      : // @ts-expect-error
        chainDeriveState(endpoint, moduleName, sectionName, params)
  )

  return !options.enabled ? (RecoilLoadable.loading() as Loadable<TResult>) : loadable
}

export default useChainState
